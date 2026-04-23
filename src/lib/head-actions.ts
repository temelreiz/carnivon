"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/vault");
  return session!.user!;
}

const CreateInput = z.object({
  earTag: z.string().min(1).max(64),
  cycleId: z.string().min(1),
  entryWeightKg: z.coerce.number().int().min(50).max(2000),
  acquiredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function createHead(formData: FormData) {
  await requireAdmin();

  const parsed = CreateInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid");

  const d = parsed.data;
  await prisma.animal.create({
    data: {
      earTag: d.earTag.trim(),
      cycleId: d.cycleId,
      entryWeightKg: d.entryWeightKg,
      currentWeightKg: d.entryWeightKg,
      acquiredAt: new Date(d.acquiredAt),
      notes: d.notes || null,
    },
  });

  revalidatePath("/admin/head");
  redirect("/admin/head");
}

const UpdateStatusInput = z.object({
  status: z.enum(["ACTIVE", "SOLD", "DEAD"]),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function updateHeadStatus(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = UpdateStatusInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid");

  const now = new Date();
  await prisma.animal.update({
    where: { id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      soldAt: parsed.data.status === "SOLD" ? now : null,
      diedAt: parsed.data.status === "DEAD" ? now : null,
    },
  });

  revalidatePath("/admin/head");
  revalidatePath(`/admin/head/${id}`);
}

const WeightInput = z.object({
  weightKg: z.coerce.number().int().min(50).max(2000),
  recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function addWeightEntry(animalId: string, formData: FormData) {
  const user = await requireAdmin();

  const parsed = WeightInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid");

  await prisma.$transaction([
    prisma.weightEntry.create({
      data: {
        animalId,
        weightKg: parsed.data.weightKg,
        recordedAt: new Date(parsed.data.recordedAt),
        enteredById: user.id ?? null,
        notes: parsed.data.notes || null,
      },
    }),
    prisma.animal.update({
      where: { id: animalId },
      data: { currentWeightKg: parsed.data.weightKg },
    }),
  ]);

  revalidatePath(`/admin/head/${animalId}`);
  revalidatePath("/admin/head");
}

/**
 * Bulk weekly weight entry. Accepts a textarea of "earTag, weightKg" pairs
 * (one per line, comma- or whitespace-separated). Non-matching tags are
 * reported back; matching rows upsert a WeightEntry at `recordedAt` and
 * bump Animal.currentWeightKg.
 */
export async function bulkAddWeights(formData: FormData) {
  const user = await requireAdmin();

  const recordedAt = (formData.get("recordedAt") as string) ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(recordedAt)) {
    throw new Error("recordedAt must be yyyy-mm-dd");
  }
  const body = ((formData.get("rows") as string) ?? "").trim();
  if (!body) throw new Error("No rows");

  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const parsedRows: { earTag: string; weightKg: number }[] = [];
  const errors: string[] = [];

  for (const line of lines) {
    const parts = line.split(/[,;\s\t]+/).filter(Boolean);
    if (parts.length < 2) {
      errors.push(`Skipped: "${line}" (need earTag + weight)`);
      continue;
    }
    const earTag = parts[0];
    const w = Number(parts[1]);
    if (!isFinite(w) || w < 50 || w > 2000) {
      errors.push(`Skipped: "${line}" (implausible weight)`);
      continue;
    }
    parsedRows.push({ earTag, weightKg: Math.round(w) });
  }

  if (parsedRows.length === 0) {
    throw new Error("No valid rows — check format: earTag weight");
  }

  const date = new Date(recordedAt);
  const tags = parsedRows.map((r) => r.earTag);
  const animals = await prisma.animal.findMany({
    where: { earTag: { in: tags } },
    select: { id: true, earTag: true },
  });
  const byTag = new Map(animals.map((a) => [a.earTag, a.id]));

  const writes = [];
  const processed: string[] = [];
  const missing: string[] = [];

  for (const r of parsedRows) {
    const animalId = byTag.get(r.earTag);
    if (!animalId) {
      missing.push(r.earTag);
      continue;
    }
    writes.push(
      prisma.weightEntry.create({
        data: {
          animalId,
          weightKg: r.weightKg,
          recordedAt: date,
          enteredById: user.id ?? null,
        },
      }),
      prisma.animal.update({
        where: { id: animalId },
        data: { currentWeightKg: r.weightKg },
      })
    );
    processed.push(r.earTag);
  }

  if (writes.length > 0) await prisma.$transaction(writes);

  revalidatePath("/admin/head");
  revalidatePath("/admin/head/bulk");

  const qs = new URLSearchParams({
    processed: String(processed.length),
    missing: missing.join(","),
    errors: errors.join(" | "),
  });
  redirect(`/admin/head/bulk?${qs}`);
}
