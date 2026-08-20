export type ThemePreference = "light" | "dark" | "system";
export type GlowIntensity = "subtle" | "medium" | "vivid";

export interface Settings {
  theme: ThemePreference;
  ambientGlow: boolean;
  glowIntensity: GlowIntensity;
  /** Neon halo strength around the glow ring, 0 (off) to 100. */
  neonGlow: number;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  ambientGlow: true,
  glowIntensity: "medium",
  neonGlow: 40,
};

export const SETTINGS_STORAGE_KEY = "songshout.settings";

/** Resolves a theme preference to a concrete theme. Client-only (uses window). */
export function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}