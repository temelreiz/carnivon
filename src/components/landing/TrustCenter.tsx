import { Section } from "@/components/ui/Section";

const items = [
  {
    title: "Legal structure",
    body: "Carnivon SPC Ltd (Cayman) as the segregated portfolio vehicle, with Carnivon Brazil Ltda as the operating company.",
    href: "#",
  },
  {
    title: "Audit reports",
    body: "Independent audit of cycle accounting, cost ledger, and sale proceeds — published at cycle close.",
    href: "#",
  },
  {
    title: "Traceability proof",
    body: "SISBOV-backed origin data and batch movement logs, available to subscribers via the vault.",
    href: "#",
  },
  {
    title: "SPV details",
    body: "Formation documents, segregation attestations, and bank-level cash controls.",
    href: "#",
  },
];

export function TrustCenter() {
  return (
    <Section
      id="trust"
      eyebrow="Trust Center"
      title="Verify, then trust."
      intro="Every component of the structure is documented and independently verifiable."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {items.map((i) => (
          <a
            key={i.title}
            href={i.href}
            className="card group p-8 hover:border-gold/60 transition-colors"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-serif text-xl text-cream-50 mb-3">
                {i.title}
              </h3>
              <span className="text-gold transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
            <p className="text-cream-100/70 leading-relaxed">{i.body}</p>
          </a>
        ))}
      </div>
    </Section>
  );
}
