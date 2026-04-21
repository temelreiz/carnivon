import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchBrlUsd } from "@/lib/fx";

export const runtime = "nodejs";

/**
 * Daily FX refresh (Vercel cron). The arroba price is entered by an operator
 * through /admin/pricing — CEPEA is Cloudflare-fronted and not scrapable from
 * serverless IPs. See the Admin dashboard for the manual entry flow.
 */
export async function GET(req: NextRequest) {
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
    return NextResponse.json({
      ok: true,
      fx: { date: fx.date, rate: fx.rate },
    });
  } catch (err) {
    console.error("[pricing/refresh:fx]", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
