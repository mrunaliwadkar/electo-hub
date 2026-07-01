import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { typesense, COLLECTION_NAME } from "@/lib/typesense";
import { checkRole, unauthorizedResponse } from "@/lib/auth-utils";

// Define shipping rules
const SHIPPING_RULES = {
  DIGIKEY: { flatFee: 9.99, freeThreshold: 50.0 },
  MOUSER: { flatFee: 7.99, freeThreshold: 50.0 },
  LCSC: { flatFee: 5.0, freeThreshold: 15.0 },
};

interface BOMItem {
  mpn: string;
  quantity: number;
}

interface PriceTier {
  qty: number;
  price: number;
}

interface OptimizedItem {
  componentId: string;
  mpn: string;
  description: string;
  manufacturer: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  distributor: string;
}

// Simple robust CSV parser
function parseCSV(text: string): BOMItem[] {
  const lines = text.split(/\r?\n/);
  const results: BOMItem[] = [];
  if (lines.length === 0) return [];

  // Parse headers
  const firstLine = lines[0];
  const headers = firstLine.split(",").map(h => h.trim().toLowerCase());

  // Find indexes for MPN and Qty
  const mpnIndex = headers.findIndex(h => h.includes("mpn") || h.includes("part number") || h.includes("mfr_pn") || h.includes("pn") || h.includes("component"));
  const qtyIndex = headers.findIndex(h => h.includes("qty") || h.includes("quantity") || h.includes("count"));

  const finalMpnIndex = mpnIndex !== -1 ? mpnIndex : 0;
  const finalQtyIndex = qtyIndex !== -1 ? qtyIndex : 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted CSV values
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    
    const mpn = cols[finalMpnIndex];
    const qtyStr = cols[finalQtyIndex];
    const quantity = qtyStr ? parseInt(qtyStr, 10) : 1;

    if (mpn) {
      results.push({ mpn, quantity: isNaN(quantity) ? 1 : quantity });
    }
  }

  return results;
}

// Helper to get unit price from tiers
function getUnitPrice(priceTiers: any, quantity: number): number {
  let tiers: PriceTier[] = [];
  try {
    tiers = typeof priceTiers === 'string' ? JSON.parse(priceTiers) : priceTiers;
  } catch (e) {
    return 0;
  }
  
  if (!Array.isArray(tiers) || tiers.length === 0) return 0;
  
  // Sort tiers by qty ascending
  const sorted = [...tiers].sort((a, b) => a.qty - b.qty);
  
  let selectedPrice = sorted[0].price;
  for (const tier of sorted) {
    if (quantity >= tier.qty) {
      selectedPrice = tier.price;
    }
  }
  return selectedPrice;
}

