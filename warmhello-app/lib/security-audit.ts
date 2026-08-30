import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { SecurityAuditKind, Prisma } from "@prisma/client";

const SIGNING_SECRET = env.JOB_SIGNING_SECRET;
const MAGIC_TOKEN_VERSION = "m1";
const HMAC_ALG = "sha256";

const FORWARDED_FOR = "x-forwarded-for";
const REAL_IP = "x-real-ip";

export function extractIpFromRequest(request: Request): string | null {
  const headersList = new Headers(request.headers);
  const ff = headersList.get(FORWARDED_FOR);
  if (ff) {
    const first = ff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headersList.get(REAL_IP);
  if (realIp) return realIp.trim();
  return null;
}

export function extractUserAgentFromRequest(request: Request): string | null {
  const ua = request.headers.get("user-agent");
  return ua ? ua.slice(0, 512) : null;
}

export interface SecurityAuditInput {
  kind: SecurityAuditKind;
  subscriberId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  tokenJti?: string | null;
  tokenExpiresAt?: Date | null;
  magicLinkNonce?: string | null;
  redirectTarget?: string | null;
  detail?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | null;
}

export async function recordSecurityAudit(input: SecurityAuditInput) {
  if (!prisma) return null;
  try {
    let detailValue: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined = undefined;
    if (input.detail !== undefined && input.detail !== null) {
      if (typeof input.detail === "object" && input.detail !== null && !Array.isArray(input.detail)) {
        detailValue = Object.keys(input.detail as Record<string, unknown>).length > 0 ? (input.detail as Prisma.InputJsonValue) : undefined;
      } else {
        detailValue = input.detail as Prisma.InputJsonValue;
      }
    }
    return await prisma.securityAudit.create({
      data: {
        kind: input.kind,
        subscriberId: input.subscriberId ?? undefined,
        email: input.email ?? undefined,
        ipAddress: input.ipAddress ?? undefined,
        userAgent: input.userAgent ?? undefined,
        tokenJti: input.tokenJti ?? undefined,
        tokenExpiresAt: input.tokenExpiresAt ?? undefined,
        magicLinkNonce: input.magicLinkNonce ?? undefined,
        redirectTarget: input.redirectTarget ?? undefined,
        detail: detailValue,
      },
      select: { id: true },
    });
  } catch (err) {
    console.error("[security-audit] recordSecurityAudit failed:", err);
    return null;
  }
}

export function createJti(): string {
  return randomBytes(16).toString("base64url");
}

export function createNonce(): string {
  return randomBytes(20).toString("base64url");
}

export interface MagicLinkTokenPayload {
  subscriberId: string;
  jti: string;
  nonce: string | null;
  exp: number;
}

function magicEncodePayload(p: MagicLinkTokenPayload): string {
  const parts = [
    encodeURIComponent(p.subscriberId),
    encodeURIComponent(p.jti),
    p.nonce ? encodeURIComponent(p.nonce) : "",
    String(Math.floor(p.exp)),
  ];
  return parts.join("~");
}

function magicDecodePayload(raw: string): MagicLinkTokenPayload | null {
  const parts = raw.split("~");
  if (parts.length !== 4) return null;
  const [subscriberIdEnc, jtiEnc, nonceEnc, expStr] = parts as [string, string, string, string];
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp)) return null;
  try {
    return {
      subscriberId: decodeURIComponent(subscriberIdEnc),
      jti: decodeURIComponent(jtiEnc),
      nonce: nonceEnc ? decodeURIComponent(nonceEnc) : null,
      exp,
    };
  } catch {
    return null;
  }
}

export function signMagicLinkToken(payload: MagicLinkTokenPayload): string {
  const encoded = magicEncodePayload(payload);
  const mac = createHmac(HMAC_ALG, SIGNING_SECRET)
    .update(`${MAGIC_TOKEN_VERSION}:${encoded}`)
    .digest("base64url");
  return `${MAGIC_TOKEN_VERSION}.${encoded}.${mac}`;
}

export type MagicLinkVerifyResult =
  | { ok: true; payload: MagicLinkTokenPayload }
  | { ok: false; reason: SecurityAuditKind };

export function verifyMagicLinkToken(signed: string | null | undefined): MagicLinkVerifyResult {
  if (!signed) return { ok: false, reason: "MAGIC_LINK_INVALID_TOKEN" };
  const parts = signed.split(".");
  if (parts.length !== 3) return { ok: false, reason: "MAGIC_LINK_INVALID_TOKEN" };
  const [version, encoded, mac] = parts as [string, string, string];
  if (version !== MAGIC_TOKEN_VERSION) return { ok: false, reason: "MAGIC_LINK_INVALID_TOKEN" };

  const expected = createHmac(HMAC_ALG, SIGNING_SECRET)
    .update(`${version}:${encoded}`)
    .digest("base64url");

  try {
    const a = Buffer.from(mac, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: "MAGIC_LINK_INVALID_TOKEN" };
    }
  } catch {
    return { ok: false, reason: "MAGIC_LINK_INVALID_TOKEN" };
  }

  const payload = magicDecodePayload(encoded);
  if (!payload) return { ok: false, reason: "MAGIC_LINK_INVALID_TOKEN" };
  if (Math.floor(Date.now() / 1000) > payload.exp) {
    return { ok: false, reason: "MAGIC_LINK_EXPIRED" };
  }
  return { ok: true, payload };
}
