import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signMobileToken } from "@/lib/mobile-jwt";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "Email or password is incorrect" },
      { status: 401 }
    );
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Email or password is incorrect" },
      { status: 401 }
    );
  }

  const token = await signMobileToken(user.id);
  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