export async function POST(req: NextRequest) {
  try {
    const { authorized, user } = await checkRole(["USER", "ADMIN"]);
    if (!authorized || !user) {
      return unauthorizedResponse("You must be logged in to optimize BOMs");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const csvText = await file.text();
    const bomItems = parseCSV(csvText);

    if (bomItems.length === 0) {
      return NextResponse.json({ error: "Empty or invalid CSV file" }, { status: 400 });
    }

    const matchedComponents: any[] = [];
    const unmatchedComponents: string[] = [];

    // Match components via Typesense and DB
    for (const item of bomItems) {
      let component = null;

      // 1. Try Typesense search first for typo tolerance
      try {
        const searchResults = await typesense.collections(COLLECTION_NAME).documents().search({
          q: item.mpn,
          query_by: "mpn",
          per_page: 1,
        });

        if (searchResults.hits && searchResults.hits.length > 0) {
          const matchId = (searchResults.hits[0].document as any).id;
          component = await db.component.findUnique({
            where: { id: matchId },
            include: {
              manufacturer: true,
              stock: true,
            },
          });
        }
      } catch (tsError) {
        console.error("Typesense search error during BOM match:", tsError);
      }

      // 2. Fallback to exact DB match if Typesense failed or didn't find anything
      if (!component) {
        component = await db.component.findUnique({
          where: { mpn: item.mpn },
          include: {
            manufacturer: true,
            stock: true,
          },
        });
      }

      if (component) {
        matchedComponents.push({
          item,
          component,
        });
      } else {
        unmatchedComponents.push(item.mpn);
      }
    }

    // Perform optimization: Cart split across DigiKey, Mouser, LCSC
    const splits: Record<string, OptimizedItem[]> = {
      DIGIKEY: [],
      MOUSER: [],
      LCSC: [],
    };

    for (const matched of matchedComponents) {
      const { item, component } = matched;
      let bestDistributor = "";
      let bestPrice = Infinity;
      let bestUnitPrice = 0;

      // Evaluate prices at each distributor
      for (const s of component.stock) {
        const dist = s.distributor.toUpperCase();
        if (s.stockQty >= item.quantity) {
          const unitPrice = getUnitPrice(s.priceTiers, item.quantity);
          const totalPrice = unitPrice * item.quantity;
          if (totalPrice < bestPrice) {
            bestPrice = totalPrice;
            bestUnitPrice = unitPrice;
            bestDistributor = dist;
          }
        }
      }

      // If a distributor is found, assign it
      if (bestDistributor && splits[bestDistributor]) {
        splits[bestDistributor].push({
          componentId: component.id,
          mpn: component.mpn,
          description: component.description,
          manufacturer: component.manufacturer.name,
          quantity: item.quantity,
          unitPrice: bestUnitPrice,
          totalPrice: bestPrice,
          distributor: bestDistributor,
        });
      } else {
        // If out of stock everywhere or no distributor, flag it as unmatched/out of stock
        unmatchedComponents.push(`${item.mpn} (Out of Stock)`);
      }
    }

    // Calculate totals and shipping
    const totals: Record<string, number> = { DIGIKEY: 0, MOUSER: 0, LCSC: 0 };
    const shipping: Record<string, number> = { DIGIKEY: 0, MOUSER: 0, LCSC: 0 };

    for (const dist of Object.keys(splits)) {
      const items = splits[dist];
      const itemSubtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
      totals[dist] = itemSubtotal;

      if (itemSubtotal > 0) {
        const rule = SHIPPING_RULES[dist as keyof typeof SHIPPING_RULES];
        if (itemSubtotal < rule.freeThreshold) {
          shipping[dist] = rule.flatFee;
        }
      }
    }

    const itemsTotal = Object.values(totals).reduce((acc, t) => acc + t, 0);
    const shippingTotal = Object.values(shipping).reduce((acc, s) => acc + s, 0);
    const grandTotal = itemsTotal + shippingTotal;

    // Format response
    const response = {
      originalCount: bomItems.length,
      matchedCount: matchedComponents.length,
      unmatchedCount: unmatchedComponents.length,
      unmatched: unmatchedComponents,
      splits: {
        digikey: {
          items: splits.DIGIKEY,
          subtotal: totals.DIGIKEY,
          shipping: shipping.DIGIKEY,
          total: totals.DIGIKEY + shipping.DIGIKEY,
        },
        mouser: {
          items: splits.MOUSER,
          subtotal: totals.MOUSER,
          shipping: shipping.MOUSER,
          total: totals.MOUSER + shipping.MOUSER,
        },
        lcsc: {
          items: splits.LCSC,
          subtotal: totals.LCSC,
          shipping: shipping.LCSC,
          total: totals.LCSC + shipping.LCSC,
        },
      },
      summary: {
        itemsTotal,
        shippingTotal,
        grandTotal,
      },
    };

    // Optionally save the BOM optimization run in the database if a projectId is provided
    const projectId = formData.get("projectId") as string;
    if (projectId) {
      const project = await db.project.findUnique({ where: { id: projectId } });
      if (project && project.userId === user.id) {
        await db.bOM.create({
          data: {
            projectId,
            summary: JSON.parse(JSON.stringify(response.summary)),
          },
        });
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("POST /api/bom/optimize error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
