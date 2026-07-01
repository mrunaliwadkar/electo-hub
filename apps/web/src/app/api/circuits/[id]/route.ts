import { NextRequest, NextResponse } from "next/server";
import { CIRCUITS_DATA } from "../data";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const circuit = CIRCUITS_DATA.find(c => c.id === id);

    if (!circuit) {
      return NextResponse.json({ error: "Circuit not found" }, { status: 404 });
    }

    return NextResponse.json(circuit);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
