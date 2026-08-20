"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  removeReactionAction,
  setReactionAction,
} from "@/app/actions/reactions";
import { Alert } from "@/components/ui/alert";
import { ProfileAvatar } from "@/components/friends/profile-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const REACTION_OPTIONS = ["❤️", "🎶", "🔥", "👏", "😂", "🥳"] as const;

export type ReactionDisplay = {
  userId: string;
  reactionType: string;
  displayName: string;
  avatarUrl: string | null;
};

/**
 * Reactions on a shout. Only the recipient can react (enforced by RLS and the
 * unique index on (shout_id, user_id)); senders see the reaction read-only.
 */
export function ReactionBar({
  shoutId,
  isRecipient,
  myReactionType,
  reactions,
}: {
  shoutId: string;
  isRecipient: boolean;
  myReactionType: string | null;
  reactions: ReactionDisplay[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customEmoji, setCustomEmoji] = useState("");

  function handleReact(emoji: string) {
    setError(null);
    startTransition(async () => {
      const res =
        myReactionType === emoji
          ? await removeReactionAction(shoutId)
          : await setReactionAction(shoutId, emoji);
      if (res.error) {
        setError(res.error);
        return;
      }
      setCustomEmoji("");
      router.refresh();
    });
  }

  function handleCustomSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = customEmoji.trim();
    if (!value) return;
    handleReact(value);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Reactions
      </h2>

      {isRecipient ? (
        <>
          <div className="flex flex-wrap gap-2">
            {REACTION_OPTIONS.map((emoji) => {
              const active = myReactionType === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  disabled={pending}
                  onClick={() => handleReact(emoji)}
                  aria-pressed={active}
                  aria-label={`React with ${emoji}`}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full text-xl transition",
                    active
                      ? "bg-zinc-900 text-white ring-2 ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100"
                      : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700",
                  )}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          {myReactionType && (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              You reacted with {myReactionType}. Tap it again to remove.
            </p>
          )}

          <form
            onSubmit={handleCustomSubmit}
            className="mt-4 flex items-center gap-2"
          >
            <label
              htmlFor={`custom-reaction-${shoutId}`}
              className="text-sm text-zinc-500 dark:text-zinc-400"
            >
              Or type your own:
            </label>
            <input
              id={`custom-reaction-${shoutId}`}
              type="text"
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              placeholder="✌️"
              maxLength={16}
              disabled={pending}
              className="w-20 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-center text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-600"
            />
            <Button type="submit" size="sm" variant="secondary" disabled={pending}>
              React
            </Button>
          </form>
        </>
      ) : (
        <div className="space-y-2">
          {reactions.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No reaction yet.
            </p>
          ) : (
            reactions.map((r) => (
              <div
                key={r.userId}
                className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <ProfileAvatar
                  avatarUrl={r.avatarUrl}
                  displayName={r.displayName}
                  size="sm"
                />
                <span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {r.displayName}
                  </span>{" "}
                  reacted with {r.reactionType}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {error && <Alert className="mt-3">{error}</Alert>}
    </div>
  );
}