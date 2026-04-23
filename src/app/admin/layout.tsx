import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { LogoMark } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Carnivon Admin",
  description: "Operator console for Carnivon cycle data entry.",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/vault/login?from=/admin");
  if (!isAdmin(session.user.email)) redirect("/vault");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-forest-700/60">
        <div className="container-max h-16 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark size={24} />
            <span className="font-serif text-xl tracking-[0.18em] uppercase text-cream-50">
              Carnivon
            </span>
            <span className="text-gold text-xs uppercase tracking-[0.2em] ml-1">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-cream-100/70">
            <Link href="/admin/cycles" className="hover:text-gold">
              Cycles
            </Link>
            <Link href="/admin/head" className="hover:text-gold">
              Head
            </Link>
            <Link href="/admin/pricing" className="hover:text-gold">
              Pricing
            </Link>
            <span className="text-cream-100/40 text-xs">
              {session.user.email}
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
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
