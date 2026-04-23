import Link from "next/link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";

const SignupSchema = z
  .object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(200),
    password: z.string().min(8).max(200),
    passwordRepeat: z.string().min(8).max(200),
  })
  .refine((d) => d.password === d.passwordRepeat, {
    path: ["passwordRepeat"],
    message: "Passwords do not match",
  });

async function signup(formData: FormData) {
  "use server";

  const parsed = SignupSchema.safeParse({
    name: formData.get("name"),
    email: (formData.get("email") as string | null)?.toLowerCase(),
    password: formData.get("password"),
    passwordRepeat: formData.get("passwordRepeat"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const from = encodeURIComponent(first?.message ?? "Invalid input");
    redirect(`/vault/signup?error=${from}`);
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect(
      `/vault/signup?error=${encodeURIComponent("An account with this email already exists — sign in instead.")}`
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, passwordHash, emailVerified: new Date() },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/vault",
  });
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="container-max py-24 max-w-md">
      <div className="eyebrow mb-4">Create account</div>
      <h1 className="font-serif text-3xl text-cream-50 mb-2">Join the vault</h1>
      <p className="text-sm text-cream-100/70 mb-10">
        Already have access?{" "}
        <Link href="/vault/login" className="text-gold hover:underline">
          Sign in
        </Link>
        .
      </p>

      <form action={signup} className="grid gap-5">
        <Field name="name" label="Full name" required />
        <Field name="email" type="email" label="Email" required />
        <Field name="password" type="password" label="Password" required />
        <Field
          name="passwordRepeat"
          type="password"
          label="Repeat password"
          required
        />
        <button type="submit" className="btn-primary">
          Create account
        </button>
        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <p className="mt-10 text-xs text-cream-100/50">
        By creating an account you agree to our{" "}
        <a href="/#documents" className="text-gold hover:underline">
          terms &amp; risk disclosures
        </a>
        .
      </p>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
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
        minLength={type === "password" ? 8 : undefined}
        className="bg-forest-900/60 border border-forest-700/60 px-4 py-3 text-cream-50 focus:outline-none focus:border-gold"
      />
    </label>
  );
}
