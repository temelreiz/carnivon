/**
 * BRL → USD FX rate. Uses frankfurter.app (free, no key, ECB daily rates).
 * Docs: https://www.frankfurter.app/docs/
 */

export type FxReading = {
  /** USD per 1 BRL (e.g. 0.1843). */
  rate: number;
  /** ECB publication date, yyyy-mm-dd. */
  date: string;
  source: "frankfurter";
};

export async function fetchBrlUsd(): Promise<FxReading> {
  const res = await fetch("https://api.frankfurter.app/latest?from=BRL&to=USD", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Frankfurter fetch failed: HTTP ${res.status}`);
  }

  const json = (await res.json()) as {
    date: string;
    rates: { USD?: number };
  };

  const rate = json.rates?.USD;
  if (typeof rate !== "number" || rate <= 0 || rate > 1) {
    throw new Error(`FX: implausible BRL→USD rate ${rate}`);
  }

  return { rate, date: json.date, source: "frankfurter" };
}
