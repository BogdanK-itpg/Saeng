export type ProviderId = "itunes" | "spotify";

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FriendRequestStatus = "pending" | "accepted" | "declined";

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
}

export interface SongReference {
  id: string;
  provider: ProviderId;
  providerSongId: string;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  previewUrl: string | null;
  externalUrl: string;
  duration: number | null;
  createdAt: string;
}

export interface Shout {
  id: string;
  senderId: string;
  receiverId: string;
  songReferenceId: string;
  message: string | null;
  sentAt: string;
  seenAt: string | null;
  replyToShoutId: string | null;
}

export interface Reaction {
  id: string;
  shoutId: string;
  userId: string;
  reactionType: string;
  createdAt: string;
}

/** A reaction joined with the reactor's profile. */
export interface ReactionWithActor extends Reaction {
  user: Pick<Profile, "id" | "username" | "displayName" | "avatarUrl">;
}

export type NotificationType = "friend_request" | "shout_received" | "reaction";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string | null;
  relatedEntityId: string | null;
  readAt: string | null;
  createdAt: string;
}

// Convenience view types.

/** A Shout joined with its song + sender/recipient profiles. */
export interface ShoutWithDetails extends Shout {
  song: SongReference;
  sender: Pick<Profile, "id" | "username" | "displayName" | "avatarUrl">;
  receiver: Pick<Profile, "id" | "username" | "displayName" | "avatarUrl">;
  myReaction: Reaction | null;
  reactions: Reaction[];
}

/** A friend request joined with the counterpart profile(s). */
export interface FriendRequestWithProfiles extends FriendRequest {
  sender: Pick<Profile, "id" | "username" | "displayName" | "avatarUrl">;
  receiver: Pick<Profile, "id" | "username" | "displayName" | "avatarUrl">;
}

export interface NotificationWithActor extends Notification {
  actor: Pick<Profile, "id" | "username" | "displayName" | "avatarUrl"> | null;
}