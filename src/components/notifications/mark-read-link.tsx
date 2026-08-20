"use client";

import Link from "next/link";

import { markNotificationReadAction } from "@/app/actions/notifications";
import { cn } from "@/utils/cn";

/**
 * A notification row: navigates to the target and marks the notification read.
 * `children` is the server-rendered content (avatar + copy + time).
 */
export function MarkReadLink({
  href,
  notificationId,
  unread,
  children,
}: {
  href: string;
  notificationId: string;
  unread: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={() => {
        markNotificationReadAction(notificationId);
      }}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        unread
          ? "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          : "border-transparent opacity-70 hover:opacity-100",
      )}
    >
      {unread && (
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
        />
      )}
      {children}
    </Link>
  );
}