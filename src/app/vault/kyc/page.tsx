import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOrCreateInvestor } from "@/lib/investor";
import type { KycStatus } from "@prisma/client";
import { SumsubWidget } from "./_sumsub-widget";

async function saveProfile(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) redirect("/vault/login");

  const investor = await getOrCreateInvestor({
    id: session.user.id!,
    email: session.user.email,
    name: session.user.name,
  });

  const name = ((formData.get("name") as string) || "").trim().slice(0, 200);
  const jurisdiction = ((formData.get("jurisdiction") as string) || "")
    .trim()
    .slice(0, 100);
  const entityName = ((formData.get("entityName") as string) || "").trim();
  const type = formData.get("type") === "ENTITY" ? "ENTITY" : "INDIVIDUAL";

  if (!name || !jurisdiction) {
    throw new Error("Name and jurisdiction are required");
  }

  await prisma.investor.update({
    where: { id: investor.id },
    data: {
      name,
      jurisdiction,
      type,
      entityName: type === "ENTITY" ? entityName || null : null,
    },
  });

  revalidatePath("/vault");
  revalidatePath("/vault/kyc");
}

export default async function KycPage() {
  const session = await auth();
  if (!session?.user) redirect("/vault/login");

  const investor = await getOrCreateInvestor({
    id: session.user.id!,
    email: session.user.email,
    name: session.user.name,
  });

  const jurisdictionSet = investor.jurisdiction !== "UNSET";
  const step1Done = jurisdictionSet;
  const step2Ready = step1Done;

  return (
    <div className="container-max py-16 max-w-3xl">
      <div className="eyebrow mb-4">Onboarding</div>
      <h1 className="font-serif text-3xl md:text-4xl text-cream-50 mb-2">
        KYC / KYB
      </h1>
      <p className="text-sm text-cream-100/70 mb-10">
        Two steps: confirm your profile, then complete identity verification
        with our provider. Required before subscribing to a cycle.
      </p>

      <StatusBanner status={investor.kycStatus} />

      <section className="mt-10">
        <StepHeader num="01" title="Profile" done={step1Done} />
        <form action={saveProfile} className="card p-8 grid gap-5">
          <div className="grid md:grid-cols-2 gap-5">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
                Full name <span className="text-gold">*</span>
              </span>
              <input
                name="name"
                defaultValue={investor.name}
                required
                className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
                Jurisdiction <span className="text-gold">*</span>
              </span>
              <input
                name="jurisdiction"
                defaultValue={jurisdictionSet ? investor.jurisdiction : ""}
                placeholder="e.g. United Kingdom"
                required
                className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
              Investor type
            </span>
            <select
              name="type"
              defaultValue={investor.type}
              className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="ENTITY">Entity / fund</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
              Entity name (if subscribing via fund)
            </span>
            <input
              name="entityName"
              defaultValue={investor.entityName ?? ""}
              className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
            />
          </label>

          <button type="submit" className="btn-primary w-fit">
            Save profile
          </button>
        </form>
      </section>

      <section className="mt-12">
        <StepHeader
          num="02"
          title="Identity verification"
          done={investor.kycStatus === "APPROVED"}
          disabled={!step2Ready}
        />
        <div className="card p-8">
          {investor.kycStatus === "APPROVED" ? (
            <p className="text-sm text-cream-100/80">
              Verified ✓ — you can proceed to subscribe to the current cycle.
            </p>
          ) : investor.kycStatus === "REJECTED" ? (
            <p className="text-sm text-cream-100/80">
              We couldn&apos;t complete verification. Please email{" "}
              <a href="mailto:investors@carnivon.io" className="text-gold hover:underline">
                investors@carnivon.io
              </a>{" "}
              and we&apos;ll unblock you.
            </p>
          ) : !step2Ready ? (
            <p className="text-sm text-cream-100/60">
              Complete your profile above to unlock identity verification.
            </p>
          ) : (
            <>
              <p className="text-sm text-cream-100/70 mb-6">
                Our identity provider (Sumsub) will guide you through ID and
                liveness checks below. Entities: certificate of incorporation
                and beneficial owner disclosures also required.
              </p>
              <SumsubWidget />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function StatusBanner({ status }: { status: KycStatus }) {
  const map = {
    PENDING: { label: "Pending", tone: "text-cream-100/70" },
    APPROVED: { label: "Approved", tone: "text-gold-soft" },
    REJECTED: { label: "Rejected", tone: "text-red-400" },
  } as const;
  const s = map[status];
  return (
    <div className="border-l-2 border-gold/50 pl-4 py-2">
      <div className="text-xs uppercase tracking-[0.2em] text-cream-100/50">
        KYC status
      </div>
      <div className={`font-serif text-2xl ${s.tone}`}>{s.label}</div>
    </div>
  );
}

function StepHeader({
  num,
  title,
  done,
  disabled,
}: {
  num: string;
  title: string;
  done?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-4 mb-4">
      <span className="font-serif text-3xl text-gold">{num}</span>
      <h2 className="font-serif text-2xl text-cream-50">
        {title}
        {done ? (
          <span className="ml-3 text-xs text-gold-soft uppercase tracking-[0.18em]">
            done
          </span>
        ) : disabled ? (
          <span className="ml-3 text-xs text-cream-100/40 uppercase tracking-[0.18em]">
            locked
          </span>
        ) : null}
      </h2>
    </div>
  );
}
