import { ProviderError } from "../types";

const ITUNES_API = "https://itunes.apple.com/search";

/**
 * Raw result shape returned by the iTunes Search API for `media=music`.
 * Only the fields the mapper needs are declared.
 */
export interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
  trackTimeMillis?: number;
}

interface ItunesSearchResponse {
  resultCount: number;
  results: ItunesTrack[];
}

/** Search the iTunes store for music tracks matching `term`. */
export async function searchItunes(
  term: string,
  { limit = 10 }: { limit?: number } = {},
): Promise<ItunesTrack[]> {
  const url = new URL(ITUNES_API);
  url.searchParams.set("term", term);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new ProviderError(
      `iTunes search failed with status ${response.status}`,
      response.status,
    );
  }

  let json: ItunesSearchResponse;
  try {
    json = (await response.json()) as ItunesSearchResponse;
  } catch {
    throw new ProviderError("iTunes returned an invalid response.");
  }

  return json.results ?? [];
}