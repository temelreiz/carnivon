import type { LiveMetrics as LiveMetricsT } from "@/lib/mock-data";
import { Section } from "@/components/ui/Section";

export function LiveMetrics({ metrics }: { metrics: LiveMetricsT }) {
  const items = [
    { label: "Total headcount", value: metrics.total_headcount.toLocaleString(), sub: "head allocated" },
    { label: "Avg entry weight", value: metrics.avg_entry_weight, sub: "per animal" },
    { label: "Mortality rate", value: metrics.mortality_rate, sub: "cycle-to-date" },
    { label: "Days in cycle", value: metrics.days_in_cycle.toString(), sub: "elapsed" },
    { label: "Deployment", value: metrics.deployment_ratio, sub: "of capital" },
    { label: "Expected exit", value: metrics.expected_exit, sub: "sale window" },
  ];

  return (
    <Section
      id="metrics"
      eyebrow="Live Operations"
      title="Operational metrics, updated weekly."
      intro="Cycle health is reported against objective, operator-signed data. No indicative marks — these are the numbers the operator is accountable to."
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-forest-700/40 border border-forest-700/60">
        {items.map((m) => (
          <div key={m.label} className="bg-forest-950/80 p-8 md:p-10">
            <div className="text-xs uppercase tracking-[0.18em] text-cream-100/50 mb-3">
              {m.label}
            </div>
            <div className="font-serif text-4xl md:text-5xl text-cream-50 leading-none mb-2">
              {m.value}
            </div>
            <div className="text-xs text-cream-100/50">{m.sub}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-cream-100/40">
        Figures reflect the most recent weekly operator report. A full audit
        trail is available in the Trust Center.
      </p>
    </Section>
  );
}
