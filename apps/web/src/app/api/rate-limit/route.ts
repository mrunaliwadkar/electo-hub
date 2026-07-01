import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const limitStr = url.searchParams.get("limit");

    if (!key || !limitStr) {
      return NextResponse.json({ error: "Missing key or limit" }, { status: 400 });
    }

    const limit = parseInt(limitStr, 10);
    if (isNaN(limit)) {
      return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
    }

    const limited = await isRateLimited(key, limit);

    if (limited) {
      return NextResponse.json({ limited: true }, { status: 429 });
    }

    return NextResponse.json({ limited: false }, { status: 200 });
  } catch (error: any) {
    console.error("Rate limit route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
