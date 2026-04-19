import { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`py-24 md:py-32 ${className}`}>
      <div className="container-max">
        {(eyebrow || title || intro) && (
          <header className="mb-14 md:mb-20 max-w-3xl">
            {eyebrow && <div className="eyebrow mb-4">{eyebrow}</div>}
            {title && (
              <h2 className="text-3xl md:text-5xl font-serif text-cream-50 leading-tight">
                {title}
              </h2>
            )}
            {intro && (
              <p className="mt-6 text-cream-100/70 text-lg leading-relaxed max-w-2xl">
                {intro}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
