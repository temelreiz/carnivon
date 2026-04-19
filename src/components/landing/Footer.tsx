export function Footer() {
  return (
    <footer className="mt-20 border-t border-forest-700/60">
      <div className="container-max py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="font-serif text-xl text-cream-50 mb-3">Carnivon</div>
          <p className="text-sm text-cream-100/60 leading-relaxed">
            Real Asset Yield Infrastructure. Institutional access to Brazilian
            livestock cycles.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            { label: "Current cycle", href: "#product" },
            { label: "How it works", href: "#how" },
            { label: "Live metrics", href: "#metrics" },
          ]}
        />
        <FooterCol
          title="Trust"
          links={[
            { label: "Risk framework", href: "#risk" },
            { label: "Trust center", href: "#trust" },
            { label: "Documents", href: "#documents" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { label: "Vault", href: "https://vault.carnivon.io" },
            { label: "Contact", href: "mailto:investors@carnivon.io" },
          ]}
        />
      </div>

      <div className="container-max pb-12 text-xs text-cream-100/40 leading-relaxed">
        <div className="hairline-gold mb-8" />
        <p className="mb-3">
          © {new Date().getFullYear()} Carnivon. Carnivon SPC Ltd is a
          segregated portfolio company organised under the laws of the Cayman
          Islands. Carnivon Brazil Ltda is the operating company in Brazil.
        </p>
        <p>
          Nothing on this site constitutes an offer, solicitation, or
          recommendation to buy or sell any security in any jurisdiction where
          such an offer would be unlawful. Offerings are limited to qualifying
          investors in permitted jurisdictions only and are subject to the
          terms of the relevant offering documents.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="eyebrow mb-4">{title}</div>
      <ul className="space-y-2 text-sm text-cream-100/70">
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} className="hover:text-gold transition-colors">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
