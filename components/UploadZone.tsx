'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getStorageAdapter } from '@/lib/storage';
import { parseEpub, getCoverDataUrl } from '@/lib/epub/parser';
import { detectFormatFromFile, generateId } from '@/lib/utils';
import type { Book, BookFormat } from '@/lib/types';

interface UploadZoneProps {
  onUploaded: (book: Book) => void;
}

const ACCEPTED = {
  'application/epub+zip': ['.epub'],
  'application/pdf': ['.pdf'],
  'application/x-mobipocket-ebook': ['.mobi'],
  'application/vnd.amazon.ebook': ['.azw3'],
  // kepub has no standard MIME
  'application/octet-stream': ['.kepub'],
};

export default function UploadZone({ onUploaded }: UploadZoneProps) {
  const { isGuest } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  const onDrop = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setUploading(true);

      for (const file of files) {
        try {
          setProgress(`Processing ${file.name}…`);
          const format = detectFormatFromFile(file);
          const buffer = await file.arrayBuffer();
          const storage = getStorageAdapter(isGuest);
          const bookId = generateId();
          const fileKey = isGuest ? `local-${bookId}.${format}` : `${bookId}/original.${format}`;

          let title = file.name.replace(/\.[^.]+$/, '');
          let author = '';
          let coverData: string | undefined;

          // Parse EPUB metadata
          if (format === 'epub') {
            try {
              const { zip, metadata } = await parseEpub(buffer);
              title = metadata.title || title;
              author = metadata.author || '';
              coverData = await getCoverDataUrl(zip, metadata.coverHref);
            } catch {
              // Non-fatal: use filename as title
            }
          }

          await storage.saveFileData(fileKey, buffer);

          const fmt: BookFormat = {
            id: generateId(),
            bookId,
            format,
            fileKey,
            fileSize: buffer.byteLength,
            generatedAt: new Date().toISOString(),
          };

          const book: Book = {
            id: bookId,
            title,
            author,
            tags: [],
            originalFormat: format,
            formats: [fmt],
            coverData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await storage.saveBook(book);
          onUploaded(book);
        } catch (err) {
          console.error('Upload failed:', err);
        }
      }

      setUploading(false);
      setProgress('');
    },
    [isGuest, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: true,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors text-center"
      style={{
        borderColor: isDragActive ? 'var(--shelf-gold)' : 'var(--shelf-border)',
        background: isDragActive ? 'var(--shelf-gold-subtle)' : 'var(--shelf-card)',
        borderRadius: 'var(--shelf-radius-lg)',
        minHeight: 160,
      }}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <>
          <Loader2 size={28} className="animate-spin-slow" style={{ color: 'var(--shelf-gold)' }} />
          <p className="text-sm" style={{ color: 'var(--shelf-text-muted)' }}>{progress}</p>
        </>
      ) : (
        <>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--shelf-gold-subtle)' }}
          >
            <Upload size={22} style={{ color: 'var(--shelf-gold)' }} />
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--shelf-text)' }}>
              {isDragActive ? 'Drop your books here' : 'Drop books here or click to browse'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--shelf-text-muted)' }}>
              EPUB · KEPUB · PDF · MOBI · AZW3
            </p>
          </div>
        </>
      )}
    </div>
  );
}
