"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import { AppError, toUserMessage } from "@/lib/errors";
import { reactionSchema } from "@/lib/validation/schemas";
import { removeReaction, setReaction } from "@/services/reactions";

const shoutIdSchema = z.string().uuid("Invalid shout id.");

export type ReactionActionState = { error?: string };

function message(err: unknown): string {
  return err instanceof AppError && err.kind === "user"
    ? err.message
    : toUserMessage(err);
}

/**
 * Sets (or changes) the current user's reaction on a shout. RLS only allows
 * the shout recipient to insert, and the unique index
 * (shout_id, user_id) keeps it to one reaction per user per shout.
 */
export async function setReactionAction(
  shoutId: string,
  reactionType: string,
): Promise<ReactionActionState> {
  const user = await requireUser();

  const id = shoutIdSchema.safeParse(shoutId);
  const type = reactionSchema.safeParse(reactionType);
  if (!id.success) return { error: id.error.issues[0]?.message ?? "Invalid shout id." };
  if (!type.success) return { error: type.error.issues[0]?.message ?? "Invalid reaction." };

  try {
    await setReaction(user.id, id.data, type.data);
    revalidatePath(`/shouts/${id.data}`);
    return {};
  } catch (err) {
    return { error: message(err) };
  }
}

/** Removes the current user's reaction from a shout (no-op if none exists). */
export async function removeReactionAction(
  shoutId: string,
): Promise<ReactionActionState> {
  const user = await requireUser();

  const id = shoutIdSchema.safeParse(shoutId);
  if (!id.success) return { error: id.error.issues[0]?.message ?? "Invalid shout id." };

  try {
    await removeReaction(user.id, id.data);
    revalidatePath(`/shouts/${id.data}`);
    return {};
  } catch (err) {
    return { error: message(err) };
  }
}