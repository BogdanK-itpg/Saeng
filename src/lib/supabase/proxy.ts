import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getPublicSupabaseKey, getSupabaseUrl } from "./env";

/**
 * Refreshes the Supabase session (if close to expiring, a no-op otherwise)
 * and returns the refreshed response plus the authenticated user, if any.
 */
export async function updateSession(request: NextRequest) {
  const url = getSupabaseUrl();
  const anonKey = getPublicSupabaseKey();

  if (!url || !anonKey) {
    return { response: NextResponse.next({ request }), user: null };
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}