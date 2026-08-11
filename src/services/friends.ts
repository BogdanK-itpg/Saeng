import { AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { FriendRequest, Profile } from "@/types/domain";

import { mapProfile, PROFILE_COLUMNS } from "./_row-mappers";

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
    const profile = (isUserSlot ? row.friend_profile : row.user_profile)?.[0];
    if (profile) friends.push(mapProfile(profile));
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
  const { data, error } = await supabase
    .from("friend_requests")
    .insert({ sender_id: userId, receiver_id: receiverId })
    .select()
    .single();
  if (error) {
    throw AppError.user("Could not send friend request.");
  }
  return {
    id: data.id,
    senderId: data.sender_id,
    receiverId: data.receiver_id,
    status: data.status,
    createdAt: data.created_at,
  };
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