/**
 * CEPEA/Esalq "Indicador do Boi Gordo" — daily BRL price per arroba.
 *
 * There's no public JSON API, so we scrape the public indicator page. CEPEA's
 * HTML is stable enough for a couple of regex anchors to cover it; if the
 * layout ever shifts we'll see stale data via the `fetchedAt` audit column
 * before the UI misprices anything.
 *
 * Source: https://www.cepea.esalq.usp.br/br/indicador/boi-gordo.aspx
 */

const CEPEA_URL = "https://www.cepea.esalq.usp.br/br/indicador/boi-gordo.aspx";

export type CepeaReading = {
  /** BRL cents per arroba — integer to avoid float drift. */
  pricePerArrobaCentsBRL: number;
  /** Market date as ISO yyyy-mm-dd (São Paulo). */
  date: string;
  /** Raw string matched, for audit. */
  raw: string;
};

export async function fetchCepeaBoiGordo(): Promise<CepeaReading> {
  const res = await fetch(CEPEA_URL, {
    headers: {
      // CEPEA serves a minimal page to non-browser UAs — pretend to be Chrome.
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    },
    // Never cache CEPEA responses — the whole point is to get today's price.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`CEPEA fetch failed: HTTP ${res.status}`);
  }

  const html = await res.text();

  // Look for the current "À vista R$" value, which appears in the summary card
  // near the top of the page. Price format is Brazilian: "329,75" (comma decimal).
  // We match up to three digits of reais + comma + two digits.
  const priceMatch =
    html.match(/À\s*vista[^<]*?R\$[^\d]*(\d{2,4}[,\.]\d{2})/i) ||
    html.match(/R\$[^\d]{0,5}(\d{2,4}[,\.]\d{2})/);

  if (!priceMatch) {
    throw new Error("CEPEA scrape: no price pattern matched");
  }

  const raw = priceMatch[1];
  const priceBRL = parseFloat(raw.replace(/\./g, "").replace(",", "."));

  if (!isFinite(priceBRL) || priceBRL <= 0 || priceBRL > 9999) {
    throw new Error(`CEPEA scrape: implausible price "${raw}"`);
  }

  const dateMatch = html.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const date = dateMatch
    ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
    : new Date().toISOString().slice(0, 10);

  return {
    pricePerArrobaCentsBRL: Math.round(priceBRL * 100),
    date,
    raw: priceMatch[0],
  };
}
