import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOrCreateInvestor } from "@/lib/investor";

export default async function VaultDepositsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/vault/login");
  const { submitted } = await searchParams;

  const investor = await getOrCreateInvestor({
    id: session.user.id!,
    email: session.user.email,
    name: session.user.name,
  });

  const deposits = await prisma.deposit.findMany({
    where: { investorId: investor.id },
    include: { cycle: { select: { symbol: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-max py-16 max-w-4xl">
      <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-4">Deposits</div>
          <h1 className="font-serif text-3xl md:text-4xl text-cream-50">
            Your deposits
          </h1>
        </div>
        <Link href="/vault/invest" className="btn-primary text-xs">
          New deposit
        </Link>
      </div>

      {submitted ? (
        <div className="mb-6 border border-gold/50 bg-forest-900/40 p-5">
          <div className="eyebrow mb-1">Submitted</div>
          <p className="text-sm text-cream-100/80">
            We&apos;ll verify your transaction on-chain and credit your
            position shortly. You&apos;ll see the status change from{" "}
            <strong>Pending</strong> to <strong>Confirmed</strong> here.
          </p>
        </div>
      ) : null}

      {deposits.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="font-serif text-2xl text-cream-50 mb-3">
            No deposits yet.
          </div>
          <p className="text-cream-100/70 max-w-md mx-auto mb-6 text-sm">
            Subscribe to the current cycle by sending crypto to our deposit
            address and submitting the transaction hash.
          </p>
          <Link href="/vault/invest" className="btn-primary text-xs">
            Start subscription
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-cream-100/50">
              <tr>
                <th className="text-left p-4">Submitted</th>
                <th className="text-left p-4">Cycle</th>
                <th className="text-left p-4">Asset</th>
                <th className="text-right p-4">USD</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Tx</th>
              </tr>
            </thead>
            <tbody className="text-cream-100/90">
              {deposits.map((d) => (
                <tr key={d.id} className="border-t border-forest-700/40">
                  <td className="p-4 text-cream-100/70 text-xs">
                    {d.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="p-4">{d.cycle.symbol}</td>
                  <td className="p-4 text-xs">
                    {d.asset}{" "}
                    <span className="text-cream-100/40">on {d.chain}</span>
                  </td>
                  <td className="p-4 text-right font-mono">
                    ${(Number(d.amountUSDCents) / 100).toLocaleString("en-US")}
                  </td>
                  <td className="p-4">
                    <StatusPill status={d.status} note={d.adminNote ?? null} />
                  </td>
                  <td className="p-4 text-xs text-cream-100/40 font-mono">
                    {d.txHash.slice(0, 12)}…
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

function StatusPill({
  status,
  note,
}: {
  status: string;
  note: string | null;
}) {
  const tone =
    status === "CONFIRMED"
      ? "border-gold/50 text-gold-soft"
      : status === "REJECTED"
        ? "border-red-500/50 text-red-300"
        : "border-cream-100/30 text-cream-100/70";
  return (
    <div>
      <span
        className={`inline-block text-xs uppercase tracking-[0.18em] px-2.5 py-1 border ${tone}`}
      >
        {status}
      </span>
      {note ? (
        <div className="text-xs text-cream-100/50 mt-1 max-w-[240px]">
          {note}
        </div>
      ) : null}
    </div>
  );
}
