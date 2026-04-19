"use client";
import { useState } from "react";
import { Section } from "@/components/ui/Section";

export function AccessForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "err">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/access/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Request failed");
      }
      setStatus("ok");
    } catch (err: unknown) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <Section
      id="access"
      eyebrow="Access"
      title="Request access to the cycle."
      intro="Institutional and qualified investors only. We reply within two business days with the full data room and subscription path."
    >
      {status === "ok" ? (
        <div className="card p-10 text-center">
          <div className="font-serif text-2xl text-cream-50 mb-3">
            Request received.
          </div>
          <p className="text-cream-100/70 max-w-md mx-auto">
            We've logged your interest and will reach out shortly with access to
            the data room.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card p-8 md:p-10 max-w-2xl grid gap-5">
          <Field name="name" label="Full name" required />
          <Field name="email" type="email" label="Email" required />
          <Field name="entity" label="Entity / fund" placeholder="Optional" />
          <Field
            name="ticket"
            label="Indicative ticket size (USD)"
            placeholder="e.g. 250,000"
            required
          />
          <Field name="jurisdiction" label="Jurisdiction" required />
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
              Notes
            </span>
            <textarea
              name="notes"
              rows={3}
              className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50
                         focus:outline-none focus:border-gold"
            />
          </label>
          <label className="flex items-start gap-3 text-xs text-cream-100/60">
            <input type="checkbox" name="qualified" required className="mt-0.5" />
            <span>
              I confirm that I am an institutional or qualified/accredited
              investor in my jurisdiction and that this inquiry is not a
              solicitation in any restricted territory.
            </span>
          </label>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="btn-primary disabled:opacity-50"
            >
              {status === "submitting" ? "Submitting…" : "Submit request"}
            </button>
            {status === "err" && (
              <span className="text-sm text-red-400">{error}</span>
            )}
          </div>
        </form>
      )}
    </Section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
        {label} {required && <span className="text-gold">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50
                   focus:outline-none focus:border-gold"
      />
    </label>
  );
}
