import { Section } from "@/components/ui/Section";

const risks = [
  {
    title: "Multi-farm diversification",
    body:
      "Herd allocated across multiple independently-operated farms to reduce single-site exposure (fire, disease, climate).",
  },
  {
    title: "Mortality reserve",
    body:
      "A dedicated reserve is provisioned at cycle start based on historical mortality benchmarks and absorbs expected losses before investor returns.",
  },
  {
    title: "Verified supply chain",
    body:
      "Every batch is sourced from tracked origin farms with SISBOV identification; weight and movement are logged at each transfer.",
  },
  {
    title: "Committed buyer network",
    body:
      "Offtake is secured through a network of vetted processors and exporters, mitigating exit liquidity risk at maturity.",
  },
  {
    title: "Segregated capital structure",
    body:
      "Cycle capital is held in an SPV that is legally segregated from operator balance sheets and from other Carnivon cycles.",
  },
  {
    title: "Independent valuation",
    body:
      "Monthly indicative NAV is calculated against observable arroba pricing and reviewed by an independent valuator.",
  },
];

export function RiskManagement() {
  return (
    <Section
      id="risk"
      eyebrow="Risk Framework"
      title="Structured where it matters."
      intro="Cattle is a real asset — it carries operational and market risk. Carnivon's structure isolates, measures, and provisions against these risks rather than masking them."
    >
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
        {risks.map((r) => (
          <div key={r.title} className="border-l border-gold/40 pl-6">
            <h3 className="font-serif text-xl text-cream-50 mb-3">{r.title}</h3>
            <p className="text-cream-100/70 leading-relaxed">{r.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 border border-cream-100/20 p-6 md:p-8 bg-forest-900/30">
        <div className="eyebrow mb-3">Disclosure</div>
        <p className="text-sm text-cream-100/70 leading-relaxed">
          Target returns are illustrative, not guaranteed. Livestock investments
          are subject to biological, operational, climatic, and market risks,
          including total loss of capital. This material is provided for
          information only and does not constitute an offer or solicitation.
          Offerings are limited to qualifying investors in permitted
          jurisdictions only.
        </p>
      </div>
    </Section>
  );
}
