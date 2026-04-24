/**
 * Canonical id for URLs and Redis: lowercase, non-alphanumerics (except `-` `_`)
 * become `-`, runs of `-` collapse. Empty result becomes `statblock`.
 */
export function slugifyStatblockId(baseId: string): string {
  return (
    String(baseId)
      .replace(/[^a-z0-9-_]/gi, '-')
      .replace(/-+/g, '-')
      .toLowerCase() || 'statblock'
  );
}

export function redisPrefix(): string {
  return process.env.REDIS_KEY_PREFIX || '';
}

export function keyStatblock(id: string): string {
  return `${redisPrefix()}statblock:${id}`;
}

export function keyStatblockIndex(): string {
  return `${redisPrefix()}statblock:index`;
}
