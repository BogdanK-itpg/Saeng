import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  Notification,
  NotificationType,
  NotificationWithActor,
} from "@/types/domain";

import { mapProfile, PROFILE_COLUMNS } from "./_row-mappers";

/** Creates a notification on behalf of a user (service role). */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  actorId?: string | null;
  relatedEntityId?: string | null;
}): Promise<Notification> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .insert({
      user_id: input.userId,
      type: input.type,
      actor_id: input.actorId ?? null,
      related_entity_id: input.relatedEntityId ?? null,
    })
    .select("id, user_id, type, actor_id, related_entity_id, read_at, created_at")
    .single();

  if (error) {
    throw AppError.infrastructure("Failed to create notification", error.code);
  }
  return mapNotification(data);
}

function mapNotification(row: {
  id: string;
  user_id: string;
  type: Notification["type"];
  actor_id: string | null;
  related_entity_id: string | null;
  read_at: string | null;
  created_at: string;
}): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    actorId: row.actor_id,
    relatedEntityId: row.related_entity_id,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

/** Latest notifications for a user, newest first. */
export async function listNotifications(
  userId: string,
  { limit = 50 }: { limit?: number } = {},
): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, actor_id, related_entity_id, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw AppError.infrastructure("Failed to load notifications", error.code);
  }
  return (data ?? []).map(mapNotification);
}

/** Count of unread notifications (for the badge). */
export async function countUnreadNotifications(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw AppError.infrastructure("Failed to count notifications", error.code);
  }
  return count ?? 0;
}

/** Marks all of a user's unread notifications as read. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw AppError.infrastructure("Failed to update notifications", error.code);
  }
}

/** Marks a single notification as read, only if it belongs to the user. */
export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    throw AppError.infrastructure("Failed to update notification", error.code);
  }
}

/** Joins notifications with their actor profile. */
export async function listNotificationsWithActors(
  userId: string,
  { limit = 50 }: { limit?: number } = {},
): Promise<NotificationWithActor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `id, user_id, type, actor_id, related_entity_id, read_at, created_at,
       actor:profiles!notifications_actor_id_fkey(${PROFILE_COLUMNS})`,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw AppError.infrastructure("Failed to load notifications", error.code);
  }

  return (data ?? []).map((row) => ({
    ...mapNotification(row),
    actor: row.actor ? mapProfile(row.actor as unknown as Parameters<typeof mapProfile>[0]) : null,
  }));
}