import Link from "next/link";

export default function VaultDashboard() {
  // Placeholder — in real app, gate behind auth + fetch investor's positions
  return (
    <div className="container-max py-16">
      <div className="eyebrow mb-4">Dashboard</div>
      <h1 className="font-serif text-4xl md:text-5xl text-cream-50 mb-4">
        Welcome to the Vault
      </h1>
      <p className="text-cream-100/70 max-w-2xl mb-10">
        This is a private area for Carnivon investors. Sign in to view your
        positions, cycle NAV, and distribution history.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <VaultCard
          title="Positions"
          body="Your subscriptions, tokens, and NAV per cycle."
          href="/positions"
        />
        <VaultCard
          title="Documents"
          body="Term sheets, subscription agreements, audit reports."
          href="/documents"
        />
        <VaultCard
          title="KYC / KYB"
          body="Complete or renew your compliance onboarding."
          href="/kyc"
        />
      </div>

      <div className="mt-16 border border-gold/30 bg-forest-900/30 p-6">
        <div className="eyebrow mb-2">Status</div>
        <p className="text-sm text-cream-100/70">
          The Vault is in pre-launch. Sign in flow, KYC integration, and
          on-chain position tracking are coming with Cycle 01 activation.
        </p>
      </div>
    </div>
  );
}

function VaultCard({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link href={href} className="card p-6 hover:border-gold/60 transition-colors group block">
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
