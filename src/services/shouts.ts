import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  Notification,
  NotificationType,
  Shout,
  ShoutWithDetails,
  SongReference,
} from "@/types/domain";

import { mapProfile, PROFILE_COLUMNS, type ProfileRow } from "./_row-mappers";

/** Looks up a normalized song reference by provider id, for re-use. */
export async function findSongByProvider(
  provider: string,
  providerSongId: string,
): Promise<SongReference | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("song_references")
    .select(
      "id, provider, provider_song_id, title, artist, album, artwork_url, preview_url, external_url, duration, created_at",
    )
    .eq("provider", provider)
    .eq("provider_song_id", providerSongId)
    .maybeSingle();

  if (error) {
    throw AppError.infrastructure("Failed to look up song", error.code);
  }
  if (!data) return null;

  return {
    id: data.id,
    provider: data.provider,
    providerSongId: data.provider_song_id,
    title: data.title,
    artist: data.artist,
    album: data.album,
    artworkUrl: data.artwork_url,
    previewUrl: data.preview_url,
    externalUrl: data.external_url,
    duration: data.duration,
    createdAt: data.created_at,
  };
}

/** Upserts a SongReference from normalized provider data; returns the row id. */
export async function saveSongReference(
  song: Omit<SongReference, "id" | "createdAt">,
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("song_references")
    .upsert(
      {
        provider: song.provider,
        provider_song_id: song.providerSongId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork_url: song.artworkUrl,
        preview_url: song.previewUrl,
        external_url: song.externalUrl,
        duration: song.duration,
      },
      { onConflict: "provider,provider_song_id" },
    )
    .select("id")
    .single();

  if (error) {
    throw AppError.infrastructure("Failed to save song", error.code);
  }
  return data.id;
}

export function mapShout(row: {
  id: string;
  sender_id: string;
  receiver_id: string;
  song_reference_id: string;
  message: string | null;
  sent_at: string;
  seen_at: string | null;
  reply_to_shout_id: string | null;
}): Shout {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    songReferenceId: row.song_reference_id,
    message: row.message,
    sentAt: row.sent_at,
    seenAt: row.seen_at,
    replyToShoutId: row.reply_to_shout_id,
  };
}

/**
 * Creates a shout plus its notification for the recipient.
 * Writes happen with the admin client: the song reference persists, the shout
 * is authorized here (recipient must be a friend), and the recipient's
 * notification is inserted on their behalf.
 */
