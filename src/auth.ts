import NextAuth, { type NextAuthConfig } from "next-auth";
import Apple from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { SignJWT, importPKCS8 } from "jose";
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/vault/login",
  },
  providers,
  callbacks: {
    // With JWT strategy the adapter still creates the User row, but the
    // user.id needs to be piped through the token into session.user.id
    // manually — otherwise it's undefined at read time.
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
