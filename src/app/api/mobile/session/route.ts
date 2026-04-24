import { NextRequest, NextResponse } from "next/server";
import { getMobileSession } from "@/lib/mobile-jwt";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user, investor } = session;
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    investor: {
      id: investor.id,
      name: investor.name,
      email: investor.email,
      entityName: investor.entityName,
      type: investor.type,
      jurisdiction: investor.jurisdiction,
      kycStatus: investor.kycStatus,
      kycProvider: investor.kycProvider,
    },
  });
}
