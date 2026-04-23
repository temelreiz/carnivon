import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { mapReviewToKyc, verifyWebhookSignature } from "@/lib/sumsub";

export const runtime = "nodejs";

type SumsubWebhookPayload = {
  type?: string;
  externalUserId?: string;
  applicantId?: string;
  reviewStatus?: string;
  reviewResult?: {
    reviewAnswer?: string;
    rejectLabels?: string[];
    reviewRejectType?: string;
  };
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-payload-digest") || "";

  if (process.env.NODE_ENV === "production") {
    if (!signature || !verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: SumsubWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { type, externalUserId, applicantId, reviewStatus, reviewResult } = payload;
  if (!externalUserId) {
    return NextResponse.json(
      { error: "Missing externalUserId" },
      { status: 400 }
    );
  }

  const investor = await prisma.investor.findUnique({
    where: { id: externalUserId },
  });
  if (!investor) {
    // Unknown investor — acknowledge so Sumsub doesn't retry forever.
    console.warn("[kyc/webhook] investor not found", externalUserId, type);
    return NextResponse.json({ ok: true });
  }

  switch (type) {
    case "applicantCreated":
      await prisma.investor.update({
        where: { id: investor.id },
        data: {
          kycProvider: "sumsub",
          kycSessionId: applicantId ?? investor.kycSessionId,
        },
      });
      break;

    case "applicantPending":
    case "applicantOnHold":
      await prisma.investor.update({
        where: { id: investor.id },
        data: { kycStatus: "PENDING" },
      });
      break;

    case "applicantReviewed": {
      const nextStatus = mapReviewToKyc(reviewStatus, reviewResult);
      await prisma.investor.update({
        where: { id: investor.id },
        data: {
          kycStatus: nextStatus,
          kycSessionId: applicantId ?? investor.kycSessionId,
        },
      });
      break;
    }

    default:
      console.log("[kyc/webhook] unhandled type", type);
  }

  revalidatePath("/vault");
  revalidatePath("/vault/kyc");

  return NextResponse.json({ ok: true });
}

// Sumsub sometimes probes the endpoint with GET during setup.
export async function GET() {
  return NextResponse.json({ ok: true, service: "carnivon-kyc-webhook" });
}
