const DEFAULT_PALETTE = ["#52525b", "#a1a1aa", "#3f3f46", "#71717a"];

type Bucket = { count: number; r: number; g: number; b: number };

/** Buckets are cached per artwork URL; the top colors are derived on read. */
const bucketCache = new Map<string, Bucket[]>();

/**
 * Returns the dominant colors of an album artwork image, as hex strings.
 * The image is fetched through the authenticated /api/artwork route because
 * the provider CDN does not send CORS headers, so canvas pixel reads would
 * otherwise be tainted. Falls back to a neutral gray palette on any failure.
 */
export async function getArtworkPalette(artworkUrl: string | null): Promise<string[]> {
  if (!artworkUrl) return DEFAULT_PALETTE;
  const buckets = await getBuckets(artworkUrl);
  return selectPalette(buckets);
}

async function getBuckets(artworkUrl: string): Promise<Bucket[]> {
  const cached = bucketCache.get(artworkUrl);
  if (cached) return cached;
  const buckets = await extractBuckets(artworkUrl);
  bucketCache.set(artworkUrl, buckets);
  return buckets;
}

async function extractBuckets(artworkUrl: string): Promise<Bucket[]> {
  try {
    const res = await fetch(`/api/artwork?url=${encodeURIComponent(artworkUrl)}`);
    if (!res.ok) throw new Error("bad artwork response");

    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);

    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("no canvas context");

    ctx.drawImage(bitmap, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    bitmap.close();

    return quantize(data);
  } catch {
    return [];
  }
}

/** Buckets pixels by 4-bit-per-channel, keeping sums for later averaging. */
function quantize(pixels: Uint8ClampedArray): Bucket[] {
  const buckets = new Map<
    number,
    { count: number; r: number; g: number; b: number }
  >();

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 125) continue;
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
    } else {
      buckets.set(key, { count: 1, r, g, b });
    }
  }

  return [...buckets.values()];
}

function selectPalette(buckets: Bucket[]): string[] {
  if (buckets.length === 0) return DEFAULT_PALETTE;

  const top = [...buckets]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return top.map(({ r, g, b, count }) => {
    const rr = Math.round(r / count);
    const gg = Math.round(g / count);
    const bb = Math.round(b / count);
    return `#${[rr, gg, bb].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  });
}