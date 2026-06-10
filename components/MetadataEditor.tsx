'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { getStorageAdapter } from '@/lib/storage';
import { updateOpfMetadata } from '@/lib/epub/editor';
import { repackEpub } from '@/lib/epub/editor';
import { parseEpub, getCoverDataUrl } from '@/lib/epub/parser';
import { generateId } from '@/lib/utils';
import { Save, Loader2, Tag, X, BookOpen } from 'lucide-react';
import type { Book, Series } from '@/lib/types';

interface MetadataEditorProps {
  book: Book;
  series: Series[];
  onChange: (updated: Book) => void;
}

export default function MetadataEditor({ book, series, onChange }: MetadataEditorProps) {
  const { isGuest } = useAuth();
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [description, setDescription] = useState(book.description ?? '');
  const [tags, setTags] = useState<string[]>(book.tags);
  const [tagInput, setTagInput] = useState('');
  const [seriesId, setSeriesId] = useState(book.seriesId ?? '');
  const [seriesOrder, setSeriesOrder] = useState(book.seriesOrder?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const storage = getStorageAdapter(isGuest);
      const updated: Book = {
        ...book,
        title,
        author,
        description: description || undefined,
        tags,
        seriesId: seriesId || undefined,
        seriesOrder: seriesOrder ? parseInt(seriesOrder) : undefined,
        updatedAt: new Date().toISOString(),
      };

      // Also write metadata into EPUB file if available
      const epubFormat = book.formats.find((f) => f.format === 'epub');
      if (epubFormat) {
        const data = await storage.getFileData(epubFormat.fileKey);
        if (data) {
          const { zip } = await parseEpub(data);
          const { updateOpfMetadata: updateMeta } = await import('@/lib/epub/editor');
          const updatedZip = await updateMeta(zip, { title, author, description });
          const packed = await repackEpub(updatedZip, []);
          await storage.saveFileData(epubFormat.fileKey, packed);
        }
      }

      await storage.saveBook(updated);
      onChange(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    title !== book.title ||
    author !== book.author ||
    description !== (book.description ?? '') ||
    JSON.stringify(tags) !== JSON.stringify(book.tags) ||
    seriesId !== (book.seriesId ?? '') ||
    seriesOrder !== (book.seriesOrder?.toString() ?? '');

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
          placeholder="Book title"
        />
      </Field>

      {/* Author */}
      <Field label="Author">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="input-field"
          placeholder="Author name"
        />
      </Field>

      {/* Description */}
      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="input-field resize-none"
          placeholder="Book description or synopsis…"
        />
      </Field>

      {/* Tags */}
      <Field label="Tags">
        <div
          className="flex flex-wrap gap-1.5 p-2 border rounded min-h-[44px]"
          style={{
            background: 'var(--shelf-surface)',
            borderColor: 'var(--shelf-border)',
            borderRadius: 'var(--shelf-radius-sm)',
          }}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded"
              style={{ background: 'var(--shelf-gold-subtle)', color: 'var(--shelf-gold)' }}
            >
              {tag}
              <button onClick={() => removeTag(tag)}>
                <X size={11} />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            className="bg-transparent outline-none text-xs flex-1 min-w-[80px]"
            style={{ color: 'var(--shelf-text)' }}
            placeholder="Add tag, press Enter"
          />
        </div>
      </Field>

      {/* Series */}
      <Field label="Series">
        <select
          value={seriesId}
          onChange={(e) => setSeriesId(e.target.value)}
          className="input-field"
        >
          <option value="">— None —</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      {seriesId && (
        <Field label="Book #">
          <input
            type="number"
            min={1}
            value={seriesOrder}
            onChange={(e) => setSeriesOrder(e.target.value)}
            className="input-field w-24"
            placeholder="1"
          />
        </Field>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!dirty || saving}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded self-start transition-colors disabled:opacity-40"
        style={{
          background: saved ? 'var(--shelf-success)' : 'var(--shelf-gold)',
          color: 'var(--shelf-bg)',
          borderRadius: 'var(--shelf-radius-sm)',
        }}
      >
        {saving ? <Loader2 size={15} className="animate-spin-slow" /> : <Save size={15} />}
        {saved ? 'Saved!' : 'Save changes'}
      </button>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 8px 12px;
          font-size: 0.875rem;
          outline: none;
          border: 1px solid var(--shelf-border);
          background: var(--shelf-surface);
          color: var(--shelf-text);
          border-radius: var(--shelf-radius-sm);
          transition: border-color 0.15s;
        }
        .input-field:focus {
          border-color: var(--shelf-gold);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: 'var(--shelf-text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
