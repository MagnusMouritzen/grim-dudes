'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronIcon } from '@/components/icons';

export default function AdminPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    });
  };

  return (
    <div className="max-w-md mx-auto grim-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="grim-label">Admin</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-parchment/70 hover:text-gold-400 text-xs uppercase tracking-wider"
        >
          <ChevronIcon className="w-3.5 h-3.5 rotate-180" /> Bestiary
        </Link>
      </div>
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">Dashboard</h1>
        <p className="text-parchment/80 text-sm mt-1">
          Editing routes require a signed-in session when{' '}
          <code className="text-gold-400/90">AUTH_SECRET</code> and a password are configured.
          Use <Link href="/login" className="text-gold-400 hover:underline">/login</Link> to sign
          in.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/new" className="grim-btn-primary">
          New stat block
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="grim-btn-ghost"
          disabled={pending}
        >
          {pending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}
