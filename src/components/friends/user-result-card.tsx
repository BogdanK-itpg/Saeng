"use client";

import { useActionState } from "react";

import { sendFriendRequestAction } from "@/app/actions/friends";
import type { ProfileWithRelationship } from "@/services/friends";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "./profile-avatar";

export function UserResultCard({
  profile,
}: {
  profile: ProfileWithRelationship;
}) {
  const [state, action, pending] = useActionState(sendFriendRequestAction, {});

  const isSelf = profile.relationship === "self";
  const isFriend = profile.relationship === "friend";
  const isOutgoing = profile.relationship === "outgoing";
  const isIncoming = profile.relationship === "incoming";

  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <ProfileAvatar
        avatarUrl={profile.avatarUrl}
        displayName={profile.displayName}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {profile.displayName}
        </p>
        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
          @{profile.username}
        </p>
      </div>

      {state.error && <Alert className="max-w-[12rem]">{state.error}</Alert>}
      {state.success && (
        <Alert variant="success" className="max-w-[12rem]">
          {state.success}
        </Alert>
      )}

      {isSelf ? (
        <span className="text-xs text-zinc-400">This is you</span>
      ) : isFriend ? (
        <span className="text-xs font-medium text-green-600 dark:text-green-400">
          Friends
        </span>
      ) : isIncoming ? (
        <span className="text-xs font-medium text-zinc-500">
          Requested you
        </span>
      ) : isOutgoing ? (
        <span className="text-xs font-medium text-zinc-500">Request sent</span>
      ) : (
        <form action={action}>
          <input type="hidden" name="receiverId" value={profile.id} />
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            {pending ? "Sending…" : "Send request"}
          </Button>
        </form>
      )}
    </li>
  );
}