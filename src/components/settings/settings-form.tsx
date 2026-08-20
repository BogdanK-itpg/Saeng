"use client";

import {
  useSettings,
} from "@/components/settings/settings-provider";
import { cn } from "@/utils/cn";
import type { GlowIntensity, ThemePreference } from "@/lib/settings";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const INTENSITY_OPTIONS: { value: GlowIntensity; label: string; hint: string }[] = [
  { value: "subtle", label: "Subtle", hint: "A thin, slow glow." },
  { value: "medium", label: "Medium", hint: "A balanced ring." },
  { value: "vivid", label: "Vivid", hint: "A thick, fast ring." },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === option.value
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-left"
    >
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-700",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
    </button>
  );
}

export function SettingsForm() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="space-y-6">
      <Section
        title="Appearance"
        description="Choose how Saeng looks. Saved on this device."
      >
        <div className="space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Theme</p>
          <Segmented<ThemePreference>
            value={settings.theme}
            options={THEME_OPTIONS}
            onChange={(theme) => updateSettings({ theme })}
          />
        </div>
      </Section>

      <Section
        title="Ambient glow"
        description="When a song preview is playing, outline its block with a rotating LED strip colored from the album cover, plus an optional neon halo."
      >
        <div className="space-y-4">
          <Switch
            checked={settings.ambientGlow}
            onChange={(ambientGlow) => updateSettings({ ambientGlow })}
            label="Glow while a preview plays"
          />
          <div className={cn("space-y-2", !settings.ambientGlow && "pointer-events-none opacity-40")}>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Glow intensity</p>
            <Segmented<GlowIntensity>
              value={settings.glowIntensity}
              options={INTENSITY_OPTIONS}
              onChange={(glowIntensity) => updateSettings({ glowIntensity })}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {
                INTENSITY_OPTIONS.find((o) => o.value === settings.glowIntensity)
                  ?.hint
              }
            </p>
          </div>
          <div className={cn("space-y-2", !settings.ambientGlow && "pointer-events-none opacity-40")}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Neon glow</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {settings.neonGlow === 0 ? "Off" : `${settings.neonGlow}%`}
              </p>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.neonGlow}
              onChange={(e) =>
                updateSettings({ neonGlow: Number(e.target.value) })
              }
              aria-label="Neon glow strength"
              className="w-full accent-zinc-900 dark:accent-zinc-100"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              A soft halo around the LED ring. Off when the glow is off.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}