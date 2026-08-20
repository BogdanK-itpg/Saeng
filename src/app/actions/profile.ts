"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/current-user";
import { AppError, toUserMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvatarPublicUrl, updateProfile } from "@/services/profiles";
import { profileSchema } from "@/lib/validation/schemas";

export type ProfileState = { error?: string; success?: string };

export async function updateProfileAction(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  try {
    await updateProfile(user.id, parsed.data);
  } catch (err) {
    const message = err instanceof AppError && err.kind === "user"
      ? err.message
      : toUserMessage(err);
    return { error: message };
  }

  revalidatePath("/profile");
  return { success: "Profile updated." };
}

/**
 * After the client uploads an avatar to storage at a path within the user's
 * folder, persist the public URL on the profile. The path is re-validated
 * here; direct path construction belongs only to the authenticated upload.
 */
export async function setAvatarAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const path = formData.get("path");
  if (typeof path !== "string" || !path.startsWith(`${user.id}/`)) {
    throw AppError.user("Invalid avatar path.");
  }

  // Server-side re-validation of the uploaded object: only image files may
  // become an avatar URL (client-side checks are not a security boundary).
  const admin = createAdminClient();
  const { data: object } = await admin
    .from("storage.objects")
    .select("metadata")
    .eq("bucket_id", "avatars")
    .eq("name", path)
    .maybeSingle();
  const mime = object?.metadata?.mimetype;
  const size = object?.metadata?.size;
  const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
  if (!mime || !ALLOWED_MIME.includes(mime)) {
    throw AppError.user("Only JPG, PNG, or WebP images can be used as an avatar.");
  }
  if (typeof size === "number" && size > 5 * 1024 * 1024) {
    throw AppError.user("Image must be 5 MB or smaller.");
  }

  const supabase = await createClient();
  const avatarUrl = getAvatarPublicUrl(path);
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (error) {
    throw AppError.infrastructure("Failed to set avatar", error.code);
  }

  revalidatePath("/profile");
  redirect("/profile");
}