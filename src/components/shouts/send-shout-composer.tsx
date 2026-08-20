"use client";

import { useState } from "react";
import { useActionState } from "react";

import { sendShoutAction } from "@/app/actions/shouts";
import type { SongResult } from "@/lib/music/types";
import type { Profile } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { SongSearch } from "@/components/songs/song-search";
import { SelectedSong } from "@/components/songs/selected-song";

export function SendShoutComposer({
  friends,
  preselectedFriendId,
}: {
  friends: Profile[];
  preselectedFriendId?: string;
}) {
  const [selected, setSelected] = useState<SongResult | null>(null);
  const [state, action, pending] = useActionState(sendShoutAction, {});

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="song" value={selected ? JSON.stringify(selected) : ""} />

      <div className="space-y-2">
        <Label htmlFor="receiverId">Choose a friend</Label>
        <select
          id="receiverId"
          name="receiverId"
          required
          defaultValue={preselectedFriendId ?? ""}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
        >
          <option value="">Select a friend…</option>
          {friends.map((friend) => (
            <option key={friend.id} value={friend.id}>
              {friend.displayName} (@{friend.username})
            </option>
          ))}
        </select>
        {friends.length === 0 && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            You have no friends yet. Add some on the Friends page first.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Pick a song</Label>
        {selected ? (
          <SelectedSong song={selected} onClear={() => setSelected(null)} />
        ) : (
          <SongSearch onSelect={setSelected} />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message (optional)</Label>
        <Input
          id="message"
          name="message"
          placeholder="A few words about the song…"
          maxLength={280}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Max 280 characters.
        </p>
      </div>

      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}

      <Button
        type="submit"
        disabled={pending || !selected || friends.length === 0}
      >
        {pending && <Spinner className="h-4 w-4 animate-spin" />}
        {pending ? "Sending…" : "Send Shout"}
      </Button>
    </form>
  );
}
