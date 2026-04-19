import { NextResponse } from "next/server";
import { mockProduct } from "@/lib/mock-data";

export const runtime = "edge";
export const revalidate = 60;

export async function GET() {
  // TODO: replace with Prisma query for active cycle
  return NextResponse.json(mockProduct, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
