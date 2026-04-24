'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from '@/lib/redis';
import {
  deleteStatblock,
  saveStatblock,
  type StatblockRecord,
} from '@/lib/statblockRedis';
import { slugifyStatblockId } from '@/lib/statblockKeys';
import { validateStatblockPayload } from '@/lib/validateStatblock';
import { isValidWriteToken } from '@/lib/writeAuth';

const WRITE_TOKEN_COOKIE = 'grim_write_token';

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(WRITE_TOKEN_COOKIE)?.value ?? null;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'anon'
  );
}

let actionLimiter: Ratelimit | null = null;
async function checkLimit(): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return true;
  }
  if (!actionLimiter) {
    actionLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(
        Number(process.env.RATE_LIMIT_WRITES_PER_MIN || '30'),
        '60 s'
      ),
      prefix: `${process.env.REDIS_KEY_PREFIX || ''}ratelimit:action`,
      analytics: false,
    });
  }
  const { success } = await actionLimiter.limit(await clientIp());
  return success;
}

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveStatblockAction(
  raw: unknown
): Promise<SaveResult> {
  if (!isValidWriteToken(await getToken())) {
    return { ok: false, error: 'Not authorised - open /admin to set a write token.' };
  }
  if (!(await checkLimit())) {
    return { ok: false, error: 'Rate limit exceeded. Try again shortly.' };
  }
  const validated = validateStatblockPayload(raw);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }
  const data = validated.data;
  const baseId = data.id || data.name || 'statblock';
  const id = slugifyStatblockId(String(baseId));
  const payload = { ...data, id } as StatblockRecord;
  try {
    await saveStatblock(payload);
  } catch (e) {
    console.error('[saveStatblockAction] failed', e);
    return { ok: false, error: 'Failed to save stat block.' };
  }
  revalidatePath('/');
  revalidatePath(`/statblock/${id}`);
  return { ok: true, id };
}

export async function deleteStatblockAction(id: string): Promise<SaveResult> {
  if (!isValidWriteToken(await getToken())) {
    return { ok: false, error: 'Not authorised - open /admin to set a write token.' };
  }
  if (!(await checkLimit())) {
    return { ok: false, error: 'Rate limit exceeded. Try again shortly.' };
  }
  const slug = slugifyStatblockId(id);
  try {
    const ok = await deleteStatblock(slug);
    if (!ok) return { ok: false, error: 'Not found' };
  } catch (e) {
    console.error('[deleteStatblockAction] failed', e);
    return { ok: false, error: 'Failed to delete stat block.' };
  }
  revalidatePath('/');
  return { ok: true, id: slug };
}

/**
 * Used by the `/admin` page to set the write token cookie so Server Actions
 * can authenticate without the client passing headers.
 */
export async function setWriteTokenCookieAction(
  token: string
): Promise<{ ok: boolean }> {
  const store = await cookies();
  if (!token) {
    store.delete(WRITE_TOKEN_COOKIE);
    return { ok: true };
  }
  store.set(WRITE_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
  return { ok: true };
}

export async function clearWriteTokenCookieAction(): Promise<void> {
  const store = await cookies();
  store.delete(WRITE_TOKEN_COOKIE);
}

/** Convenience for navigation after a successful save from a Server Action. */
export async function redirectTo(path: string): Promise<never> {
  redirect(path);
}
