import { PrismaClient } from "@prisma/client";

declare global {
  var __warmhello_prisma__: PrismaClient | undefined;
}

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = process.env.DATABASE_URL
  ? globalThis.__warmhello_prisma__ ?? createClient()
  : null;

if (process.env.NODE_ENV !== "production" && prisma) {
  globalThis.__warmhello_prisma__ = prisma;
}
