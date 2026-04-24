import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signMobileToken } from "@/lib/mobile-jwt";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      emailVerified: new Date(),
    },
  });

  // Create the linked Investor row so the first /session call doesn't race.
  await prisma.investor.create({
    data: {
      email,
      name: parsed.data.name,
      jurisdiction: "UNSET",
      userId: user.id,
    },
  });

  const token = await signMobileToken(user.id);
  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
