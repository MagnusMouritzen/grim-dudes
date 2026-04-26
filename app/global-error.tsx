'use client';

import { useEffect } from 'react';
import { Cinzel, Crimson_Text } from 'next/font/google';
import './globals.css';

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-display' });
const crimson = Crimson_Text({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-body',
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    void import('@sentry/browser').then((Sentry) => {
      Sentry.init({ dsn, tracesSampleRate: 0.1, sendDefaultPii: false });
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <html lang="en" className={`${cinzel.variable} ${crimson.variable}`}>
      <body className="bg-ink-900 text-parchment-100 min-h-screen flex items-center justify-center p-6">
        <div className="grim-page w-full max-w-md motion-safe:animate-fade-in">
          <div className="grim-card p-10 w-full text-center space-y-4 border-blood-700/60 ring-1 ring-stone-800/40">
            <h1 className="font-display text-2xl text-blood-300 tracking-wide">Catastrophe</h1>
            <p className="text-parchment-200/90 text-sm">
              {error.message || 'A fatal error felled the application.'}
            </p>
            <button type="button" onClick={reset} className="grim-btn-primary">
              Rebuild the world
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
