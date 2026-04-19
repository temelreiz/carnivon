export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 md:pt-36 md:pb-44">
      {/* Subtle topographical lines */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, #d4a84a 0 1px, transparent 1px 120px)",
        }}
      />
      <div className="container-max relative">
        <div className="eyebrow mb-6">Real Asset Yield Infrastructure</div>
        <h1 className="text-5xl md:text-7xl lg:text-[88px] font-serif leading-[1.02] text-cream-50 max-w-5xl">
          Institutional access to<br />
          <span className="text-gold-soft italic">livestock yield.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg md:text-xl text-cream-100/75 leading-relaxed">
          Invest in short-duration Brazilian cattle cycles with audited
          operations, verified supply chains, and structured returns.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href="#access" className="btn-primary">
            Request Access
          </a>
          <a href="#product" className="btn-secondary">
            View Current Cycle
          </a>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6 max-w-3xl">
          <HeroStat label="Target return" value="10–16%" sub="annualized" />
          <HeroStat label="Cycle length" value="150 days" sub="average" />
          <HeroStat label="Minimum" value="$50,000" sub="per ticket" />
          <HeroStat label="Status" value="Open" sub="CVC01" />
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-cream-100/50 mb-2">
        {label}
      </div>
      <div className="font-serif text-2xl md:text-3xl text-cream-50">{value}</div>
      <div className="text-xs text-cream-100/50 mt-1">{sub}</div>
    </div>
  );
}
