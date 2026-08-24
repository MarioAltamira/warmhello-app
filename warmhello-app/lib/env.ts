import { z } from "zod";

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
  TELNYX_API_KEY: stripEnvWrapping(process.env.TELNYX_API_KEY) as string | undefined,
  TELNYX_FROM_NUMBER: stripEnvWrapping(process.env.TELNYX_FROM_NUMBER) as string | undefined,
  TELNYX_WEBHOOK_SECRET: stripEnvWrapping(process.env.TELNYX_WEBHOOK_SECRET) as string | undefined,
  SHORT_LINK_BASE_URL: stripEnvWrapping(process.env.SHORT_LINK_BASE_URL) as string | undefined,
  EMAIL_FROM_ADDRESS: stripEnvWrapping(process.env.EMAIL_FROM_ADDRESS) as string | undefined,
  SMTP_HOST: stripEnvWrapping(process.env.SMTP_HOST) as string | undefined,
  SMTP_PORT: stripEnvWrapping(process.env.SMTP_PORT) as string | undefined,
  SMTP_USERNAME: stripEnvWrapping(process.env.SMTP_USERNAME) as string | undefined,
  SMTP_PASSWORD: stripEnvWrapping(process.env.SMTP_PASSWORD) as string | undefined,
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
  JOB_SIGNING_SECRET: z.string().min(16).default("local-dev-job-secret"),
  STRIPE_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_WEBHOOK_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_PRICE_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  TELNYX_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  TELNYX_FROM_NUMBER: z.preprocess(emptyToUndefined, z.string().optional()),
  TELNYX_WEBHOOK_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  SHORT_LINK_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  EMAIL_FROM_ADDRESS: z.string().email().default("sales@warm-hello.com"),
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  SMTP_USERNAME: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PASSWORD: z.preprocess(emptyToUndefined, z.string().optional()),
  QSTASH_URL: z.string().url().default("https://qstash.upstash.io"),
  QSTASH_TOKEN: z.preprocess(emptyToUndefined, z.string().optional()),
});

export const env = envSchema.parse(raw);

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
