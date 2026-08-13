import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/current-user";
import { listFriends } from "@/services/friends";
import { SendShoutComposer } from "@/components/shouts/send-shout-composer";

export const metadata: Metadata = { title: "Send Shout" };

export default async function SendPage() {
  const user = await requireUser();
  const friends = await listFriends(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Send a Shout
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pick a friend, choose a song, and shout it out. It&apos;s a mini
          taste-sharing moment.
        </p>
      </div>

      <SendShoutComposer friends={friends} />
    </div>
  );
}
