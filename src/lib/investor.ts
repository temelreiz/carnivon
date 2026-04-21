import { prisma } from "@/lib/db";
import type { Investor } from "@prisma/client";

/**
 * Returns the Investor record linked to this User, creating a minimal
 * placeholder the first time. KYC / jurisdiction / wallet are filled in
 * later via the /vault/kyc onboarding flow — we just need a row to hang
 * subscriptions off of.
 */
export async function getOrCreateInvestor(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}): Promise<Investor> {
  const existing = await prisma.investor.findUnique({ where: { userId: user.id } });
  if (existing) return existing;

  // Email is the business unique key on Investor, so if one was already
  // seeded before Auth.js ever saw this user, adopt it.
  if (user.email) {
    const byEmail = await prisma.investor.findUnique({
      where: { email: user.email },
    });
    if (byEmail && !byEmail.userId) {
      return prisma.investor.update({
        where: { id: byEmail.id },
        data: { userId: user.id },
      });
    }
  }

  return prisma.investor.create({
    data: {
      email: user.email ?? `user-${user.id}@unknown.local`,
      name: user.name ?? "New investor",
      jurisdiction: "UNSET",
      userId: user.id,
    },
  });
}
