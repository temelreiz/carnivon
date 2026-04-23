import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOrCreateInvestor } from "@/lib/investor";
import { submitDeposit } from "@/lib/deposit-actions";
import { getCurrentHeadPrice } from "@/lib/product-pricing";
import { formatUSD } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function InvestPage() {
  const session = await auth();
  if (!session?.user) redirect("/vault/login?from=/vault/invest");

  const investor = await getOrCreateInvestor({
    id: session.user.id!,
    email: session.user.email,
    name: session.user.name,
  });

  if (investor.kycStatus !== "APPROVED") {
    // Allow UNSET-jurisdiction to reach KYC flow first.
    return (
      <div className="container-max py-24 max-w-xl">
        <div className="eyebrow mb-4">Invest</div>
        <h1 className="font-serif text-3xl text-cream-50 mb-4">
          Finish onboarding first.
        </h1>
        <p className="text-sm text-cream-100/70 mb-6">
          Subscriptions require a completed KYC profile. Your current status
          is <span className="text-gold">{investor.kycStatus}</span>.
        </p>
        <Link href="/vault/kyc" className="btn-primary text-xs">
          Continue onboarding →
        </Link>
      </div>
    );
  }

  const [cycle, wallets, pricing] = await Promise.all([
    prisma.cycle.findFirst({
      where: { status: { in: ["FUNDING", "ACTIVE"] } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.houseWallet.findMany({
      where: { active: true },
      orderBy: [{ asset: "asc" }, { chain: "asc" }],
    }),
    getCurrentHeadPrice().catch(() => null),
  ]);

  if (!cycle) {
    return (
      <div className="container-max py-24 max-w-xl">
        <div className="eyebrow mb-4">Invest</div>
        <h1 className="font-serif text-3xl text-cream-50 mb-4">
          No cycle open.
        </h1>
        <p className="text-sm text-cream-100/70">
          Come back when the next cycle opens. We&apos;ll notify verified
          investors by email.
        </p>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="container-max py-24 max-w-xl">
        <div className="eyebrow mb-4">Invest</div>
        <h1 className="font-serif text-3xl text-cream-50 mb-4">
          Wire instructions unavailable.
        </h1>
        <p className="text-sm text-cream-100/70">
          Deposit addresses aren&apos;t configured yet. Please contact
          investors@carnivon.io.
        </p>
      </div>
    );
  }

  return (
    <div className="container-max py-16 max-w-3xl">
      <div className="eyebrow mb-4">Invest</div>
      <h1 className="font-serif text-3xl md:text-4xl text-cream-50 mb-2">
        Subscribe to {cycle.symbol}
      </h1>
      <p className="text-sm text-cream-100/70 mb-8 max-w-2xl">
        Send crypto to the matching Carnivon address, then submit the
        transaction hash below. We verify on-chain and credit your position
        within one business day.
        {pricing ? (
          <>
            {" "}
            Current price: <strong>{formatUSD(pricing.priceUSD)}</strong> per
            head.
          </>
        ) : null}
      </p>

      <InvestForm wallets={wallets} cycleId={cycle.id} />

      <p className="mt-10 text-xs text-cream-100/50">
        Seen your deposit already?{" "}
        <Link href="/vault/deposits" className="text-gold hover:underline">
          Check deposit status →
        </Link>
      </p>
    </div>
  );
}

function InvestForm({
  wallets,
  cycleId,
}: {
  wallets: {
    id: string;
    chain: string;
    asset: string;
    address: string;
    memo: string | null;
    label: string | null;
  }[];
  cycleId: string;
}) {
  return (
    <form action={submitDeposit} className="card p-8 grid gap-6">
      <input type="hidden" name="cycleId" value={cycleId} />

      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-cream-100/60 mb-3">
          1. Pick a network
        </div>
        <div className="grid gap-2">
          {wallets.map((w, i) => (
            <label
              key={w.id}
              className="flex items-center gap-3 p-3 border border-forest-700/60 hover:border-gold/40 cursor-pointer has-[:checked]:border-gold/60 has-[:checked]:bg-forest-900/40"
            >
              <input
                type="radio"
                name="walletChoice"
                value={`${w.id}|${w.chain}|${w.asset}|${w.address}|${w.memo ?? ""}`}
                defaultChecked={i === 0}
                className="accent-gold"
              />
              <div className="flex-1">
                <div className="font-serif text-base text-cream-50">
                  {w.asset}{" "}
                  <span className="text-cream-100/40 text-xs font-sans">
                    on {w.chain}
                  </span>
                </div>
                <div className="text-xs text-cream-100/40 font-mono break-all mt-0.5">
                  {w.address}
                  {w.memo ? ` · memo ${w.memo}` : ""}
                </div>
              </div>
            </label>
          ))}
        </div>
        {/* Hidden fields updated from the radio choice via the client helper. */}
        <WalletChoiceHydrator />
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-cream-100/60 mb-3">
          2. Send your deposit
        </div>
        <p className="text-sm text-cream-100/70">
          Copy the address above into your wallet. Send the exact amount you
          intend to invest. Keep the transaction hash — you&apos;ll paste it
          below after confirmation.
        </p>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-cream-100/60 mb-3">
          3. Submit tx hash
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="grid gap-2">
            <span className="text-xs text-cream-100/60">
              Declared USD value <span className="text-gold">*</span>
            </span>
            <input
              name="amountUSD"
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="e.g. 2500"
              className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 font-mono focus:outline-none focus:border-gold"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs text-cream-100/60">
              Crypto amount (optional)
            </span>
            <input
              name="amountCrypto"
              placeholder="e.g. 0.0625"
              className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 font-mono focus:outline-none focus:border-gold"
            />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className="text-xs text-cream-100/60">
              Transaction hash <span className="text-gold">*</span>
            </span>
            <input
              name="txHash"
              required
              placeholder="0x… or bitcoin tx id"
              className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 font-mono focus:outline-none focus:border-gold"
            />
          </label>
        </div>
      </div>

      <button type="submit" className="btn-primary">
        Submit deposit for review
      </button>
    </form>
  );
}

/**
 * Tiny client island that expands the selected "walletChoice" radio value
 * into the four hidden form fields (houseWalletId, chain, asset, plus we
 * discard address/memo server-side — they're just displayed for the user).
 */
function WalletChoiceHydrator() {
  return (
    <>
      <input type="hidden" name="houseWalletId" />
      <input type="hidden" name="chain" />
      <input type="hidden" name="asset" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              function sync() {
                var radio = document.querySelector('input[name="walletChoice"]:checked');
                if (!radio) return;
                var parts = radio.value.split("|");
                var form = radio.closest("form");
                form.querySelector('input[name="houseWalletId"]').value = parts[0] || "";
                form.querySelector('input[name="chain"]').value = parts[1] || "";
                form.querySelector('input[name="asset"]').value = parts[2] || "";
              }
              document.addEventListener("change", function (e) {
                if (e.target && e.target.name === "walletChoice") sync();
              });
              sync();
            })();
          `,
        }}
      />
    </>
  );
}
