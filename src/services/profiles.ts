import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/domain";

import { mapProfile, PROFILE_COLUMNS, type ProfileRow } from "./_row-mappers";

/** Whether a username is already taken by a different profile. */
export async function isUsernameTaken(
  username: string,
  excludeUserId?: string,
): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from("profiles").select("id").eq("username", username);
  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) {
    throw AppError.infrastructure("Failed to check username", error.code);
  }
  return !!data;
}

/** Fetches a profile by user id. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw AppError.infrastructure("Failed to load profile", error.code);
  }
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function updateProfile(
  userId: string,
  input: { username: string; displayName: string },
): Promise<Profile> {
  const supabase = await createClient();

  if (await isUsernameTaken(input.username, userId)) {
    throw AppError.user("That username is already taken.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ username: input.username, display_name: input.displayName })
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    throw AppError.infrastructure("Failed to update profile", error.code);
  }
  return mapProfile(data as ProfileRow);
}

/** Generates the public URL for an avatar object path. */
export function getAvatarPublicUrl(path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${url}/storage/v1/object/public/avatars/${path}`;
}