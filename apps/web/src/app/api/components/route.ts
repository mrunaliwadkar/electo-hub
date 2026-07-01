import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { typesense, COLLECTION_NAME, indexComponentInTypesense } from "@/lib/typesense";
import { checkRole, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-utils";
import { ComponentSearchSchema, ComponentCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    const parsed = ComponentSearchSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: parsed.error.format() }, { status: 400 });
    }

    const {
      q,
      category,
      manufacturer,
      lifecycle,
      page,
      limit,
      voltage_min,
      voltage_max,
      capacitance_min,
      capacitance_max,
      resistance_min,
      resistance_max,
      package_type,
    } = parsed.data;

    // Construct Typesense search query
    const filters: string[] = [];
    if (category) filters.push(`category_path:=${category}`);
    if (manufacturer) filters.push(`manufacturer:=${manufacturer}`);
    if (lifecycle) filters.push(`lifecycle:=${lifecycle}`);
    if (voltage_min !== undefined) filters.push(`normalized_voltage:>=${voltage_min}`);
    if (voltage_max !== undefined) filters.push(`normalized_voltage:<=${voltage_max}`);
    if (capacitance_min !== undefined) filters.push(`normalized_capacitance:>=${capacitance_min}`);
    if (capacitance_max !== undefined) filters.push(`normalized_capacitance:<=${capacitance_max}`);
    if (resistance_min !== undefined) filters.push(`normalized_resistance:>=${resistance_min}`);
    if (resistance_max !== undefined) filters.push(`normalized_resistance:<=${resistance_max}`);
    if (package_type) filters.push(`package_type:=${package_type}`);

    const searchOptions: any = {
      q: q || "*",
      query_by: "mpn,description",
      filter_by: filters.join(" && "),
      page,
      per_page: limit,
      facet_by: "manufacturer,category,lifecycle,package_type",
    };

    let searchResults;
    try {
      searchResults = await typesense.collections(COLLECTION_NAME).documents().search(searchOptions);
    } catch (typesenseError: any) {
      console.error("Typesense search error, falling back to Database:", typesenseError);
      
      // Fallback: Query Database directly if Typesense is unavailable
      const dbWhereClause: any = {};
      if (q) {
        dbWhereClause.OR = [
          { mpn: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ];
      }
      if (lifecycle) dbWhereClause.lifecycle = lifecycle;
      if (category) {
        dbWhereClause.category = { path: { contains: category } };
      }
      if (manufacturer) {
        dbWhereClause.manufacturer = { name: { equals: manufacturer, mode: "insensitive" } };
      }

      const total = await db.component.count({ where: dbWhereClause });
      const dbComponents = await db.component.findMany({
        where: dbWhereClause,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          manufacturer: true,
          category: true,
          stock: true,
          assets: true,
        },
      });

      return NextResponse.json({
        hits: dbComponents.map((c) => ({
          document: {
            id: c.id,
            mpn: c.mpn,
            description: c.description,
            manufacturer: c.manufacturer.name,
            category: c.category.name,
            lifecycle: c.lifecycle,
            stock_total: c.stock.reduce((acc, s) => acc + s.stockQty, 0),
          },
        })),
        found: total,
        page,
        limit,
        fallback: true,
      });
    }

    return NextResponse.json(searchResults);
  } catch (error: any) {
    console.error("GET /api/components error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized } = await checkRole(["ADMIN"]);
    if (!authorized) {
      return forbiddenResponse("Only Admins can add components");
    }

    const body = await req.json();
    const parsed = ComponentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const { mpn, description, manufacturerId, categoryId, lifecycle, specs, pins, assets } = parsed.data;

    // Check if MPN already exists
    const existing = await db.component.findUnique({ where: { mpn } });
    if (existing) {
      return NextResponse.json({ error: `Component with MPN ${mpn} already exists` }, { status: 409 });
    }

    // Create component in database
    const component = await db.component.create({
      data: {
        mpn,
        description,
        manufacturerId,
        categoryId,
        lifecycle,
        specs: specs as any,
        pins: pins && pins.length > 0 ? {
          createMany: {
            data: pins.map((p) => ({
              number: p.number,
              name: p.name,
              type: p.type,
              functionalGroup: p.functionalGroup,
              color: p.color,
              description: p.description,
            })),
          },
        } : undefined,
        assets: assets && assets.length > 0 ? {
          createMany: {
            data: assets.map((a) => ({
              type: a.type,
              fileUrl: a.fileUrl,
              checksum: a.checksum,
            })),
          },
        } : undefined,
      },
      include: {
        pins: true,
        assets: true,
        manufacturer: true,
        category: true,
      },
    });

    // Index in Typesense
    try {
      await indexComponentInTypesense(component.id);
    } catch (typesenseError) {
      console.error(`Failed to index component ${component.id} in Typesense:`, typesenseError);
    }

    return NextResponse.json(component, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/components error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
