import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-jwt";
import {
  createAccessToken,
  createApplicant,
  getApplicantByExternalId,
  sumsubIsTest,
  sumsubLevelName,
} from "@/lib/sumsub";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { investor } = session;
  const externalUserId = investor.id;

  const applicant =
    (await getApplicantByExternalId(externalUserId)) ??
    (await createApplicant(externalUserId, investor.email));

  if (
    investor.kycSessionId !== applicant.id ||
    investor.kycProvider !== "sumsub"
  ) {
    await prisma.investor.update({
      where: { id: investor.id },
      data: { kycProvider: "sumsub", kycSessionId: applicant.id },
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
