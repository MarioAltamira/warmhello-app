import { PrismaClient } from "@prisma/client";

declare global {
  var __warmhello_prisma__: PrismaClient | undefined;
}

function createClient() {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  let datasourceUrl = databaseUrl;

  // Supabase/pooled Postgres connections need PgBouncer-safe settings at runtime.
  if (databaseUrl && directUrl && directUrl !== databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);

      if (!parsed.searchParams.has("pgbouncer")) {
        parsed.searchParams.set("pgbouncer", "true");
      }

      if (!parsed.searchParams.has("connection_limit")) {
        parsed.searchParams.set("connection_limit", "1");
      }

      datasourceUrl = parsed.toString();
    } catch {
      datasourceUrl = databaseUrl;
    }
  }

  return new PrismaClient({
    datasources: datasourceUrl
      ? {
          db: {
            url: datasourceUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = process.env.DATABASE_URL
  ? globalThis.__warmhello_prisma__ ?? createClient()
  : null;

if (process.env.NODE_ENV !== "production" && prisma) {
  globalThis.__warmhello_prisma__ = prisma;
}
