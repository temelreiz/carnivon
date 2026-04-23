import crypto from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendPasswordReset } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const IDENTIFIER_PREFIX = "pw-reset:";

async function requestReset(formData: FormData) {
  "use server";

  const parsed = z
    .object({ email: z.string().email() })
    .safeParse({ email: (formData.get("email") as string)?.toLowerCase() });
  if (!parsed.success) redirect("/vault/forgot?sent=1");

  const email = parsed.data.email;
  const user = await prisma.user.findUnique({ where: { email } });

  // Send only when the account exists, but always look like we did — leaks no
  // enumeration signal.
  if (user?.passwordHash != null) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + TOKEN_TTL_MS);
    await prisma.verificationToken.create({
      data: {
        identifier: `${IDENTIFIER_PREFIX}${email}`,
        token,
        expires,
      },
    });

    const base = process.env.AUTH_URL || "http://localhost:3000";
    const resetUrl = `${base}/vault/reset?token=${encodeURIComponent(token)}`;
    await sendPasswordReset({ email, resetUrl });
  }

  redirect("/vault/forgot?sent=1");
}

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  if (sent) {
    return (
      <div className="container-max py-24 max-w-md">
        <div className="eyebrow mb-4">Check your inbox</div>
        <h1 className="font-serif text-3xl text-cream-50 mb-2">
          Reset link sent.
        </h1>
        <p className="text-sm text-cream-100/70 mb-10">
          If an account exists for that address, we've emailed you a link to
          reset your password. The link expires in 1 hour.
        </p>
        <Link href="/vault/login" className="btn-secondary text-xs">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container-max py-24 max-w-md">
      <div className="eyebrow mb-4">Forgot password</div>
      <h1 className="font-serif text-3xl text-cream-50 mb-2">
        Reset your password
      </h1>
      <p className="text-sm text-cream-100/70 mb-10">
        Enter the email you used to sign up and we&apos;ll send a reset link.
      </p>

      <form action={requestReset} className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Email <span className="text-gold">*</span>
          </span>
          <input
            type="email"
            name="email"
            required
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
          />
        </label>
        <button type="submit" className="btn-primary w-fit">
          Send reset link
        </button>
      </form>

      <p className="mt-10 text-xs text-cream-100/50">
        Remembered it?{" "}
        <Link href="/vault/login" className="text-gold hover:underline">
          Back to sign in
        </Link>
        .
      </p>
    </div>
  );
}
