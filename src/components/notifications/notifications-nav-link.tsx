"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";

/**
 * Nav link with a live unread badge. Starts from the server-rendered count,
 * increments as new notifications arrive, and decrements when one is marked
 * read (all via Supabase Realtime).
 */
export function NotificationsNavLink({
  userId,
  unreadCount,
}: {
  userId: string;
  unreadCount: number;
}) {
  const [count, setCount] = useState(unreadCount);
  const pathname = usePathname();
  const active =
    pathname === "/notifications" || pathname.startsWith("/notifications/");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-badge-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => setCount((c) => c + 1),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const wasUnread =
            (payload.old as { read_at?: string | null } | null)?.read_at == null;
          const isNowRead =
            (payload.new as { read_at?: string | null } | null)?.read_at != null;
          if (wasUnread && isNowRead) {
            setCount((c) => Math.max(0, c - 1));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
      )}
    >
      Notifications
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-white"
          aria-label={`${count} unread notifications`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}