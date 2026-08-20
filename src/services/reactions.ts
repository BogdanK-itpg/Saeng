import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Reaction, ReactionWithActor } from "@/types/domain";

import { PROFILE_COLUMNS, type ProfileRow } from "./_row-mappers";

function mapReaction(row: {
  id: string;
  shout_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}): Reaction {
  return {
    id: row.id,
    shoutId: row.shout_id,
    userId: row.user_id,
    reactionType: row.reaction_type,
    createdAt: row.created_at,
  };
}

/** Upserts the current user's reaction on a shout (one reaction per shout). */
export async function setReaction(
  userId: string,
  shoutId: string,
  reactionType: string,
): Promise<Reaction> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reactions")
    .upsert(
      { shout_id: shoutId, user_id: userId, reaction_type: reactionType },
      { onConflict: "shout_id,user_id" },
    )
    .select("id, shout_id, user_id, reaction_type, created_at")
    .single();

  if (error) {
    throw AppError.user("Could not add reaction.");
  }
  return mapReaction(data);
}

/** Removes the current user's reaction from a shout. */
export async function removeReaction(
  userId: string,
  shoutId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reactions")
    .delete()
    .eq("shout_id", shoutId)
    .eq("user_id", userId);

  if (error) {
    throw AppError.user("Could not remove reaction.");
  }
}

/** All reactions on a shout. */
export async function listReactions(shoutId: string): Promise<Reaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reactions")
    .select("id, shout_id, user_id, reaction_type, created_at")
    .eq("shout_id", shoutId);

  if (error) {
    throw AppError.infrastructure("Failed to load reactions", error.code);
  }
  return (data ?? []).map(mapReaction);
}

const REACTION_ACTOR_COLUMNS = `
  id, shout_id, user_id, reaction_type, created_at,
  user:profiles!reactions_user_id_fkey(${PROFILE_COLUMNS})
` as const;

type ReactionActorRow = {
  id: string;
  shout_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
  user: ProfileRow;
};

/** All reactions on a shout, joined with the reactor's profile. */
export async function listReactionsWithActors(
  shoutId: string,
): Promise<ReactionWithActor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reactions")
    .select(REACTION_ACTOR_COLUMNS)
    .eq("shout_id", shoutId)
    .order("created_at", { ascending: true });

  if (error) {
    throw AppError.infrastructure("Failed to load reactions", error.code);
  }

  // PostgREST returns the to-one FK join as an object (not an array); the
  // untyped builder infers arrays, so cast before mapping.
  return ((data ?? []) as unknown as ReactionActorRow[]).map((row) => ({
    ...mapReaction(row),
    user: {
      id: row.user.id,
      username: row.user.username,
      displayName: row.user.display_name,
      avatarUrl: row.user.avatar_url,
    },
  }));
}