import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { LogoMark } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Carnivon Vault",
  description: "Investor vault for active Carnivon cycles.",
  robots: { index: false, follow: false },
};

export default async function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  const admin = isAdmin(user?.email);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-forest-700/60">
        <div className="container-max h-16 flex items-center justify-between">
          <Link href="/vault" className="flex items-center gap-2.5">
            <LogoMark size={24} />
            <span className="font-serif text-xl tracking-[0.18em] uppercase text-cream-50">
              Carnivon
            </span>
            <span className="text-gold text-xs uppercase tracking-[0.2em] ml-1">
              Vault
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-cream-100/70">
            {user ? (
              <>
                <Link href="/vault" className="hover:text-gold">
                  Dashboard
                </Link>
                <Link href="/vault/positions" className="hover:text-gold">
                  Positions
                </Link>
                <Link href="/vault/documents" className="hover:text-gold">
                  Documents
                </Link>
                {admin ? (
                  <Link href="/admin" className="hover:text-gold text-gold-soft">
                    Admin
                  </Link>
                ) : null}
                <span className="text-cream-100/40 text-xs hidden md:inline">
                  {user.email}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button type="submit" className="btn-secondary text-xs">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/vault/login" className="btn-secondary text-xs">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
