import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const Body = z.object({
  /** BRL per arroba, e.g. 327.50 */
  arrobaBRL: z.number().positive().max(9999),
  /** yyyy-mm-dd; defaults to today */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  /** Free-text source note, e.g. "CEPEA 2026-04-22 print" */
  note: z.string().max(200).optional(),
});

/**
 * Manual override for the CEPEA arroba price. Use this when the scraper
 * can't get through (Cloudflare challenge) or for backfilling historical
 * prices. Same auth as the cron endpoint — CRON_SECRET or localhost.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;
  const isLocal = req.headers.get("host")?.startsWith("localhost");

  if (expected && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!expected && !isLocal) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { arrobaBRL, note } = parsed.data;
  const date = new Date(parsed.data.date ?? new Date().toISOString().slice(0, 10));
  const cents = Math.round(arrobaBRL * 100);

  const row = await prisma.cattlePrice.upsert({
    where: { source_date: { source: "MANUAL", date } },
    update: {
      pricePerArrobaBRL: cents,
      rawPayload: { note: note ?? null, manual: true },
      fetchedAt: new Date(),
    },
    create: {
      source: "MANUAL",
      date,
      pricePerArrobaBRL: cents,
      rawPayload: { note: note ?? null, manual: true },
    },
  });

  return NextResponse.json({
    ok: true,
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    brlPerArroba: cents / 100,
  });
}
