import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain routing:
 *   carnivon.io          → /(marketing)/*
 *   vault.carnivon.io    → /vault/*
 *
 * Locally (localhost:3000) both apps are path-based:
 *   /              → marketing
 *   /vault/*       → vault
 *
 * To test subdomain locally, add to /etc/hosts:
 *   127.0.0.1 carnivon.localhost vault.carnivon.localhost
 * and visit vault.carnivon.localhost:3000
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "carnivon.io";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";
  const bareHost = hostname.replace(/:\d+$/, "");

  const isVault =
    bareHost.startsWith("vault.") ||
    bareHost === `vault.${ROOT_DOMAIN}` ||
    bareHost === "vault.carnivon.localhost";

  // If on vault subdomain and request path doesn't already start with /vault, rewrite it in
  if (isVault && !url.pathname.startsWith("/vault")) {
    const rewritten = url.clone();
    rewritten.pathname = `/vault${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(rewritten);
  }

  // If on marketing domain, block direct /vault access (should go via subdomain)
  if (!isVault && url.pathname.startsWith("/vault")) {
    // In production, 404 it; in dev let it through for convenience
    if (process.env.NODE_ENV === "production") {
      return NextResponse.rewrite(new URL("/404", req.url));
    }
  }

  return NextResponse.next();
}
