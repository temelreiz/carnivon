import Link from "next/link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";

const IDENTIFIER_PREFIX = "pw-reset:";

const ResetSchema = z
  .object({
    token: z.string().min(32),
    password: z.string().min(8).max(200),
    passwordRepeat: z.string().min(8).max(200),
  })
  .refine((d) => d.password === d.passwordRepeat, {
    path: ["passwordRepeat"],
    message: "Passwords do not match",
  });

async function doReset(formData: FormData) {
  "use server";

  const parsed = ResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    passwordRepeat: formData.get("passwordRepeat"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request";
    redirect(
      `/vault/reset?token=${encodeURIComponent((formData.get("token") as string) ?? "")}&error=${encodeURIComponent(msg)}`
    );
  }

  const row = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token },
  });
  if (!row || !row.identifier.startsWith(IDENTIFIER_PREFIX)) {
    redirect("/vault/reset?error=invalid");
  }
  if (row.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token: row.token } });
    redirect("/vault/reset?error=expired");
  }

  const email = row.identifier.slice(IDENTIFIER_PREFIX.length);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    redirect("/vault/reset?error=invalid");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    // Burn this token and any other pending reset tokens for the same email.
    prisma.verificationToken.deleteMany({
      where: { identifier: row.identifier },
    }),
  ]);

  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/vault",
  });
}

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (!token) {
    return (
      <ErrorLayout
        title="Invalid reset link"
        body="This link is missing a token. Request a fresh one from the sign-in page."
      />
    );
  }

  if (error === "invalid" || error === "expired") {
    return (
      <ErrorLayout
        title={error === "expired" ? "Link expired" : "Invalid link"}
        body="Please request a new reset link."
      />
    );
  }

  return (
    <div className="container-max py-24 max-w-md">
      <div className="eyebrow mb-4">Choose a new password</div>
      <h1 className="font-serif text-3xl text-cream-50 mb-10">
        Set your password
      </h1>

      <form action={doReset} className="grid gap-5">
        <input type="hidden" name="token" value={token} />
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            New password <span className="text-gold">*</span>
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-cream-100/60">
            Repeat password <span className="text-gold">*</span>
          </span>
          <input
            type="password"
            name="passwordRepeat"
            required
            minLength={8}
            className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
          />
        </label>
        <button type="submit" className="btn-primary w-fit">
          Save new password
        </button>
        {error && error !== "invalid" && error !== "expired" ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function ErrorLayout({ title, body }: { title: string; body: string }) {
  return (
    <div className="container-max py-24 max-w-md">
      <div className="eyebrow mb-4">Reset</div>
      <h1 className="font-serif text-3xl text-cream-50 mb-4">{title}</h1>
      <p className="text-sm text-cream-100/70 mb-6">{body}</p>
      <Link href="/vault/forgot" className="btn-primary text-xs">
        Request new link
      </Link>
    </div>
  );
}
