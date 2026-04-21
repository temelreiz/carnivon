import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOrCreateInvestor } from "@/lib/investor";

export default async function PositionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/vault/login");

  const investor = await getOrCreateInvestor({
    id: session.user.id!,
    email: session.user.email,
    name: session.user.name,
  });

  const subscriptions = await prisma.subscription.findMany({
    where: { investorId: investor.id },
    include: { cycle: true },
    orderBy: { committedAt: "desc" },
  });

  return (
    <div className="container-max py-16">
      <div className="eyebrow mb-4">Positions</div>
      <h1 className="font-serif text-3xl md:text-4xl text-cream-50 mb-10">
        Your subscriptions
      </h1>

      {subscriptions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-cream-100/50">
              <tr>
                <th className="text-left p-4">Cycle</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Committed</th>
                <th className="text-right p-4">Tokens</th>
                <th className="text-right p-4">Funded on</th>
              </tr>
            </thead>
            <tbody className="text-cream-100/90">
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-t border-forest-700/40">
                  <td className="p-4">
                    <div className="font-serif text-base text-cream-50">
                      {s.cycle.symbol}
                    </div>
                    <div className="text-xs text-cream-100/50">
                      {s.cycle.name}
                    </div>
                  </td>
                  <td className="p-4 text-cream-100/60">{s.cycle.status}</td>
                  <td className="p-4 text-right font-mono">
                    ${(Number(s.amountCents) / 100).toLocaleString("en-US")}
                  </td>
                  <td className="p-4 text-right font-mono">
                    {s.tokenAmount ? Number(s.tokenAmount).toLocaleString("en-US") : "—"}
                  </td>
                  <td className="p-4 text-right text-cream-100/60">
                    {s.fundedAt
                      ? s.fundedAt.toISOString().slice(0, 10)
                      : "pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-10 text-center">
      <div className="font-serif text-2xl text-cream-50 mb-3">
        No positions yet.
      </div>
      <p className="text-cream-100/70 max-w-md mx-auto mb-6 text-sm">
        You haven&apos;t subscribed to a cycle. The current cycle is open for
        allocations — complete your KYC and reach out to the investor relations
        desk to commit capital.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/vault/kyc" className="btn-secondary text-xs">
          Start KYC
        </Link>
        <Link href="/#product" className="btn-primary text-xs">
          View current cycle
        </Link>
      </div>
    </div>
  );
}
