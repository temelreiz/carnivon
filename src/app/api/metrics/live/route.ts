import { NextResponse } from "next/server";
import { mockMetrics } from "@/lib/mock-data";

export const runtime = "edge";
export const revalidate = 300;

export async function GET() {
  // TODO: aggregate from operator weekly reports
  return NextResponse.json(mockMetrics, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
