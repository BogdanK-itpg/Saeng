import type { MusicProvider, SongResult } from "../types";
import { ProviderError } from "../types";
import { searchItunes } from "./http";
import { mapItunesTracks } from "./mapper";

const TRACK_URL = "https://itunes.apple.com/lookup";

/**
 * Music provider backed by the public iTunes Search API. No credentials or
 * accounts required. Preview URLs are direct Apple-hosted audio streams.
 */
export class ItunesProvider implements MusicProvider {
  async searchSongs(query: string): Promise<SongResult[]> {
    const tracks = await searchItunes(query);
    return mapItunesTracks(tracks);
  }

  /** Looks up a single track by its iTunes track id. */
  async getSong(id: string): Promise<SongResult> {
    const url = new URL(TRACK_URL);
    url.searchParams.set("id", id);
    url.searchParams.set("entity", "song");

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new ProviderError(
        `iTunes lookup failed with status ${response.status}`,
        response.status,
      );
    }

    let json: { results: Parameters<typeof mapItunesTracks>[0] };
    try {
      json = (await response.json()) as typeof json;
    } catch {
      throw new ProviderError("iTunes returned an invalid response.");
    }

    if (!json.results || json.results.length === 0) {
      throw new ProviderError("Song not found.");
    }

    return mapItunesTracks(json.results)[0];
  }
}