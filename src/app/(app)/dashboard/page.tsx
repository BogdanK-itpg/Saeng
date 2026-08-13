import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/current-user";
import { listReceivedShoutsWithDetails } from "@/services/shouts";
import { ReceivedShoutCard } from "@/components/shouts/shout-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [received] = await Promise.all([
    listReceivedShoutsWithDetails(user.id, { limit: 10 }),
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