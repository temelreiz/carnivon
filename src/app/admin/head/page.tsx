import Link from "next/link";
import { prisma } from "@/lib/db";
import type { AnimalStatus } from "@prisma/client";

const STATUSES: AnimalStatus[] = ["ACTIVE", "SOLD", "DEAD"];

export default async function AdminHeadPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string; status?: AnimalStatus }>;
}) {
  const { cycle: cycleFilter, status: statusFilter } = await searchParams;

  const [cycles, head] = await Promise.all([
    prisma.cycle.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, symbol: true, status: true },
    }),
    prisma.animal.findMany({
      where: {
        ...(cycleFilter ? { cycleId: cycleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: { cycle: { select: { symbol: true } } },
      orderBy: [{ status: "asc" }, { earTag: "asc" }],
      take: 500,
    }),
  ]);

  return (
    <div className="container-max py-16">
      <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-4">Head registry</div>
          <h1 className="font-serif text-3xl md:text-4xl text-cream-50">
            Herd
          </h1>
          <p className="text-sm text-cream-100/70 mt-2 max-w-2xl">
            Every head tracked by its brinco (ear tag). Weekly weights are
            entered individually or via the bulk form.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/head/bulk" className="btn-secondary text-xs">
            Bulk weights
          </Link>
          <Link href="/admin/head/new" className="btn-primary text-xs">
            Register head
          </Link>
        </div>
      </div>

      <form className="card p-5 mb-6 flex flex-wrap items-end gap-4">
        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/50">
            Cycle
          </span>
          <select
            name="cycle"
            defaultValue={cycleFilter ?? ""}
            className="bg-forest-900/60 border border-forest-700/60 px-3 py-2 text-cream-50 text-sm focus:outline-none focus:border-gold"
          >
            <option value="">All cycles</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.symbol} ({c.status})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/50">
            Status
          </span>
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className="bg-forest-900/60 border border-forest-700/60 px-3 py-2 text-cream-50 text-sm focus:outline-none focus:border-gold"
          >
            <option value="">Any</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-secondary text-xs">
          Filter
        </button>
      </form>

      {head.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="font-serif text-2xl text-cream-50 mb-3">
            No head registered.
          </div>
          <p className="text-cream-100/70 max-w-md mx-auto mb-6 text-sm">
            Register head one-by-one, or seed the cycle then enter weekly
            weights in bulk.
          </p>
          <Link href="/admin/head/new" className="btn-primary text-xs">
            Register first head
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-cream-100/50">
              <tr>
                <th className="text-left p-4">Ear tag</th>
                <th className="text-left p-4">Cycle</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Entry kg</th>
                <th className="text-right p-4">Current kg</th>
                <th className="text-right p-4">Gain</th>
                <th className="text-right p-4">Acquired</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="text-cream-100/90">
              {head.map((h) => {
                const gain =
                  h.currentWeightKg != null
                    ? h.currentWeightKg - h.entryWeightKg
                    : null;
                return (
                  <tr key={h.id} className="border-t border-forest-700/40">
                    <td className="p-4 font-mono">{h.earTag}</td>
                    <td className="p-4 text-cream-100/70">
                      {h.cycle.symbol}
                    </td>
                    <td className="p-4">
                      <StatusPill status={h.status} />
                    </td>
                    <td className="p-4 text-right font-mono">
                      {h.entryWeightKg}
                    </td>
                    <td className="p-4 text-right font-mono">
                      {h.currentWeightKg ?? "—"}
                    </td>
                    <td
                      className={`p-4 text-right font-mono ${
                        gain == null
                          ? "text-cream-100/40"
                          : gain >= 0
                            ? "text-gold-soft"
                            : "text-red-300"
                      }`}
                    >
                      {gain == null ? "—" : `${gain >= 0 ? "+" : ""}${gain}`}
                    </td>
                    <td className="p-4 text-right text-xs text-cream-100/60">
                      {h.acquiredAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/head/${h.id}`}
                        className="text-gold text-xs hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {head.length === 500 ? (
            <div className="p-4 text-xs text-cream-100/50 border-t border-forest-700/40">
              Showing first 500. Narrow with filters.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: AnimalStatus }) {
  const tone =
    status === "ACTIVE"
      ? "border-gold/50 text-gold-soft"
      : status === "SOLD"
        ? "border-cream-100/40 text-cream-100/70"
        : "border-red-500/50 text-red-300";
  return (
    <span
      className={`inline-block text-xs uppercase tracking-[0.18em] px-2.5 py-1 border ${tone}`}
    >
      {status}
    </span>
  );
}
