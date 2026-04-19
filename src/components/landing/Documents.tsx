import type { DocumentLink } from "@/lib/mock-data";
import { Section } from "@/components/ui/Section";

export function Documents({ documents }: { documents: DocumentLink[] }) {
  return (
    <Section
      id="documents"
      eyebrow="Documents"
      title="The full legal package."
      intro="Available on request to qualified, verified investors. Access gated through the Vault."
    >
      <div className="card divide-y divide-forest-700/60">
        {documents.map((d) => (
          <div
            key={d.title}
            className="flex flex-wrap items-center justify-between gap-4 px-6 md:px-10 py-5"
          >
            <div>
              <div className="font-serif text-lg text-cream-50">{d.title}</div>
              <div className="text-xs text-cream-100/50 mt-1">
                {d.version} · Updated {d.updated_at}
              </div>
            </div>
            <a href="#access" className="btn-secondary text-xs">
              Request
            </a>
          </div>
        ))}
      </div>
    </Section>
  );
}
