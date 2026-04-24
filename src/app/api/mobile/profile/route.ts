import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-jwt";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().min(1).max(200).optional(),
  jurisdiction: z.string().min(1).max(100).optional(),
  type: z.enum(["INDIVIDUAL", "ENTITY"]).optional(),
  entityName: z.string().max(200).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const investor = await prisma.investor.update({
    where: { id: session.investor.id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.jurisdiction
        ? { jurisdiction: parsed.data.jurisdiction }
        : {}),
      ...(parsed.data.type ? { type: parsed.data.type } : {}),
      ...(parsed.data.entityName !== undefined
        ? { entityName: parsed.data.entityName || null }
        : {}),
    },
  });

  return NextResponse.json({
    investor: {
      id: investor.id,
      name: investor.name,
      jurisdiction: investor.jurisdiction,
      type: investor.type,
      entityName: investor.entityName,
      kycStatus: investor.kycStatus,
    },
  });
}
