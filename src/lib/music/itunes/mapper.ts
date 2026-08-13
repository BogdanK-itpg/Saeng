import type { SongResult } from "../types";
import type { ItunesTrack } from "./http";

const ARTWORK_SIZE = "300x300bb";

/**
 * Normalizes an iTunes track into a SongResult. Artwork is bumped from the
 * default 100x100 to 300x300; missing optional fields become null.
 */
export function mapItunesTrack(track: ItunesTrack): SongResult {
  return {
    provider: "itunes",
    providerSongId: String(track.trackId),
    title: track.trackName,
    artist: track.artistName,
    album: track.collectionName ?? null,
    artworkUrl: track.artworkUrl100
      ? track.artworkUrl100.replace(/100x100bb/, ARTWORK_SIZE)
      : null,
    previewUrl: track.previewUrl ?? null,
    externalUrl: track.trackViewUrl ?? "",
    duration: track.trackTimeMillis ? Math.round(track.trackTimeMillis / 1000) : null,
  };
}

export function mapItunesTracks(tracks: ItunesTrack[]): SongResult[] {
  return tracks.map(mapItunesTrack);
}