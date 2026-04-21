import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchCepeaBoiGordo } from "@/lib/cepea";
import { fetchBrlUsd } from "@/lib/fx";

export const runtime = "nodejs";

/**
 * Pulls today's CEPEA arroba price and BRL→USD FX and upserts both into the
 * DB. Called by Vercel Cron daily; protected by CRON_SECRET so only the
 * cron runner (or a dev with the secret) can trigger it.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;

  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when set.
  // If CRON_SECRET is not configured, allow only from localhost for dev.
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

  const results: Record<string, unknown> = {};

  try {
    const cepea = await fetchCepeaBoiGordo();
    await prisma.cattlePrice.upsert({
      where: {
        source_date: {
          source: "CEPEA_BOI_GORDO",
          date: new Date(cepea.date),
        },
      },
      update: {
        pricePerArrobaBRL: cepea.pricePerArrobaCentsBRL,
        rawPayload: { raw: cepea.raw },
        fetchedAt: new Date(),
      },
      create: {
        source: "CEPEA_BOI_GORDO",
        date: new Date(cepea.date),
        pricePerArrobaBRL: cepea.pricePerArrobaCentsBRL,
        rawPayload: { raw: cepea.raw },
      },
    });
    results.cepea = {
      ok: true,
      date: cepea.date,
      brlPerArroba: cepea.pricePerArrobaCentsBRL / 100,
    };
  } catch (err) {
    console.error("[pricing/refresh:cepea]", err);
    results.cepea = { ok: false, error: (err as Error).message };
  }

  try {
    const fx = await fetchBrlUsd();
    await prisma.fxRate.upsert({
      where: { pair_date: { pair: "BRL_USD", date: new Date(fx.date) } },
      update: { rate: fx.rate, source: fx.source, fetchedAt: new Date() },
      create: {
        pair: "BRL_USD",
        date: new Date(fx.date),
        rate: fx.rate,
        source: fx.source,
      },
    });
    results.fx = { ok: true, date: fx.date, rate: fx.rate };
  } catch (err) {
    console.error("[pricing/refresh:fx]", err);
    results.fx = { ok: false, error: (err as Error).message };
  }

  return NextResponse.json({ ok: true, results });
}
