import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminCyclesPage() {
  const cycles = await prisma.cycle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { subscriptions: true, animals: true } },
    },
  });

  return (
    <div className="container-max py-16">
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="eyebrow mb-4">Cycles</div>
          <h1 className="font-serif text-3xl md:text-4xl text-cream-50">
            Investment cycles
          </h1>
          <p className="text-sm text-cream-100/70 mt-2 max-w-2xl">
            One Carnivon cycle = one 90-day livestock round. Landing page &
            vault read from the currently-open cycle.
          </p>
        </div>
        <Link href="/admin/cycles/new" className="btn-primary text-xs">
          New cycle
        </Link>
      </div>

      {cycles.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="font-serif text-2xl text-cream-50 mb-3">
            No cycles yet.
          </div>
          <p className="text-cream-100/70 max-w-md mx-auto mb-6 text-sm">
            Create the first cycle to populate the landing page and vault.
          </p>
          <Link href="/admin/cycles/new" className="btn-primary text-xs">
            Create first cycle
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-cream-100/50">
              <tr>
                <th className="text-left p-4">Symbol</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Duration</th>
                <th className="text-right p-4">Subs</th>
                <th className="text-right p-4">Head</th>
                <th className="text-right p-4">Dates</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="text-cream-100/90">
              {cycles.map((c) => (
                <tr key={c.id} className="border-t border-forest-700/40">
                  <td className="p-4 font-serif text-base text-cream-50">
                    {c.symbol}
                  </td>
                  <td className="p-4 text-cream-100/70">{c.name}</td>
                  <td className="p-4">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="p-4 text-right font-mono">
                    {c.durationDays}d
                  </td>
                  <td className="p-4 text-right font-mono">
                    {c._count.subscriptions}
                  </td>
                  <td className="p-4 text-right font-mono">
                    {c._count.animals}
                  </td>
                  <td className="p-4 text-right text-xs text-cream-100/60">
                    {c.startDate
                      ? c.startDate.toISOString().slice(0, 10)
                      : "—"}
                    <br />
                    <span className="text-cream-100/40">
                      → {c.maturityDate?.toISOString().slice(0, 10) ?? "—"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/cycles/${c.id}`}
                      className="text-gold text-xs hover:underline"
                    >
                      Edit →
                    </Link>
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

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "FUNDING" || status === "ACTIVE"
      ? "border-gold/50 text-gold-soft"
      : status === "MATURED"
        ? "border-cream-100/40 text-cream-100/70"
        : status === "CLOSED"
          ? "border-cream-100/20 text-cream-100/40"
          : "border-cream-100/30 text-cream-100/60";

  return (
    <span
      className={`inline-block text-xs uppercase tracking-[0.18em] px-2.5 py-1 border ${tone}`}
    >
      {status}
    </span>
  );
}
