import type { MusicProvider } from "./types";
import { ItunesProvider } from "./itunes/provider";

const providers = new Map<string, MusicProvider>();

function register<T extends MusicProvider>(id: string, provider: T): T {
  providers.set(id, provider);
  return provider;
}

// The active music providers. Spotify can be added later as a second provider
// by implementing the same interface and registering it here.
export const itunes = register("itunes", new ItunesProvider());

/** Returns the provider registered under `id`, or throws if unknown. */
export function getProvider(id: string): MusicProvider {
  const provider = providers.get(id);
  if (!provider) {
    throw new Error(`Unknown music provider: "${id}"`);
  }
  return provider;
}