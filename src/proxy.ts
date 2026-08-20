import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/friends",
  "/send",
  "/shouts",
  "/notifications",
  "/profile",
  "/settings",
];

// "/forgot-password" removed — email-driven reset is disabled (2026-08-20).
const AUTH_PAGES = ["/login", "/register"];

/**
 * Proxy (Next 16 middleware): refreshes the Supabase session and guards
 * protected routes. Authorization beyond "is signed in" is enforced in
 * Server Components and RLS.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const onAuthPage = AUTH_PAGES.includes(pathname);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && onAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};