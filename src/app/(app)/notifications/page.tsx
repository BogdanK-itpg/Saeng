import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/current-user";
import { listNotificationsWithActors } from "@/services/notifications";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { MarkReadLink } from "@/components/notifications/mark-read-link";
import { ProfileAvatar } from "@/components/friends/profile-avatar";
import { Button } from "@/components/ui/button";
import type { NotificationWithActor } from "@/types/domain";

export const metadata: Metadata = { title: "Notifications" };

function notificationTarget(
  notification: NotificationWithActor,
): { href: string; text: string } {
  const name = notification.actor?.displayName ?? "Someone";
  const shoutHref = `/shouts/${notification.relatedEntityId ?? ""}`;
  switch (notification.type) {
    case "friend_request":
      return { href: "/friends", text: `${name} sent you a friend request.` };
    case "shout_received":
      return { href: shoutHref, text: `${name} shouted you out!` };
    case "reaction":
      return { href: shoutHref, text: `${name} reacted to your shout.` };
  }
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await listNotificationsWithActors(user.id, {
    limit: 50,
  });
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Notifications
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Shout-outs, friend requests, and reactions.
          </p>
        </div>
        {hasUnread && (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="ghost">
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You&apos;re all caught up. Nothing here yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => {
            const { href, text } = notificationTarget(notification);
            return (
              <li key={notification.id}>
                <MarkReadLink
                  href={href}
                  notificationId={notification.id}
                  unread={!notification.readAt}
                >
                  <ProfileAvatar
                    avatarUrl={notification.actor?.avatarUrl ?? null}
                    displayName={notification.actor?.displayName ?? "Someone"}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-zinc-800 dark:text-zinc-200">
                      {text}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {formatTime(notification.createdAt)}
                    </span>
                  </span>
                </MarkReadLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}