import type { Metadata } from "next";
import { LogoMark } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Carnivon Vault",
  description: "Investor vault for active Carnivon cycles.",
  robots: { index: false, follow: false },
};

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-forest-700/60">
        <div className="container-max h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <LogoMark size={24} />
            <span className="font-serif text-xl tracking-[0.18em] uppercase text-cream-50">
              Carnivon
            </span>
            <span className="text-gold text-xs uppercase tracking-[0.2em] ml-1">Vault</span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-cream-100/70">
            <a href="/" className="hover:text-gold">Dashboard</a>
            <a href="/positions" className="hover:text-gold">Positions</a>
            <a href="/documents" className="hover:text-gold">Documents</a>
            <a href="/login" className="btn-secondary text-xs">Sign in</a>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
