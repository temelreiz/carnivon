import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain routing is handled in next.config.ts via `rewrites` (more reliable
 * with Vercel's edge cache than middleware-based rewrites).
 *
 * This middleware only blocks direct access to /vault on the marketing domain
 * in production.
 */
export const config = {
  matcher: ["/vault/:path*"],
};

export default function middleware(req: NextRequest) {
  const host = (
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    ""
  )
    .replace(/:\d+$/, "")
    .toLowerCase();

  const isVault = host.startsWith("vault.");

  if (!isVault && process.env.NODE_ENV === "production") {
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  return NextResponse.next();
}
