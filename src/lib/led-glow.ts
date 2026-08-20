"use client";

import { useEffect, useState } from "react";

import { getArtworkPalette } from "@/lib/colors";
import { useSettings } from "@/components/settings/settings-provider";
import type { GlowIntensity } from "@/lib/settings";

const GLOW_CONFIG: Record<GlowIntensity, { px: number; speed: number }> = {
  subtle: { px: 2, speed: 14 },
  medium: { px: 3, speed: 9 },
  vivid: { px: 4, speed: 6 },
};

/** Converts 0..1 opacity to a 2-digit hex alpha suffix for #rrggbb colors. */
function alphaHex(opacity: number): string {
  return Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0");
}

/** Soft neon halo behind the LED ring. `strength` is 0..100; 0 = no neon. */
function neonShadow(colors: string[], strength: number): string {
  if (strength <= 0) return "none";
  const s = strength / 100;
  return [
    `0 0 ${Math.round(10 + 50 * s)}px ${Math.round(2 + 12 * s)}px ${colors[0]}${alphaHex(0.5 * s)}`,
    `0 0 ${Math.round(4 + 20 * s)}px ${Math.round(1 + 4 * s)}px ${colors[1]}${alphaHex(0.35 * s)}`,
  ].join(", ");
}

export type LedGlowStyle = {
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Rotating LED-strip ring around an element while `active` (e.g. a song
 * preview playing). The ring is the element's own border, painted with a
 * conic gradient clipped to border-box (see `.led-glow` in globals.css), so
 * no extra DOM nodes are introduced and the child tree is never remounted.
 * Returns class/style to spread onto the element, or nothing when inactive.
 */
export function useLedGlow(
  artworkUrl: string | null | undefined,
  active: boolean,
): LedGlowStyle {
  const { settings } = useSettings();
  const [palette, setPalette] = useState<string[]>([]);

  useEffect(() => {
    if (!settings.ambientGlow || !artworkUrl) return;
    let ok = true;
    getArtworkPalette(artworkUrl).then((p) => {
      if (ok) setPalette(p);
    });
    return () => {
      ok = false;
    };
  }, [artworkUrl, settings.ambientGlow]);

  const glow = active && settings.ambientGlow && !!artworkUrl && palette.length > 0;
  if (!glow) return {};

  const config = GLOW_CONFIG[settings.glowIntensity];
  return {
    className: "led-glow",
    style: {
      "--led-px": `${config.px}px`,
      "--led-speed": `${config.speed}s`,
      "--led-c1": palette[0],
      "--led-c2": palette[1],
      "--led-c3": palette[2],
      "--led-c4": palette[3],
      "--led-neon": neonShadow(palette, settings.neonGlow),
    } as React.CSSProperties,
  };
}