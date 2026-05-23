import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Centralized client for the unofficial Apex Legends Status API
 * (api.mozambiquehe.re / api.apexlegendsstatus.com).
 *
 * - Reads APEX_API_KEY from env; never hardcode.
 * - Caches successful responses in memory AND on disk under .cache/.
 *   The disk cache survives dev reloads and ISR regeneration, so we don't
 *   hammer an API with no uptime guarantee.
 * - On a network/HTTP failure, returns the last-known-good cached payload
 *   with stale:true so pages can show a banner instead of crashing.
 * - First time each endpoint succeeds, the raw JSON is written to
 *   .cache/<endpoint>.raw.json and logged once so we can inspect the
 *   real shape (the API is unofficial and changes).
 */

const BASE_URL = "https://api.mozambiquehe.re";
const CACHE_DIR = path.join(process.cwd(), ".cache");

export type ApexResult<T> = {
  data: T;
  fetchedAt: number;
  stale: boolean;
  source: "network" | "memory" | "disk";
};

type CacheEntry = { data: unknown; fetchedAt: number };
const memCache = new Map<string, CacheEntry>();
const loggedShapes = new Set<string>();

function cacheKey(endpoint: string, query: Record<string, string>): string {
  const parts = Object.entries(query)
    .filter(([k]) => k !== "auth")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return parts ? `${endpoint}?${parts}` : endpoint;
}

function cacheFilePath(key: string): string {
  const safe = key.replace(/[^a-z0-9._-]+/gi, "_");
  return path.join(CACHE_DIR, `${safe}.json`);
}

function rawShapeFilePath(endpoint: string): string {
  const safe = endpoint.replace(/[^a-z0-9._-]+/gi, "_");
  return path.join(CACHE_DIR, `${safe}.raw.json`);
}

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function readDiskCache(key: string): Promise<CacheEntry | null> {
  try {
    const buf = await fs.readFile(cacheFilePath(key), "utf8");
    return JSON.parse(buf) as CacheEntry;
  } catch {
    return null;
  }
}

async function writeDiskCache(key: string, entry: CacheEntry): Promise<void> {
  try {
    await ensureCacheDir();
    await fs.writeFile(cacheFilePath(key), JSON.stringify(entry), "utf8");
  } catch (err) {
    console.warn(`[apex] failed to write disk cache for ${key}:`, err);
  }
}

async function logRawShapeOnce(endpoint: string, raw: unknown): Promise<void> {
  if (loggedShapes.has(endpoint)) return;
  loggedShapes.add(endpoint);
  try {
    await ensureCacheDir();
    const file = rawShapeFilePath(endpoint);
    try {
      await fs.access(file);
      return;
    } catch {}
    const pretty = JSON.stringify(raw, null, 2);
    await fs.writeFile(file, pretty, "utf8");
    const preview = pretty.length > 1500 ? pretty.slice(0, 1500) + "\n…(truncated, full shape at " + file + ")" : pretty;
    console.log(`\n[apex] First successful fetch of ${endpoint}. Raw JSON shape:\n${preview}\n`);
  } catch (err) {
    console.warn(`[apex] failed to log raw shape for ${endpoint}:`, err);
  }
}

export async function fetchApex<T>(
  endpoint: string,
  query: Record<string, string> = {},
): Promise<ApexResult<T>> {
  const key = cacheKey(endpoint, query);
  const apiKey = process.env.APEX_API_KEY;

  if (!apiKey) {
    const mem = memCache.get(key);
    if (mem) {
      return { data: mem.data as T, fetchedAt: mem.fetchedAt, stale: true, source: "memory" };
    }
    const disk = await readDiskCache(key);
    if (disk) {
      memCache.set(key, disk);
      return { data: disk.data as T, fetchedAt: disk.fetchedAt, stale: true, source: "disk" };
    }
    throw new Error(
      "APEX_API_KEY is not set. Copy .env.local.example to .env.local and fill in your key from https://apexlegendsapi.com/auth.",
    );
  }

  const url = new URL(endpoint, BASE_URL);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  url.searchParams.set("auth", apiKey);

  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "apexdex/0.1 (+https://github.com/ThatDudeFreak/apexdex)" },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${endpoint}`);
    }
    const data = (await res.json()) as T;
    const entry: CacheEntry = { data, fetchedAt: Date.now() };
    memCache.set(key, entry);
    await writeDiskCache(key, entry);
    await logRawShapeOnce(endpoint, data);
    return { data, fetchedAt: entry.fetchedAt, stale: false, source: "network" };
  } catch (err) {
    console.warn(`[apex] fetch failed for ${endpoint}:`, err);
    const mem = memCache.get(key);
    if (mem) {
      return { data: mem.data as T, fetchedAt: mem.fetchedAt, stale: true, source: "memory" };
    }
    const disk = await readDiskCache(key);
    if (disk) {
      memCache.set(key, disk);
      return { data: disk.data as T, fetchedAt: disk.fetchedAt, stale: true, source: "disk" };
    }
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Endpoint shapes are unconfirmed (the API is unofficial and shifts), */
/* so the types below are intentionally loose. The first fetch logs    */
/* the real shape into .cache/<endpoint>.raw.json — refine then.       */
/* ------------------------------------------------------------------ */

export type MapInfo = {
  map?: string;
  code?: string;
  DurationInSecs?: number;
  DurationInMinutes?: number;
  remainingSecs?: number;
  remainingMins?: number;
  remainingTimer?: string;
  start?: number;
  end?: number;
  readableDate_start?: string;
  readableDate_end?: string;
  asset?: string;
  eventName?: string | null;
};

export type ModeRotation = {
  current?: MapInfo;
  next?: MapInfo;
};

export type MapRotationResponse = {
  battle_royale?: ModeRotation;
  ranked?: ModeRotation;
  ltm?: ModeRotation;
  control?: ModeRotation;
  gunGame?: ModeRotation;
  [mode: string]: ModeRotation | undefined;
};

export type PredatorPlatform = {
  foundRank?: number;
  val?: number;
  uid?: string;
  totalMastersAndPreds?: number;
};

export type PredatorResponse = {
  RP?: {
    PC?: PredatorPlatform;
    PS4?: PredatorPlatform;
    X1?: PredatorPlatform;
    SWITCH?: PredatorPlatform;
    [platform: string]: PredatorPlatform | undefined;
  };
  AP?: {
    PC?: PredatorPlatform;
    PS4?: PredatorPlatform;
    X1?: PredatorPlatform;
    SWITCH?: PredatorPlatform;
    [platform: string]: PredatorPlatform | undefined;
  };
};

export type CraftingItem = {
  item?: string;
  cost?: number;
  itemType?: { name?: string; rarity?: string; asset?: string };
};

export type CraftingBundle = {
  bundle?: string;
  bundleType?: string;
  start?: number;
  end?: number;
  startDate?: string;
  endDate?: string;
  bundleContent?: CraftingItem[];
};

export type CraftingResponse = CraftingBundle[];

export function getMapRotation(): Promise<ApexResult<MapRotationResponse>> {
  return fetchApex<MapRotationResponse>("/maprotation", { version: "2" });
}

export function getPredator(): Promise<ApexResult<PredatorResponse>> {
  return fetchApex<PredatorResponse>("/predator");
}

export function getCrafting(): Promise<ApexResult<CraftingResponse>> {
  return fetchApex<CraftingResponse>("/crafting");
}
