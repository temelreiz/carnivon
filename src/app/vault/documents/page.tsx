import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const KIND_LABEL: Record<string, string> = {
  term_sheet: "Term sheet",
  subscription: "Subscription agreement",
  risk: "Risk disclosure",
  valuation: "Valuation policy",
  audit: "Audit report",
  traceability: "Traceability",
};

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/vault/login");

  const docs = await prisma.document.findMany({
    orderBy: [{ cycleSymbol: "desc" }, { publishedAt: "desc" }],
  });

  // Group by cycleSymbol (null → "General") for a cleaner layout.
  const groups = new Map<string, typeof docs>();
  for (const d of docs) {
    const k = d.cycleSymbol ?? "General";
    const list = groups.get(k) ?? [];
    list.push(d);
    groups.set(k, list);
  }

  return (
    <div className="container-max py-16 max-w-4xl">
      <div className="eyebrow mb-4">Documents</div>
      <h1 className="font-serif text-3xl md:text-4xl text-cream-50 mb-10">
        Data room
      </h1>

      {docs.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="font-serif text-2xl text-cream-50 mb-3">
            No documents published yet.
          </div>
          <p className="text-cream-100/70 text-sm">
            Term sheets, subscription agreements, and audit reports will
            appear here as each cycle opens.
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {[...groups.entries()].map(([cycle, list]) => (
            <section key={cycle}>
              <h2 className="text-xs uppercase tracking-[0.2em] text-cream-100/50 mb-3">
                {cycle}
              </h2>
              <div className="card">
                {list.map((d, i) => (
                  <div
                    key={d.id}
                    className={`flex items-center justify-between p-5 ${
                      i > 0 ? "border-t border-forest-700/40" : ""
                    }`}
                  >
                    <div>
                      <div className="font-serif text-lg text-cream-50">
                        {d.title}
                      </div>
                      <div className="text-xs text-cream-100/50 mt-1">
                        {KIND_LABEL[d.kind] ?? d.kind} · {d.version} ·{" "}
                        {d.publishedAt.toISOString().slice(0, 10)}
                      </div>
                    </div>
                    <span className="text-xs text-cream-100/40 uppercase tracking-[0.18em]">
                      Download coming soon
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
