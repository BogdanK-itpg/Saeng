import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = request.headers.get("x-forwarded-host")?.includes("localhost");
      const redirect = forwardedHost
        ? `https://${forwardedHost}${next}`
        : `${origin}${next}`;
      if (isLocal) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      return NextResponse.redirect(redirect);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}