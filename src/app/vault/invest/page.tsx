import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOrCreateInvestor } from "@/lib/investor";
import { submitDeposit } from "@/lib/deposit-actions";
import { getCurrentHeadPrice } from "@/lib/product-pricing";
import { formatUSD } from "@/lib/pricing";

export const dynamic = "force-dynamic";

type CryptoMethod = {
  kind: "crypto";
  chain: string;
  asset: string;
  label: string;
  network: string;
};
type FiatMethod = {
  kind: "fiat";
  id: string;
  label: string;
  sub: string;
};
type Method = CryptoMethod | FiatMethod;

// Canonical payment-method list the investor sees, regardless of whether we
// have an address configured. Crypto entries resolve to a live HouseWallet
// where possible; otherwise they render as "Coming soon" and stay disabled.
// Fiat entries are always disabled for now.
const METHODS: Method[] = [
  { kind: "crypto", chain: "bitcoin", asset: "BTC", label: "BTC", network: "Bitcoin" },
  { kind: "crypto", chain: "ethereum", asset: "ETH", label: "ETH", network: "Ethereum" },
  { kind: "crypto", chain: "base", asset: "USDC", label: "USDC", network: "Base" },
  { kind: "crypto", chain: "ethereum", asset: "USDC", label: "USDC", network: "Ethereum (ERC-20)" },
  { kind: "crypto", chain: "tron", asset: "USDT", label: "USDT", network: "Tron (TRC-20)" },
  { kind: "crypto", chain: "ethereum", asset: "USDT", label: "USDT", network: "Ethereum (ERC-20)" },
  { kind: "fiat", id: "card", label: "Credit / Debit card", sub: "Visa · Mastercard" },
  { kind: "fiat", id: "bank", label: "Bank transfer", sub: "SWIFT · SEPA" },
];

export default async function InvestPage() {
  const session = await auth();
  if (!session?.user) redirect("/vault/login?from=/vault/invest");

  const investor = await getOrCreateInvestor({
    id: session.user.id!,
    email: session.user.email,
    name: session.user.name,
  });

  if (investor.kycStatus !== "APPROVED") {
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
    prisma.houseWallet.findMany({ where: { active: true } }),
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

  // Index wallets by (chain, asset) so each canonical method can resolve its
  // live address in O(1). Only the first matching active wallet is used.
  const walletByKey = new Map<string, (typeof wallets)[number]>();
  for (const w of wallets) {
    const k = `${w.chain}|${w.asset}`;
    if (!walletByKey.has(k)) walletByKey.set(k, w);
  }

  const resolved = METHODS.map((m) => {
    if (m.kind === "fiat") return { method: m, wallet: null as null };
    const w = walletByKey.get(`${m.chain}|${m.asset}`) ?? null;
    return { method: m, wallet: w };
  });

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

      <InvestForm resolved={resolved} cycleId={cycle.id} />

      <p className="mt-10 text-xs text-cream-100/50">
        Seen your deposit already?{" "}
        <Link href="/vault/deposits" className="text-gold hover:underline">
          Check deposit status →
        </Link>
      </p>
    </div>
  );
}

type ResolvedMethod = {
  method: Method;
  wallet: {
    id: string;
    chain: string;
    asset: string;
    address: string;
    memo: string | null;
  } | null;
};

function InvestForm({
  resolved,
  cycleId,
}: {
  resolved: ResolvedMethod[];
  cycleId: string;
}) {
  const firstAvailableIndex = resolved.findIndex(
    (r) => r.method.kind === "crypto" && r.wallet
  );

  return (
    <form action={submitDeposit} className="card p-8 grid gap-6">
      <input type="hidden" name="cycleId" value={cycleId} />

      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-cream-100/60 mb-3">
          1. Pick a method
        </div>
        <div className="grid gap-2">
          {resolved.map((r, i) => {
            const isAvailable = r.method.kind === "crypto" && !!r.wallet;
            const value = r.wallet
              ? `${r.wallet.id}|${r.wallet.chain}|${r.wallet.asset}|${r.wallet.address}|${r.wallet.memo ?? ""}`
              : "";
            const title =
              r.method.kind === "crypto"
                ? `${r.method.label}`
                : r.method.label;
            const sub =
              r.method.kind === "crypto"
                ? `on ${r.method.network}`
                : r.method.sub;
            const detail = r.wallet
              ? r.wallet.memo
                ? `${r.wallet.address} · memo ${r.wallet.memo}`
                : r.wallet.address
              : "Coming soon";

            return (
              <label
                key={`${r.method.kind}-${i}`}
                className={`flex items-center gap-3 p-3 border ${
                  isAvailable
                    ? "border-forest-700/60 hover:border-gold/40 cursor-pointer has-[:checked]:border-gold/60 has-[:checked]:bg-forest-900/40"
                    : "border-forest-700/40 opacity-50 cursor-not-allowed"
                }`}
              >
                <input
                  type="radio"
                  name="walletChoice"
                  value={value}
                  disabled={!isAvailable}
                  defaultChecked={isAvailable && i === firstAvailableIndex}
                  className="accent-gold"
                />
                <div className="flex-1">
                  <div className="font-serif text-base text-cream-50 flex items-center gap-2">
                    {title}
                    <span className="text-cream-100/40 text-xs font-sans">
                      {sub}
                    </span>
                    {!isAvailable ? (
                      <span className="ml-auto text-xs uppercase tracking-[0.18em] text-cream-100/40 border border-cream-100/20 px-2 py-0.5">
                        Coming soon
                      </span>
                    ) : null}
                  </div>
                  <div
                    className={`text-xs mt-0.5 break-all ${
                      r.wallet ? "text-cream-100/40 font-mono" : "text-cream-100/30"
                    }`}
                  >
                    {detail}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
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
