import Link from "next/link";
import { prisma } from "@/lib/db";
import { approveDeposit, rejectDeposit } from "@/lib/deposit-actions";
import type { DepositStatus } from "@prisma/client";

const STATUSES: DepositStatus[] = ["PENDING", "CONFIRMED", "REJECTED"];

export default async function AdminDepositsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: DepositStatus }>;
}) {
  const { status } = await searchParams;
  const filter = status ?? "PENDING";

  const deposits = await prisma.deposit.findMany({
    where: { status: filter },
    include: {
      investor: { select: { email: true, name: true } },
      cycle: { select: { symbol: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = await prisma.deposit.groupBy({
    by: ["status"],
    _count: true,
  });
  const countFor = (s: DepositStatus) =>
    counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="container-max py-16">
      <div className="eyebrow mb-4">Deposits</div>
      <h1 className="font-serif text-3xl md:text-4xl text-cream-50 mb-2">
        Deposit queue
      </h1>
      <p className="text-sm text-cream-100/70 mb-8 max-w-2xl">
        Investor-submitted transactions. Verify each on-chain before
        approving — approval mints a Subscription and bumps cycle AUM.
      </p>

      <div className="flex items-center gap-4 mb-6">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/deposits?status=${s}`}
            className={`text-xs uppercase tracking-[0.18em] px-3 py-2 border ${
              filter === s
                ? "border-gold/60 text-gold-soft"
                : "border-forest-700/60 text-cream-100/60 hover:border-gold/40"
            }`}
          >
            {s} · {countFor(s)}
          </Link>
        ))}
      </div>

      {deposits.length === 0 ? (
        <div className="card p-10 text-center text-sm text-cream-100/60">
          Nothing in {filter.toLowerCase()} queue.
        </div>
      ) : (
        <div className="grid gap-4">
          {deposits.map((d) => {
            const boundApprove = approveDeposit.bind(null, d.id);
            const boundReject = rejectDeposit.bind(null, d.id);
            const declaredUSD = Number(d.amountUSDCents) / 100;
            return (
              <div key={d.id} className="card p-6">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <div className="font-serif text-lg text-cream-50">
                      {d.investor.name}{" "}
                      <span className="text-cream-100/50 text-sm font-sans">
                        ({d.investor.email})
                      </span>
                    </div>
                    <div className="text-xs text-cream-100/50 mt-1">
                      {d.createdAt.toISOString().slice(0, 16).replace("T", " ")}{" "}
                      UTC · Cycle {d.cycle.symbol}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-xl text-gold-soft">
                      ${declaredUSD.toLocaleString("en-US")}
                    </div>
                    <div className="text-xs text-cream-100/50 font-mono">
                      {d.amountCrypto ? `${d.amountCrypto} ` : ""}
                      {d.asset} on {d.chain}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-cream-100/70 font-mono break-all mb-4 p-3 bg-forest-900/60 border border-forest-700/40">
                  tx: {d.txHash}
                </div>

                {d.status === "PENDING" ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <form action={boundApprove} className="card p-4 grid gap-3 border-gold/30">
                      <div className="text-xs uppercase tracking-[0.18em] text-gold-soft">
                        Approve & credit
                      </div>
                      <label className="grid gap-1">
                        <span className="text-xs text-cream-100/60">
                          Confirmed USD (adjust if needed)
                        </span>
                        <input
                          name="amountUSD"
                          type="number"
                          step="0.01"
                          defaultValue={declaredUSD.toFixed(2)}
                          required
                          className="bg-forest-900/60 border border-forest-700/60 px-3 py-2 text-cream-50 font-mono focus:outline-none focus:border-gold"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs text-cream-100/60">Note</span>
                        <input
                          name="adminNote"
                          placeholder="e.g. confirmed 3 blocks, $2,410.55 at deposit time"
                          className="bg-forest-900/60 border border-forest-700/60 px-3 py-2 text-cream-50 text-xs focus:outline-none focus:border-gold"
                        />
                      </label>
                      <button type="submit" className="btn-primary text-xs">
                        Approve
                      </button>
                    </form>

                    <form action={boundReject} className="card p-4 grid gap-3 border-red-900/50">
                      <div className="text-xs uppercase tracking-[0.18em] text-red-300">
                        Reject
                      </div>
                      <label className="grid gap-1">
                        <span className="text-xs text-cream-100/60">
                          Reason (required)
                        </span>
                        <input
                          name="adminNote"
                          required
                          placeholder="e.g. tx not found on-chain"
                          className="bg-forest-900/60 border border-forest-700/60 px-3 py-2 text-cream-50 text-xs focus:outline-none focus:border-gold"
                        />
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs uppercase tracking-[0.18em] border border-red-500/60 text-red-300 hover:bg-red-950/40"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="text-xs text-cream-100/60">
                    {d.status === "CONFIRMED" ? (
                      <>
                        Confirmed{" "}
                        {d.confirmedAt?.toISOString().slice(0, 10)} by{" "}
                        {d.adminEmail ?? "—"}.
                      </>
                    ) : (
                      <>
                        Rejected {d.rejectedAt?.toISOString().slice(0, 10)} by{" "}
                        {d.adminEmail ?? "—"}.
                      </>
                    )}
                    {d.adminNote ? (
                      <div className="mt-1 text-cream-100/40">
                        Note: {d.adminNote}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
