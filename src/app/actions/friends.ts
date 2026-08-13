"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import { AppError, toUserMessage } from "@/lib/errors";
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
  withdrawFriendRequest,
} from "@/services/friends";

const uuidSchema = z.string().uuid("Invalid id.");

export type FriendActionState = {
  error?: string;
  success?: string;
};

function message(err: unknown): string {
  return err instanceof AppError && err.kind === "user"
    ? err.message
    : toUserMessage(err);
}

export async function sendFriendRequestAction(
  _prevState: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  const user = await requireUser();
  const parsed = uuidSchema.safeParse(formData.get("receiverId"));
  if (!parsed.success) return { error: "Invalid user id." };

  try {
    await sendFriendRequest(user.id, parsed.data);
  } catch (err) {
    return { error: message(err) };
  }

  revalidatePath("/friends");
  return { success: "Friend request sent." };
}

export async function acceptFriendRequestAction(
  _prevState: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  const user = await requireUser();
  const parsed = uuidSchema.safeParse(formData.get("requestId"));
  if (!parsed.success) return { error: "Invalid request id." };

  try {
    await acceptFriendRequest(user.id, parsed.data);
  } catch (err) {
    return { error: message(err) };
  }

  revalidatePath("/friends");
  return { success: "Friend request accepted." };
}

export async function declineFriendRequestAction(
  _prevState: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  const user = await requireUser();
  const parsed = uuidSchema.safeParse(formData.get("requestId"));
  if (!parsed.success) return { error: "Invalid request id." };

  try {
    await declineFriendRequest(user.id, parsed.data);
  } catch (err) {
    return { error: message(err) };
  }

  revalidatePath("/friends");
  return { success: "Friend request declined." };
}

export async function withdrawFriendRequestAction(
  _prevState: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  const user = await requireUser();
  const parsed = uuidSchema.safeParse(formData.get("requestId"));
  if (!parsed.success) return { error: "Invalid request id." };

  try {
    await withdrawFriendRequest(user.id, parsed.data);
  } catch (err) {
    return { error: message(err) };
  }

  revalidatePath("/friends");
  return { success: "Friend request withdrawn." };
}

export async function removeFriendAction(
  _prevState: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  const user = await requireUser();
  const parsed = uuidSchema.safeParse(formData.get("friendId"));
  if (!parsed.success) return { error: "Invalid user id." };

  try {
    await removeFriend(user.id, parsed.data);
  } catch (err) {
    return { error: message(err) };
  }

  revalidatePath("/friends");
  return { success: "Friend removed." };
}