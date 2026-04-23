import { prisma } from "@/lib/db";
import { computeHeadPrice, formatUSD, type PriceBreakdown } from "@/lib/pricing";

export type CurrentHeadPrice = {
  priceUSD: number;
  display: string;
  asOf: string; // yyyy-mm-dd — oldest of (cattle date, fx date)
  breakdown: PriceBreakdown;
  source: { cattle: string; fx: string };
};

/**
 * Returns the current computed price per head of cattle, pulling the latest
 * CEPEA arroba and BRL→USD FX from the DB. Returns null if either side is
 * missing so the caller can fall back to a copy-only "1 head" display.
 */
export async function getCurrentHeadPrice(): Promise<CurrentHeadPrice | null> {
  if (!process.env.DATABASE_URL) return null;

  const [cattle, fx] = await Promise.all([
    // Latest arroba price regardless of source (MANUAL overrides CEPEA for
    // the same date via a later fetchedAt; across dates, newest wins).
    prisma.cattlePrice.findFirst({
      orderBy: [{ date: "desc" }, { fetchedAt: "desc" }],
    }),
    prisma.fxRate.findFirst({
      where: { pair: "BRL_USD" },
      orderBy: { date: "desc" },
    }),
  ]);

  if (!cattle || !fx) return null;

  const arrobaBRL = cattle.pricePerArrobaBRL / 100;
  const breakdown = computeHeadPrice({
    arrobaBRL,
    usdPerBRL: fx.rate,
  });

  const cattleDate = cattle.date.toISOString().slice(0, 10);
  const fxDate = fx.date.toISOString().slice(0, 10);
  const asOf = cattleDate < fxDate ? cattleDate : fxDate;

  return {
    priceUSD: breakdown.investorPriceUSD,
    display: `1 head ≈ ${formatUSD(breakdown.investorPriceUSD)}`,
    asOf,
    breakdown,
    source: { cattle: cattleDate, fx: fxDate },
  };
}
