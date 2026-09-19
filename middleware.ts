import { NextResponse, type NextRequest } from "next/server";

const NONCE_GENERATABLE_METHODS = new Set(["GET", "HEAD"]);
const ALLOWED_IFRAME_ANCESTORS = "'none'";
const STRICT_TRANSPORT_SECURITY =
  "max-age=63072000; includeSubDomains; preload";
const REFERRER_POLICY = "strict-origin-when-cross-origin";
const PERMISSIONS_POLICY =
  "camera=(), microphone=(), geolocation=(), payment=(), accelerometer=(), gyroscope=(), magnetometer=()";
const CROSS_ORIGIN_OPENER_POLICY = "same-origin";
const CROSS_ORIGIN_EMBEDDER_POLICY = "require-corp";
const CROSS_ORIGIN_RESOURCE_POLICY = "same-origin";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const EXTERNAL_POST_WHITELIST_PREFIXES = [
  "/api/webhooks/",
  "/api/jobs/",
  "/api/auth/magic",
];

function buildCsp(nonce: string | null) {
  const nonceSrc = nonce ? ` 'nonce-${nonce}'` : "";
  // 'unsafe-inline' has been removed from script-src: a codebase-wide search
  // found no remaining inline executable <script> tags (the only <script>
  // elements left are JSON-LD `type="application/ld+json"` data blocks,
  // which are inert and not governed by script-src). The per-request nonce
  // is kept for defense-in-depth in case an inline script is reintroduced.
  // NOTE: 'unsafe-inline' is also kept on style-src because the app makes
  // extensive use of inline `style={{...}}` JSX props (300+ occurrences
  // across dozens of components/pages), which CSP treats the same as
  // inline `style` attributes governed by style-src. Removing it would break
  // the UI broadly.
  // 'unsafe-eval' is allowed only in development: Next.js dev mode (webpack)
  // wraps modules with eval() for Fast Refresh/source maps, which a strict
  // CSP blocks and silently breaks client-side hydration (e.g. onClick-only
  // buttons like the Return pill). Production builds don't use eval, so
  // 'unsafe-eval' is never sent in production.
  const devEval = process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : "";
  return (
    "default-src 'self'; " +
    `script-src 'self'${nonceSrc}${devEval} https://js.stripe.com; ` +
    `style-src 'self' 'unsafe-inline' fonts.googleapis.com; ` +
    // Scoped from a bare "https:" to 'self' data: blob: — a codebase-wide
    // search found no external image domains actually referenced by any
    // <img>/<Image> element or CSS (all images are self-hosted static
    // assets or app-generated OG/twitter image routes; Stripe Checkout
    // images render inside Stripe's own iframe/domain, governed by frame-src
    // and Stripe's own CSP, not our img-src).
    "img-src 'self' data: blob:; " +
    "font-src 'self' data: fonts.gstatic.com fonts.googleapis.com; " +
    "connect-src 'self' https://qstash.upstash.io https://api.stripe.com https://api.telnyx.com; " +
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com; " +
    `frame-ancestors ${ALLOWED_IFRAME_ANCESTORS}; ` +
    "object-src 'none'; " +
    "base-uri 'none'; " +
    "form-action 'self';"
  );
}

function hostMatches(a: string, b: string): boolean {
  if (a === b) return true;
  if (a === "www." + b) return true;
  if (b === "www." + a) return true;
  const aParts = a.split(".");
  const bParts = b.split(".");
  if (
    aParts.length >= 2 &&
    bParts.length >= 2 &&
    aParts.slice(-2).join(".") === bParts.slice(-2).join(".")
  ) {
    return true;
  }
  return false;
}

function isTrustedOrigin(originHeader: string | null, appPublicUrl: string | undefined): boolean {
  if (!originHeader) return false;
  try {
    const u = new URL(originHeader);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    if (!appPublicUrl) {
      return u.hostname === "localhost" || u.hostname === "127.0.0.1";
    }
    const app = new URL(appPublicUrl);
    const protocolOk = u.protocol === app.protocol;
    const hostOk = hostMatches(u.hostname, app.hostname);
    const portOk =
      u.port === app.port ||
      (u.port === "" && ((app.protocol === "https:" && app.port === "") || app.port === "443")) ||
      (u.port === "" && ((app.protocol === "http:" && app.port === "") || app.port === "80")) ||
      (app.port === "" && ((u.protocol === "https:" && u.port === "") || u.port === "443")) ||
      (app.port === "" && ((u.protocol === "http:" && u.port === "") || u.port === "80"));
    return protocolOk && hostOk && portOk;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { method, nextUrl, headers } = request;

  if (STATE_CHANGING_METHODS.has(method)) {
    const pathname = nextUrl.pathname;
    const isExternalWebhookOrJob = EXTERNAL_POST_WHITELIST_PREFIXES.some(
      (p) => pathname.startsWith(p)
    );
    if (!isExternalWebhookOrJob) {
      const origin = headers.get("origin");
      const referer = headers.get("referer");
      const appPublicUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
      const originOk = isTrustedOrigin(origin, appPublicUrl);
      const refererOk =
        referer === null ? false : isTrustedOrigin(referer, appPublicUrl);
      if (!originOk && !refererOk) {
        return NextResponse.json(
          { ok: false, error: "Cross-origin request blocked." },
          { status: 403 }
        );
      }
    }
  }

  const nonce =
    NONCE_GENERATABLE_METHODS.has(method) &&
    !nextUrl.pathname.startsWith("/api/") &&
    !nextUrl.pathname.startsWith("/_next/")
      ? crypto.randomUUID().replace(/-/g, "")
      : null;

  const requestHeaders = new Headers(headers);
  if (nonce) {
    requestHeaders.set("x-nonce", nonce);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (nextUrl.protocol === "https:" || process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", STRICT_TRANSPORT_SECURITY);
  }

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", REFERRER_POLICY);
  response.headers.set("Permissions-Policy", PERMISSIONS_POLICY);
  response.headers.set("Cross-Origin-Opener-Policy", CROSS_ORIGIN_OPENER_POLICY);
  response.headers.set("Cross-Origin-Embedder-Policy", CROSS_ORIGIN_EMBEDDER_POLICY);
  response.headers.set("Cross-Origin-Resource-Policy", CROSS_ORIGIN_RESOURCE_POLICY);
  response.headers.set("Content-Security-Policy", buildCsp(nonce));

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.gif$|.*\\.ico$|.*\\.webp$).*)",
  ],
};
