import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** Returns the authenticated user, or null when there is no session. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Returns the authenticated user, redirecting to /login when signed out. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}