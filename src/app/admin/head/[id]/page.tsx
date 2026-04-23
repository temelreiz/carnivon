import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  addWeightEntry,
  updateHeadStatus,
} from "@/lib/head-actions";

export default async function HeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const head = await prisma.animal.findUnique({
    where: { id },
    include: {
      cycle: { select: { symbol: true, name: true } },
      weights: {
        orderBy: { recordedAt: "desc" },
        include: { enteredBy: { select: { email: true } } },
      },
    },
  });
  if (!head) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const boundAddWeight = addWeightEntry.bind(null, head.id);
  const boundUpdateStatus = updateHeadStatus.bind(null, head.id);

  return (
    <div className="container-max py-16 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="eyebrow mb-4">Head</div>
          <h1 className="font-serif text-3xl md:text-4xl text-cream-50 font-mono">
            {head.earTag}
          </h1>
        </div>
        <Link
          href="/admin/head"
          className="text-xs text-cream-100/60 hover:text-gold"
        >
          ← Back to list
        </Link>
      </div>

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 text-sm">
        <Stat label="Cycle" value={`${head.cycle.symbol}`} />
        <Stat label="Status" value={head.status} />
        <Stat label="Entry" value={`${head.entryWeightKg} kg`} />
        <Stat
          label="Current"
          value={head.currentWeightKg != null ? `${head.currentWeightKg} kg` : "—"}
        />
        <Stat
          label="Gain"
          value={
            head.currentWeightKg != null
              ? `${head.currentWeightKg - head.entryWeightKg >= 0 ? "+" : ""}${head.currentWeightKg - head.entryWeightKg} kg`
              : "—"
          }
        />
        <Stat
          label="Acquired"
          value={head.acquiredAt.toISOString().slice(0, 10)}
        />
        {head.soldAt ? (
          <Stat label="Sold" value={head.soldAt.toISOString().slice(0, 10)} />
        ) : null}
        {head.diedAt ? (
          <Stat label="Died" value={head.diedAt.toISOString().slice(0, 10)} />
        ) : null}
      </dl>

      {/* Weight entry — hidden when head is no longer active */}
      {head.status === "ACTIVE" ? (
        <section className="mb-12">
          <h2 className="font-serif text-xl text-cream-50 mb-4">
            Log a weight
          </h2>
          <form action={boundAddWeight} className="card p-6 grid gap-4">
            <div className="grid md:grid-cols-3 gap-4">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
                  Weight (kg) <span className="text-gold">*</span>
                </span>
                <input
                  name="weightKg"
                  type="number"
                  min="50"
                  max="2000"
                  required
                  defaultValue={head.currentWeightKg ?? head.entryWeightKg}
                  className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 font-mono focus:outline-none focus:border-gold"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
                  Recorded <span className="text-gold">*</span>
                </span>
                <input
                  name="recordedAt"
                  type="date"
                  defaultValue={today}
                  required
                  className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
                  Notes
                </span>
                <input
                  name="notes"
                  placeholder="e.g. post-deworming"
                  className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
                />
              </label>
            </div>
            <button type="submit" className="btn-primary w-fit">
              Save weight
            </button>
          </form>
        </section>
      ) : null}

      {/* Status change */}
      <section className="mb-12">
        <h2 className="font-serif text-xl text-cream-50 mb-4">Status</h2>
        <form action={boundUpdateStatus} className="card p-6 flex flex-wrap items-end gap-4">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
              New status
            </span>
            <select
              name="status"
              defaultValue={head.status}
              className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="SOLD">SOLD</option>
              <option value="DEAD">DEAD</option>
            </select>
          </label>
          <label className="grid gap-2 flex-1 min-w-[240px]">
            <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
              Reason / notes
            </span>
            <input
              name="notes"
              defaultValue={head.notes ?? ""}
              className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
            />
          </label>
          <button type="submit" className="btn-secondary text-xs">
            Update
          </button>
        </form>
      </section>

      {/* Weight history */}
      <section>
        <h2 className="font-serif text-xl text-cream-50 mb-4">
          Weight history
        </h2>
        {head.weights.length === 0 ? (
          <div className="text-sm text-cream-100/60">
            No weight entries yet — only the entry weight is on record.
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-cream-100/50">
                <tr>
                  <th className="text-left p-4">Recorded</th>
                  <th className="text-right p-4">Weight (kg)</th>
                  <th className="text-left p-4">By</th>
                  <th className="text-left p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="text-cream-100/90">
                {head.weights.map((w) => (
                  <tr key={w.id} className="border-t border-forest-700/40">
                    <td className="p-4">
                      {w.recordedAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="p-4 text-right font-mono">{w.weightKg}</td>
                    <td className="p-4 text-cream-100/60 text-xs">
                      {w.enteredBy?.email ?? "system"}
                    </td>
                    <td className="p-4 text-cream-100/70 text-xs">
                      {w.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.18em] text-cream-100/50 mb-1">
        {label}
      </dt>
      <dd className="font-serif text-lg text-cream-50">{value}</dd>
    </div>
  );
}
