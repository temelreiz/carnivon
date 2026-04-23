import Link from "next/link";
import { signIn } from "@/auth";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email or password is incorrect.",
  OAuthAccountNotLinked:
    "This email is already linked to a different sign-in method.",
  Configuration: "Sign-in is misconfigured — please contact support.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? `Sign-in failed (${error}).`)
    : null;
  const redirectTo = from || "/vault";

  return (
    <div className="container-max py-20 max-w-md">
      <div className="eyebrow mb-4">Sign in</div>
      <h1 className="font-serif text-3xl text-cream-50 mb-2">Vault access</h1>
      <p className="text-sm text-cream-100/70 mb-10">
        New here?{" "}
        <Link
          href={`/vault/signup${from ? `?from=${encodeURIComponent(from)}` : ""}`}
          className="text-gold hover:underline"
        >
          Create an account
        </Link>
        .
      </p>

      <form
        action={async (formData) => {
          "use server";
          const email = (formData.get("email") as string)?.toLowerCase();
          const password = formData.get("password") as string;
          await signIn("credentials", {
            email,
            password,
            redirectTo,
          });
        }}
        className="grid gap-4"
      >
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Password
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
          />
        </label>
        <div className="flex items-center justify-between">
          <button type="submit" className="btn-primary">
            Sign in
          </button>
          <Link
            href="/vault/forgot"
            className="text-xs text-cream-100/60 hover:text-gold"
          >
            Forgot password?
          </Link>
        </div>
      </form>

      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 border-t border-forest-700/60" />
        <span className="text-xs text-cream-100/40 uppercase tracking-[0.2em]">
          or
        </span>
        <div className="flex-1 border-t border-forest-700/60" />
      </div>

      <div className="grid gap-3">
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white text-neutral-900 py-3 px-6 border border-white/20 hover:bg-neutral-100 transition-colors"
          >
            <GoogleGlyph />
            <span className="font-medium">Continue with Google</span>
          </button>
        </form>

        <form
          action={async () => {
            "use server";
            await signIn("apple", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-black text-white py-3 px-6 border border-black/60 hover:bg-neutral-900 transition-colors"
          >
            <AppleGlyph />
            <span className="font-medium">Continue with Apple</span>
          </button>
        </form>
      </div>

      {errorMessage ? (
        <p className="mt-6 text-xs text-red-400" role="alert">
          {errorMessage}
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

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.2-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.8 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.8 6.5 29.1 4.5 24 4.5c-7.3 0-13.6 4.1-16.7 10.2z" />
      <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-2 1.5-4.5 2.4-7 2.4-5.3 0-9.7-3-11.3-7.4l-6.5 5C9.3 39.8 16 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4-4.3 5.2l6 5.1C40.7 35.5 43.5 30.2 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
