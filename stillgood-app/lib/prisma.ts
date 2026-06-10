import { PrismaClient } from "@prisma/client";

declare global {
  var __stillgood_prisma__: PrismaClient | undefined;
}

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = process.env.DATABASE_URL
  ? globalThis.__stillgood_prisma__ ?? createClient()
  : null;

if (process.env.NODE_ENV !== "production" && prisma) {
  globalThis.__stillgood_prisma__ = prisma;
}
