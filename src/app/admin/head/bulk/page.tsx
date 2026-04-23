import Link from "next/link";
import { bulkAddWeights } from "@/lib/head-actions";

export default async function BulkWeightsPage({
  searchParams,
}: {
  searchParams: Promise<{
    processed?: string;
    missing?: string;
    errors?: string;
  }>;
}) {
  const { processed, missing, errors } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  const missingTags = missing ? missing.split(",").filter(Boolean) : [];
  const errorsList = errors ? errors.split(" | ").filter(Boolean) : [];

  return (
    <div className="container-max py-16 max-w-3xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="eyebrow mb-4">Bulk weights</div>
          <h1 className="font-serif text-3xl md:text-4xl text-cream-50">
            Weekly weight entry
          </h1>
          <p className="text-sm text-cream-100/70 mt-2 max-w-2xl">
            Paste one line per head. Format:{" "}
            <code className="text-gold">earTag weight</code> — comma, tab, or
            space separated. Weights update the denormalised{" "}
            <code>currentWeightKg</code> on each animal and append a{" "}
            <code>WeightEntry</code> row.
          </p>
        </div>
        <Link
          href="/admin/head"
          className="text-xs text-cream-100/60 hover:text-gold"
        >
          ← Head list
        </Link>
      </div>

      {processed ? (
        <div className="mb-6 border border-gold/40 bg-forest-900/40 p-5">
          <div className="eyebrow mb-2">Last batch</div>
          <div className="text-sm text-cream-100/80">
            {processed} weights saved.
            {missingTags.length > 0 ? (
              <>
                {" "}
                <span className="text-red-300">
                  Unknown ear tags skipped: {missingTags.join(", ")}
                </span>
              </>
            ) : null}
          </div>
          {errorsList.length > 0 ? (
            <ul className="mt-2 text-xs text-cream-100/60 list-disc ml-5">
              {errorsList.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <form action={bulkAddWeights} className="card p-8 grid gap-5">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Recorded <span className="text-gold">*</span>
          </span>
          <input
            name="recordedAt"
            type="date"
            defaultValue={today}
            required
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold w-fit"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Rows <span className="text-gold">*</span>
          </span>
          <textarea
            name="rows"
            required
            rows={12}
            placeholder={`BR-SISBOV-12345  345
BR-SISBOV-12346, 361
BR-SISBOV-12347\t358`}
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 font-mono text-sm focus:outline-none focus:border-gold"
          />
          <span className="text-xs text-cream-100/40">
            One head per line. Weight between 50–2000 kg. Unknown ear tags are
            skipped and reported above.
          </span>
        </label>

        <button type="submit" className="btn-primary w-fit">
          Save weights
        </button>
      </form>
    </div>
  );
}
