'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getStorageAdapter } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { Layers, Plus, X, Loader2, BookOpen } from 'lucide-react';
import type { Series } from '@/lib/types';

export default function SeriesPage() {
  const { isGuest } = useAuth();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const storage = getStorageAdapter(isGuest);
      const data = await storage.getSeries();
      setSeriesList(data);
      setLoading(false);
    })();
  }, [isGuest]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const storage = getStorageAdapter(isGuest);
      const series: Series = {
        id: generateId(),
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        books: [],
        bookCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await storage.saveSeries(series);
      setSeriesList((prev) => [series, ...prev]);
      setNewName('');
      setNewDesc('');
      setCreating(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this series? Books will not be deleted.')) return;
    const storage = getStorageAdapter(isGuest);
    await storage.deleteSeries(id);
    setSeriesList((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-8 gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--shelf-text)' }}>
            Series
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--shelf-text-muted)' }}>
            {seriesList.length} {seriesList.length === 1 ? 'series' : 'series'}
          </p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded transition-colors"
          style={{
            background: creating ? 'var(--shelf-gold-subtle)' : 'var(--shelf-gold)',
            color: creating ? 'var(--shelf-gold)' : 'var(--shelf-bg)',
            borderRadius: 'var(--shelf-radius-sm)',
          }}
        >
          {creating ? <X size={16} /> : <Plus size={16} />}
          {creating ? 'Cancel' : 'New series'}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          className="border p-5 rounded-xl flex flex-col gap-4"
          style={{
            background: 'var(--shelf-card)',
            borderColor: 'var(--shelf-border)',
            borderRadius: 'var(--shelf-radius-lg)',
          }}
        >
          <h3 className="font-semibold text-sm" style={{ color: 'var(--shelf-text)' }}>
            New Series
          </h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--shelf-text-muted)' }}>
              Series name *
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="e.g. A Court of Thorns and Roses"
              className="px-3 py-2.5 text-sm outline-none border rounded transition-colors"
              style={{
                background: 'var(--shelf-surface)',
                borderColor: 'var(--shelf-border)',
                color: 'var(--shelf-text)',
                borderRadius: 'var(--shelf-radius-sm)',
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--shelf-text-muted)' }}>
              Description (optional)
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              placeholder="Brief description of the series…"
              className="px-3 py-2.5 text-sm outline-none border rounded resize-none transition-colors"
              style={{
                background: 'var(--shelf-surface)',
                borderColor: 'var(--shelf-border)',
                color: 'var(--shelf-text)',
                borderRadius: 'var(--shelf-radius-sm)',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="self-start flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded transition-colors disabled:opacity-50"
            style={{
              background: 'var(--shelf-gold)',
              color: 'var(--shelf-bg)',
              borderRadius: 'var(--shelf-radius-sm)',
            }}
          >
            {saving && <Loader2 size={15} className="animate-spin-slow" />}
            Create series
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin-slow"
            style={{ borderColor: 'var(--shelf-gold)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : seriesList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'var(--shelf-card)' }}
          >
            <Layers size={24} style={{ color: 'var(--shelf-text-faint)' }} />
          </div>
          <div className="text-center">
            <p className="font-medium" style={{ color: 'var(--shelf-text)' }}>
              No series yet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--shelf-text-muted)' }}>
              Create a series to organize your books
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map((s) => (
            <Link
              key={s.id}
              href={`/series/${s.id}`}
              className="group border p-5 rounded-xl flex flex-col gap-2 transition-colors"
              style={{
                background: 'var(--shelf-card)',
                borderColor: 'var(--shelf-border)',
                borderRadius: 'var(--shelf-radius-lg)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--shelf-gold-subtle)' }}
                >
                  <Layers size={18} style={{ color: 'var(--shelf-gold)' }} />
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(s.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                  style={{ color: 'var(--shelf-text-faint)' }}
                >
                  <X size={14} />
                </button>
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--shelf-text)' }}>
                {s.name}
              </h3>
              {s.description && (
                <p className="text-xs line-clamp-2" style={{ color: 'var(--shelf-text-muted)' }}>
                  {s.description}
                </p>
              )}
              <div className="flex items-center gap-1 mt-1">
                <BookOpen size={12} style={{ color: 'var(--shelf-text-faint)' }} />
                <span className="text-xs" style={{ color: 'var(--shelf-text-faint)' }}>
                  {s.bookCount ?? 0} books
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
