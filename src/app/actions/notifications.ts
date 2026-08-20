"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";

const idSchema = z.string().uuid("Invalid id.");

/** Marks every one of the current user's notifications as read (best-effort). */
export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  try {
    await markAllNotificationsRead(user.id);
    revalidatePath("/notifications");
  } catch {
    // Best-effort: the badge refreshes on the next navigation anyway.
  }
}

/** Marks a single notification as read (used when navigating to its target). */
export async function markNotificationReadAction(
  notificationId: string,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(notificationId);
  if (!parsed.success) return { error: "Invalid notification id." };

  try {
    await markNotificationRead(user.id, parsed.data);
    return {};
  } catch {
    return { error: "Could not update notification." };
  }
}