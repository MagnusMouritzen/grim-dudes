/**
 * Tiny structured logger. Emits single-line JSON on stdout/stderr so Vercel Log
 * Drains (or Axiom / Logflare) can parse them straight into queryable fields.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogCtx = Record<string, unknown>;

function write(level: LogLevel, event: string, ctx?: LogCtx) {
  const line = JSON.stringify({
    level,
    event,
    time: new Date().toISOString(),
    ...ctx,
  });
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function logDebug(event: string, ctx?: LogCtx) {
  if (process.env.NODE_ENV !== 'production') write('debug', event, ctx);
}
export function logInfo(event: string, ctx?: LogCtx) {
  write('info', event, ctx);
}
export function logWarn(event: string, ctx?: LogCtx) {
  write('warn', event, ctx);
}
export function logError(event: string, err: unknown, ctx?: LogCtx) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  write('error', event, { ...ctx, message, stack });
}

/** Extract a request id we can tie logs to - Vercel sets `x-vercel-id`. */
export function requestId(req: Request): string | null {
  return (
    req.headers.get('x-vercel-id') ||
    req.headers.get('x-request-id') ||
    null
  );
}
