import type { Product } from "@/lib/mock-data";
import { Section } from "@/components/ui/Section";

export function ProductCard({ product }: { product: Product }) {
  const rows = [
    { label: "Symbol", value: product.symbol },
    { label: "Duration", value: `${product.duration_days} days` },
    { label: "Target return", value: product.target_return },
    { label: "AUM (current)", value: product.aum },
    { label: "Deployed", value: product.deployed },
    { label: "Minimum ticket", value: product.min_ticket },
    { label: "Start date", value: formatDate(product.start_date) },
    { label: "Maturity", value: formatDate(product.maturity_date) },
  ];

  return (
    <Section
      id="product"
      eyebrow="Current Cycle"
      title="Carnivon Brazil Cattle Cycle 01"
      intro="A structured, asset-backed participation in a single 90-day Brazilian cattle cycle. Audited, permissioned, and capacity-limited."
    >
      <div className="card">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-forest-700/60 px-6 py-5 md:px-10 md:py-6">
          <div className="flex items-center gap-4">
            <StatusPill status={product.status} />
            <div>
              <div className="text-xs text-cream-100/50 uppercase tracking-[0.18em]">
                {product.symbol}
              </div>
              <div className="font-serif text-xl md:text-2xl text-cream-50">
                {product.name}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="#documents" className="btn-secondary text-xs">
              Download term sheet
            </a>
            <a href="#access" className="btn-primary text-xs">
              View details
            </a>
          </div>
        </div>

        {/* Data grid */}
        <dl className="grid grid-cols-2 md:grid-cols-4">
          {rows.map((r, i) => (
            <div
              key={r.label}
              className={`p-6 md:p-8 border-forest-700/60 ${
                i % 4 !== 3 ? "md:border-r" : ""
              } ${i < rows.length - (rows.length % 4 || 4) ? "border-b" : ""} ${
                i % 2 !== 1 ? "border-r md:border-r" : ""
              }`}
            >
              <dt className="text-xs uppercase tracking-[0.18em] text-cream-100/50 mb-2">
                {r.label}
              </dt>
              <dd className="font-serif text-lg md:text-xl text-cream-50">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Deployment bar */}
        <div className="border-t border-forest-700/60 px-6 md:px-10 py-6">
          <div className="flex items-center justify-between text-xs text-cream-100/60 mb-2">
            <span>Capital deployment</span>
            <span>{product.deployed}</span>
          </div>
          <div className="h-[3px] w-full bg-forest-700/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-deep to-gold-soft"
              style={{ width: product.deployed }}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

function StatusPill({ status }: { status: Product["status"] }) {
  const active = status === "Open" || status === "Funding" || status === "Active";
  return (
    <div
      className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] px-3 py-1.5 border ${
        active
          ? "border-gold/50 text-gold-soft"
          : "border-cream-100/30 text-cream-100/60"
      }`}
    >
      <span
        className={`block h-1.5 w-1.5 rounded-full ${
          active ? "bg-gold-soft animate-pulse" : "bg-cream-100/40"
        }`}
      />
      {status}
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
