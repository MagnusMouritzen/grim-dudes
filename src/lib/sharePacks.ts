import { getJSON, setJSON } from './redis';
import { slugifyStatblockId, redisPrefix } from './statblockKeys';

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

type SharePackRecord = { ids: string[]; createdAt: number };

function keySharePack(id: string): string {
  return `${redisPrefix()}sharepack:${id}`;
}

function generateId(): string {
  // 8-char base36 id: ~41 bits; fine for sharepack URLs.
  const rand = Math.floor(Math.random() * 2 ** 41).toString(36);
  return rand.padStart(8, '0').slice(0, 10);
}

export async function createSharePack(rawIds: string[]): Promise<string> {
  const cleaned = Array.from(
    new Set(
      rawIds
        .map((x) => (typeof x === 'string' ? x.trim() : ''))
        .filter(Boolean)
        .map((x) => slugifyStatblockId(x))
    )
  ).slice(0, 200);
  if (cleaned.length === 0) {
    throw new Error('EMPTY');
  }
  const id = generateId();
  await setJSON<SharePackRecord>(
    keySharePack(id),
    { ids: cleaned, createdAt: Date.now() },
    { ex: DEFAULT_TTL_SECONDS }
  );
  return id;
}

export async function readSharePack(id: string): Promise<string[] | null> {
  const data = await getJSON<SharePackRecord>(keySharePack(id));
  if (!data || !Array.isArray(data.ids)) return null;
  return data.ids.filter((x): x is string => typeof x === 'string');
}
