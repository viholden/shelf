'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getStorageAdapter } from '@/lib/storage';
import BookCard from '@/components/BookCard';
import UploadZone from '@/components/UploadZone';
import type { Book, Format } from '@/lib/types';
import { FORMAT_LABELS, ACCEPTED_FORMATS } from '@/lib/types';

export default function LibraryPage() {
  const { isGuest } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<Format | 'all'>('all');
  const [showUpload, setShowUpload] = useState(false);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    const storage = getStorageAdapter(isGuest);
    const data = await storage.getBooks();
    setBooks(data);
    setLoading(false);
  }, [isGuest]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  function handleUploaded(book: Book) {
    setBooks((prev) => [book, ...prev]);
    setShowUpload(false);
  }

  async function handleDelete(id: string) {
    const storage = getStorageAdapter(isGuest);
    await storage.deleteBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  const filtered = books.filter((book) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.tags.some((t) => t.toLowerCase().includes(q)) ||
      book.description?.toLowerCase().includes(q);

    const matchesFormat =
      formatFilter === 'all' ||
      book.formats.some((f) => f.format === formatFilter) ||
      book.originalFormat === formatFilter;

    return matchesQuery && matchesFormat;
  });

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-8 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--shelf-text)' }}>
            My Library
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--shelf-text-muted)' }}>
            {books.length} {books.length === 1 ? 'book' : 'books'}
            {isGuest && (
              <span style={{ color: 'var(--shelf-text-faint)' }}> · stored locally in browser</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded transition-colors"
          style={{
            background: showUpload ? 'var(--shelf-gold-subtle)' : 'var(--shelf-gold)',
            color: showUpload ? 'var(--shelf-gold)' : 'var(--shelf-bg)',
            borderRadius: 'var(--shelf-radius-sm)',
          }}
        >
          {showUpload ? <X size={16} /> : null}
          {showUpload ? 'Cancel' : 'Add books'}
        </button>
      </div>

      {/* Upload zone */}
      {showUpload && <UploadZone onUploaded={handleUploaded} />}

      {/* Search & filter */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--shelf-text-faint)' }}
          />
          <input
            type="text"
            placeholder="Search title, author, tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm outline-none border rounded transition-colors"
            style={{
              background: 'var(--shelf-card)',
              borderColor: 'var(--shelf-border)',
              color: 'var(--shelf-text)',
              borderRadius: 'var(--shelf-radius-sm)',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--shelf-text-faint)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(['all', ...ACCEPTED_FORMATS] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormatFilter(f)}
              className="px-3 py-1.5 text-xs font-medium rounded transition-colors border"
              style={{
                background: formatFilter === f ? 'var(--shelf-gold-subtle)' : 'var(--shelf-card)',
                color: formatFilter === f ? 'var(--shelf-gold)' : 'var(--shelf-text-muted)',
                borderColor: formatFilter === f ? 'var(--shelf-gold-dim)' : 'var(--shelf-border)',
                borderRadius: 'var(--shelf-radius-sm)',
              }}
            >
              {f === 'all' ? 'All' : FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin-slow"
            style={{ borderColor: 'var(--shelf-gold)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'var(--shelf-card)' }}
          >
            <Search size={24} style={{ color: 'var(--shelf-text-faint)' }} />
          </div>
          <div className="text-center">
            <p className="font-medium" style={{ color: 'var(--shelf-text)' }}>
              {books.length === 0 ? 'Your library is empty' : 'No books match'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--shelf-text-muted)' }}>
              {books.length === 0
                ? 'Upload your first book to get started'
                : 'Try a different search or filter'}
            </p>
          </div>
          {books.length === 0 && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-2 px-5 py-2.5 text-sm font-semibold rounded transition-colors"
              style={{
                background: 'var(--shelf-gold)',
                color: 'var(--shelf-bg)',
                borderRadius: 'var(--shelf-radius-sm)',
              }}
            >
              Upload books
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
