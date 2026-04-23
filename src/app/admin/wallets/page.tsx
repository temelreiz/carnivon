import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  createHouseWallet,
  updateHouseWallet,
  deleteHouseWallet,
} from "@/lib/deposit-actions";

const CHAINS = ["bitcoin", "ethereum", "base", "tron"] as const;
const ASSETS = ["BTC", "ETH", "USDC", "USDT"] as const;

export default async function WalletsPage() {
  const wallets = await prisma.houseWallet.findMany({
    orderBy: [{ active: "desc" }, { asset: "asc" }, { chain: "asc" }],
    include: { _count: { select: { deposits: true } } },
  });

  return (
    <div className="container-max py-16 max-w-5xl">
      <div className="eyebrow mb-4">Deposit wallets</div>
      <h1 className="font-serif text-3xl md:text-4xl text-cream-50 mb-2">
        House wallets
      </h1>
      <p className="text-sm text-cream-100/70 mb-10 max-w-2xl">
        Static deposit addresses investors pay into. Carnivon holds the keys
        off-platform (Ledger / cold storage) — only the public address is
        recorded here. Deactivate instead of deleting once an address has
        incoming deposits.
      </p>

      <div className="card p-8 mb-10">
        <h2 className="font-serif text-xl text-cream-50 mb-5">Add wallet</h2>
        <form action={createHouseWallet} className="grid md:grid-cols-2 gap-4">
          <Select name="chain" label="Chain" options={CHAINS} />
          <Select name="asset" label="Asset" options={ASSETS} />
          <Field
            name="address"
            label="Address"
            required
            placeholder="0x… / bc1… / T…"
          />
          <Field name="memo" label="Memo (Tron/XRP)" placeholder="Optional" />
          <Field
            name="label"
            label="Label"
            placeholder="e.g. Cold Wallet 01"
            className="md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm text-cream-100/70 md:col-span-2">
            <input type="checkbox" name="active" defaultChecked />
            Active (offered on the investor form)
          </label>
          <button type="submit" className="btn-primary w-fit md:col-span-2">
            Add wallet
          </button>
        </form>
      </div>

      <h2 className="font-serif text-xl text-cream-50 mb-4">
        Existing wallets
      </h2>
      {wallets.length === 0 ? (
        <div className="card p-8 text-sm text-cream-100/60">
          None yet. Add the first wallet above.
        </div>
      ) : (
        <div className="grid gap-4">
          {wallets.map((w) => {
            const boundUpdate = updateHouseWallet.bind(null, w.id);
            const boundDelete = deleteHouseWallet.bind(null, w.id);
            return (
              <div key={w.id} className="card p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-lg text-cream-50">
                        {w.asset}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-cream-100/50">
                        on {w.chain}
                      </span>
                      {w.active ? (
                        <span className="text-xs text-gold-soft border border-gold/50 px-2 py-0.5 uppercase tracking-[0.18em]">
                          active
                        </span>
                      ) : (
                        <span className="text-xs text-cream-100/40 border border-cream-100/20 px-2 py-0.5 uppercase tracking-[0.18em]">
                          paused
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-cream-100/40 mt-1">
                      {w._count.deposits} deposit(s)
                    </div>
                  </div>
                  {w._count.deposits === 0 ? (
                    <form action={boundDelete}>
                      <button
                        type="submit"
                        className="text-xs text-red-300 hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  ) : null}
                </div>

                <form action={boundUpdate} className="grid md:grid-cols-2 gap-4">
                  <Select
                    name="chain"
                    label="Chain"
                    options={CHAINS}
                    defaultValue={w.chain}
                  />
                  <Select
                    name="asset"
                    label="Asset"
                    options={ASSETS}
                    defaultValue={w.asset}
                  />
                  <Field
                    name="address"
                    label="Address"
                    required
                    defaultValue={w.address}
                    className="md:col-span-2 font-mono"
                  />
                  <Field
                    name="memo"
                    label="Memo"
                    defaultValue={w.memo ?? ""}
                  />
                  <Field
                    name="label"
                    label="Label"
                    defaultValue={w.label ?? ""}
                  />
                  <label className="flex items-center gap-2 text-sm text-cream-100/70 md:col-span-2">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={w.active}
                    />
                    Active
                  </label>
                  <button
                    type="submit"
                    className="btn-secondary text-xs w-fit md:col-span-2"
                  >
                    Save changes
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  required,
  defaultValue,
  placeholder,
  className = "",
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
        {label} {required ? <span className="text-gold">*</span> : null}
      </span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
      />
    </label>
  );
}

function Select({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
