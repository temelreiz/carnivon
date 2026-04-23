import { NextResponse } from "next/server";
import { mockProduct } from "@/lib/mock-data";
import { prisma } from "@/lib/db";
import { getCurrentHeadPrice } from "@/lib/product-pricing";

// nodejs runtime (Prisma) — edge cache headers still applied at the CDN layer.
export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  const pricing = await getCurrentHeadPrice().catch(() => null);
  const minTicket = pricing?.display ?? mockProduct.min_ticket;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ...mockProduct, min_ticket: minTicket, pricing },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  }

  try {
    // Active = FUNDING | ACTIVE (Open to new capital or deployed)
    const cycle = await prisma.cycle.findFirst({
      where: { status: { in: ["FUNDING", "ACTIVE"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!cycle) {
      return NextResponse.json(
        { ...mockProduct, min_ticket: minTicket, pricing },
        { headers: { "Cache-Control": "public, s-maxage=60" } }
      );
    }

    return NextResponse.json(
      {
        name: cycle.name,
        symbol: cycle.symbol,
        duration_days: cycle.durationDays,
        target_return: cycle.targetReturn,
        status:
          cycle.status === "FUNDING"
            ? "Open"
            : cycle.status === "ACTIVE"
              ? "Active"
              : cycle.status,
        aum: `$${(Number(cycle.aumCents) / 100).toLocaleString("en-US")}`,
        deployed: `${cycle.deployedPct}%`,
        min_ticket: minTicket,
        start_date: cycle.startDate?.toISOString().slice(0, 10) ?? "",
        maturity_date: cycle.maturityDate?.toISOString().slice(0, 10) ?? "",
        pricing,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    console.error("[product/current]", err);
    return NextResponse.json({ ...mockProduct, min_ticket: minTicket, pricing });
  }
}
