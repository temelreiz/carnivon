/**
 * Carnivon per-animal pricing.
 *
 * Cycle model (standard):
 *   - Enter at 300 kg live weight
 *   - Sell at ~450 kg live weight after 90 days
 *   - Daily ops cost (feed, care, insurance, amortised): $10/animal/day
 *   - Platform margin on the all-in cost: 10%
 *
 * Live-weight price derivation from the CEPEA arroba indicator:
 *   1 arroba (@) = 15 kg of carcass
 *   carcass yield (rendimento) ≈ 0.55 × live weight
 *   → price per kg live (BRL) = arrobaPriceBRL × 0.55 / 15
 */

export const CYCLE_DEFAULTS = {
  entryWeightKg: 300,
  exitWeightKg: 450,
  durationDays: 90,
  feedCostPerDayUSD: 10,
  marginBps: 1000, // 10%
  carcassYield: 0.55,
  kgPerArroba: 15,
} as const;

export type PriceInputs = {
  /** CEPEA Boi Gordo — BRL per arroba (15 kg carcass). */
  arrobaBRL: number;
  /** FX: how many USD for 1 BRL (e.g. 0.184). */
  usdPerBRL: number;
  /** Live weight at entry, in kg. Defaults to 300. */
  entryWeightKg?: number;
  /** Cycle duration in days. Defaults to 90. */
  durationDays?: number;
  /** Daily ops cost in USD. Defaults to $10. */
  feedCostPerDayUSD?: number;
  /** Margin in basis points (1000 = 10%). Defaults to 1000. */
  marginBps?: number;
};

export type PriceBreakdown = {
  liveKgPriceBRL: number;
  liveKgPriceUSD: number;
  animalCostUSD: number;
  opsCostUSD: number;
  totalCostUSD: number;
  marginUSD: number;
  investorPriceUSD: number;
};

/** Compute one animal's investor-facing price, given a spot arroba + FX rate. */
export function computeAnimalPrice(inputs: PriceInputs): PriceBreakdown {
  const entryWeightKg = inputs.entryWeightKg ?? CYCLE_DEFAULTS.entryWeightKg;
  const durationDays = inputs.durationDays ?? CYCLE_DEFAULTS.durationDays;
  const feedCostPerDayUSD =
    inputs.feedCostPerDayUSD ?? CYCLE_DEFAULTS.feedCostPerDayUSD;
  const marginBps = inputs.marginBps ?? CYCLE_DEFAULTS.marginBps;

  const liveKgPriceBRL =
    (inputs.arrobaBRL * CYCLE_DEFAULTS.carcassYield) / CYCLE_DEFAULTS.kgPerArroba;
  const liveKgPriceUSD = liveKgPriceBRL * inputs.usdPerBRL;

  const animalCostUSD = liveKgPriceUSD * entryWeightKg;
  const opsCostUSD = feedCostPerDayUSD * durationDays;
  const totalCostUSD = animalCostUSD + opsCostUSD;
  const marginUSD = totalCostUSD * (marginBps / 10000);
  const investorPriceUSD = totalCostUSD + marginUSD;

  return {
    liveKgPriceBRL,
    liveKgPriceUSD,
    animalCostUSD,
    opsCostUSD,
    totalCostUSD,
    marginUSD,
    investorPriceUSD,
  };
}

/** Format USD as a display string: $2,547 (rounded to nearest dollar). */
export function formatUSD(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
