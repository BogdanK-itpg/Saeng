import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  ReactionWithActor,
  Shout,
  ShoutWithDetails,
  SongReference,
} from "@/types/domain";
import { createNotification } from "@/services/notifications";

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

  await createNotification({
    userId: receiverId,
    type: "shout_received",
    actorId: senderId,
    relatedEntityId: shout.id,
  });

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

const REACTION_EMBED = `
  reactions:reactions!reactions_shout_id_fkey(
    id, reaction_type, created_at,
    user:profiles!reactions_user_id_fkey(${PROFILE_COLUMNS})
  )
` as const;

const SENT_DETAIL_COLUMNS = `${SHOUT_DETAIL_COLUMNS}, ${REACTION_EMBED}` as const;

type ReactionEmbed = {
  id: string;
  reaction_type: string;
  created_at: string;
  user: ProfileRow;
};

type SentShoutDetailRow = ShoutDetailRow & {
  reactions: ReactionEmbed[];
};

function mapEmbeddedReaction(
  row: ReactionEmbed,
  shoutId: string,
): ReactionWithActor {
  return {
    id: row.id,
    shoutId,
    userId: row.user.id,
    reactionType: row.reaction_type,
    createdAt: row.created_at,
    user: {
      id: row.user.id,
      username: row.user.username,
      displayName: row.user.display_name,
      avatarUrl: row.user.avatar_url,
    },
  };
}

/** Latest shouts the user sent, joined with song + receiver + reactions. */
export async function listSentShoutsWithDetails(
  userId: string,
  { limit = 20 }: { limit?: number } = {},
): Promise<
  Array<ShoutWithDetails & { receiverName: string; reactions: ReactionWithActor[] }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shouts")
    .select(SENT_DETAIL_COLUMNS)
    .eq("sender_id", userId)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw AppError.infrastructure("Failed to load shouts", error.code);
  }

  return ((data ?? []) as unknown as SentShoutDetailRow[]).map((row) => {
    const detail = mapDetailRow(row);
    detail.reactions = (row.reactions ?? []).map((r) =>
      mapEmbeddedReaction(r, row.id),
    );
    return {
      ...detail,
      receiverName: row.receiver.display_name ?? "Someone",
      reactions: detail.reactions as ReactionWithActor[],
    };
  });
}

export interface RecentShoutActivity {
  id: string;
  direction: "sent" | "received";
  other: Pick<Profile, "id" | "username" | "displayName" | "avatarUrl">;
  song: Pick<SongReference, "id" | "title" | "artist" | "artworkUrl">;
  message: string | null;
  sentAt: string;
}

const ACTIVITY_COLUMNS = `
  id, sender_id, receiver_id, message, sent_at,
  song:song_references(id, title, artist, artwork_url),
  sender:profiles!shouts_sender_id_fkey(${PROFILE_COLUMNS}),
  receiver:profiles!shouts_receiver_id_fkey(${PROFILE_COLUMNS})
` as const;

type ActivityRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  sent_at: string;
  song: { id: string; title: string; artist: string; artwork_url: string | null };
  sender: ProfileRow;
  receiver: ProfileRow;
};

/** Most recent shouts the user sent or received, with song + counterpart. */
export async function listRecentShoutActivity(
  userId: string,
  { limit = 5 }: { limit?: number } = {},
): Promise<RecentShoutActivity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shouts")
    .select(ACTIVITY_COLUMNS)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw AppError.infrastructure("Failed to load activity", error.code);
  }

  return ((data ?? []) as unknown as ActivityRow[]).map((row) => {
    const isSender = row.sender_id === userId;
    const other = isSender ? row.receiver : row.sender;
    return {
      id: row.id,
      direction: isSender ? "sent" : "received",
      other: {
        id: other.id,
        username: other.username,
        displayName: other.display_name,
        avatarUrl: other.avatar_url,
      },
      song: {
        id: row.song.id,
        title: row.song.title,
        artist: row.song.artist,
        artworkUrl: row.song.artwork_url,
      },
      message: row.message,
      sentAt: row.sent_at,
    };
  });
}