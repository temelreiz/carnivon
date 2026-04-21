import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";

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
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={26} />
          <span className="font-serif text-xl tracking-[0.18em] uppercase text-cream-50">
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
          <a href="/vault/login" className="btn-primary text-xs">
            Sign In
          </a>
        </div>
      </div>
    </nav>
  );
}

