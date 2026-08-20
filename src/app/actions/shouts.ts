"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import { AppError, toUserMessage } from "@/lib/errors";
import { sendShout } from "@/services/shouts";
import type { ProviderId } from "@/types/domain";

const songSchema = z.object({
  provider: z.enum(["itunes", "spotify"]),
  providerSongId: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  artist: z.string().trim().min(1).max(200),
  album: z.string().trim().max(200).nullable().optional(),
  artworkUrl: z.string().trim().url().max(1000).nullable().optional(),
  previewUrl: z.string().trim().url().max(1000).nullable().optional(),
  externalUrl: z.string().trim().url().max(1000),
  duration: z.number().int().nonnegative().nullable().optional(),
});

const sendShoutSchema = z.object({
  receiverId: z.string().uuid("Invalid friend id."),
  song: songSchema,
  message: z
    .string()
    .trim()
    .max(280, "Message must be at most 280 characters")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export type SendShoutActionState = {
  error?: string;
  success?: string;
  shoutId?: string;
};

function message(err: unknown): string {
  return err instanceof AppError && err.kind === "user"
    ? err.message
    : toUserMessage(err);
}

/**
 * Sends a shout to a friend. The song is re-validated server-side; the
 * recipient must be a friend (enforced in the service with the admin client).
 */
export async function sendShoutAction(
  _prevState: SendShoutActionState,
  formData: FormData,
): Promise<SendShoutActionState> {
  const user = await requireUser();

  const rawSong = JSON.parse(String(formData.get("song") ?? "{}"));
  const parsed = sendShoutSchema.safeParse({
    receiverId: formData.get("receiverId"),
    song: rawSong,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Invalid shout." };
  }

  const { receiverId, song, message: shoutMessage } = parsed.data;

  try {
    await sendShout({
      senderId: user.id,
      receiverId,
      song: {
        provider: song.provider as ProviderId,
        providerSongId: song.providerSongId,
        title: song.title,
        artist: song.artist,
        album: song.album ?? null,
        artworkUrl: song.artworkUrl ?? null,
        previewUrl: song.previewUrl ?? null,
        externalUrl: song.externalUrl,
        duration: song.duration ?? null,
      },
      message: shoutMessage,
    });
  } catch (err) {
    return { error: message(err) };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
