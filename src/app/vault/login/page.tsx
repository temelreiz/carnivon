export default function LoginPage() {
  return (
    <div className="container-max py-24 max-w-md">
      <div className="eyebrow mb-4">Sign in</div>
      <h1 className="font-serif text-3xl text-cream-50 mb-2">Vault access</h1>
      <p className="text-sm text-cream-100/70 mb-10">
        Sign-in is available to verified Carnivon investors only. If you are
        not yet onboarded, request access from the main site.
      </p>

      <form className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50
                       focus:outline-none focus:border-gold"
          />
        </label>
        <button type="button" disabled className="btn-primary disabled:opacity-50">
          Send magic link (coming soon)
        </button>
      </form>

      <p className="mt-10 text-xs text-cream-100/50">
        Not yet an investor?{" "}
        <a href="https://carnivon.io/#access" className="text-gold hover:underline">
          Request access
        </a>
        .
      </p>
    </div>
  );
}
