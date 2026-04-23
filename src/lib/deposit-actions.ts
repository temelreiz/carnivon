"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { getOrCreateInvestor } from "@/lib/investor";
import { sendDepositNotification } from "@/lib/email";

async function requireInvestorSession() {
  const session = await auth();
  if (!session?.user) redirect("/vault/login");
  return session!.user!;
}

async function requireAdminSession() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/vault");
  return session!.user!;
}

// ------------------------- Investor-side -------------------------

const SubmitInput = z.object({
  cycleId: z.string().min(1),
  chain: z.string().min(1),
  asset: z.string().min(1),
  houseWalletId: z.string().min(1),
  amountUSD: z.coerce.number().positive().max(100_000_000),
  amountCrypto: z.string().max(64).optional().or(z.literal("")),
  txHash: z.string().min(6).max(200),
});

export async function submitDeposit(formData: FormData) {
  const user = await requireInvestorSession();
  const investor = await getOrCreateInvestor({
    id: user.id!,
    email: user.email,
    name: user.name,
  });

  const parsed = SubmitInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const d = parsed.data;

  const wallet = await prisma.houseWallet.findUnique({
    where: { id: d.houseWalletId },
  });
  if (!wallet || !wallet.active) {
    throw new Error("Selected wallet is no longer available");
  }
  if (wallet.chain !== d.chain || wallet.asset !== d.asset) {
    throw new Error("Chain/asset mismatch");
  }

  const cycle = await prisma.cycle.findUnique({ where: { id: d.cycleId } });
  if (!cycle || !["FUNDING", "ACTIVE"].includes(cycle.status)) {
    throw new Error("This cycle is not open for subscriptions");
  }

  const dup = await prisma.deposit.findUnique({
    where: { txHash: d.txHash.trim() },
  });
  if (dup) {
    throw new Error("This transaction hash is already on file");
  }

  const deposit = await prisma.deposit.create({
    data: {
      investorId: investor.id,
      cycleId: cycle.id,
      houseWalletId: wallet.id,
      chain: d.chain,
      asset: d.asset,
      amountUSDCents: BigInt(Math.round(d.amountUSD * 100)),
      amountCrypto: d.amountCrypto?.trim() || null,
      txHash: d.txHash.trim(),
    },
  });

  // Fire-and-forget — failures only log, shouldn't block the submission.
  sendDepositNotification({
    depositId: deposit.id,
    investorEmail: investor.email,
    investorName: investor.name,
    cycleSymbol: cycle.symbol,
    chain: d.chain,
    asset: d.asset,
    amountUSD: d.amountUSD,
    amountCrypto: d.amountCrypto?.trim() || null,
    txHash: d.txHash.trim(),
  }).catch((err) =>
    console.error("[deposit:email-notify]", err)
  );

  revalidatePath("/vault/deposits");
  revalidatePath("/admin/deposits");
  redirect("/vault/deposits?submitted=1");
}

// ------------------------- Admin-side -------------------------

const ApproveInput = z.object({
  amountUSD: z.coerce.number().positive().max(100_000_000),
  adminNote: z.string().max(500).optional().or(z.literal("")),
});

export async function approveDeposit(id: string, formData: FormData) {
  const admin = await requireAdminSession();

  const parsed = ApproveInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const deposit = await prisma.deposit.findUnique({ where: { id } });
  if (!deposit) throw new Error("Not found");
  if (deposit.status !== "PENDING") {
    throw new Error(`Deposit is already ${deposit.status}`);
  }

  const amountCents = BigInt(Math.round(parsed.data.amountUSD * 100));
  const now = new Date();

  // Create Subscription + link it in one transaction.
  await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.create({
      data: {
        investorId: deposit.investorId,
        cycleId: deposit.cycleId,
        amountCents,
        committedAt: deposit.createdAt,
        fundedAt: now,
      },
    });
    await tx.deposit.update({
      where: { id: deposit.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: now,
        amountUSDCents: amountCents, // corrected by admin if needed
        adminNote: parsed.data.adminNote || null,
        adminEmail: admin.email ?? null,
        subscriptionId: sub.id,
      },
    });
    // Bump cycle AUM (add to aumCents).
    await tx.cycle.update({
      where: { id: deposit.cycleId },
      data: { aumCents: { increment: amountCents } },
    });
  });

  revalidatePath("/admin/deposits");
  revalidatePath("/vault/deposits");
  revalidatePath("/vault/positions");
  revalidatePath("/vault");
}

const RejectInput = z.object({
  adminNote: z.string().min(1).max(500),
});

export async function rejectDeposit(id: string, formData: FormData) {
  const admin = await requireAdminSession();

  const parsed = RejectInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Reason required");
  }

  const deposit = await prisma.deposit.findUnique({ where: { id } });
  if (!deposit) throw new Error("Not found");
  if (deposit.status !== "PENDING") {
    throw new Error(`Deposit is already ${deposit.status}`);
  }

  await prisma.deposit.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
      adminNote: parsed.data.adminNote,
      adminEmail: admin.email ?? null,
    },
  });

  revalidatePath("/admin/deposits");
  revalidatePath("/vault/deposits");
}

// ------------------------- HouseWallet CRUD -------------------------

const HouseWalletInput = z.object({
  chain: z.enum(["bitcoin", "ethereum", "base", "tron"]),
  asset: z.enum(["BTC", "ETH", "USDC", "USDT"]),
  address: z.string().min(10).max(200),
  memo: z.string().max(200).optional().or(z.literal("")),
  label: z.string().max(120).optional().or(z.literal("")),
  active: z.coerce.boolean().optional(),
});

export async function createHouseWallet(formData: FormData) {
  await requireAdminSession();
  const parsed = HouseWalletInput.safeParse({
    ...Object.fromEntries(formData),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid");
  }
  const d = parsed.data;
  await prisma.houseWallet.create({
    data: {
      chain: d.chain,
      asset: d.asset,
      address: d.address.trim(),
      memo: d.memo || null,
      label: d.label || null,
      active: d.active ?? true,
    },
  });
  revalidatePath("/admin/wallets");
  redirect("/admin/wallets");
}

export async function updateHouseWallet(id: string, formData: FormData) {
  await requireAdminSession();
  const parsed = HouseWalletInput.safeParse({
    ...Object.fromEntries(formData),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid");
  }
  const d = parsed.data;
  await prisma.houseWallet.update({
    where: { id },
    data: {
      chain: d.chain,
      asset: d.asset,
      address: d.address.trim(),
      memo: d.memo || null,
      label: d.label || null,
      active: d.active ?? false,
    },
  });
  revalidatePath("/admin/wallets");
  redirect("/admin/wallets");
}

export async function deleteHouseWallet(id: string) {
  await requireAdminSession();
  const inUse = await prisma.deposit.count({ where: { houseWalletId: id } });
  if (inUse > 0) {
    throw new Error(
      `Wallet has ${inUse} deposit(s) linked to it — deactivate instead of deleting.`
    );
  }
  await prisma.houseWallet.delete({ where: { id } });
  revalidatePath("/admin/wallets");
}
