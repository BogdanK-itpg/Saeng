"use client";

import { useActionState } from "react";

import {
  acceptFriendRequestAction,
  declineFriendRequestAction,
} from "@/app/actions/friends";
import type { FriendRequestWithProfiles } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "./profile-avatar";

export function IncomingRequestCard({
  request,
}: {
  request: FriendRequestWithProfiles;
}) {
  const [acceptState, acceptAction, accepting] = useActionState(
    acceptFriendRequestAction,
    {},
  );
  const [declineState, declineAction, declining] = useActionState(
    declineFriendRequestAction,
    {},
  );

  return (
    <li className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <ProfileAvatar
        avatarUrl={request.sender.avatarUrl}
        displayName={request.sender.displayName}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {request.sender.displayName}
        </p>
        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
          @{request.sender.username} sent you a request
        </p>
      </div>

      <div className="flex items-center gap-2">
        <form action={acceptAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <Button type="submit" size="sm" disabled={accepting || declining}>
            {accepting ? "Accepting…" : "Accept"}
          </Button>
        </form>
        <form action={declineAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={accepting || declining}
          >
            {declining ? "Declining…" : "Decline"}
          </Button>
        </form>
      </div>

      {(acceptState.error || declineState.error) && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          {acceptState.error ?? declineState.error}
        </p>
      )}
    </li>
  );
}