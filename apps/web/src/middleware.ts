import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Only rate limit /api/components (search) and /api/ai/chat (AI assistant)
  // We exclude /api/components/[id] from aggressive rate limiting, though it can be added if needed.
  const isSearch = pathname === "/api/components";
  const isAIChat = pathname.startsWith("/api/ai/chat");

  if (!isSearch && !isAIChat) {
    return NextResponse.next();
  }

  try {
    // Determine if the user is registered (check NextAuth session cookies)
    const sessionToken = req.cookies.get("next-auth.session-token")?.value ||
                         req.cookies.get("__Secure-next-auth.session-token")?.value;

    const limit = sessionToken ? 200 : 60; // 200 req/min for registered, 60 req/min for guests
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || (req as any).ip || "127.0.0.1";
    
    // Construct a unique key for the rate limiter
    const key = `rate_limit:${sessionToken ? `user:${sessionToken.substring(0, 15)}` : `guest:${ip}`}`;

    // Call the internal rate limiting route (Node.js runtime)
    const origin = req.nextUrl.origin;
    const rateLimitUrl = new URL("/api/rate-limit", origin);
    rateLimitUrl.searchParams.set("key", key);
    rateLimitUrl.searchParams.set("limit", limit.toString());

    const res = await fetch(rateLimitUrl.toString(), {
      method: "POST",
      headers: {
        "x-internal-request": "true",
      },
    });

    if (res.status === 429) {
      return NextResponse.json(
        { error: "Too Many Requests", message: `Rate limit exceeded. Limit is ${limit} requests per minute.` },
        { status: 429 }
      );
    }
  } catch (error) {
    console.error("Middleware rate limiting error (fail-open):", error);
  }

  return NextResponse.next();
}

// Configure middleware matcher to only run on search and chat endpoints
export const config = {
  matcher: [
    "/api/components",
    "/api/ai/chat/:path*",
  ],
};
