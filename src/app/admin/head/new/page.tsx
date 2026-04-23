import Link from "next/link";
import { prisma } from "@/lib/db";
import { createHead } from "@/lib/head-actions";

export default async function NewHeadPage() {
  const cycles = await prisma.cycle.findMany({
    where: { status: { in: ["DRAFT", "FUNDING", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
  });

  if (cycles.length === 0) {
    return (
      <div className="container-max py-16 max-w-xl">
        <div className="eyebrow mb-4">Register head</div>
        <h1 className="font-serif text-3xl text-cream-50 mb-4">
          No open cycles.
        </h1>
        <p className="text-sm text-cream-100/70 mb-6">
          Head can only be registered against a cycle in DRAFT, FUNDING, or
          ACTIVE status. Create one first.
        </p>
        <Link href="/admin/cycles/new" className="btn-primary text-xs">
          Create cycle →
        </Link>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="container-max py-16 max-w-2xl">
      <div className="eyebrow mb-4">Register head</div>
      <h1 className="font-serif text-3xl md:text-4xl text-cream-50 mb-10">
        New head
      </h1>

      <form action={createHead} className="card p-8 grid gap-5">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Ear tag (brinco) <span className="text-gold">*</span>
          </span>
          <input
            name="earTag"
            required
            placeholder="e.g. BR-SISBOV-12345"
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 font-mono focus:outline-none focus:border-gold"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Cycle <span className="text-gold">*</span>
          </span>
          <select
            name="cycleId"
            required
            defaultValue={cycles[0].id}
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
          >
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.symbol} — {c.name} ({c.status})
              </option>
            ))}
          </select>
        </label>

        <div className="grid md:grid-cols-2 gap-5">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
              Entry weight (kg) <span className="text-gold">*</span>
            </span>
            <input
              name="entryWeightKg"
              type="number"
              min="50"
              max="2000"
              defaultValue="300"
              required
              className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 font-mono focus:outline-none focus:border-gold"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
              Acquired <span className="text-gold">*</span>
            </span>
            <input
              name="acquiredAt"
              type="date"
              defaultValue={today}
              required
              className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Notes
          </span>
          <textarea
            name="notes"
            rows={3}
            placeholder="Optional — origin farm, batch reference, etc."
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
          />
        </label>

        <div className="flex items-center gap-4">
          <button type="submit" className="btn-primary">
            Register head
          </button>
          <Link
            href="/admin/head"
            className="text-xs text-cream-100/60 hover:text-gold"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export const dynamic = "force-dynamic";
