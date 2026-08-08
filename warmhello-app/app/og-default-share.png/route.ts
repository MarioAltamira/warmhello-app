import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/opengraph-image";
  return NextResponse.redirect(url, 301);
}
