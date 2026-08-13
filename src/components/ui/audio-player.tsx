"use client";

import { useEffect, useRef, useState } from "react";

import { Spinner } from "@/components/ui/spinner";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Streams the song preview directly from the provider CDN (no proxying).
 * Play triangle + progress bar. Falls back to a provider link when no
 * preview is available. Only one player plays at a time per page.
 */
export function AudioPlayer({
  previewUrl,
  externalUrl,
}: {
  previewUrl: string | null;
  externalUrl: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    function onOtherPlay(event: Event) {
      const audio = audioRef.current;
      const other = (event as CustomEvent<HTMLAudioElement | null>).detail;
      if (audio && other && other !== audio && !audio.paused) {
        audio.pause();
      }
    }
    window.addEventListener("player:play", onOtherPlay);
    return () => window.removeEventListener("player:play", onOtherPlay);
  }, []);

  if (!previewUrl) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Listen on the web
      </a>
    );
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      return;
    }
    setError(false);
    setLoading(true);
    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          window.dispatchEvent(
            new CustomEvent("player:play", { detail: audioRef.current }),
          );
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }

  /** Reads the preview duration whenever the element reports it. */
  function readDuration() {
    const audio = audioRef.current;
    if (!audio) return;
    const d = audio.duration;
    if (Number.isFinite(d) && d > 0 && d !== duration) {
      setDuration(d);
    }
  }

  function seek(event: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <audio
        ref={audioRef}
        src={previewUrl}
        preload="metadata"
        onPlay={() => {
          setPlaying(true);
          readDuration();
        }}
        onPause={() => {
          setPlaying(false);
          readDuration();
        }}
        onLoadedMetadata={readDuration}
        onDurationChange={readDuration}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
          readDuration();
        }}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setError(true);
          setLoading(false);
          setPlaying(false);
        }}
      />
      <button
        type="button"
        onClick={toggle}
        disabled={loading && !playing}
        aria-label={playing ? "Pause preview" : "Play preview"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading && !playing ? (
          <Spinner className="h-4 w-4 animate-spin" />
        ) : playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        )}
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          role="slider"
          aria-label="Preview progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          onClick={seek}
          className="group relative h-1.5 w-full cursor-pointer rounded-full bg-zinc-200 dark:bg-zinc-700"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-zinc-900 transition-[width] dark:bg-zinc-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-zinc-900 opacity-0 shadow transition-opacity group-hover:opacity-100 dark:bg-zinc-100"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open in provider"
        className="shrink-0 text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6" />
          <path d="M10 14L21 3" />
        </svg>
      </a>
      {error && (
        <p className="shrink-0 text-xs text-red-600 dark:text-red-400">
          Preview unavailable. Try the provider link instead.
        </p>
      )}
    </div>
  );
}
