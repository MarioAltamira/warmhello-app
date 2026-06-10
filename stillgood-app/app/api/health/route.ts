import { NextResponse } from "next/server";
import { getIntegrationStatus } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    integrations: getIntegrationStatus(),
    timestamp: new Date().toISOString(),
  });
}
