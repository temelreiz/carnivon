import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentHeadPrice } from "@/lib/product-pricing";

export const runtime = "nodejs";

// Public — no auth required. Matches what the landing page shows so the
// mobile home screen can render a teaser even before login.
export async function GET() {
  const [cycle, pricing] = await Promise.all([
    prisma.cycle.findFirst({
      where: { status: { in: ["FUNDING", "ACTIVE"] } },
      orderBy: { createdAt: "desc" },
    }),
    getCurrentHeadPrice().catch(() => null),
  ]);

  return NextResponse.json({
    cycle: cycle
      ? {
          id: cycle.id,
          symbol: cycle.symbol,
          name: cycle.name,
          status: cycle.status,
          durationDays: cycle.durationDays,
          startDate: cycle.startDate,
          maturityDate: cycle.maturityDate,
          targetReturn: cycle.targetReturn,
          deployedPct: cycle.deployedPct,
        }
      : null,
    pricing: pricing
      ? {
          priceUSD: pricing.priceUSD,
          display: pricing.display,
          asOf: pricing.asOf,
        }
      : null,
  });
}
