import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRole, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-utils";
import { ProjectUpdateSchema, ProjectComponentSchema } from "@/lib/validation";

// GET /api/projects/[id] - Get project details and its components
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, user } = await checkRole(["USER", "ADMIN"]);
    if (!authorized || !user) {
      return unauthorizedResponse("You must be logged in to view this project");
    }

    const project = await db.project.findUnique({
      where: { id },
      include: {
        components: {
          include: {
            component: {
              include: {
                manufacturer: true,
                category: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Authorization check: Ensure project belongs to the user
    if (project.userId !== user.id && user.role !== "ADMIN") {
      return forbiddenResponse("You do not have permission to view this project");
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update project metadata or manage its components
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, user } = await checkRole(["USER", "ADMIN"]);
    if (!authorized || !user) {
      return unauthorizedResponse("You must be logged in to update this project");
    }

    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Authorization check
    if (project.userId !== user.id && user.role !== "ADMIN") {
      return forbiddenResponse("You do not have permission to update this project");
    }

    const body = await req.json();

    // Check if we are doing a component action or metadata update
    if (body.action) {
      const { action, componentId, quantity = 1, notes } = body;

      if (!componentId) {
        return NextResponse.json({ error: "componentId is required for component actions" }, { status: 400 });
      }

      if (action === "add_component" || action === "update_component") {
        const parsedComp = ProjectComponentSchema.safeParse({ componentId, quantity, notes });
        if (!parsedComp.success) {
          return NextResponse.json({ error: "Invalid component payload", details: parsedComp.error.format() }, { status: 400 });
        }

        // Verify component exists
        const componentExists = await db.component.findUnique({ where: { id: componentId } });
        if (!componentExists) {
          return NextResponse.json({ error: "Component not found" }, { status: 404 });
        }

        // Find if component already in project
        const existingProjComp = await db.projectComponent.findFirst({
          where: { projectId: id, componentId },
        });

        let result;
        if (existingProjComp) {
          result = await db.projectComponent.update({
            where: { id: existingProjComp.id },
            data: {
              quantity: action === "add_component" ? existingProjComp.quantity + quantity : quantity,
              notes: notes !== undefined ? notes : existingProjComp.notes,
            },
          });
        } else {
          result = await db.projectComponent.create({
            data: {
              projectId: id,
              componentId,
              quantity,
              notes,
            },
          });
        }

        return NextResponse.json({ message: "Component updated in project successfully", data: result });
      } else if (action === "remove_component") {
        const existingProjComp = await db.projectComponent.findFirst({
          where: { projectId: id, componentId },
        });

        if (!existingProjComp) {
          return NextResponse.json({ error: "Component not found in this project" }, { status: 404 });
        }

        await db.projectComponent.delete({
          where: { id: existingProjComp.id },
        });

        return NextResponse.json({ message: "Component removed from project successfully" });
      } else {
        return NextResponse.json({ error: "Invalid action. Supported: add_component, update_component, remove_component" }, { status: 400 });
      }
    }

    // Otherwise, do a standard project metadata update
    const parsed = ProjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const updatedProject = await db.project.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updatedProject);
  } catch (error: any) {
    console.error("PUT /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete a project workspace
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorized, user } = await checkRole(["USER", "ADMIN"]);
    if (!authorized || !user) {
      return unauthorizedResponse("You must be logged in to delete this project");
    }

    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Authorization check
    if (project.userId !== user.id && user.role !== "ADMIN") {
      return forbiddenResponse("You do not have permission to delete this project");
    }

    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
