import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;

  return (
    <div className="container-max py-24 max-w-md">
      <div className="eyebrow mb-4">Sign in</div>
      <h1 className="font-serif text-3xl text-cream-50 mb-2">Vault access</h1>
      <p className="text-sm text-cream-100/70 mb-10">
        Sign in with your Apple ID to access the Carnivon investor vault —
        positions, cycle NAV, and distribution history.
      </p>

      <form
        action={async () => {
          "use server";
          await signIn("apple", { redirectTo: from || "/vault" });
        }}
      >
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 bg-black text-white
                     py-3 px-6 border border-black/60 hover:bg-neutral-900 transition-colors"
        >
          <AppleGlyph />
          <span className="font-medium">Sign in with Apple</span>
        </button>
      </form>

      {error ? (
        <p className="mt-6 text-xs text-red-400">
          Sign-in failed ({error}). Please try again.
        </p>
      ) : null}

      <p className="mt-10 text-xs text-cream-100/50">
        Institutional investor?{" "}
        <a href="https://carnivon.io/#access" className="text-gold hover:underline">
          Contact us
        </a>
        .
      </p>
    </div>
  );
}

function AppleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.543 12.64c-.02-2.09 1.71-3.09 1.79-3.14-.98-1.43-2.5-1.62-3.04-1.64-1.29-.13-2.52.76-3.18.76-.66 0-1.67-.74-2.75-.72-1.41.02-2.72.82-3.45 2.08-1.47 2.56-.38 6.34 1.05 8.42.7 1.02 1.53 2.16 2.61 2.12 1.05-.04 1.45-.68 2.72-.68 1.27 0 1.63.68 2.74.66 1.13-.02 1.85-1.04 2.54-2.06.8-1.18 1.13-2.32 1.15-2.38-.03-.01-2.2-.85-2.22-3.36zM15.37 6.29c.58-.7 1-1.67.88-2.65-.85.03-1.88.57-2.48 1.27-.54.62-1.01 1.61-.88 2.57.95.07 1.9-.48 2.48-1.19z" />
    </svg>
  );
}
