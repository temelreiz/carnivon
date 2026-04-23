import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { computeHeadPrice, formatUSD } from "@/lib/pricing";

async function submitArroba(formData: FormData) {
  "use server";

  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/vault");

  const raw = formData.get("arrobaBRL");
  const dateRaw = (formData.get("date") as string) || "";
  const note = ((formData.get("note") as string) || "").slice(0, 200);

  const arrobaBRL = Number(raw);
  if (!isFinite(arrobaBRL) || arrobaBRL <= 0 || arrobaBRL > 9999) {
    throw new Error("Invalid arroba price");
  }

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)
      ? dateRaw
      : new Date().toISOString().slice(0, 10)
  );

  await prisma.cattlePrice.upsert({
    where: { source_date: { source: "MANUAL", date } },
    update: {
      pricePerArrobaBRL: Math.round(arrobaBRL * 100),
      rawPayload: { note: note || null, via: "admin-ui", by: session?.user?.email ?? null },
      fetchedAt: new Date(),
    },
    create: {
      source: "MANUAL",
      date,
      pricePerArrobaBRL: Math.round(arrobaBRL * 100),
      rawPayload: { note: note || null, via: "admin-ui", by: session?.user?.email ?? null },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/pricing");
}

export default async function AdminPricingPage() {
  const recent = await prisma.cattlePrice.findMany({
    orderBy: [{ date: "desc" }, { fetchedAt: "desc" }],
    take: 10,
  });
  const latestFx = await prisma.fxRate.findFirst({
    where: { pair: "BRL_USD" },
    orderBy: { date: "desc" },
  });

  const today = new Date().toISOString().slice(0, 10);

  const preview = (arroba: number) =>
    latestFx
      ? formatUSD(
          computeHeadPrice({
            arrobaBRL: arroba,
            usdPerBRL: latestFx.rate,
          }).investorPriceUSD
        )
      : "(no FX yet)";

  return (
    <div className="container-max py-16 max-w-3xl">
      <div className="eyebrow mb-4">Pricing</div>
      <h1 className="font-serif text-3xl md:text-4xl text-cream-50 mb-2">
        Weekly arroba price
      </h1>
      <p className="text-sm text-cream-100/70 mb-10">
        Enter the CEPEA/Esalq "Boi Gordo" indicator in BRL per arroba. The
        landing-page Hero picks up the new value within a minute of submission.
      </p>

      <form action={submitArroba} className="card p-8 grid gap-5">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Arroba price (BRL) <span className="text-gold">*</span>
          </span>
          <input
            name="arrobaBRL"
            type="number"
            step="0.01"
            min="1"
            max="9999"
            required
            placeholder="e.g. 327.50"
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Date
          </span>
          <input
            name="date"
            type="date"
            defaultValue={today}
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Note
          </span>
          <input
            name="note"
            type="text"
            placeholder="Optional — source, screenshot ref, etc."
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
          />
        </label>
        <button type="submit" className="btn-primary w-fit">
          Save arroba price
        </button>
      </form>

      <h2 className="font-serif text-2xl text-cream-50 mt-16 mb-4">
        Recent entries
      </h2>
      {recent.length === 0 ? (
        <p className="text-sm text-cream-100/60">No entries yet.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-cream-100/50">
              <tr>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Source</th>
                <th className="text-right p-4">BRL / @</th>
                <th className="text-right p-4">≈ 1 head</th>
              </tr>
            </thead>
            <tbody className="text-cream-100/90">
              {recent.map((r) => (
                <tr key={r.id} className="border-t border-forest-700/40">
                  <td className="p-4">{r.date.toISOString().slice(0, 10)}</td>
                  <td className="p-4 text-cream-100/60">{r.source}</td>
                  <td className="p-4 text-right font-mono">
                    R${(r.pricePerArrobaBRL / 100).toFixed(2)}
                  </td>
                  <td className="p-4 text-right font-mono text-gold-soft">
                    {preview(r.pricePerArrobaBRL / 100)}
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
