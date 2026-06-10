'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { getStorageAdapter } from '@/lib/storage';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, GripVertical, BookOpen, Loader2, Save } from 'lucide-react';
import type { Book, Series } from '@/lib/types';

function SortableBookRow({ book }: { book: Book }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cover = book.coverUrl || book.coverData;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 border rounded-lg"
      {...attributes}
    >
      <button
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded"
        style={{ color: 'var(--shelf-text-faint)' }}
      >
        <GripVertical size={16} />
      </button>

      <div
        className="w-8 h-12 rounded overflow-hidden shrink-0 border"
        style={{ background: 'var(--shelf-surface)', borderColor: 'var(--shelf-border)' }}
      >
        {cover ? (
          <Image
            src={cover}
            alt={book.title}
            width={32}
            height={48}
            className="object-cover w-full h-full"
            unoptimized={cover.startsWith('data:')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={12} style={{ color: 'var(--shelf-text-faint)' }} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--shelf-text)' }}>
          {book.title}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--shelf-text-muted)' }}>
          {book.author}
        </p>
      </div>

      <span
        className="text-xs font-bold px-2 py-1 rounded shrink-0"
        style={{
          background: 'var(--shelf-gold-subtle)',
          color: 'var(--shelf-gold)',
          borderRadius: '4px',
        }}
      >
        #{book.seriesOrder ?? '?'}
      </span>

      <Link
        href={`/book/${book.id}`}
        className="text-xs shrink-0"
        style={{ color: 'var(--shelf-text-faint)' }}
      >
        Edit →
      </Link>
    </div>
  );
}

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isGuest } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    (async () => {
      const storage = getStorageAdapter(isGuest);
      const [s, allBooks] = await Promise.all([
        storage.getSeriesById(id),
        storage.getBooks(),
      ]);
      setSeries(s);
      if (s) {
        const seriesBooks = allBooks
          .filter((b) => b.seriesId === id)
          .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
        setBooks(seriesBooks);
      }
      setLoading(false);
    })();
  }, [id, isGuest]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBooks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((b, i) => ({ ...b, seriesOrder: i + 1 }));
    });
  }

  async function saveOrder() {
    setSaving(true);
    try {
      const storage = getStorageAdapter(isGuest);
      for (const book of books) {
        await storage.saveBook({
          ...book,
          updatedAt: new Date().toISOString(),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin-slow" style={{ color: 'var(--shelf-gold)' }} />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <p style={{ color: 'var(--shelf-text-muted)' }}>Series not found</p>
        <Link href="/series" className="text-sm" style={{ color: 'var(--shelf-gold)' }}>
          Back to series
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-8 gap-6 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/series"
          className="flex items-center gap-1.5 text-sm"
          style={{ color: 'var(--shelf-text-muted)' }}
        >
          <ArrowLeft size={15} />
          Series
        </Link>
        <span style={{ color: 'var(--shelf-text-faint)' }}>/</span>
        <span className="text-sm" style={{ color: 'var(--shelf-text)' }}>
          {series.name}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--shelf-text)' }}>
          {series.name}
        </h1>
        {series.description && (
          <p className="text-sm mt-1" style={{ color: 'var(--shelf-text-muted)' }}>
            {series.description}
          </p>
        )}
        <p className="text-sm mt-2" style={{ color: 'var(--shelf-text-faint)' }}>
          {books.length} books · drag to reorder
        </p>
      </div>

      {books.length === 0 ? (
        <div
          className="border rounded-xl p-8 text-center"
          style={{
            background: 'var(--shelf-card)',
            borderColor: 'var(--shelf-border)',
            borderRadius: 'var(--shelf-radius-lg)',
          }}
        >
          <BookOpen size={28} className="mx-auto mb-3" style={{ color: 'var(--shelf-text-faint)' }} />
          <p className="text-sm" style={{ color: 'var(--shelf-text-muted)' }}>
            No books in this series yet.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--shelf-text-faint)' }}>
            Edit a book and assign it to "{series.name}" to add it here.
          </p>
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={books.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {books.map((book) => (
                  <div
                    key={book.id}
                    style={{
                      background: 'var(--shelf-card)',
                      borderColor: 'var(--shelf-border)',
                    }}
                  >
                    <SortableBookRow book={book} />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={saveOrder}
            disabled={saving}
            className="self-start flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded transition-colors"
            style={{
              background: saved ? 'var(--shelf-success)' : 'var(--shelf-gold)',
              color: 'var(--shelf-bg)',
              borderRadius: 'var(--shelf-radius-sm)',
            }}
          >
            {saving ? <Loader2 size={15} className="animate-spin-slow" /> : <Save size={15} />}
            {saved ? 'Order saved!' : 'Save order'}
          </button>
        </>
      )}
    </div>
  );
}
