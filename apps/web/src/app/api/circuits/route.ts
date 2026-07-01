import { NextRequest, NextResponse } from "next/server";

import { CIRCUITS_DATA, Circuit } from "./data";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const difficulty = url.searchParams.get("difficulty");
    const q = url.searchParams.get("q")?.toLowerCase();

    let circuits = CIRCUITS_DATA;

    if (difficulty) {
      circuits = circuits.filter(c => c.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (q) {
      circuits = circuits.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        c.components.some(comp => comp.mpn.toLowerCase().includes(q) || comp.name.toLowerCase().includes(q))
      );
    }

    return NextResponse.json(circuits);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
