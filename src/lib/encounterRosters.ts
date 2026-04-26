import { getJSON, mgetJSON, setJSON } from './redis';
import { getRedis } from './redis';
import { slugifyStatblockId, redisPrefix } from './statblockKeys';

export type EncounterRosterRecord = {
  name: string;
  ids: string[];
  updatedAt: number;
};

function keyRoster(slug: string): string {
  return `${redisPrefix()}encounter:roster:${slug}`;
}

function keyRosterIndex(): string {
  return `${redisPrefix()}encounter:roster:index`;
}

/**
 * Deduplicate and canonicalise ids the same way as share packs.
 */
function cleanIds(rawIds: string[]): string[] {
  return Array.from(
    new Set(
      rawIds
        .map((x) => (typeof x === 'string' ? x.trim() : ''))
        .filter(Boolean)
        .map((x) => slugifyStatblockId(x))
    )
  ).slice(0, 200);
}

/**
 * Resolves a unique slug: preferred slug from the display name, then -2, -3, …
 */
async function uniqueSlugForName(name: string): Promise<string> {
  const base = (() => {
    const s = slugifyStatblockId(name);
    if (s && s !== 'statblock') return s;
    return 'roster';
  })();
  const redis = getRedis();
  for (let n = 0; n < 100; n++) {
    const candidate = n === 0 ? base : `${base}-${n}`;
    const taken = await redis.exists(keyRoster(candidate));
    if (taken === 0) return candidate;
  }
  throw new Error('Could not allocate roster id');
}

export async function createEncounterRoster(
  name: string,
  rawIds: string[]
): Promise<{ slug: string }> {
  const ids = cleanIds(rawIds);
  if (ids.length === 0) {
    throw new Error('EMPTY');
  }
  const displayName = name.trim() || 'Encounter';
  const slug = await uniqueSlugForName(displayName);
  const rec: EncounterRosterRecord = {
    name: displayName.slice(0, 200),
    ids,
    updatedAt: Date.now(),
  };
  const redis = getRedis();
  await setJSON(keyRoster(slug), rec);
  await redis.sadd(keyRosterIndex(), slug);
  return { slug };
}

export async function getEncounterRoster(slug: string): Promise<EncounterRosterRecord | null> {
  return getJSON<EncounterRosterRecord>(keyRoster(slug));
}

export type EncounterRosterListItem = {
  slug: string;
  name: string;
  count: number;
  updatedAt: number;
};

export async function listEncounterRosters(): Promise<EncounterRosterListItem[]> {
  const redis = getRedis();
  const slugs = (await redis.smembers(keyRosterIndex())) as string[];
  if (!Array.isArray(slugs) || slugs.length === 0) return [];

  const keys = slugs.map((s) => keyRoster(s));
  const records = await mgetJSON<EncounterRosterRecord>(keys);

  const out: EncounterRosterListItem[] = [];
  slugs.forEach((slug, i) => {
    const rec = records[i];
    if (!rec || !Array.isArray(rec.ids)) return;
    out.push({
      slug,
      name: rec.name || slug,
      count: rec.ids.length,
      updatedAt: rec.updatedAt || 0,
    });
  });

  out.sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
  return out;
}

export async function updateEncounterRoster(
  slug: string,
  input: { name?: string; ids?: string[] }
): Promise<EncounterRosterRecord | null> {
  const existing = await getEncounterRoster(slug);
  if (!existing) return null;
  const name =
    input.name !== undefined
      ? input.name.trim().slice(0, 200) || existing.name
      : existing.name;
  const ids = input.ids !== undefined ? cleanIds(input.ids) : existing.ids;
  if (ids.length === 0) {
    throw new Error('EMPTY');
  }
  const rec: EncounterRosterRecord = { name, ids, updatedAt: Date.now() };
  await setJSON(keyRoster(slug), rec);
  return rec;
}

export async function deleteEncounterRoster(slug: string): Promise<boolean> {
  const redis = getRedis();
  const k = keyRoster(slug);
  const n = (await redis.del(k)) as number;
  if (n > 0) {
    await redis.srem(keyRosterIndex(), slug);
    return true;
  }
  return false;
}
