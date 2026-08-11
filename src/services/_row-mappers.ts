import type { Profile } from "@/types/domain";

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, created_at, updated_at" as const;

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export { PROFILE_COLUMNS };
export type { ProfileRow };