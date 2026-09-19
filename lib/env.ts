import { z } from "zod";
import { createHmac } from "crypto";

function stripEnvWrapping(value: unknown): unknown {
  if (typeof value !== "string") return value;
  let v = value.replace(/^\uFEFF/, "").trim();
  for (let i = 0; i < 4; i += 1) {
    if (v.length >= 2) {
      const first = v[0];
      const last = v[v.length - 1];
      const wrappedByBackticks = first === "`" && last === "`";
      const wrappedByDoubleQuotes = first === '"' && last === '"';
      const wrappedBySingleQuotes = first === "'" && last === "'";
      if (wrappedByBackticks || wrappedByDoubleQuotes || wrappedBySingleQuotes) {
        v = v.slice(1, -1).trim();
        continue;
      }
    }
    break;
  }
  return v;
}

const raw = {
  NODE_ENV: stripEnvWrapping(process.env.NODE_ENV) as string | undefined,
  APP_URL: stripEnvWrapping(process.env.APP_URL) as string | undefined,
  NEXT_PUBLIC_APP_URL: stripEnvWrapping(process.env.NEXT_PUBLIC_APP_URL) as string | undefined,
  DATABASE_URL: stripEnvWrapping(process.env.DATABASE_URL) as string | undefined,
  DIRECT_URL: stripEnvWrapping(process.env.DIRECT_URL) as string | undefined,
  JOB_SIGNING_SECRET: stripEnvWrapping(process.env.JOB_SIGNING_SECRET) as string | undefined,
  STRIPE_SECRET_KEY: stripEnvWrapping(process.env.STRIPE_SECRET_KEY) as string | undefined,
  STRIPE_WEBHOOK_SECRET: stripEnvWrapping(process.env.STRIPE_WEBHOOK_SECRET) as string | undefined,
  STRIPE_PRICE_ID: stripEnvWrapping(process.env.STRIPE_PRICE_ID) as string | undefined,
  STRIPE_PRICE_ID_USD_MONTHLY: stripEnvWrapping(process.env.STRIPE_PRICE_ID_USD_MONTHLY) as string | undefined,
  STRIPE_PRICE_ID_USD_ANNUAL: stripEnvWrapping(process.env.STRIPE_PRICE_ID_USD_ANNUAL) as string | undefined,
  STRIPE_PRICE_ID_CAD_MONTHLY: stripEnvWrapping(process.env.STRIPE_PRICE_ID_CAD_MONTHLY) as string | undefined,
  STRIPE_PRICE_ID_CAD_ANNUAL: stripEnvWrapping(process.env.STRIPE_PRICE_ID_CAD_ANNUAL) as string | undefined,
  STRIPE_WINBACK_COUPON_ID: stripEnvWrapping(process.env.STRIPE_WINBACK_COUPON_ID) as string | undefined,
  TELNYX_API_KEY: stripEnvWrapping(process.env.TELNYX_API_KEY) as string | undefined,
  TELNYX_FROM_NUMBER: stripEnvWrapping(process.env.TELNYX_FROM_NUMBER) as string | undefined,
  TELNYX_WEBHOOK_SECRET: stripEnvWrapping(process.env.TELNYX_WEBHOOK_SECRET) as string | undefined,
  ALLOW_UNAUTHENTICATED_WEBHOOK_DEV: stripEnvWrapping(process.env.ALLOW_UNAUTHENTICATED_WEBHOOK_DEV) as string | undefined,
  SHORT_LINK_BASE_URL: stripEnvWrapping(process.env.SHORT_LINK_BASE_URL) as string | undefined,
  EMAIL_FROM_ADDRESS: stripEnvWrapping(process.env.EMAIL_FROM_ADDRESS) as string | undefined,
  SMTP_HOST: stripEnvWrapping(process.env.SMTP_HOST) as string | undefined,
  SMTP_PORT: stripEnvWrapping(process.env.SMTP_PORT) as string | undefined,
  SMTP_USERNAME: stripEnvWrapping(process.env.SMTP_USERNAME) as string | undefined,
  SMTP_PASSWORD: stripEnvWrapping(process.env.SMTP_PASSWORD) as string | undefined,
  SMTP_SECURE: stripEnvWrapping(process.env.SMTP_SECURE) as string | undefined,
  QSTASH_URL: stripEnvWrapping(process.env.QSTASH_URL) as string | undefined,
  QSTASH_TOKEN: stripEnvWrapping(process.env.QSTASH_TOKEN) as string | undefined,
};

const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:8080"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:8080"),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  DIRECT_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  JOB_SIGNING_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_WEBHOOK_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_PRICE_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_PRICE_ID_USD_MONTHLY: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_PRICE_ID_USD_ANNUAL: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_PRICE_ID_CAD_MONTHLY: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_PRICE_ID_CAD_ANNUAL: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_WINBACK_COUPON_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  TELNYX_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  TELNYX_FROM_NUMBER: z.preprocess(emptyToUndefined, z.string().optional()),
  TELNYX_WEBHOOK_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  ALLOW_UNAUTHENTICATED_WEBHOOK_DEV: z.preprocess(
    (value) => (typeof value === "string" ? value.toLowerCase() === "true" : false),
    z.boolean(),
  ).default(false),
  SHORT_LINK_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  EMAIL_FROM_ADDRESS: z.string().email().default("sales@warm-hello.com"),
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  SMTP_USERNAME: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PASSWORD: z.preprocess(emptyToUndefined, z.string().optional()),
  // Not currently read/used anywhere in the codebase; added to the schema
  // for forward-compatibility only (no new behavior wired up).
  SMTP_SECURE: z.preprocess(emptyToUndefined, z.string().optional()),
  QSTASH_URL: z.string().url().default("https://qstash.upstash.io"),
  QSTASH_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),
});

const envSchemaWithProductionChecks = envSchema.superRefine((data, ctx) => {
  if (data.NODE_ENV !== "production") return;

  if (!data.DATABASE_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["DATABASE_URL"],
      message: "DATABASE_URL is required when NODE_ENV=production.",
    });
  }

  const publicUrl = data.APP_URL || data.NEXT_PUBLIC_APP_URL;
  if (!publicUrl || !publicUrl.startsWith("https://")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["APP_URL"],
      message: "APP_URL (or NEXT_PUBLIC_APP_URL) must start with https:// when NODE_ENV=production.",
    });
  }
});

export const env = envSchemaWithProductionChecks.parse(raw);

export function deriveSigningKey(purpose: string): Buffer {
  return createHmac("sha256", env.JOB_SIGNING_SECRET).update(purpose).digest();
}

export function getIntegrationStatus() {
  return {
    database: Boolean(env.DATABASE_URL),
    stripe: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID),
    sms: Boolean(env.TELNYX_API_KEY && env.TELNYX_FROM_NUMBER),
    email: Boolean(
      env.EMAIL_FROM_ADDRESS &&
        env.SMTP_HOST &&
        env.SMTP_PORT &&
        env.SMTP_USERNAME &&
        env.SMTP_PASSWORD,
    ),
    qstash: Boolean(env.QSTASH_TOKEN),
  };
}
