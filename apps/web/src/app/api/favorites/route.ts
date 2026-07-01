import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRole, unauthorizedResponse } from "@/lib/auth-utils";
import { FavoriteToggleSchema } from "@/lib/validation";

// GET /api/favorites - List all favorites for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const { authorized, user } = await checkRole(["USER", "ADMIN"]);
    if (!authorized || !user) {
      return unauthorizedResponse("You must be logged in to view favorites");
    }

    const favorites = await db.favorite.findMany({
      where: { userId: user.id },
      include: {
        component: {
          include: {
            manufacturer: true,
            category: true,
            stock: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(favorites.map(f => f.component));
  } catch (error: any) {
    console.error("GET /api/favorites error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

// POST /api/favorites - Toggle favorite status of a component
export async function POST(req: NextRequest) {
  try {
    const { authorized, user } = await checkRole(["USER", "ADMIN"]);
    if (!authorized || !user) {
      return unauthorizedResponse("You must be logged in to manage favorites");
    }

    const body = await req.json();
    const parsed = FavoriteToggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const { componentId } = parsed.data;

    // Verify component exists
    const component = await db.component.findUnique({ where: { id: componentId } });
    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    // Check if it's already favorited
    const existing = await db.favorite.findUnique({
      where: {
        userId_componentId: {
          userId: user.id,
          componentId,
        },
      },
    });

    if (existing) {
      // Unfavorite
      await db.favorite.delete({
        where: {
          userId_componentId: {
            userId: user.id,
            componentId,
          },
        },
      });
      return NextResponse.json({ favorited: false, message: "Component removed from favorites" });
    } else {
      // Favorite
      await db.favorite.create({
        data: {
          userId: user.id,
          componentId,
        },
      });
      return NextResponse.json({ favorited: true, message: "Component added to favorites" });
    }
  } catch (error: any) {
    console.error("POST /api/favorites error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
