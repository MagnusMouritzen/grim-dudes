'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  clearWriteTokenCookieAction,
  setWriteTokenCookieAction,
} from '@/app-actions/statblocks';
import { ChevronIcon, CloseIcon, CheckIcon } from '@/components/icons';

const COOKIE_NAME = 'grim_write_token';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setHasToken(
      typeof document !== 'undefined' && document.cookie.includes(`${COOKIE_NAME}=`)
    );
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    startTransition(async () => {
      await setWriteTokenCookieAction(t);
      setToken('');
      setHasToken(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  };

  const handleClear = () => {
    startTransition(async () => {
      await clearWriteTokenCookieAction();
      setHasToken(false);
      setSaved(false);
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
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">Write token</h1>
        <p className="text-parchment/80 text-sm mt-1">
          Paste the shared secret so the editor can create, update, and delete stat blocks.
          Stored in a server-readable cookie (httpOnly). Leave blank to use without auth
          (local dev only).
        </p>
      </div>
      <form onSubmit={handleSave} className="space-y-2">
        <label htmlFor="write-token" className="grim-label">
          Token
        </label>
        <input
          id="write-token"
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={hasToken ? 'Stored (enter to replace)' : 'Paste token…'}
          className="grim-input font-mono"
        />
        <div className="flex items-center justify-between pt-1">
          <button
            type="submit"
            className="grim-btn-primary"
            disabled={!token.trim() || pending}
          >
            <CheckIcon className="w-4 h-4" />
            {saved ? 'Saved' : pending ? 'Saving…' : 'Save token'}
          </button>
          {hasToken && (
            <button
              type="button"
              onClick={handleClear}
              className="grim-btn-ghost"
              disabled={pending}
            >
              <CloseIcon className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </form>
      <p className="text-parchment/50 text-xs">
        Token status:{' '}
        <span className="font-mono text-gold-400">
          {hasToken ? 'stored' : 'not set'}
        </span>
      </p>
    </div>
  );
}
