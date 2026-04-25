import { slugifyStatblockId } from '@/lib/statblockKeys';
import { normalizeStatblockPayload, type StatblockPayload } from '@/lib/validateStatblock';

const API = '/api';

export async function allocateDuplicateStatblockId(data: StatblockPayload): Promise<string> {
  const root = `${slugifyStatblockId(String(data.id || data.name || 'statblock'))}-copy`;
  for (let i = 0; i < 50; i++) {
    const id = i === 0 ? root : `${root}-${i}`;
    const r = await fetch(`${API}/statblocks/${encodeURIComponent(id)}`, { method: 'GET' });
    if (r.status === 404) return id;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export function duplicateDisplayName(data: StatblockPayload, newId: string): string {
  const base = (data.name || newId).slice(0, 450);
  return `${base} (copy)`;
}

export async function postDuplicateStatblock(
  data: unknown
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const n = normalizeStatblockPayload(data);
  if (!n.ok) {
    return { ok: false, error: n.error };
  }
  const dataNorm = n.data;
  const newId = await allocateDuplicateStatblockId(dataNorm);
  const payload = { ...dataNorm, id: newId, name: duplicateDisplayName(dataNorm, newId) };
  const res = await fetch(`${API}/statblocks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    return { ok: false, error: 'Sign in to save a copy' };
  }
  if (res.status === 503) {
    return { ok: false, error: 'Server refused save (check auth in production)' };
  }
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: j.error ?? 'Save failed' };
  }
  const out = (await res.json()) as { id?: string };
  return { ok: true, id: String(out.id ?? newId) };
}
