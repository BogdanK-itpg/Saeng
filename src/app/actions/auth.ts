"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authEmailForUsername } from "@/lib/auth/username-email";
import { loginSchema, registerSchema } from "@/lib/validation/schemas";

export async function registerAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error: string }> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { username, displayName, password } = parsed.data;
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) {
    return { error: "That username is already taken." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: authEmailForUsername(username),
    password,
    options: {
      data: { username, display_name: displayName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation were enabled (it should be disabled for the
  // username-based flow), the profile is created server-side by the trigger
  // once the user confirms. Redirect to the login page either way.
  if (data.user && !data.session) {
    redirect("/login?confirmed=1");
  }
  redirect("/dashboard");
}

export async function loginAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error: string }> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { username, password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: authEmailForUsername(username),
    password,
  });

  if (error) {
    return { error: "Invalid username or password." };
  }

  const next = formData.get("next");
  // Reject protocol-relative (`//host`) and backslash (`/\`) values so the
  // `next` param can never be an open redirect off the app.
  const nextUrl =
    typeof next === "string" && /^\/[^/\\]/.test(next)
      ? next
      : "/dashboard";
  redirect(nextUrl);
}

// ---------------------------------------------------------------------------
// Email-driven password reset — disabled for future development (auth is
// username-based as of 2026-08-20). Re-enable alongside the resend client and
// real email delivery.
// ---------------------------------------------------------------------------
/*
export async function forgotPasswordAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error: string }> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  redirect("/forgot-password?sent=1");
}
*/

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}