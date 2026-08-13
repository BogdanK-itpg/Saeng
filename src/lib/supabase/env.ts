/** Resolves the public Supabase key. New-style publishable keys are the
 *  replacement for the legacy anon key; accept either so `.env` setups
 *  created with either name keep working. */
export function getPublicSupabaseKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}