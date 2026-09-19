import type { z, ZodSchema } from "zod";
import { NextResponse } from "next/server";

export async function parseJsonBody<T extends ZodSchema>(
  request: Request,
  schema: T,
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: NextResponse<{ ok: false; message: string; issues?: unknown }> }
> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: "Invalid JSON payload." },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const message = firstIssue
      ? firstIssue.message || "Invalid request payload."
      : "Invalid request payload.";
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message, issues: parsed.error.issues },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data as z.infer<T> };
}

export function parseSearchParams<T extends ZodSchema>(
  urlOrRequest: URL | Request,
  schema: T,
):
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: NextResponse<{ ok: false; message: string; issues?: unknown }> } {
  const url =
    urlOrRequest instanceof Request ? new URL(urlOrRequest.url) : urlOrRequest;
  const raw: Record<string, unknown> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      const existing = raw[key];
      if (Array.isArray(existing)) existing.push(value);
      else raw[key] = [existing, value];
    } else {
      raw[key] = value;
    }
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const message = firstIssue
      ? firstIssue.message || "Invalid query parameters."
      : "Invalid query parameters.";
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message, issues: parsed.error.issues },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data as z.infer<T> };
}
