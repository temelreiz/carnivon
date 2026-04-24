import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import type { Investor, User } from "@prisma/client";

/**
 * Mobile sessions are stateless — a short-lived JWT signed with AUTH_SECRET.
 * Web still uses Auth.js cookies (separate namespace); this path is only hit
 * by the /api/mobile/* endpoints.
 */

const ISSUER = "carnivon-mobile";
const AUDIENCE = "carnivon-mobile-app";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw) throw new Error("AUTH_SECRET missing — can't sign mobile JWTs");
  return new TextEncoder().encode(raw);
}

export async function signMobileToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + TTL_SECONDS)
    .sign(getSecret());
}

export async function verifyMobileToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.sub !== "string") return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export function bearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const t = h.slice(7).trim();
  return t || null;
}

/**
 * Pull the caller's User + Investor off the bearer token. Throws null-like
 * behaviour (returns null) when the token is absent or invalid so endpoints
 * can short-circuit with a 401.
 */
export async function getMobileSession(
  req: NextRequest
): Promise<{ user: User; investor: Investor } | null> {
  const token = bearer(req);
  if (!token) return null;
  const claims = await verifyMobileToken(token);
  if (!claims) return null;

  const user = await prisma.user.findUnique({ where: { id: claims.userId } });
  if (!user) return null;

  // Lazily create the Investor row on first mobile hit, same way the web
  // flow does via getOrCreateInvestor.
  const investor =
    (await prisma.investor.findUnique({ where: { userId: user.id } })) ??
    (user.email
      ? await prisma.investor.findUnique({ where: { email: user.email } })
      : null);

  if (!investor) return null;
  // Backfill userId if the Investor existed via email but hadn't been linked.
  if (!investor.userId) {
    await prisma.investor.update({
      where: { id: investor.id },
      data: { userId: user.id },
    });
  }
  return { user, investor };
}
