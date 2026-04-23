"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";

const CycleInput = z.object({
  symbol: z.string().min(1).max(32),
  name: z.string().min(1).max(200),
  status: z.enum(["DRAFT", "FUNDING", "ACTIVE", "MATURED", "CLOSED"]),
  durationDays: z.coerce.number().int().min(1).max(3650),
  startDate: z.string().optional().or(z.literal("")),
  maturityDate: z.string().optional().or(z.literal("")),
  targetReturn: z.string().min(1).max(100),
  minTicketUSD: z.coerce.number().min(0).max(1_000_000_000),
  aumUSD: z.coerce.number().min(0).max(1_000_000_000).optional(),
  deployedPct: z.coerce.number().int().min(0).max(100).optional(),
  spvEntity: z.string().max(200).optional().or(z.literal("")),
  operator: z.string().max(200).optional().or(z.literal("")),
  tokenAddress: z.string().max(100).optional().or(z.literal("")),
});

function parseDate(s: string | undefined | null): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(s);
}

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/vault");
}

export async function createCycle(formData: FormData) {
  await requireAdmin();

  const parsed = CycleInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid");

  const startDate = parseDate(parsed.data.startDate);
  let maturityDate = parseDate(parsed.data.maturityDate);
  if (!maturityDate && startDate) {
    maturityDate = new Date(
      startDate.getTime() + parsed.data.durationDays * 86_400_000
    );
  }

  await prisma.cycle.create({
    data: {
      symbol: parsed.data.symbol.toUpperCase(),
      name: parsed.data.name,
      status: parsed.data.status,
      durationDays: parsed.data.durationDays,
      startDate,
      maturityDate,
      targetReturn: parsed.data.targetReturn,
      minTicket: Math.round(parsed.data.minTicketUSD * 100),
      aumCents: BigInt(Math.round((parsed.data.aumUSD ?? 0) * 100)),
      deployedPct: parsed.data.deployedPct ?? 0,
      spvEntity: parsed.data.spvEntity || null,
      operator: parsed.data.operator || null,
      tokenAddress: parsed.data.tokenAddress || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/cycles");
  redirect("/admin/cycles");
}

export async function updateCycle(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = CycleInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid");

  const startDate = parseDate(parsed.data.startDate);
  let maturityDate = parseDate(parsed.data.maturityDate);
  if (!maturityDate && startDate) {
    maturityDate = new Date(
      startDate.getTime() + parsed.data.durationDays * 86_400_000
    );
  }

  await prisma.cycle.update({
    where: { id },
    data: {
      name: parsed.data.name,
      status: parsed.data.status,
      durationDays: parsed.data.durationDays,
      startDate,
      maturityDate,
      targetReturn: parsed.data.targetReturn,
      minTicket: Math.round(parsed.data.minTicketUSD * 100),
      aumCents: BigInt(Math.round((parsed.data.aumUSD ?? 0) * 100)),
      deployedPct: parsed.data.deployedPct ?? 0,
      spvEntity: parsed.data.spvEntity || null,
      operator: parsed.data.operator || null,
      tokenAddress: parsed.data.tokenAddress || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/cycles");
  revalidatePath(`/admin/cycles/${id}`);
  redirect("/admin/cycles");
}

export async function deleteCycle(id: string) {
  await requireAdmin();

  const counts = await prisma.cycle.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          subscriptions: true,
          animals: true,
          batches: true,
          costs: true,
          sales: true,
          distributions: true,
        },
      },
    },
  });

  if (!counts) redirect("/admin/cycles");

  const busy = Object.values(counts!._count).reduce((a, b) => a + b, 0);
  if (busy > 0) {
    throw new Error(
      "Cycle has linked records (subscriptions, head, costs, sales, distributions). Close instead of deleting."
    );
  }

  await prisma.cycle.delete({ where: { id } });

  revalidatePath("/admin/cycles");
  redirect("/admin/cycles");
}
