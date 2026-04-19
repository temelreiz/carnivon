import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  entity: z.string().max(200).optional().or(z.literal("")),
  ticket: z.string().min(1).max(50),
  jurisdiction: z.string().min(1).max(100),
  notes: z.string().max(2000).optional().or(z.literal("")),
  qualified: z.union([z.literal("on"), z.literal(true), z.literal("true")]),
});

// Naive in-memory rate limit. Replace with Upstash / KV in production.
const HITS = new Map<string, { n: number; t: number }>();
function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const h = HITS.get(key);
  if (!h || now - h.t > windowMs) {
    HITS.set(key, { n: 1, t: now });
    return true;
  }
  if (h.n >= limit) return false;
  h.n += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // TODO: persist to DB (AccessRequest table) + notify investors@carnivon.io
  // For now, log structured event.
  console.log("[access-request]", {
    name: data.name,
    email: data.email,
    entity: data.entity || null,
    ticket: data.ticket,
    jurisdiction: data.jurisdiction,
    notes: data.notes || null,
    ip,
    ts: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
