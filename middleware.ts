import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const config = {
  matcher: ["/vault/:path*"],
};

export default auth((req) => {
  const host = (
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    ""
  )
    .replace(/:\d+$/, "")
    .toLowerCase();

  const isVault = host.startsWith("vault.");

  // On the marketing domain in prod, /vault should 404 — vault is
  // served from vault.carnivon.io via next.config rewrites.
  if (!isVault && process.env.NODE_ENV === "production") {
    return NextResponse.rewrite(new URL("/404", req.nextUrl));
  }

  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/vault/login" || pathname.startsWith("/vault/login/");

  if (!isLogin && !req.auth) {
    const loginUrl = new URL("/vault/login", req.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});
