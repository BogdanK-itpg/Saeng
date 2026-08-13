"use client";

import { useActionState } from "react";

import { removeFriendAction } from "@/app/actions/friends";
import type { Profile } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "./profile-avatar";

export function FriendCard({ friend }: { friend: Profile }) {
  const [state, action, pending] = useActionState(removeFriendAction, {});

  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <ProfileAvatar
        avatarUrl={friend.avatarUrl}
        displayName={friend.displayName}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {friend.displayName}
        </p>
        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
          @{friend.username}
        </p>
      </div>

      <form action={action}>
        <input type="hidden" name="friendId" value={friend.id} />
        <Button type="submit" variant="ghost" size="sm" disabled={pending}>
          {pending ? "Removing…" : "Remove"}
        </Button>
      </form>

      {state.error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </li>
  );
}