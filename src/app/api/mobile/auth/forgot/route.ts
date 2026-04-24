import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendPasswordReset } from "@/lib/email";

export const runtime = "nodejs";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const IDENTIFIER_PREFIX = "pw-reset:";

const Body = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  // Always return the same success shape regardless of whether the email is
  // on file — no enumeration signal.
  if (!parsed.success) return NextResponse.json({ ok: true });

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.passwordHash) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: `${IDENTIFIER_PREFIX}${email}`,
        token,
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    // Reset link opens the web flow — mobile app deep-linking comes later.
    const base = process.env.AUTH_URL || "https://vault.carnivon.io";
    const resetUrl = `${base}/vault/reset?token=${encodeURIComponent(token)}`;
    await sendPasswordReset({ email, resetUrl });
  }

  return NextResponse.json({ ok: true });
}
