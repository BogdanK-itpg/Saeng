import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/current-user";
import { listReceivedShoutsWithDetails } from "@/services/shouts";
import { listFriends } from "@/services/friends";
import { ReceivedShoutCard } from "@/components/shouts/shout-card";
import { ProfileAvatar } from "@/components/friends/profile-avatar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [received, friends] = await Promise.all([
    listReceivedShoutsWithDetails(user.id, { limit: 10 }),
    listFriends(user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your recent shouts.
          </p>
        </div>
        <Link href="/send">
          <Button>Send a Shout</Button>
        </Link>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Quick send
          </h2>
          <Link
            href="/send"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            All friends
          </Link>
        </div>
        {friends.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            No friends yet. Add some on the Friends page, then shout one back.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-4">
            {friends.slice(0, 8).map((friend) => (
              <li key={friend.id}>
                <Link
                  href={`/send?friend=${friend.id}`}
                  className="group flex w-16 flex-col items-center gap-1"
                >
                  <ProfileAvatar
                    avatarUrl={friend.avatarUrl}
                    displayName={friend.displayName}
                    size="sm"
                  />
                  <span className="w-full truncate text-center text-xs text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100">
                    {friend.displayName}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Received ({received.length})
        </h2>
        {received.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No shouts yet. Send one to a friend to get things going.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {received.map((shout) => (
              <ReceivedShoutCard
                key={shout.id}
                shout={shout}
                senderName={shout.senderName}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}