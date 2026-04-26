/**
 * First IP in X-Forwarded-For, or x-real-ip. For self-hosting, run behind a
 * reverse proxy you trust to set these; Vercel sets them.
 */
export function getClientIpFromHeaders(h: Headers): string {
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'anon'
  );
}

export function getClientIpFromRequest(req: Request): string {
  return getClientIpFromHeaders(req.headers);
}
