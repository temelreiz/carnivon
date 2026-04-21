import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const config = {
  matcher: ["/vault/:path*", "/admin/:path*"],
};

export default auth((req) => {
  const host = (
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    ""
  )
    .replace(/:\d+$/, "")
    .toLowerCase();

  const { pathname } = req.nextUrl;
  const isVaultPath = pathname.startsWith("/vault");

  // Marketing domain in prod only hosts /vault via vault.carnivon.io rewrites;
  // /admin lives on the marketing domain (vault.* 404s it).
  if (process.env.NODE_ENV === "production") {
    const isVaultHost = host.startsWith("vault.");
    if (isVaultPath && !isVaultHost) {
      return NextResponse.rewrite(new URL("/404", req.nextUrl));
    }
    if (pathname.startsWith("/admin") && isVaultHost) {
      return NextResponse.rewrite(new URL("/404", req.nextUrl));
    }
  }

  const isLogin =
    pathname === "/vault/login" || pathname.startsWith("/vault/login/");

  if (!isLogin && !req.auth) {
    const loginUrl = new URL("/vault/login", req.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});
