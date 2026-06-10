'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { getStorageAdapter } from '@/lib/storage';
import { parseEpub } from '@/lib/epub/parser';
import { replaceCover, repackEpub } from '@/lib/epub/editor';
import { Loader2, Upload, BookOpen } from 'lucide-react';
import type { Book } from '@/lib/types';
import { arrayBufferToBase64 } from '@/lib/utils';

interface CoverEditorProps {
  book: Book;
  onChange: (updated: Book) => void;
}

export default function CoverEditor({ book, onChange }: CoverEditorProps) {
  const { isGuest } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const cover = preview || book.coverUrl || book.coverData;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = `data:${file.type};base64,${arrayBufferToBase64(buffer)}`;
      setPreview(base64);

      const storage = getStorageAdapter(isGuest);

      // Update cover inside EPUB if available
      const epubFmt = book.formats.find((f) => f.format === 'epub');
      if (epubFmt) {
        const epubData = await storage.getFileData(epubFmt.fileKey);
        if (epubData) {
          const { zip, metadata } = await parseEpub(epubData);
          if (metadata.coverHref) {
            const updatedZip = await replaceCover(zip, metadata.coverHref, buffer);
            const packed = await repackEpub(updatedZip, []);
            await storage.saveFileData(epubFmt.fileKey, packed);
          }
        }
      }

      const updated: Book = {
        ...book,
        coverData: base64,
        updatedAt: new Date().toISOString(),
      };
      await storage.saveBook(updated);
      onChange(updated);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-40 aspect-[2/3] rounded-lg overflow-hidden border"
        style={{
          background: 'var(--shelf-surface)',
          borderColor: 'var(--shelf-border)',
          borderRadius: 'var(--shelf-radius)',
        }}
      >
        {cover ? (
          <Image
            src={cover}
            alt={book.title}
            fill
            className="object-cover"
            unoptimized={cover.startsWith('data:')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={28} style={{ color: 'var(--shelf-text-faint)' }} />
          </div>
        )}
        {uploading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <Loader2 size={24} className="animate-spin-slow" style={{ color: 'var(--shelf-gold)' }} />
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium border rounded transition-colors"
        style={{
          background: 'var(--shelf-card)',
          borderColor: 'var(--shelf-border)',
          color: 'var(--shelf-text-muted)',
          borderRadius: 'var(--shelf-radius-sm)',
        }}
      >
        <Upload size={13} />
        Replace cover
      </button>
      <p className="text-xs text-center" style={{ color: 'var(--shelf-text-faint)' }}>
        JPG, PNG, or WebP
      </p>
    </div>
  );
}
