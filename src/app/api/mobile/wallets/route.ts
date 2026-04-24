import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Public — deposit addresses are meant to be handed to investors. Matches
// what's rendered on /vault/invest.
export async function GET() {
  const wallets = await prisma.houseWallet.findMany({
    where: { active: true },
    orderBy: [{ asset: "asc" }, { chain: "asc" }],
    select: {
      id: true,
      chain: true,
      asset: true,
      address: true,
      memo: true,
      label: true,
    },
  });
  return NextResponse.json({ wallets });
}
