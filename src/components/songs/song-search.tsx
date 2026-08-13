"use client";

import { useRef, useState } from "react";

import type { SongResult } from "@/lib/music/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SongResultCard } from "./song-result-card";

/** Client-side song search against the provider-backed API route. */
export function SongSearch({
  onSelect,
}: {
  onSelect: (song: SongResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const seq = useRef(0);

  async function runSearch() {
    const term = query.trim();
    if (!term) {
      setResults(null);
      setSearched(false);
      return;
    }

    const current = ++seq.current;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/songs/search?q=${encodeURIComponent(term)}`,
        { cache: "no-store" },
      );
      const body = await res.json().catch(() => null);
      if (current !== seq.current) return;

      if (!res.ok) {
        setError(body?.error ?? "Search failed.");
        setResults([]);
        return;
      }
      setResults(body?.results ?? []);
    } catch {
      if (current !== seq.current) return;
      setError("Search failed. Try again.");
      setResults([]);
    } finally {
      if (current === seq.current) setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void runSearch();
            }
          }}
          placeholder="Search for a song…"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="button" onClick={() => void runSearch()} disabled={loading || !query.trim()}>
          {loading ? <Spinner className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {searched && !loading && results && (
        results.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No songs found for “{query}”.
          </p>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {results.map((song) => (
              <SongResultCard
                key={`${song.provider}:${song.providerSongId}`}
                song={song}
                onSelect={() => onSelect(song)}
              />
            ))}
          </ul>
        )
      )}
    </div>
  );
}
