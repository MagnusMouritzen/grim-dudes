import { getRedis } from './redis';
import { keyStatblock, keyStatblockIndex } from './statblockKeys';

export type StatblockRecord = Record<string, unknown> & { id: string; name?: string };

function parseRecord(raw: string | null): StatblockRecord | null {
  if (raw == null || raw === '') return null;
  try {
    const data = JSON.parse(raw) as StatblockRecord;
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

/** Sorted by name (case-insensitive), then id */
export async function listStatblocks(): Promise<StatblockRecord[]> {
  const redis = getRedis();
  const indexKey = keyStatblockIndex();
  const ids = await redis.smembers(indexKey);
  const sortedIds = [...ids].sort((a, b) => a.localeCompare(b));
  if (sortedIds.length === 0) return [];

  const keys = sortedIds.map((id) => keyStatblock(id));
  const values = (await redis.mget(...keys)) as (string | null)[];

  const blocks: StatblockRecord[] = [];
  const orphans: string[] = [];

  sortedIds.forEach((id, i) => {
    const rec = parseRecord(values[i] ?? null);
    if (!rec) {
      orphans.push(id);
      return;
    }
    const merged = { ...rec, id: String(rec.id || id), name: rec.name || 'Unnamed' };
    blocks.push(merged as StatblockRecord);
  });

  if (orphans.length > 0) {
    await Promise.all(orphans.map((id) => redis.srem(indexKey, id)));
  }

  blocks.sort((a, b) => {
    const na = String(a.name || '').toLowerCase();
    const nb = String(b.name || '').toLowerCase();
    if (na !== nb) return na.localeCompare(nb);
    return String(a.id).localeCompare(String(b.id));
  });

  return blocks;
}

export async function getStatblockById(id: string): Promise<StatblockRecord | null> {
  const redis = getRedis();
  const raw = await redis.get<string>(keyStatblock(id));
  const rec = parseRecord(raw);
  if (!rec) return null;
  return { ...rec, id: String(rec.id || id) } as StatblockRecord;
}

export async function saveStatblock(payload: StatblockRecord): Promise<StatblockRecord> {
  const redis = getRedis();
  const id = String(payload.id);
  const key = keyStatblock(id);
  const indexKey = keyStatblockIndex();
  const json = JSON.stringify(payload);
  await redis.set(key, json);
  await redis.sadd(indexKey, id);
  return payload;
}

export async function deleteStatblock(id: string): Promise<boolean> {
  const redis = getRedis();
  const key = keyStatblock(id);
  const existed = await redis.exists(key);
  if (existed !== 1) return false;
  await redis.del(key);
  await redis.srem(keyStatblockIndex(), id);
  return true;
}
