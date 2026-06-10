'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Upload, Loader2, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function CalibreImportPage() {
  const { isGuest } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    total: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Read the file as text — user needs to export Calibre to JSON first
      const text = await file.text();

      const formData = new FormData();
      formData.append('json', text);

      const res = await fetch('/api/calibre/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }

      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  if (isGuest) {
    return (
      <div className="flex flex-col flex-1 p-4 lg:p-8 gap-6 max-w-xl">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--shelf-text)' }}>
          Calibre Import
        </h1>
        <div
          className="border rounded-xl p-6 flex flex-col gap-3"
          style={{
            background: 'var(--shelf-card)',
            borderColor: 'var(--shelf-border)',
            borderRadius: 'var(--shelf-radius-lg)',
          }}
        >
          <AlertTriangle size={24} style={{ color: 'var(--shelf-warning)' }} />
          <p className="font-medium" style={{ color: 'var(--shelf-text)' }}>
            Cloud account required
          </p>
          <p className="text-sm" style={{ color: 'var(--shelf-text-muted)' }}>
            Calibre import requires a Shelf account to save your library to the cloud.
          </p>
          <Link
            href="/signup"
            className="self-start mt-2 px-4 py-2 text-sm font-semibold rounded"
            style={{ background: 'var(--shelf-gold)', color: 'var(--shelf-bg)', borderRadius: 'var(--shelf-radius-sm)' }}
          >
            Create free account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-8 gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--shelf-text)' }}>
          Import from Calibre
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--shelf-text-muted)' }}>
          Bring your existing Calibre library into Shelf.
        </p>
      </div>

      {/* Instructions */}
      <div
        className="border rounded-xl p-5 flex flex-col gap-3"
        style={{
          background: 'var(--shelf-card)',
          borderColor: 'var(--shelf-border)',
          borderRadius: 'var(--shelf-radius-lg)',
        }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--shelf-text)' }}>
          How to export from Calibre
        </p>
        <ol className="flex flex-col gap-2">
          {[
            'In Calibre, select all books (Ctrl+A)',
            'Go to Preferences → Plugins → Catalog and export as CSV/JSON, OR',
            'Use the Calibre CLI: calibredb catalog --fields=title,authors,series,series_index,tags,comments /tmp/library.json',
            'Upload the resulting JSON file below.',
          ].map((step, i) => (
            <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--shelf-text-muted)' }}>
              <span
                className="w-5 h-5 rounded-full text-xs flex items-center justify-center shrink-0 font-bold mt-0.5"
                style={{ background: 'var(--shelf-gold-subtle)', color: 'var(--shelf-gold)' }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div
          className="mt-1 px-3 py-2 rounded text-xs font-mono"
          style={{
            background: 'var(--shelf-surface)',
            color: 'var(--shelf-text-muted)',
            borderRadius: 'var(--shelf-radius-sm)',
          }}
        >
          calibredb catalog --fields=title,authors,series,series_index,tags,comments ~/library.json
        </div>
      </div>

      {/* Upload */}
      <div
        className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer"
        style={{
          borderColor: file ? 'var(--shelf-gold)' : 'var(--shelf-border)',
          background: file ? 'var(--shelf-gold-subtle)' : 'var(--shelf-card)',
          borderRadius: 'var(--shelf-radius-lg)',
        }}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: file ? 'var(--shelf-gold-dim)' : 'var(--shelf-surface)' }}
        >
          <Upload size={20} style={{ color: file ? 'var(--shelf-gold)' : 'var(--shelf-text-faint)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: file ? 'var(--shelf-gold)' : 'var(--shelf-text-muted)' }}>
          {file ? file.name : 'Click to select your JSON export'}
        </p>
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--shelf-error)' }}>
          {error}
        </p>
      )}

      {result && (
        <div
          className="border rounded-xl p-5 flex flex-col gap-2"
          style={{
            background: 'var(--shelf-card)',
            borderColor: result.errors.length ? 'var(--shelf-warning)' : 'var(--shelf-success)',
            borderRadius: 'var(--shelf-radius-lg)',
          }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} style={{ color: 'var(--shelf-success)' }} />
            <span className="font-medium text-sm" style={{ color: 'var(--shelf-text)' }}>
              Imported {result.imported} of {result.total} books
            </span>
          </div>
          {result.errors.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--shelf-warning)' }}>
                {result.errors.length} errors:
              </p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs" style={{ color: 'var(--shelf-text-muted)' }}>
                  • {e}
                </p>
              ))}
            </div>
          )}
          <Link
            href="/library"
            className="self-start mt-2 text-sm"
            style={{ color: 'var(--shelf-gold)' }}
          >
            View library →
          </Link>
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="self-start flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded transition-colors disabled:opacity-50"
        style={{
          background: 'var(--shelf-gold)',
          color: 'var(--shelf-bg)',
          borderRadius: 'var(--shelf-radius-sm)',
        }}
      >
        {loading && <Loader2 size={15} className="animate-spin-slow" />}
        {loading ? 'Importing…' : 'Import library'}
      </button>
    </div>
  );
}
