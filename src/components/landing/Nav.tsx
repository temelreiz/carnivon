import Link from "next/link";

const items = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how" },
  { label: "Metrics", href: "#metrics" },
  { label: "Trust", href: "#trust" },
  { label: "Documents", href: "#documents" },
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-forest-700/40 bg-forest-950/80 backdrop-blur">
      <div className="container-max flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-serif text-xl tracking-tight text-cream-50">
            Carnivon
          </span>
        </Link>
        <ul className="hidden md:flex items-center gap-8 text-sm text-cream-100/70">
          {items.map((i) => (
            <li key={i.href}>
              <a href={i.href} className="hover:text-gold transition-colors">
                {i.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <a
            href="https://vault.carnivon.io"
            className="hidden md:inline-flex text-sm text-cream-100/70 hover:text-gold"
          >
            Vault
          </a>
          <a href="#access" className="btn-primary text-xs">
            Request Access
          </a>
        </div>
      </div>
    </nav>
  );
}

function Logo() {
  // Simple monogram placeholder: "C" inside hairline circle
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="13" stroke="#b8893a" strokeWidth="1" />
      <path
        d="M18.8 10.8c-.9-1.5-2.6-2.4-4.5-2.4-3 0-5.2 2.4-5.2 5.6s2.2 5.6 5.2 5.6c1.9 0 3.6-.9 4.5-2.4"
        stroke="#d4a84a"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
