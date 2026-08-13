import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/current-user";
import {
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  searchProfilesWithRelationship,
} from "@/services/friends";
import { FriendSearch } from "@/components/friends/friend-search";
import { UserResultCard } from "@/components/friends/user-result-card";
import { IncomingRequestCard } from "@/components/friends/incoming-request-card";
import { OutgoingRequestCard } from "@/components/friends/outgoing-request-card";
import { FriendCard } from "@/components/friends/friend-card";

export const metadata: Metadata = { title: "Friends" };

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";

  const [friends, incoming, outgoing] = await Promise.all([
    listFriends(user.id),
    listIncomingRequests(user.id),
    listOutgoingRequests(user.id),
  ]);

  const results = query
    ? await searchProfilesWithRelationship(user.id, query)
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Friends
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Only friends can receive your shouts.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Add a friend
        </h2>
        <FriendSearch initialQuery={query} />
        {query && (
          <ul className="space-y-2">
            {results.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No users found for “{query}”.
              </p>
            ) : (
              results.map((profile) => (
                <UserResultCard key={profile.id} profile={profile} />
              ))
            )}
          </ul>
        )}
      </section>

      {incoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Incoming requests ({incoming.length})
          </h2>
          <ul className="space-y-2">
            {incoming.map((request) => (
              <IncomingRequestCard key={request.id} request={request} />
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Outgoing requests ({outgoing.length})
          </h2>
          <ul className="space-y-2">
            {outgoing.map((request) => (
              <OutgoingRequestCard key={request.id} request={request} />
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Your friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No friends yet. Search for a username above to send your first
            request.
          </p>
        ) : (
          <ul className="space-y-2">
            {friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}