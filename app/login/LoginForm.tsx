'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ChevronIcon } from '@/components/icons';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') ?? '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim() || undefined,
          password,
          next: nextParam,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'Sign-in failed');
        return;
      }
      const data = (await res.json()) as { redirect?: string };
      router.push(data.redirect || '/');
      router.refresh();
    });
  };

  return (
    <div className="grim-page max-w-md mx-auto grim-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="grim-label">Sign in</p>
        <Link href="/" className="grim-back-link">
          <ChevronIcon className="w-3.5 h-3.5 rotate-180" /> Bestiary
        </Link>
      </div>
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">Admin access</h1>
        <p className="text-parchment/80 text-sm mt-1">
          Use the credentials configured for this deployment.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="login-user" className="grim-label">
            Username <span className="text-parchment/50 font-normal">(if required)</span>
          </label>
          <input
            id="login-user"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="grim-input mt-1"
          />
        </div>
        <div>
          <label htmlFor="login-pass" className="grim-label">
            Password
          </label>
          <input
            id="login-pass"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="grim-input mt-1"
          />
        </div>
        {error ? (
          <p className="text-sm text-red-400/90" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="grim-btn-primary w-full justify-center" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
