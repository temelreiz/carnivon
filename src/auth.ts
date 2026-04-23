import NextAuth, { type NextAuthConfig } from "next-auth";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { SignJWT, importPKCS8 } from "jose";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

async function appleClientSecret() {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const clientId = process.env.AUTH_APPLE_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;

  if (!teamId || !keyId || !clientId || !privateKey) {
    throw new Error(
      "Apple Sign-In env missing: APPLE_TEAM_ID, APPLE_KEY_ID, AUTH_APPLE_ID, APPLE_PRIVATE_KEY"
    );
  }

  const key = await importPKCS8(privateKey.replace(/\\n/g, "\n"), "ES256");
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 24 * 180) // 6 months, Apple max
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .sign(key);
}

const providers: NextAuthConfig["providers"] = [];

// Apple — native Sign In with Apple for iOS/macOS users.
try {
  const clientSecret = await appleClientSecret();
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret,
    })
  );
} catch (err) {
  console.warn(
    "[auth] Apple Sign-In disabled:",
    err instanceof Error ? err.message : err
  );
}

// Google OAuth — allowDangerousEmailAccountLinking lets investors who first
// signed up with email/password link Google later by matching the address.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
} else {
  console.warn(
    "[auth] Google Sign-In disabled: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing"
  );
}

// Email + password. Signup happens via the /vault/signup server action;
// this provider only validates existing credentials.
const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

providers.push(
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const parsed = CredentialsSchema.safeParse(raw);
      if (!parsed.success) return null;

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
      });
      if (!user?.passwordHash) return null;

      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/vault/login",
  },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
