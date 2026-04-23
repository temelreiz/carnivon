import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatUSD } from "@/lib/pricing";
import { getCurrentHeadPrice } from "@/lib/product-pricing";

export default async function AdminDashboard() {
  const [latestCattle, latestFx, pricing] = await Promise.all([
    prisma.cattlePrice.findFirst({
      orderBy: [{ date: "desc" }, { fetchedAt: "desc" }],
    }),
    prisma.fxRate.findFirst({
      where: { pair: "BRL_USD" },
      orderBy: { date: "desc" },
    }),
    getCurrentHeadPrice().catch(() => null),
  ]);

  return (
    <div className="container-max py-16">
      <div className="eyebrow mb-4">Operator console</div>
      <h1 className="font-serif text-4xl md:text-5xl text-cream-50 mb-4">
        Admin
      </h1>
      <p className="text-cream-100/70 max-w-2xl mb-12">
        Weekly data entry for the active cycle. Kept intentionally minimal —
        just the inputs the pricing model needs until a scraper or admin app
        replaces this.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <Tile
          title="Pricing"
          body={
            latestCattle
              ? `Last arroba: R$${(latestCattle.pricePerArrobaBRL / 100).toFixed(2)} (${latestCattle.date.toISOString().slice(0, 10)}, ${latestCattle.source})`
              : "No arroba price recorded yet."
          }
          href="/admin/pricing"
          cta="Enter weekly arroba →"
        />
        <Tile
          title="FX (auto)"
          body={
            latestFx
              ? `1 BRL = $${latestFx.rate.toFixed(4)} on ${latestFx.date.toISOString().slice(0, 10)} (${latestFx.source})`
              : "No FX rate yet — cron not run."
          }
          href=""
          cta="Pulled daily from frankfurter.app"
        />
        <Tile
          title="Investor price"
          body={
            pricing
              ? `1 head ≈ ${formatUSD(pricing.priceUSD)} as of ${pricing.asOf}`
              : "Needs both an arroba reading and an FX rate."
          }
          href=""
          cta="Shown on the landing page Hero"
        />
      </div>
    </div>
  );
}

function Tile({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  const inner = (
    <div className="card p-6 h-full">
      <h3 className="font-serif text-xl text-cream-50 mb-3">{title}</h3>
      <p className="text-sm text-cream-100/70 mb-6">{body}</p>
      <div className="text-xs text-gold uppercase tracking-[0.18em]">{cta}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  ) : (
    inner
  );
}
