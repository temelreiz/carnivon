import { NextResponse } from "next/server";
import { mockDocuments } from "@/lib/mock-data";

export const runtime = "edge";

export async function GET() {
  // Public metadata only. Signed URLs are only returned to authenticated
  // investors via the vault API.
  return NextResponse.json(mockDocuments);
}
