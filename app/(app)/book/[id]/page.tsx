'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getStorageAdapter } from '@/lib/storage';
import MetadataEditor from '@/components/MetadataEditor';
import FormatManager from '@/components/FormatManager';
import EpubEditor from '@/components/EpubEditor';
import CoverEditor from '@/components/CoverEditor';
import { ArrowLeft, BookOpen, FileText, Edit3, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import type { Book, Series } from '@/lib/types';

type Tab = 'metadata' | 'formats' | 'epub' | 'cover';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isGuest } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('metadata');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const storage = getStorageAdapter(isGuest);
      const [b, s] = await Promise.all([storage.getBook(id), storage.getSeries()]);
      setBook(b);
      setSeries(s);
      setLoading(false);
    })();
  }, [id, isGuest]);

  async function handleDelete() {
    if (!book) return;
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    const storage = getStorageAdapter(isGuest);
    await storage.deleteBook(book.id);
    router.push('/library');
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin-slow" style={{ color: 'var(--shelf-gold)' }} />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <BookOpen size={36} style={{ color: 'var(--shelf-text-faint)' }} />
        <p style={{ color: 'var(--shelf-text-muted)' }}>Book not found</p>
        <Link
          href="/library"
          className="text-sm"
          style={{ color: 'var(--shelf-gold)' }}
        >
          Back to library
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'metadata', label: 'Details', icon: FileText },
    { id: 'formats', label: 'Formats', icon: BookOpen },
    { id: 'epub', label: 'Edit EPUB', icon: Edit3 },
    { id: 'cover', label: 'Cover', icon: ImageIcon },
  ];

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-8 gap-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/library"
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--shelf-text-muted)' }}
        >
          <ArrowLeft size={15} />
          Library
        </Link>
        <span style={{ color: 'var(--shelf-text-faint)' }}>/</span>
        <span className="text-sm truncate" style={{ color: 'var(--shelf-text)' }}>
          {book.title}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--shelf-text)' }}>
            {book.title}
          </h1>
          {book.author && (
            <p className="mt-1" style={{ color: 'var(--shelf-text-muted)' }}>
              by {book.author}
            </p>
          )}
          {book.seriesId && book.seriesOrder && (
            <p className="text-sm mt-1" style={{ color: 'var(--shelf-text-faint)' }}>
              {series.find((s) => s.id === book.seriesId)?.name ?? 'Series'} #{book.seriesOrder}
            </p>
          )}
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 px-3 py-2 text-xs border rounded transition-colors shrink-0"
          style={{
            borderColor: 'var(--shelf-border)',
            color: 'var(--shelf-error)',
            borderRadius: 'var(--shelf-radius-sm)',
          }}
        >
          {deleting ? <Loader2 size={13} className="animate-spin-slow" /> : <Trash2 size={13} />}
          Delete
        </button>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 border-b"
        style={{ borderColor: 'var(--shelf-border)' }}
      >
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px"
            style={{
              borderBottomColor: tab === tabId ? 'var(--shelf-gold)' : 'transparent',
              color: tab === tabId ? 'var(--shelf-gold)' : 'var(--shelf-text-muted)',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {tab === 'metadata' && (
          <MetadataEditor book={book} series={series} onChange={setBook} />
        )}
        {tab === 'formats' && (
          <FormatManager book={book} onChange={setBook} />
        )}
        {tab === 'epub' && (
          <EpubEditor book={book} />
        )}
        {tab === 'cover' && (
          <CoverEditor book={book} onChange={setBook} />
        )}
      </div>
    </div>
  );
}
