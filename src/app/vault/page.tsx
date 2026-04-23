import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOrCreateInvestor } from "@/lib/investor";

export default async function VaultDashboard() {
  const session = await auth();
  if (!session?.user) redirect("/vault/login");

  const investor = await getOrCreateInvestor({
    id: session.user.id!,
    email: session.user.email,
    name: session.user.name,
  });

  const [pendingCount, confirmedCount, openCycle] = await Promise.all([
    prisma.deposit.count({
      where: { investorId: investor.id, status: "PENDING" },
    }),
    prisma.deposit.count({
      where: { investorId: investor.id, status: "CONFIRMED" },
    }),
    prisma.cycle.findFirst({
      where: { status: { in: ["FUNDING", "ACTIVE"] } },
      orderBy: { createdAt: "desc" },
      select: { symbol: true },
    }),
  ]);

  const firstName =
    (investor.name || session.user.name || session.user.email || "investor")
      .split(/[ @]/)[0];

  const kycApproved = investor.kycStatus === "APPROVED";
  const jurisdictionMissing = investor.jurisdiction === "UNSET";
  const kycBlocking = !kycApproved || jurisdictionMissing;

  return (
    <div className="container-max py-16">
      <div className="eyebrow mb-4">Dashboard</div>
      <h1 className="font-serif text-4xl md:text-5xl text-cream-50 mb-4">
        Welcome, {firstName}.
      </h1>
      <p className="text-cream-100/70 max-w-2xl mb-10">
        Your positions, documents, and compliance status for active Carnivon
        cycles.
      </p>

      {kycBlocking ? (
        <div className="mb-10 border border-gold/50 bg-forest-900/40 p-6">
          <div className="eyebrow mb-2">Action required</div>
          <p className="text-sm text-cream-100/80 mb-4">
            Complete KYC before subscribing to a cycle — jurisdiction and
            identity verification are required on the subscription agreement.
          </p>
          <Link href="/vault/kyc" className="btn-primary text-xs">
            Continue onboarding →
          </Link>
        </div>
      ) : openCycle && pendingCount === 0 && confirmedCount === 0 ? (
        <div className="mb-10 border border-gold/50 bg-forest-900/40 p-6">
          <div className="eyebrow mb-2">{openCycle.symbol} is open</div>
          <p className="text-sm text-cream-100/80 mb-4">
            Subscribe by sending crypto to our deposit address. We credit your
            position on confirmation.
          </p>
          <Link href="/vault/invest" className="btn-primary text-xs">
            Invest in {openCycle.symbol} →
          </Link>
        </div>
      ) : null}

      <div className="grid md:grid-cols-3 gap-6">
        <VaultCard
          title="Invest"
          body={
            openCycle
              ? `Subscribe to ${openCycle.symbol} with BTC, ETH, USDC, or USDT.`
              : "No open cycle right now."
          }
          href="/vault/invest"
          highlight={!kycBlocking && !!openCycle && confirmedCount === 0}
        />
        <VaultCard
          title="Deposits"
          body={
            pendingCount > 0
              ? `${pendingCount} pending verification, ${confirmedCount} confirmed.`
              : confirmedCount > 0
                ? `${confirmedCount} confirmed deposit(s).`
                : "No deposits yet."
          }
          href="/vault/deposits"
        />
        <VaultCard
          title="Positions"
          body="Your subscriptions, allocated head, and NAV per cycle."
          href="/vault/positions"
        />
        <VaultCard
          title="Documents"
          body="Term sheets, subscription agreements, audit reports."
          href="/vault/documents"
        />
        <VaultCard
          title="KYC / KYB"
          body={
            investor.kycStatus === "APPROVED"
              ? "Approved — renewal not yet due."
              : investor.kycStatus === "REJECTED"
                ? "Rejected — please contact investors@carnivon.io."
                : "Pending — complete or renew your onboarding."
          }
          href="/vault/kyc"
          highlight={kycBlocking}
        />
      </div>
    </div>
  );
}

function VaultCard({
  title,
  body,
  href,
  highlight,
}: {
  title: string;
  body: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card p-6 hover:border-gold/60 transition-colors group block ${
        highlight ? "border-gold/50" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-xl text-cream-50">{title}</h3>
        <span className="text-gold transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
      <p className="text-sm text-cream-100/70">{body}</p>
    </Link>
  );
}
