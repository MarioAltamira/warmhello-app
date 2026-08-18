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

function buildCsp(nonce: string | null) {
  const nonceSrc = nonce ? ` 'nonce-${nonce}'` : "";
  return (
    "default-src 'self'; " +
    `script-src 'self'${nonceSrc} 'unsafe-inline' https://js.stripe.com; ` +
    `style-src 'self' 'unsafe-inline' fonts.googleapis.com; ` +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data: fonts.gstatic.com fonts.googleapis.com; " +
    "connect-src 'self' https://qstash.upstash.io https://api.stripe.com https://api.telnyx.com; " +
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com; " +
    `frame-ancestors ${ALLOWED_IFRAME_ANCESTORS}; ` +
    "object-src 'none'; " +
    "base-uri 'none'; " +
    "form-action 'self';"
  );
}

export function middleware(request: NextRequest) {
  const { method, nextUrl, headers } = request;
  const nonce =
    NONCE_GENERATABLE_METHODS.has(method) &&
    !nextUrl.pathname.startsWith("/api/") &&
    !nextUrl.pathname.startsWith("/_next/")
      ? crypto.randomUUID().replace(/-/g, "")
      : null;

  const response = NextResponse.next({
    request: nonce
      ? {
          headers: new Headers(headers),
        }
      : undefined,
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
