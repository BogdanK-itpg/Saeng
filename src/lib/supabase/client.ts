import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseKey, getSupabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getPublicSupabaseKey());
}