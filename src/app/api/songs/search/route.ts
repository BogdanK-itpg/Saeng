import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { ProviderError } from "@/lib/music/types";
import { getProvider } from "@/lib/music/registry";

const MAX_QUERY_LENGTH = 100;

/** Provider-backed song search. Runs on the server so provider implementations
 *  (and any future credentials) never reach the browser. Authenticated. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const providerId = request.nextUrl.searchParams.get("provider") ?? "itunes";

  if (!query) {
    return NextResponse.json({ error: "Missing query." }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Query too long." }, { status: 400 });
  }

  let provider;
  try {
    provider = getProvider(providerId);
  } catch {
    return NextResponse.json(
      { error: `Unknown provider "${providerId}".` },
      { status: 400 },
    );
  }

  try {
    const results = await provider.searchSongs(query);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof ProviderError) {
      return NextResponse.json(
        { error: err.message || "Music provider error." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}