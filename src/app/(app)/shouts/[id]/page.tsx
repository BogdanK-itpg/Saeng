import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/current-user";
import { getShoutWithDetails, markShoutSeen } from "@/services/shouts";
import { AudioPlayer } from "@/components/ui/audio-player";
import { ProfileAvatar } from "@/components/friends/profile-avatar";

export const metadata: Metadata = { title: "Shout" };

export function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function ShoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const shout = await getShoutWithDetails(user.id, id);
  if (!shout) notFound();

  if (shout.receiverId === user.id && !shout.seenAt) {
    await markShoutSeen(user.id, shout.id);
  }

  const isMine = shout.senderId === user.id;
  const other = isMine ? shout.receiver : shout.sender;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <ProfileAvatar avatarUrl={other.avatarUrl} displayName={other.displayName} size="lg" />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {isMine ? `To ${other.displayName}` : `From ${other.displayName}`}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              @{other.username} · {formatDate(shout.sentAt)}
            </p>
          </div>
        </div>

        {shout.message && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {shout.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {shout.song.artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shout.song.artworkUrl}
            alt=""
            width={112}
            height={112}
            className="h-28 w-28 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
          />
        ) : (
          <div className="h-28 w-28 shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {shout.song.title}
          </p>
          <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
            {shout.song.artist}
          </p>
          {shout.song.album && (
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {shout.song.album}
            </p>
          )}
        </div>
      </div>

      <AudioPlayer
        previewUrl={shout.song.previewUrl}
        externalUrl={shout.song.externalUrl}
      />
    </div>
  );
}
