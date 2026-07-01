import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRole, unauthorizedResponse } from "@/lib/auth-utils";
import { ProjectCreateSchema } from "@/lib/validation";

// GET /api/projects - List all projects belonging to the logged-in user
export async function GET(req: NextRequest) {
  try {
    const { authorized, user } = await checkRole(["USER", "ADMIN"]);
    if (!authorized || !user) {
      return unauthorizedResponse("You must be logged in to view projects");
    }

    const projects = await db.project.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { components: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

// POST /api/projects - Create a new project workspace
export async function POST(req: NextRequest) {
  try {
    const { authorized, user } = await checkRole(["USER", "ADMIN"]);
    if (!authorized || !user) {
      return unauthorizedResponse("You must be logged in to create a project");
    }

    const body = await req.json();
    const parsed = ProjectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const { name, description } = parsed.data;

    const project = await db.project.create({
      data: {
        name,
        description,
        userId: user.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
