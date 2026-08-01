import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;

  const baseUrl = env.APP_URL.endsWith("/") ? env.APP_URL.slice(0, -1) : env.APP_URL;

  if (!prisma) {
    return NextResponse.redirect(`${baseUrl}/`);
  }

  const shortLink = await prisma.shortLink.findUnique({
    where: { code },
    select: { targetPath: true },
  });

  if (!shortLink?.targetPath) {
    return NextResponse.redirect(`${baseUrl}/`);
  }

  const targetUrl = new URL(shortLink.targetPath, baseUrl);
  return NextResponse.redirect(targetUrl.toString());
}

