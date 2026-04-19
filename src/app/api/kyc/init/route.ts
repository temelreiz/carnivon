import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email(),
  entity_type: z.enum(["individual", "entity"]).default("individual"),
});

/**
 * Initiates a KYC session with the upstream provider (Sumsub / Onfido).
 * Currently a stub — returns a synthetic session token that the vault
 * can use in place of a real provider until the integration is wired.
 */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // TODO: call KYC provider API with KYC_PROVIDER_API_KEY
  const sessionId = `stub_${crypto.randomUUID()}`;

  return NextResponse.json({
    session_id: sessionId,
    provider: "stub",
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
    // In real integration this would be a provider-hosted URL
    hosted_url: `https://vault.carnivon.io/kyc/session/${sessionId}`,
  });
}
