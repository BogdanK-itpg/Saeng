import type { SongResult } from "@/lib/music/types";
import { Button } from "@/components/ui/button";

export function SongResultCard({
  song,
  onSelect,
  pending,
}: {
  song: SongResult;
  onSelect: () => void;
  pending?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      {song.artworkUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={song.artworkUrl}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
        />
      ) : (
        <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {song.title}
        </p>
        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
          {song.artist}
          {song.album ? ` · ${song.album}` : ""}
        </p>
      </div>
      <Button type="button" size="sm" variant="secondary" onClick={onSelect} disabled={pending}>
        Select
      </Button>
    </li>
  );
}
