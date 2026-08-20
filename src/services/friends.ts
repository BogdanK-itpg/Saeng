import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  FriendRequest,
  FriendRequestWithProfiles,
  Profile,
} from "@/types/domain";
import { createNotification } from "@/services/notifications";

import { mapProfile, PROFILE_COLUMNS, type ProfileRow } from "./_row-mappers";

export type RelationshipStatus =
  | "self"
  | "friend"
  | "outgoing"
  | "incoming"
  | "none";

export interface ProfileWithRelationship extends Profile {
  relationship: RelationshipStatus;
}

/** Search for profiles by username (friend add / user search). */
export async function searchProfiles(
  query: string,
  limit = 20,
): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .ilike("username", `%${query}%`)
    .order("username")
    .limit(limit);

  if (error) {
    throw AppError.infrastructure("Failed to search users", error.code);
  }
  return (data ?? []).map(mapProfile);
}

/** The current user's relationship to another profile. */
export async function getRelationship(
  userId: string,
  otherId: string,
): Promise<RelationshipStatus> {
  if (userId === otherId) return "self";

  const supabase = await createClient();

  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${otherId}),and(user_id.eq.${otherId},friend_id.eq.${userId})`,
    )
    .maybeSingle();
  if (friendship) return "friend";

  const { data: request } = await supabase
    .from("friend_requests")
    .select("sender_id")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`,
    )
    .eq("status", "pending")
    .maybeSingle();

  if (!request) return "none";
  return request.sender_id === userId ? "outgoing" : "incoming";
}

const FRIEND_REQUEST_ROW_COLUMNS =
  `id, sender_id, receiver_id, status, created_at,
   sender:profiles!friend_requests_sender_id_fkey(${PROFILE_COLUMNS}),
   receiver:profiles!friend_requests_receiver_id_fkey(${PROFILE_COLUMNS})` as const;

type FriendRequestRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequest["status"];
  created_at: string;
  sender: ProfileRow;
  receiver: ProfileRow;
};

function mapRequestRow(row: FriendRequestRow): FriendRequestWithProfiles {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    status: row.status,
    createdAt: row.created_at,
    sender: mapProfile(row.sender),
    receiver: mapProfile(row.receiver),
  };
}

/** Pending friend requests sent to the user (to accept/decline). */
export async function listIncomingRequests(
  userId: string,
): Promise<FriendRequestWithProfiles[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("friend_requests")
    .select(FRIEND_REQUEST_ROW_COLUMNS)
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw AppError.infrastructure("Failed to load incoming requests", error.code);
  }
  return ((data ?? []) as unknown as FriendRequestRow[]).map(mapRequestRow);
}

/** Pending friend requests the user sent (to withdraw). */
export async function listOutgoingRequests(
  userId: string,
): Promise<FriendRequestWithProfiles[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("friend_requests")
    .select(FRIEND_REQUEST_ROW_COLUMNS)
    .eq("sender_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw AppError.infrastructure("Failed to load outgoing requests", error.code);
  }
  return ((data ?? []) as unknown as FriendRequestRow[]).map(mapRequestRow);
}

/** Searches profiles and annotates each result with the user's relationship. */
export async function searchProfilesWithRelationship(
  userId: string,
  query: string,
  limit = 20,
): Promise<ProfileWithRelationship[]> {
  const profiles = await searchProfiles(query, limit);
  return Promise.all(
    profiles.map(async (profile) => ({
      ...profile,
      relationship: await getRelationship(userId, profile.id),
    })),
  );
}

/** Lists friends for the current user. */
export async function listFriends(userId: string): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("friendships")
    .select(
      `user_id,
       friend_id,
       user_profile:profiles!friendships_user_id_fkey(${PROFILE_COLUMNS}),
       friend_profile:profiles!friendships_friend_id_fkey(${PROFILE_COLUMNS})`,
    )
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (error) {
    throw AppError.infrastructure("Failed to load friends", error.code);
  }

  const friends: Profile[] = [];
  for (const row of data ?? []) {
    const isUserSlot = row.user_id === userId;
    const profile = isUserSlot ? row.friend_profile : row.user_profile;
    if (profile) friends.push(mapProfile(profile as unknown as ProfileRow));
  }
  return friends;
}

export async function sendFriendRequest(
  userId: string,
  receiverId: string,
): Promise<FriendRequest> {
  const supabase = await createClient();
  if (userId === receiverId) {
    throw AppError.user("You cannot send a friend request to yourself.");
  }

  const relationship = await getRelationship(userId, receiverId);
  if (relationship === "friend") {
    throw AppError.user("You are already friends with this user.");
  }
  if (relationship === "outgoing") {
    throw AppError.user("You already sent a friend request to this user.");
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .insert({ sender_id: userId, receiver_id: receiverId })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      throw AppError.user(
        "You already sent a friend request to this user.",
      );
    }
    throw AppError.user("Could not send friend request.");
  }

  await createNotification({
    userId: receiverId,
    type: "friend_request",
    actorId: userId,
    relatedEntityId: data.id,
  });

  return {
    id: data.id,
    senderId: data.sender_id,
    receiverId: data.receiver_id,
    status: data.status,
    createdAt: data.created_at,
  };
}

/** Withdraws a pending friend request the user sent. */
export async function withdrawFriendRequest(
  userId: string,
  requestId: string,
): Promise<void> {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("friend_requests")
    .select("sender_id, status")
    .eq("id", requestId)
    .single();

  if (!request || request.sender_id !== userId || request.status !== "pending") {
    throw AppError.user("This friend request is no longer available.");
  }

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .eq("sender_id", userId);

  if (error) {
    throw AppError.infrastructure("Failed to withdraw friend request.", error.code);
  }
}

/**
 * Accepts a pending request directed at the user: creates the friendship edge
 * and resolves the request. Uses the admin client so both write operations are
 * performed with the service role (RLS insert policy intentionally absent).
 */
export async function acceptFriendRequest(
  userId: string,
  requestId: string,
): Promise<void> {
  const admin = createAdminClient();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("friend_requests")
    .select("sender_id, receiver_id, status")
    .eq("id", requestId)
    .single();

  if (!request || request.receiver_id !== userId || request.status !== "pending") {
    throw AppError.user("This friend request is no longer available.");
  }

  const a = request.sender_id;
  const b = request.receiver_id;
  const [userA, userB] = a < b ? [a, b] : [b, a];

  const { error: insertError } = await admin
    .from("friendships")
    .insert({ user_id: userA, friend_id: userB });

  const { error: updateError } = await admin
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);

  if (insertError || updateError) {
    throw AppError.infrastructure("Failed to accept friend request.");
  }
}

export async function declineFriendRequest(
  userId: string,
  requestId: string,
): Promise<void> {
  const admin = createAdminClient();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("friend_requests")
    .select("receiver_id, status")
    .eq("id", requestId)
    .single();

  if (!request || request.receiver_id !== userId || request.status !== "pending") {
    throw AppError.user("This friend request is no longer available.");
  }

  const { error } = await admin
    .from("friend_requests")
    .update({ status: "declined" })
    .eq("id", requestId);

  if (error) {
    throw AppError.infrastructure("Failed to decline friend request.");
  }
}

export async function removeFriend(
  userId: string,
  friendId: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("friendships")
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

  if (error) {
    throw AppError.infrastructure("Failed to remove friend.");
  }
}