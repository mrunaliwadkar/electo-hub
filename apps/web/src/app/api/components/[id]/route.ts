import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { typesense, COLLECTION_NAME, indexComponentInTypesense } from "@/lib/typesense";
import { checkRole, forbiddenResponse } from "@/lib/auth-utils";
import { ComponentUpdateSchema } from "@/lib/validation";

// GET /api/components/[id] - Fetch detailed component specs, pins, assets, and pgvector-based alternatives
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const component = await db.component.findUnique({
      where: { id },
      include: {
        manufacturer: true,
        category: true,
        pins: {
          orderBy: { number: "asc" }
        },
        assets: true,
        datasheets: {
          select: {
            id: true,
            pdfUrl: true,
            extractedText: true
          }
        },
        stock: true,
      },
    });

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    // Find alternatives using pgvector cosine similarity
    interface AlternativeResult {
      id: string;
      mpn: string;
      description: string;
      distance: number | null;
    }

    let alternatives: AlternativeResult[] = [];

    try {
      // Query pgvector alternatives
      alternatives = await db.$queryRaw<AlternativeResult[]>`
        SELECT c.id, c.mpn, c.description,
               (d.embedding <=> (SELECT embedding FROM "Datasheet" WHERE "componentId" = ${id} AND embedding IS NOT NULL LIMIT 1)) AS distance
         FROM "Component" c
         JOIN "Datasheet" d ON d."componentId" = c.id
         WHERE c."categoryId" = ${component.categoryId}
           AND c.id != ${id}
           AND d.embedding IS NOT NULL
           AND (SELECT COUNT(*) FROM "Pin" p WHERE p."componentId" = c.id) = ${component.pins.length}
         ORDER BY distance ASC
         LIMIT 5
      `;
    } catch (err) {
      console.error("pgvector query failed, falling back to basic category/pin match:", err);
    }

    // Fallback: find components in the same category with the same pin count if no pgvector results
    if (alternatives.length === 0) {
      const targetPinCount = component.pins.length;
      const fallbackComponents = await db.component.findMany({
        where: {
          categoryId: component.categoryId,
          id: { not: id },
        },
        take: 10,
        include: {
          pins: true,
        },
      });

      // Filter to only those with matching pin count
      const matched = fallbackComponents.filter((c) => c.pins.length === targetPinCount);
      alternatives = matched.slice(0, 5).map((c) => ({
        id: c.id,
        mpn: c.mpn,
        description: c.description,
        distance: null,
      }));
    }

    return NextResponse.json({
      ...component,
      alternatives,
    });
  } catch (error: any) {
    console.error("GET /api/components/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

// PUT /api/components/[id] - Update component specs (Admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized } = await checkRole(["ADMIN"]);
    if (!authorized) {
      return forbiddenResponse("Only Admins can update components");
    }

    const body = await req.json();
    const parsed = ComponentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const { mpn, description, manufacturerId, categoryId, lifecycle, specs, pins, assets } = parsed.data;

    // Check if component exists
    const existing = await db.component.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    // Update component in database
    await db.$transaction(async (tx) => {
      await tx.component.update({
        where: { id },
        data: {
          mpn,
          description,
          manufacturerId,
          categoryId,
          lifecycle,
          specs: specs as any,
        },
      });

      // If pins are provided, replace them
      if (pins) {
        await tx.pin.deleteMany({ where: { componentId: id } });
        if (pins.length > 0) {
          await tx.pin.createMany({
            data: pins.map((p) => ({
              componentId: id,
              number: p.number,
              name: p.name,
              type: p.type,
              functionalGroup: p.functionalGroup,
              color: p.color,
              description: p.description,
            })),
          });
        }
      }

      // If assets are provided, replace them
      if (assets) {
        await tx.cadAsset.deleteMany({ where: { componentId: id } });
        if (assets.length > 0) {
          await tx.cadAsset.createMany({
            data: assets.map((a) => ({
              componentId: id,
              type: a.type,
              fileUrl: a.fileUrl,
              checksum: a.checksum,
            })),
          });
        }
      }
    });

    // Re-fetch updated component
    const updatedComponent = await db.component.findUnique({
      where: { id },
      include: {
        pins: true,
        assets: true,
        manufacturer: true,
        category: true,
      },
    });

    // Sync to Typesense
    try {
      await indexComponentInTypesense(id);
    } catch (typesenseError) {
      console.error(`Failed to update index for component ${id} in Typesense:`, typesenseError);
    }

    return NextResponse.json(updatedComponent);
  } catch (error: any) {
    console.error("PUT /api/components/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

// DELETE /api/components/[id] - Delete a component (Admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized } = await checkRole(["ADMIN"]);
    if (!authorized) {
      return forbiddenResponse("Only Admins can delete components");
    }

    const existing = await db.component.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    // Delete from database (cascade deletes will handle pins, assets, datasheets)
    await db.component.delete({ where: { id } });

    // Delete from Typesense
    try {
      await typesense.collections(COLLECTION_NAME).documents(id).delete();
    } catch (typesenseError) {
      console.error(`Failed to delete component ${id} from Typesense index:`, typesenseError);
    }

    return NextResponse.json({ message: "Component deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/components/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
