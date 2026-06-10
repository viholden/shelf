'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { useState } from 'react';
import type { Book } from '@/lib/types';
import { FORMAT_LABELS } from '@/lib/types';
import { truncate } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  onDelete?: (id: string) => void;
}

export default function BookCard({ book, onDelete }: BookCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cover = book.coverUrl || book.coverData;

  return (
    <div
      className="group relative flex flex-col rounded-xl overflow-hidden border transition-colors"
      style={{
        background: 'var(--shelf-card)',
        borderColor: 'var(--shelf-border)',
        borderRadius: 'var(--shelf-radius-lg)',
      }}
    >
      {/* Cover */}
      <Link href={`/book/${book.id}`} className="block relative aspect-[2/3] overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt={book.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 200px"
            unoptimized={cover.startsWith('data:')}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2 px-4"
            style={{ background: 'var(--shelf-surface)' }}
          >
            <BookOpen size={32} style={{ color: 'var(--shelf-text-faint)' }} />
            <span
              className="text-xs text-center line-clamp-3 font-medium"
              style={{ color: 'var(--shelf-text-faint)' }}
            >
              {book.title}
            </span>
          </div>
        )}

        {/* Format badges */}
        <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
          {book.formats.map((f) => (
            <span
              key={f.format}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(0,0,0,0.7)',
                color: 'var(--shelf-gold)',
                backdropFilter: 'blur(4px)',
                borderRadius: '4px',
              }}
            >
              {FORMAT_LABELS[f.format]}
            </span>
          ))}
        </div>
      </Link>

      {/* Meta */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/book/${book.id}`}>
              <h3
                className="text-sm font-semibold leading-snug line-clamp-2"
                style={{ color: 'var(--shelf-text)' }}
              >
                {book.title}
              </h3>
            </Link>
            {book.author && (
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--shelf-text-muted)' }}>
                {book.author}
              </p>
            )}
          </div>

          {/* Actions menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
              style={{ color: 'var(--shelf-text-muted)' }}
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-6 z-20 w-36 border rounded-lg shadow-lg py-1 overflow-hidden"
                  style={{
                    background: 'var(--shelf-card)',
                    borderColor: 'var(--shelf-border)',
                    borderRadius: 'var(--shelf-radius-sm)',
                  }}
                >
                  <Link
                    href={`/book/${book.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                    style={{ color: 'var(--shelf-text-muted)' }}
                  >
                    <Edit3 size={13} />
                    Edit book
                  </Link>
                  {onDelete && (
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(book.id); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs w-full text-left transition-colors"
                      style={{ color: 'var(--shelf-error)' }}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {book.seriesId && book.seriesOrder != null && (
          <p className="text-[11px]" style={{ color: 'var(--shelf-text-faint)' }}>
            #{book.seriesOrder}
          </p>
        )}
      </div>
    </div>
  );
}
