/**
 * Canonical public origin for links (Obsidian, Discord, markdown). Prefer
 * NEXT_PUBLIC_SITE_URL in production; falls back to window or localhost.
 */
export function getPublicSiteBase(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env != null && env !== '') {
    return env.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}
