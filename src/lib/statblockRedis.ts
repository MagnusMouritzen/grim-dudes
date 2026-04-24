import { getRedis, getJSON, mgetJSON, setJSON } from './redis';
import { keyStatblock, keyStatblockIndex } from './statblockKeys';

export type StatblockRecord = Record<string, unknown> & { id: string; name?: string };

function isObjectRecord(v: unknown): v is StatblockRecord {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Sorted by name (case-insensitive), then id. O(N); see {@link listStatblocksPage} for pagination.
 * Does NOT mutate the index on read. Use {@link cleanupOrphans} explicitly.
 */
export async function listStatblocks(): Promise<StatblockRecord[]> {
  const redis = getRedis();
  const indexKey = keyStatblockIndex();
  const ids = await redis.smembers(indexKey);
  const sortedIds = [...ids].sort((a, b) => a.localeCompare(b));
  if (sortedIds.length === 0) return [];

  const keys = sortedIds.map((id) => keyStatblock(id));
  const values = await mgetJSON<StatblockRecord>(keys);

  const blocks: StatblockRecord[] = [];
  sortedIds.forEach((id, i) => {
    const rec = values[i];
    if (!isObjectRecord(rec)) return;
    blocks.push({ ...rec, id: String(rec.id || id), name: rec.name || 'Unnamed' });
  });

  blocks.sort((a, b) => {
    const na = String(a.name || '').toLowerCase();
    const nb = String(b.name || '').toLowerCase();
    if (na !== nb) return na.localeCompare(nb);
    return String(a.id).localeCompare(String(b.id));
  });

  return blocks;
}

/**
 * Paginated list using SSCAN. Note that SSCAN is unordered, so callers that need
 * alphabetical ordering should use {@link listStatblocks} or sort across pages.
 */
export async function listStatblocksPage(
  cursor: string | number = 0,
  count = 100
): Promise<{ blocks: StatblockRecord[]; nextCursor: string }> {
  const redis = getRedis();
  const indexKey = keyStatblockIndex();
  const [next, ids] = (await redis.sscan(indexKey, cursor, { count })) as [
    string | number,
    string[]
  ];
  if (ids.length === 0) {
    return { blocks: [], nextCursor: String(next) };
  }
  const keys = ids.map((id) => keyStatblock(id));
  const values = await mgetJSON<StatblockRecord>(keys);
  const blocks: StatblockRecord[] = [];
  ids.forEach((id, i) => {
    const rec = values[i];
    if (!isObjectRecord(rec)) return;
    blocks.push({ ...rec, id: String(rec.id || id), name: rec.name || 'Unnamed' });
  });
  return { blocks, nextCursor: String(next) };
}

export async function getStatblockById(id: string): Promise<StatblockRecord | null> {
  const rec = await getJSON<StatblockRecord>(keyStatblock(id));
  if (!isObjectRecord(rec)) return null;
  return { ...rec, id: String(rec.id || id) };
}

export async function saveStatblock(payload: StatblockRecord): Promise<StatblockRecord> {
  const redis = getRedis();
  const id = String(payload.id);
  const key = keyStatblock(id);
  const indexKey = keyStatblockIndex();
  // Atomic: ensure key + index membership are written together.
  const pipeline = redis.pipeline();
  pipeline.set(key, JSON.stringify(payload));
  pipeline.sadd(indexKey, id);
  await pipeline.exec();
  return payload;
}

export async function deleteStatblock(id: string): Promise<boolean> {
  const redis = getRedis();
  const key = keyStatblock(id);
  const indexKey = keyStatblockIndex();
  // Atomic delete + index removal. DEL returns 1 if the key existed.
  const pipeline = redis.pipeline();
  pipeline.del(key);
  pipeline.srem(indexKey, id);
  const results = (await pipeline.exec()) as Array<number | null>;
  const delCount = Number(results?.[0] ?? 0);
  return delCount > 0;
}

/**
 * Remove index entries whose value key no longer resolves (or is unparsable).
 * Intended to be run explicitly via a script or cron, NOT during reads.
 */
export async function cleanupOrphans(): Promise<{ removed: string[]; kept: number }> {
  const redis = getRedis();
  const indexKey = keyStatblockIndex();
  const ids = await redis.smembers(indexKey);
  if (ids.length === 0) return { removed: [], kept: 0 };
  const values = await mgetJSON<StatblockRecord>(ids.map((id) => keyStatblock(id)));
  const removed: string[] = [];
  ids.forEach((id, i) => {
    const rec = values[i];
    if (!isObjectRecord(rec)) removed.push(id);
  });
  if (removed.length > 0) {
    const pipeline = redis.pipeline();
    removed.forEach((id) => pipeline.srem(indexKey, id));
    await pipeline.exec();
  }
  return { removed, kept: ids.length - removed.length };
}

// Re-export the low-level helpers so scripts can use a single import path.
export { setJSON, getJSON, mgetJSON };