export async function sendShout(input: {
  senderId: string;
  receiverId: string | null;
  song: Omit<SongReference, "id" | "createdAt">;
  message: string | null;
  replyToShoutId?: string | null;
}): Promise<Shout> {
  const { senderId, receiverId, song, message, replyToShoutId } = input;

  if (!receiverId) {
    throw AppError.user("Please choose a friend to shout at.");
  }

  const admin = createAdminClient();
  const supabase = await createClient();

  const { data: friend } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(user_id.eq.${senderId},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${senderId})`,
    )
    .maybeSingle();

  if (!friend) {
    throw AppError.user("You can only shout at friends.");
  }

  const songReferenceId = await saveSongReference(song);

  const { data: shout, error } = await admin
    .from("shouts")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      song_reference_id: songReferenceId,
      message,
      reply_to_shout_id: replyToShoutId ?? null,
    })
    .select(
      "id, sender_id, receiver_id, song_reference_id, message, sent_at, seen_at, reply_to_shout_id",
    )
    .single();

  if (error) {
    throw AppError.infrastructure("Failed to send shout", error.code);
  }

  const { error: notifError } = await admin.from("notifications").insert({
    user_id: receiverId,
    type: "shout_received",
    actor_id: senderId,
    related_entity_id: shout.id,
  });

  if (notifError) {
    throw AppError.infrastructure("Failed to create notification", notifError.code);
  }

  return mapShout(shout);
}

export async function markShoutSeen(
  userId: string,
  shoutId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shouts")
    .update({ seen_at: new Date().toISOString() })
    .eq("id", shoutId)
    .eq("receiver_id", userId);

  if (error) {
    throw AppError.infrastructure("Failed to update shout", error.code);
  }
}

/** Lists shouts the user sent (newest first), with pagination. */
export async function listShoutsSent(
  userId: string,
  { from = 0, to = 49 }: { from?: number; to?: number } = {},
): Promise<Shout[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shouts")
    .select(
      "id, sender_id, receiver_id, song_reference_id, message, sent_at, seen_at, reply_to_shout_id",
    )
    .eq("sender_id", userId)
    .order("sent_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw AppError.infrastructure("Failed to load shouts", error.code);
  }
  return (data ?? []).map(mapShout);
}

/** Lists shouts the user received (newest first), with pagination. */
export async function listShoutsReceived(
  userId: string,
  { from = 0, to = 49 }: { from?: number; to?: number } = {},
): Promise<Shout[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shouts")
    .select(
      "id, sender_id, receiver_id, song_reference_id, message, sent_at, seen_at, reply_to_shout_id",
    )
    .eq("receiver_id", userId)
    .order("sent_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw AppError.infrastructure("Failed to load shouts", error.code);
  }
  return (data ?? []).map(mapShout);
}

const SHOUT_DETAIL_COLUMNS = `
  id, sender_id, receiver_id, song_reference_id, message, sent_at, seen_at, reply_to_shout_id,
  song:song_references(id, provider, provider_song_id, title, artist, album, artwork_url, preview_url, external_url, duration, created_at),
  sender:profiles!shouts_sender_id_fkey(${PROFILE_COLUMNS}),
  receiver:profiles!shouts_receiver_id_fkey(${PROFILE_COLUMNS})
` as const;

type ShoutDetailRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  song_reference_id: string;
  message: string | null;
  sent_at: string;
  seen_at: string | null;
  reply_to_shout_id: string | null;
  song: {
    id: string;
    provider: string;
    provider_song_id: string;
    title: string;
    artist: string;
    album: string | null;
    artwork_url: string | null;
    preview_url: string | null;
    external_url: string;
    duration: number | null;
    created_at: string;
  };
  sender: ProfileRow;
  receiver: ProfileRow;
};

// PostgREST returns to-one embedded FK joins as objects, not arrays. The
// untyped query builder's inferred rows are cast to the actual shape here.
function mapDetailRow(
  row: Pick<
    ShoutDetailRow,
    "id" | "sender_id" | "receiver_id" | "song_reference_id" | "message" | "sent_at" | "seen_at" | "reply_to_shout_id" | "song" | "sender" | "receiver"
  >,
): ShoutWithDetails {
  const song: SongReference = {
    id: row.song.id,
    provider: row.song.provider as SongReference["provider"],
    providerSongId: row.song.provider_song_id,
    title: row.song.title,
    artist: row.song.artist,
    album: row.song.album,
    artworkUrl: row.song.artwork_url,
    previewUrl: row.song.preview_url,
    externalUrl: row.song.external_url,
    duration: row.song.duration,
    createdAt: row.song.created_at,
  };

  return {
    ...mapShout(row),
    song,
    sender: mapProfile(row.sender),
    receiver: mapProfile(row.receiver),
    myReaction: null,
    reactions: [],
  };
}

/** Returns a shout with its song + sender/recipient, if the user is a participant. */
export async function getShoutWithDetails(
  userId: string,
  shoutId: string,
): Promise<ShoutWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shouts")
    .select(SHOUT_DETAIL_COLUMNS)
    .eq("id", shoutId)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .maybeSingle();

  if (error) {
    throw AppError.infrastructure("Failed to load shout", error.code);
  }
  if (!data) return null;

  return mapDetailRow(data as unknown as ShoutDetailRow);
}

/** Latest shouts the user received, joined with song + sender. */
export async function listReceivedShoutsWithDetails(
  userId: string,
  { limit = 20 }: { limit?: number } = {},
): Promise<Array<ShoutWithDetails & { senderName: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shouts")
    .select(SHOUT_DETAIL_COLUMNS)
    .eq("receiver_id", userId)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw AppError.infrastructure("Failed to load shouts", error.code);
  }

  return ((data ?? []) as unknown as ShoutDetailRow[]).map((row) => ({
    ...mapDetailRow(row),
    senderName: row.sender.display_name ?? "Someone",
  }));
}

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
  return {
    id: data.id,
    userId: data.user_id,
    type: data.type,
    actorId: data.actor_id,
    relatedEntityId: data.related_entity_id,
    readAt: data.read_at,
    createdAt: data.created_at,
  };
}