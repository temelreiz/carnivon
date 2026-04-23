import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getOrCreateInvestor } from "@/lib/investor";
import {
  createAccessToken,
  createApplicant,
  getApplicantByExternalId,
  sumsubIsTest,
  sumsubLevelName,
} from "@/lib/sumsub";

export const runtime = "nodejs";

/**
 * Opens (or resumes) a Sumsub KYC session for the authenticated investor
 * and returns a WebSDK access token the client embeds.
 *
 * Investor.id is used as Sumsub's externalUserId so we can look the row up
 * from webhook callbacks without carrying the applicantId back and forth.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const investor = await getOrCreateInvestor({
    id: session.user.id!,
    email: session.user.email,
    name: session.user.name,
  });

  const externalUserId = investor.id;

  let applicant =
    (await getApplicantByExternalId(externalUserId)) ??
    (await createApplicant(externalUserId, investor.email));

  // Record the applicantId + provider on the Investor row the first time.
  if (investor.kycSessionId !== applicant.id || investor.kycProvider !== "sumsub") {
    await prisma.investor.update({
      where: { id: investor.id },
      data: {
        kycProvider: "sumsub",
        kycSessionId: applicant.id,
      },
    });
  }

  const accessToken = await createAccessToken(externalUserId);

  return NextResponse.json({
    accessToken,
    applicantId: applicant.id,
    levelName: sumsubLevelName,
    test: sumsubIsTest,
  });
}
