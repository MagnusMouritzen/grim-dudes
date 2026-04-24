'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getClientIpFromHeaders } from '@/lib/clientIp';
import {
  deleteStatblock,
  saveStatblock,
  type StatblockRecord,
} from '@/lib/statblockRedis';
import { slugifyStatblockId } from '@/lib/statblockKeys';
import { validateStatblockPayload } from '@/lib/validateStatblock';
import {
  isCookieAuthenticated,
  isProdWriteAuthMisconfigured,
  PROD_WRITE_AUTH_MISCONFIG_MESSAGE,
} from '@/lib/session';
import { limitWriteByIp } from '@/lib/rateLimit';

async function checkLimit(): Promise<boolean> {
  const h = await headers();
  const { ok } = await limitWriteByIp(getClientIpFromHeaders(h));
  return ok;
}

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveStatblockAction(
  raw: unknown
): Promise<SaveResult> {
  if (isProdWriteAuthMisconfigured()) {
    return { ok: false, error: PROD_WRITE_AUTH_MISCONFIG_MESSAGE };
  }
  if (!(await isCookieAuthenticated(await cookies()))) {
    return { ok: false, error: 'Not authorised — sign in at /login.' };
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
  if (isProdWriteAuthMisconfigured()) {
    return { ok: false, error: PROD_WRITE_AUTH_MISCONFIG_MESSAGE };
  }
  if (!(await isCookieAuthenticated(await cookies()))) {
    return { ok: false, error: 'Not authorised — sign in at /login.' };
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

/** Convenience for navigation after a successful save from a Server Action. */
export async function redirectTo(path: string): Promise<never> {
  redirect(path);
}
