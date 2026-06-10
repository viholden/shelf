'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getStorageAdapter } from '@/lib/storage';
import { convertClientSide, isClientSideConversion } from '@/lib/conversion';
import { generateId, formatBytes, isLossyConversion } from '@/lib/utils';
import {
  Download,
  RefreshCw,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { Book, BookFormat, Format } from '@/lib/types';
import { FORMAT_LABELS, CONVERSION_MATRIX } from '@/lib/types';

interface FormatManagerProps {
  book: Book;
  onChange: (updated: Book) => void;
}

export default function FormatManager({ book, onChange }: FormatManagerProps) {
  const { isGuest } = useAuth();
  const [converting, setConverting] = useState<Format | null>(null);
  const [error, setError] = useState('');

  const existingFormats = new Set(book.formats.map((f) => f.format));
  const availableConversions = CONVERSION_MATRIX[book.originalFormat] ?? [];

  async function handleDownload(fmt: BookFormat) {
    const storage = getStorageAdapter(isGuest);
    const data = await storage.getFileData(fmt.fileKey);
    if (!data) return;
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title}.${fmt.format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleConvert(toFormat: Format) {
    setConverting(toFormat);
    setError('');
    try {
      const storage = getStorageAdapter(isGuest);
      const sourceFormat = book.formats.find((f) => f.format === book.originalFormat)
        ?? book.formats[0];
      if (!sourceFormat) throw new Error('No source file found');

      const sourceData = await storage.getFileData(sourceFormat.fileKey);
      if (!sourceData) throw new Error('Source file not found in storage');

      let convertedData: ArrayBuffer;

      if (isClientSideConversion(sourceFormat.format, toFormat)) {
        convertedData = await convertClientSide(sourceData, sourceFormat.format, toFormat);
      } else if (!isGuest) {
        // Server-side conversion for cloud users
        const res = await fetch(`/api/books/${book.id}/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: sourceFormat.format, to: toFormat }),
        });
        if (!res.ok) throw new Error(await res.text());
        convertedData = await res.arrayBuffer();
      } else {
        throw new Error(
          `Converting ${FORMAT_LABELS[sourceFormat.format]} → ${FORMAT_LABELS[toFormat]} requires a cloud account.`
        );
      }

      const fileKey = isGuest
        ? `local-${book.id}.${toFormat}`
        : `${book.id}/${toFormat}.${toFormat}`;
      await storage.saveFileData(fileKey, convertedData);

      const newFmt: BookFormat = {
        id: generateId(),
        bookId: book.id,
        format: toFormat,
        fileKey,
        fileSize: convertedData.byteLength,
        generatedAt: new Date().toISOString(),
      };

      const updated: Book = {
        ...book,
        formats: [...book.formats.filter((f) => f.format !== toFormat), newFmt],
        updatedAt: new Date().toISOString(),
      };

      await storage.saveBook(updated);
      onChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setConverting(null);
    }
  }

  async function handleDeleteFormat(fmt: BookFormat) {
    if (book.formats.length === 1) return; // don't delete last format
    const storage = getStorageAdapter(isGuest);
    await storage.deleteFileData(fmt.fileKey);
    const updated: Book = {
      ...book,
      formats: book.formats.filter((f) => f.format !== fmt.format),
      updatedAt: new Date().toISOString(),
    };
    await storage.saveBook(updated);
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Existing formats */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium" style={{ color: 'var(--shelf-text-muted)' }}>
          Available formats
        </p>
        {book.formats.map((fmt) => (
          <div
            key={fmt.format}
            className="flex items-center justify-between gap-3 px-4 py-3 border rounded-lg"
            style={{
              background: 'var(--shelf-surface)',
              borderColor: 'var(--shelf-border)',
              borderRadius: 'var(--shelf-radius-sm)',
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  background: 'var(--shelf-gold-subtle)',
                  color: 'var(--shelf-gold)',
                  borderRadius: '4px',
                }}
              >
                {FORMAT_LABELS[fmt.format]}
              </span>
              <span className="text-xs" style={{ color: 'var(--shelf-text-faint)' }}>
                {formatBytes(fmt.fileSize)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDownload(fmt)}
                title="Download"
                className="p-2 rounded transition-colors"
                style={{ color: 'var(--shelf-text-muted)' }}
              >
                <Download size={15} />
              </button>
              {book.formats.length > 1 && (
                <button
                  onClick={() => handleDeleteFormat(fmt)}
                  title="Remove format"
                  className="p-2 rounded transition-colors"
                  style={{ color: 'var(--shelf-text-faint)' }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Convert */}
      {availableConversions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium" style={{ color: 'var(--shelf-text-muted)' }}>
            Convert to
          </p>
          <div className="flex flex-wrap gap-2">
            {availableConversions.map((toFmt) => {
              const alreadyHave = existingFormats.has(toFmt);
              const isLossy = isLossyConversion(book.originalFormat, toFmt);
              const isConverting = converting === toFmt;

              return (
                <button
                  key={toFmt}
                  onClick={() => handleConvert(toFmt)}
                  disabled={isConverting || !!converting}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded transition-colors disabled:opacity-50"
                  style={{
                    background: alreadyHave
                      ? 'var(--shelf-gold-subtle)'
                      : 'var(--shelf-card)',
                    color: alreadyHave ? 'var(--shelf-gold)' : 'var(--shelf-text-muted)',
                    borderColor: alreadyHave ? 'var(--shelf-gold-dim)' : 'var(--shelf-border)',
                    borderRadius: 'var(--shelf-radius-sm)',
                  }}
                  title={isLossy ? 'Quality may be reduced' : undefined}
                >
                  {isConverting ? (
                    <Loader2 size={13} className="animate-spin-slow" />
                  ) : alreadyHave ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  {FORMAT_LABELS[toFmt]}
                  {isLossy && !alreadyHave && (
                    <AlertTriangle size={11} style={{ color: 'var(--shelf-warning)' }} />
                  )}
                </button>
              );
            })}
          </div>
          {error && (
            <p className="text-xs mt-1" style={{ color: 'var(--shelf-error)' }}>
              {error}
            </p>
          )}
          <p className="text-xs" style={{ color: 'var(--shelf-text-faint)' }}>
            ⚠ Conversions marked with{' '}
            <AlertTriangle size={10} className="inline" style={{ color: 'var(--shelf-warning)' }} />{' '}
            may lose formatting.
          </p>
        </div>
      )}
    </div>
  );
}
