const USERNAME_EMAIL_DOMAIN = "songshout.local";

/**
 * Maps a username to the synthetic email used for the Supabase Auth identity.
 * Supabase Auth requires an email for signUp/signInWithPassword, but the app
 * is username-based, so we derive a deterministic, internal-only email from
 * the (unique, lowercase) username. Users never see or type this address.
 */
export function authEmailForUsername(username: string): string {
  return `${username.toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}