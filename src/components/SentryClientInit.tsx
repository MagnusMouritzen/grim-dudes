'use client';

import { useEffect } from 'react';

/**
 * Server-side Sentry is started from instrumentation.ts. This mirrors init for
 * the browser when NEXT_PUBLIC_SENTRY_DSN is set. Uses @sentry/browser so the
 * client bundle does not pull Node-only Sentry integrations.
 */
export default function SentryClientInit() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    void import('@sentry/browser').then((Sentry) => {
      Sentry.init({ dsn, tracesSampleRate: 0.1, sendDefaultPii: false });
    });
  }, []);
  return null;
}
