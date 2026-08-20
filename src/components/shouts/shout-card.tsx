"use client";

import { useState } from "react";
import Link from "next/link";

import type { ShoutWithDetails } from "@/types/domain";
import { AudioPlayer } from "@/components/ui/audio-player";
import { useLedGlow } from "@/lib/led-glow";
import { cn } from "@/utils/cn";

/** A received shout card with inline preview playback, linking to the detail page. */
export function ReceivedShoutCard({
  shout,
  senderName,
}: {
  shout: ShoutWithDetails;
  senderName: string;
}) {
  const song = shout.song;
  const [playing, setPlaying] = useState(false);
  const glow = useLedGlow(song.artworkUrl, playing);

  return (
    <li
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
        glow.className,
      )}
      style={glow.style}
    >
      <div className="flex items-center gap-4">
        <Link
          href={`/shouts/${shout.id}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          {song.artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={song.artworkUrl}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-md object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {song.title}
            </p>
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {song.artist}
            </p>
          </div>
        </Link>
        <div className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
          from @{senderName}
        </div>
      </div>
      <div className="mt-3">
        <AudioPlayer
          previewUrl={song.previewUrl}
          externalUrl={song.externalUrl}
          onPlayingChange={setPlaying}
        />
      </div>
    </li>
  );
}