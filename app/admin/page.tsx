'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronIcon, PlusIcon, QuillIcon, ScrollIcon } from '@/components/icons';

type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: { index: number; error: string }[];
};

export default function AdminPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'skip' | 'overwrite'>('skip');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleLogout = () => {
    startTransition(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    });
  };

  const exportAllJson = async () => {
    setExportError(null);
    setExporting(true);
    try {
      const res = await fetch('/api/statblocks');
      if (!res.ok) {
        setExportError('Could not load stat blocks for export');
        return;
      }
      const data = await res.json();
      const text = JSON.stringify(data, null, 2);
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grim-dudes-statblocks-${new Date().toISOString().slice(0, 10)}.json`;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const runImport = async (file: File) => {
    setImportError(null);
    setImportResult(null);
    setImporting(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        setImportError('File is not valid JSON');
        return;
      }
      const items = Array.isArray(parsed) ? parsed : (parsed as { items?: unknown }).items;
      if (!Array.isArray(items)) {
        setImportError('JSON must be an array of stat blocks, or { items: [...] }');
        return;
      }
      const res = await fetch('/api/admin/import-statblocks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items, mode: importMode }),
      });
      if (res.status === 401) {
        setImportError('Sign in required to import');
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setImportError(err.error ?? 'Import failed');
        return;
      }
      const data = (await res.json()) as ImportResult;
      setImportResult(data);
      router.refresh();
    } catch {
      setImportError('Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-lg mx-auto grim-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="grim-label">Admin</p>
        <Link href="/" className="grim-back-link">
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
          <PlusIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">New</span>
          <span className="hidden sm:inline">New stat block</span>
        </Link>
        <button
          type="button"
          onClick={exportAllJson}
          className="grim-btn-ghost"
          disabled={exporting}
        >
          <ScrollIcon className="w-3.5 h-3.5" />
          {exporting ? 'Exporting…' : 'Export all (JSON)'}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="grim-btn-ghost"
          disabled={pending}
        >
          {pending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
      {exportError && (
        <p className="text-blood-400/90 text-sm" role="alert">
          {exportError}
        </p>
      )}

      <div className="border-t border-iron-700/50 pt-5 space-y-3">
        <p className="grim-label">Import from JSON</p>
        <p className="text-parchment/75 text-sm">
          Same format as <strong>Export all</strong> (array) or <code className="text-gold-400/90">{'{ items, mode }'}</code>.
          Zod must validate each entry (no unknown keys in strict mode).
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-xs uppercase tracking-wider text-parchment/60">If id exists</span>
          <label className="inline-flex items-center gap-2 text-sm text-parchment/90">
            <input
              type="radio"
              name="importMode"
              checked={importMode === 'skip'}
              onChange={() => setImportMode('skip')}
              className="accent-blood-500"
            />
            Skip
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-parchment/90">
            <input
              type="radio"
              name="importMode"
              checked={importMode === 'overwrite'}
              onChange={() => setImportMode('overwrite')}
              className="accent-blood-500"
            />
            Overwrite
          </label>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void runImport(f);
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="grim-btn-ghost"
          disabled={importing}
        >
          <QuillIcon className="w-3.5 h-3.5" />
          {importing ? 'Importing…' : 'Choose JSON file…'}
        </button>
      </div>
      {importError && (
        <p className="text-blood-400/90 text-sm" role="alert">
          {importError}
        </p>
      )}
      {importResult && (
        <div className="text-sm text-parchment/85 space-y-1 font-mono" role="status">
          <p>
            Created <span className="text-gold-400">{importResult.created}</span>, updated{' '}
            <span className="text-gold-400">{importResult.updated}</span>, skipped{' '}
            <span className="text-gold-400">{importResult.skipped}</span>
          </p>
          {importResult.errors.length > 0 && (
            <p className="text-blood-400/90">
              {importResult.errors.length} row(s) failed validation
              {importResult.errors.length <= 5
                ? `: ${importResult.errors.map((e) => `[${e.index}]`).join(' ')}`
                : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
