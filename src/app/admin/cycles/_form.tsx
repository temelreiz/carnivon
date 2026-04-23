import Link from "next/link";
import type { Cycle, CycleStatus } from "@prisma/client";

const STATUSES: CycleStatus[] = [
  "DRAFT",
  "FUNDING",
  "ACTIVE",
  "MATURED",
  "CLOSED",
];

export function CycleForm({
  action,
  cycle,
  submitLabel,
  onDelete,
}: {
  action: (formData: FormData) => Promise<void>;
  cycle?: Cycle | null;
  submitLabel: string;
  onDelete?: (formData: FormData) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const iso = (d: Date | null | undefined) =>
    d ? d.toISOString().slice(0, 10) : "";

  return (
    <>
      <form action={action} className="card p-8 grid gap-5">
        <div className="grid md:grid-cols-2 gap-5">
          <Field
            name="symbol"
            label="Symbol"
            required
            defaultValue={cycle?.symbol ?? ""}
            placeholder="CVC01"
            readOnly={!!cycle}
            hint={cycle ? "Symbol is immutable after creation." : undefined}
          />
          <Field
            name="name"
            label="Name"
            required
            defaultValue={cycle?.name ?? ""}
            placeholder="Carnivon Brazil Cattle Cycle 01"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <Select
            name="status"
            label="Status"
            defaultValue={cycle?.status ?? "DRAFT"}
            options={STATUSES}
          />
          <Field
            name="durationDays"
            label="Duration (days)"
            type="number"
            required
            defaultValue={String(cycle?.durationDays ?? 90)}
          />
          <Field
            name="targetReturn"
            label="Target return"
            required
            defaultValue={cycle?.targetReturn ?? "10–16% (annualized target)"}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Field
            name="startDate"
            label="Start date"
            type="date"
            defaultValue={iso(cycle?.startDate) || today}
          />
          <Field
            name="maturityDate"
            label="Maturity date"
            type="date"
            defaultValue={iso(cycle?.maturityDate)}
            hint="Leave empty to auto-compute from start + duration."
          />
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <Field
            name="minTicketUSD"
            label="Minimum ticket (USD)"
            type="number"
            required
            defaultValue={String((cycle?.minTicket ?? 0) / 100)}
            hint="Legacy field; UI shows '1 head ≈ $X' from pricing engine."
          />
          <Field
            name="aumUSD"
            label="AUM (USD)"
            type="number"
            defaultValue={String(Number(cycle?.aumCents ?? 0n) / 100)}
          />
          <Field
            name="deployedPct"
            label="Deployed %"
            type="number"
            defaultValue={String(cycle?.deployedPct ?? 0)}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Field
            name="spvEntity"
            label="SPV entity"
            defaultValue={cycle?.spvEntity ?? ""}
            placeholder="Carnivon Cattle Cycle 01 SPV Ltd."
          />
          <Field
            name="operator"
            label="Operator"
            defaultValue={cycle?.operator ?? ""}
            placeholder="Operator LLC"
          />
        </div>

        <Field
          name="tokenAddress"
          label="Token address (on-chain)"
          defaultValue={cycle?.tokenAddress ?? ""}
          placeholder="0x…"
        />

        <div className="flex items-center gap-4">
          <button type="submit" className="btn-primary">
            {submitLabel}
          </button>
          <Link
            href="/admin/cycles"
            className="text-xs text-cream-100/60 hover:text-gold"
          >
            Cancel
          </Link>
        </div>
      </form>

      {onDelete && cycle ? (
        <form action={onDelete} className="mt-10 card p-8 border-red-900/60">
          <h3 className="font-serif text-lg text-cream-50 mb-2">Danger zone</h3>
          <p className="text-sm text-cream-100/60 mb-4">
            Deletes this cycle and cannot be undone. Only allowed when the
            cycle has no subscriptions, animals, costs, or sales.
          </p>
          <button
            type="submit"
            className="px-4 py-2 text-xs uppercase tracking-[0.18em] border border-red-500/60 text-red-300 hover:bg-red-950/40"
          >
            Delete cycle
          </button>
        </form>
      ) : null}
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
  placeholder,
  readOnly,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
        {label} {required ? <span className="text-gold">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold ${
          readOnly ? "opacity-60 cursor-not-allowed" : ""
        }`}
      />
      {hint ? <span className="text-xs text-cream-100/40">{hint}</span> : null}
    </label>
  );
}

function Select({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: readonly string[];
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
