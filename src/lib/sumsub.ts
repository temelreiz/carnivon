/**
 * Sumsub KYC client — HMAC-signed requests to the Sumsub API, plus the
 * WebSDK access-token flow we use in /vault/kyc.
 *
 * Falls back to a local TEST mode (synthetic token + no network calls) when
 * SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY aren't set, so dev builds without the
 * creds don't 500.
 */

import crypto from "node:crypto";
import type { KycStatus } from "@prisma/client";

const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN ?? "";
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY ?? "";
const SUMSUB_WEBHOOK_SECRET =
  process.env.SUMSUB_WEBHOOK_SECRET || SUMSUB_SECRET_KEY;
const SUMSUB_BASE_URL =
  process.env.SUMSUB_BASE_URL || "https://api.sumsub.com";
const SUMSUB_LEVEL_NAME =
  process.env.SUMSUB_LEVEL_NAME || "id-and-liveness";

const IS_TEST = !SUMSUB_APP_TOKEN || !SUMSUB_SECRET_KEY;

function sign(ts: number, method: string, path: string, body: string): string {
  return crypto
    .createHmac("sha256", SUMSUB_SECRET_KEY)
    .update(ts + method.toUpperCase() + path + body)
    .digest("hex");
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const ts = Math.floor(Date.now() / 1000);
  const bodyStr = body ? JSON.stringify(body) : "";
  const res = await fetch(SUMSUB_BASE_URL + path, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-App-Token": SUMSUB_APP_TOKEN,
      "X-App-Access-Ts": ts.toString(),
      "X-App-Access-Sig": sign(ts, method, path, bodyStr),
    },
    body: body ? bodyStr : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sumsub ${res.status}: ${text}`);
  }
  return res.json();
}

export type SumsubApplicant = {
  id: string;
  externalUserId: string;
  createdAt?: string;
  review?: { reviewStatus?: string; reviewResult?: { reviewAnswer?: string } };
};

/** Create a new Sumsub applicant for this investor. */
export async function createApplicant(
  externalUserId: string,
  email?: string | null
): Promise<SumsubApplicant> {
  if (IS_TEST) {
    return {
      id: `test_${externalUserId}`,
      externalUserId,
      createdAt: new Date().toISOString(),
    };
  }
  return request<SumsubApplicant>(
    "POST",
    `/resources/applicants?levelName=${encodeURIComponent(SUMSUB_LEVEL_NAME)}`,
    { externalUserId, email: email || undefined }
  );
}

export async function getApplicantByExternalId(
  externalUserId: string
): Promise<SumsubApplicant | null> {
  if (IS_TEST) return null;
  try {
    return await request<SumsubApplicant>(
      "GET",
      `/resources/applicants/-;externalUserId=${encodeURIComponent(externalUserId)}/one`
    );
  } catch {
    return null;
  }
}

export async function getApplicantStatus(applicantId: string): Promise<{
  reviewStatus?: string;
  reviewResult?: { reviewAnswer?: string };
}> {
  if (IS_TEST) return { reviewStatus: "pending" };
  return request("GET", `/resources/applicants/${applicantId}/status`);
}

/** WebSDK access token — short-lived JWT passed to the frontend SDK. */
export async function createAccessToken(externalUserId: string): Promise<string> {
  if (IS_TEST) return `test_token_${externalUserId}_${Date.now()}`;
  const res = await request<{ token: string }>(
    "POST",
    `/resources/accessTokens?userId=${encodeURIComponent(externalUserId)}&levelName=${encodeURIComponent(SUMSUB_LEVEL_NAME)}`
  );
  return res.token;
}

/** Verify Sumsub webhook body against the X-Payload-Digest header. */
export function verifyWebhookSignature(
  body: string,
  receivedSig: string
): boolean {
  const expected = crypto
    .createHmac("sha256", SUMSUB_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  // Timing-safe compare — pad to same length to avoid .equal throwing.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(receivedSig, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Map a Sumsub review outcome to our Prisma KycStatus enum. */
export function mapReviewToKyc(
  reviewStatus?: string,
  reviewResult?: { reviewAnswer?: string }
): KycStatus {
  if (reviewStatus === "completed") {
    if (reviewResult?.reviewAnswer === "GREEN") return "APPROVED";
    if (reviewResult?.reviewAnswer === "RED") return "REJECTED";
  }
  // init, pending, queued, onHold — treat all as still pending our side.
  return "PENDING";
}

export const sumsubLevelName = SUMSUB_LEVEL_NAME;
export const sumsubIsTest = IS_TEST;
