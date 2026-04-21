import { Section } from "@/components/ui/Section";

const steps = [
  {
    num: "01",
    title: "Subscribe",
    body:
      "Investor onboarding with institutional-grade KYC and KYB. Capital commitment is locked against a specific cycle SPV.",
    points: ["KYC / AML screening", "Jurisdiction checks", "Capital commitment"],
  },
  {
    num: "02",
    title: "Deploy",
    body:
      "Capital routes into the SPV and onward to the operating company in Brazil. Livestock is sourced, weighed, and allocated across vetted farms.",
    points: ["Multi-farm diversification", "Traceable supply chain", "Weekly operational reporting"],
  },
  {
    num: "03",
    title: "Realize",
    body:
      "Cattle are sold at cycle maturity. Net proceeds — after verified costs, mortality, and fees — are distributed to investors on a pro-rata basis.",
    points: ["Audited cost ledger", "Transparent NAV", "Distribution at exit"],
  },
];

export function HowItWorks() {
  return (
    <Section
      id="how"
      eyebrow="How it works"
      title="Three phases. One cycle."
      intro="Each Carnivon cycle is a self-contained, time-bound investment: from commitment to realization in roughly 90 days."
    >
      <div className="grid md:grid-cols-3 gap-px bg-forest-700/40 border border-forest-700/60">
        {steps.map((s) => (
          <div key={s.num} className="bg-forest-950/80 p-8 md:p-10">
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-serif text-5xl text-gold">{s.num}</span>
              <h3 className="font-serif text-2xl text-cream-50">{s.title}</h3>
            </div>
            <p className="text-cream-100/70 leading-relaxed mb-6">{s.body}</p>
            <ul className="space-y-2 text-sm text-cream-100/60">
              {s.points.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="block h-px w-4 bg-gold/60" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
