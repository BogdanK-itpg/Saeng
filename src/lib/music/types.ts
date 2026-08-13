/**
 * Music provider abstraction. Business logic depends only on these types;
 * provider-specific structures (iTunes, Spotify, …) never leak past a
 * provider implementation.
 */

export interface SongResult {
  provider: string;
  providerSongId: string;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  /** Direct provider-hosted audio stream URL, or null if unavailable. */
  previewUrl: string | null;
  externalUrl: string;
  /** Duration in seconds, when the provider supplies it. */
  duration: number | null;
}

export interface MusicProvider {
  searchSongs(query: string): Promise<SongResult[]>;
  getSong(id: string): Promise<SongResult>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
