import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/db";
import { signMobileToken } from "@/lib/mobile-jwt";

export const runtime = "nodejs";

const Body = z.object({
  provider: z.enum(["google", "apple"]),
  idToken: z.string().min(16),
  name: z.string().max(200).optional(),
});

const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys")
);

async function verifyApple(idToken: string): Promise<{
  sub: string;
  email?: string | null;
  name?: string | null;
}> {
  const audience = process.env.AUTH_APPLE_ID; // Services ID
  if (!audience) throw new Error("AUTH_APPLE_ID not configured");
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience,
  });
  return {
    sub: String(payload.sub),
    email: (payload.email as string | undefined) ?? null,
    name: null,
  };
}

async function verifyGoogle(idToken: string): Promise<{
  sub: string;
  email?: string | null;
  name?: string | null;
}> {
  // All three client IDs are accepted — the mobile app uses whichever is
  // appropriate for its platform (iOS bundle, Android SHA, or generic web).
  const allowedClients = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ].filter(Boolean) as string[];
  if (allowedClients.length === 0) {
    throw new Error("No GOOGLE_*_CLIENT_ID configured");
  }

  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: allowedClients,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub) throw new Error("Invalid Google token");
  return {
    sub: payload.sub,
    email: payload.email ?? null,
    name: payload.name ?? null,
  };
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { provider, idToken, name: fallbackName } = parsed.data;

  let identity: { sub: string; email?: string | null; name?: string | null };
  try {
    identity =
      provider === "apple"
        ? await verifyApple(idToken)
        : await verifyGoogle(idToken);
  } catch (err) {
    console.error("[mobile/auth/oauth:verify]", err);
    return NextResponse.json(
      { error: "Could not verify provider token" },
      { status: 401 }
    );
  }

  // Apple relay emails and anonymous Google sign-ins can have null email on
  // subsequent logins. Require email for first-time create; for returning
  // users we match by Account (provider, providerAccountId).
  const providerAccountId = identity.sub;

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: { provider, providerAccountId },
    },
    include: { user: true },
  });

  let userId: string;

  if (existingAccount) {
    userId = existingAccount.userId;
  } else {
    const email = identity.email;
    if (!email) {
      return NextResponse.json(
        { error: "Provider returned no email — sign up on the web first" },
        { status: 400 }
      );
    }
    // Email account linking: if a User already exists by email, link this
    // provider Account to that User (matches Google provider's
    // allowDangerousEmailAccountLinking behaviour on web).
    const user =
      (await prisma.user.findUnique({ where: { email } })) ??
      (await prisma.user.create({
        data: {
          email,
          name: identity.name ?? fallbackName ?? null,
          emailVerified: new Date(),
        },
      }));

    await prisma.account.create({
      data: {
        userId: user.id,
        type: "oidc",
        provider,
        providerAccountId,
      },
    });

    // Make sure an Investor row exists (web dashboard expects it).
    const existingInvestor = await prisma.investor.findUnique({
      where: { userId: user.id },
    });
    if (!existingInvestor) {
      await prisma.investor.create({
        data: {
          email: user.email!,
          name: user.name ?? identity.name ?? fallbackName ?? "Investor",
          jurisdiction: "UNSET",
          userId: user.id,
        },
      });
    }

    userId = user.id;
  }

  const token = await signMobileToken(userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return NextResponse.json({
    token,
    user: { id: userId, email: user?.email, name: user?.name },
  });
}
