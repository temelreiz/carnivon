import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendAccessRequestNotification } from "@/lib/email";

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
  const userAgent = req.headers.get("user-agent") || null;

  // Persist — fall back to structured log if DB is unavailable so dev/demo
  // deployments without DATABASE_URL don't 500.
  try {
    if (process.env.DATABASE_URL) {
      await prisma.accessRequest.create({
        data: {
          name: data.name,
          email: data.email,
          entity: data.entity || null,
          ticket: data.ticket,
          jurisdiction: data.jurisdiction,
          notes: data.notes || null,
          ip,
          userAgent,
        },
      });
    } else {
      console.log("[access-request:no-db]", {
        name: data.name,
        email: data.email,
        ticket: data.ticket,
        jurisdiction: data.jurisdiction,
        ip,
        ts: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("[access-request:db-error]", err);
    // Don't leak DB errors — still return success to the visitor.
  }

  try {
    await sendAccessRequestNotification({
      name: data.name,
      email: data.email,
      entity: data.entity || null,
      ticket: data.ticket,
      jurisdiction: data.jurisdiction,
      notes: data.notes || null,
      ip,
      userAgent,
    });
  } catch (err) {
    console.error("[access-request:email-error]", err);
  }

  return NextResponse.json({ ok: true });
}
