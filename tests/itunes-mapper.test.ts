import { describe, expect, it } from "vitest";

import { mapItunesTrack, mapItunesTracks } from "@/lib/music/itunes/mapper";
import type { ItunesTrack } from "@/lib/music/itunes/http";

const track: ItunesTrack = {
  trackId: 123,
  trackName: "Dreams",
  artistName: "Fleetwood Mac",
  collectionName: "Rumours",
  artworkUrl100: "https://example.com/100x100bb.jpg",
  previewUrl: "https://example.com/preview.m4a",
  trackViewUrl: "https://itunes.apple.com/track",
  trackTimeMillis: 210000,
};

describe("mapItunesTrack", () => {
  it("normalizes provider fields and bumps artwork size", () => {
    const result = mapItunesTrack(track);
    expect(result.provider).toBe("itunes");
    expect(result.providerSongId).toBe("123");
    expect(result.title).toBe("Dreams");
    expect(result.artist).toBe("Fleetwood Mac");
    expect(result.album).toBe("Rumours");
    expect(result.artworkUrl).toBe("https://example.com/300x300bb.jpg");
    expect(result.duration).toBe(210);
  });

  it("handles missing optional fields as null", () => {
    const result = mapItunesTrack({
      trackId: 1,
      trackName: "Nope",
      artistName: "Unknown",
      trackViewUrl: "https://example.com",
    });
    expect(result.album).toBeNull();
    expect(result.artworkUrl).toBeNull();
    expect(result.previewUrl).toBeNull();
    expect(result.duration).toBeNull();
    expect(result.externalUrl).toBe("https://example.com");
  });
});

describe("mapItunesTracks", () => {
  it("maps every track", () => {
    expect(mapItunesTracks([track, track])).toHaveLength(2);
  });
});