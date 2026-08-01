import { randomBytes } from "crypto";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function generateShortCode(length = 7) {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = randomBytes(length);
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += alphabet[bytes[index] % alphabet.length];
  }
  return result;
}

export async function getShortLinkForCheckIn(input: { checkInId: string; token: string }) {
  const baseUrl = normalizeBaseUrl(env.SHORT_LINK_BASE_URL ?? env.APP_URL);

  if (!prisma) {
    return `${baseUrl}/checkin/${input.token}`;
  }

  const existing = await prisma.shortLink.findFirst({
    where: { checkInId: input.checkInId },
    select: { code: true },
  });

  if (existing?.code) {
    return `${baseUrl}/s/${existing.code}`;
  }

  const targetPath = `/checkin/${input.token}`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateShortCode(7);
    try {
      const created = await prisma.shortLink.create({
        data: {
          code,
          targetPath,
          kind: "checkin",
          checkInId: input.checkInId,
        },
        select: { code: true },
      });

      return `${baseUrl}/s/${created.code}`;
    } catch (error) {
      const maybePrismaError = error as { code?: string };
      if (maybePrismaError.code !== "P2002") {
        break;
      }
    }
  }

  return `${baseUrl}${targetPath}`;
}

