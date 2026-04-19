import { NextResponse } from "next/server";
import { mockMetrics } from "@/lib/mock-data";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(mockMetrics, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  try {
    const snap = await prisma.metricsSnapshot.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (!snap) {
      return NextResponse.json(mockMetrics, {
        headers: { "Cache-Control": "public, s-maxage=300" },
      });
    }
    return NextResponse.json(
      {
        total_headcount: snap.totalHeadcount,
        avg_entry_weight: `${snap.avgEntryWeightKg}kg`,
        mortality_rate: `${(snap.mortalityPctBp / 100).toFixed(1)}%`,
        days_in_cycle: snap.daysInCycle,
        deployment_ratio: `${snap.deploymentPctBp / 100}%`,
        expected_exit: snap.expectedExit,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("[metrics/live]", err);
    return NextResponse.json(mockMetrics);
  }
}
