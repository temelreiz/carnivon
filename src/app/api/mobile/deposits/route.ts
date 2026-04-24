import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-jwt";
import { sendDepositNotification } from "@/lib/email";

export const runtime = "nodejs";

// GET — the authenticated investor's own deposit history.
export async function GET(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const deposits = await prisma.deposit.findMany({
    where: { investorId: session.investor.id },
    include: { cycle: { select: { symbol: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    deposits: deposits.map((d) => ({
      id: d.id,
      createdAt: d.createdAt,
      cycleSymbol: d.cycle.symbol,
      chain: d.chain,
      asset: d.asset,
      amountUSD: Number(d.amountUSDCents) / 100,
      amountCrypto: d.amountCrypto,
      txHash: d.txHash,
      status: d.status,
      adminNote: d.adminNote,
      confirmedAt: d.confirmedAt,
      rejectedAt: d.rejectedAt,
    })),
  });
}

// POST — submit a new deposit. Same guards as submitDeposit() server action:
// cycle open, wallet active/matching, tx hash unique. Fires the investors@
// notification email on success.
const SubmitInput = z.object({
  cycleId: z.string().min(1),
  houseWalletId: z.string().min(1),
  amountUSD: z.coerce.number().positive().max(100_000_000),
  amountCrypto: z.string().max(64).optional().nullable(),
  txHash: z.string().min(6).max(200),
});

export async function POST(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { investor } = session;

  const parsed = SubmitInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const wallet = await prisma.houseWallet.findUnique({
    where: { id: d.houseWalletId },
  });
  if (!wallet || !wallet.active) {
    return NextResponse.json(
      { error: "Selected wallet is no longer available" },
      { status: 400 }
    );
  }

  const cycle = await prisma.cycle.findUnique({ where: { id: d.cycleId } });
  if (!cycle || !["FUNDING", "ACTIVE"].includes(cycle.status)) {
    return NextResponse.json(
      { error: "This cycle is not open for subscriptions" },
      { status: 400 }
    );
  }

  const dup = await prisma.deposit.findUnique({
    where: { txHash: d.txHash.trim() },
  });
  if (dup) {
    return NextResponse.json(
      { error: "This transaction hash is already on file" },
      { status: 409 }
    );
  }

  const deposit = await prisma.deposit.create({
    data: {
      investorId: investor.id,
      cycleId: cycle.id,
      houseWalletId: wallet.id,
      chain: wallet.chain,
      asset: wallet.asset,
      amountUSDCents: BigInt(Math.round(d.amountUSD * 100)),
      amountCrypto: d.amountCrypto?.trim() || null,
      txHash: d.txHash.trim(),
    },
  });

  sendDepositNotification({
    depositId: deposit.id,
    investorEmail: investor.email,
    investorName: investor.name,
    cycleSymbol: cycle.symbol,
    chain: wallet.chain,
    asset: wallet.asset,
    amountUSD: d.amountUSD,
    amountCrypto: d.amountCrypto?.trim() || null,
    txHash: d.txHash.trim(),
  }).catch((err) => console.error("[mobile/deposit:email]", err));

  return NextResponse.json({
    deposit: {
      id: deposit.id,
      status: deposit.status,
      createdAt: deposit.createdAt,
    },
  });
}
