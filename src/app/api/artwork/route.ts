import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Only cover-art metadata is proxied (never audio). Restrict to the provider
// CDN hosts the app can produce artwork URLs from, so this isn't an open proxy.
const ALLOWED_HOST_SUFFIXES = [".mzstatic.com", "itunes.apple.com"];

/**
 * Proxies album-artwork image bytes so the browser can draw them to a canvas
 * for color sampling (the provider CDN sends no CORS headers). Same-origin
 * requests need no CORS header. Authenticated to prevent abuse.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const limit = rateLimit(`artwork:${clientIp(request)}`);
  if (!limit.ok) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfter) },
    });
  }

  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return new NextResponse("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (parsed.protocol !== "https:") {
    return new NextResponse("Unsupported protocol", { status: 400 });
  }
  const host = parsed.hostname;
  const allowed = ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
  );
  if (!allowed) {
    return new NextResponse("Host not allowed", { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(parsed, { cache: "no-store" });
  } catch {
    return new NextResponse("Upstream fetch failed", { status: 502 });
  }
  if (!res.ok) {
    return new NextResponse("Upstream error", { status: 502 });
  }

  const bytes = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}