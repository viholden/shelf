'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getStorageAdapter } from '@/lib/storage';
import { parseEpub } from '@/lib/epub/parser';
import { repackEpub } from '@/lib/epub/editor';
import { Loader2, Save, ChevronRight, BookOpen } from 'lucide-react';
import type { Book, EpubChapter } from '@/lib/types';
import type JSZip from 'jszip';

interface EpubEditorProps {
  book: Book;
}

export default function EpubEditor({ book }: EpubEditorProps) {
  const { isGuest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [zip, setZip] = useState<JSZip | null>(null);
  const [chapters, setChapters] = useState<EpubChapter[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedChapter, setSavedChapter] = useState<string | null>(null);
  const [error, setError] = useState('');

  const epubFormat = book.formats.find((f) => f.format === 'epub');

  useEffect(() => {
    if (!epubFormat) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const storage = getStorageAdapter(isGuest);
        const data = await storage.getFileData(epubFormat.fileKey);
        if (!data) throw new Error('EPUB file not found');
        const { zip: z, metadata } = await parseEpub(data);
        setZip(z);
        setChapters(metadata.chapters);
        if (metadata.chapters.length > 0) {
          setSelected(metadata.chapters[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load EPUB');
      } finally {
        setLoading(false);
      }
    })();
  }, [epubFormat, isGuest]);

  function getCurrentContent(chapterId: string): string {
    if (editedContent[chapterId] !== undefined) return editedContent[chapterId];
    return chapters.find((c) => c.id === chapterId)?.content ?? '';
  }

  async function saveChapter(chapterId: string) {
    if (!zip || !epubFormat) return;
    setSaving(true);
    try {
      const storage = getStorageAdapter(isGuest);
      const updatedChapters = chapters.map((c) => ({
        ...c,
        content: editedContent[c.id] !== undefined ? editedContent[c.id] : c.content,
      }));
      const packed = await repackEpub(zip, updatedChapters);
      await storage.saveFileData(epubFormat.fileKey, packed);

      // Refresh zip
      const { default: JSZip } = await import('jszip');
      const newZip = await JSZip.loadAsync(packed);
      setZip(newZip);

      setSavedChapter(chapterId);
      setTimeout(() => setSavedChapter(null), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!epubFormat) {
    return (
      <div
        className="rounded-lg p-6 text-center border"
        style={{
          background: 'var(--shelf-surface)',
          borderColor: 'var(--shelf-border)',
          borderRadius: 'var(--shelf-radius)',
        }}
      >
        <BookOpen size={28} className="mx-auto mb-2" style={{ color: 'var(--shelf-text-faint)' }} />
        <p className="text-sm" style={{ color: 'var(--shelf-text-muted)' }}>
          EPUB editor is only available for EPUB files. Convert to EPUB first.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin-slow" style={{ color: 'var(--shelf-gold)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm py-4" style={{ color: 'var(--shelf-error)' }}>
        {error}
      </p>
    );
  }

  const activeChapter = chapters.find((c) => c.id === selected);

  return (
    <div
      className="flex border rounded-xl overflow-hidden"
      style={{
        borderColor: 'var(--shelf-border)',
        borderRadius: 'var(--shelf-radius-lg)',
        minHeight: 500,
      }}
    >
      {/* Chapter list */}
      <div
        className="w-48 shrink-0 border-r flex flex-col overflow-y-auto"
        style={{ background: 'var(--shelf-surface)', borderColor: 'var(--shelf-border)' }}
      >
        <p
          className="px-3 py-3 text-xs font-semibold uppercase tracking-wider border-b"
          style={{ color: 'var(--shelf-text-faint)', borderColor: 'var(--shelf-border)' }}
        >
          Chapters
        </p>
        {chapters.map((ch) => {
          const isDirty = editedContent[ch.id] !== undefined && editedContent[ch.id] !== ch.content;
          return (
            <button
              key={ch.id}
              onClick={() => setSelected(ch.id)}
              className="px-3 py-2.5 text-left text-xs flex items-center gap-1.5 transition-colors border-b"
              style={{
                background:
                  selected === ch.id ? 'var(--shelf-gold-subtle)' : 'transparent',
                color:
                  selected === ch.id ? 'var(--shelf-gold)' : 'var(--shelf-text-muted)',
                borderColor: 'var(--shelf-border-subtle)',
              }}
            >
              <ChevronRight size={11} className={selected === ch.id ? '' : 'opacity-0'} />
              <span className="line-clamp-2 flex-1">{ch.title}</span>
              {isDirty && (
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--shelf-warning)' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {activeChapter ? (
          <>
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{
                background: 'var(--shelf-card)',
                borderColor: 'var(--shelf-border)',
              }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--shelf-text)' }}>
                {activeChapter.title}
              </p>
              <button
                onClick={() => saveChapter(activeChapter.id)}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors"
                style={{
                  background:
                    savedChapter === activeChapter.id
                      ? 'var(--shelf-success)'
                      : 'var(--shelf-gold)',
                  color: 'var(--shelf-bg)',
                  borderRadius: 'var(--shelf-radius-sm)',
                }}
              >
                {saving ? (
                  <Loader2 size={12} className="animate-spin-slow" />
                ) : (
                  <Save size={12} />
                )}
                {savedChapter === activeChapter.id ? 'Saved' : 'Save'}
              </button>
            </div>

            <textarea
              value={getCurrentContent(activeChapter.id)}
              onChange={(e) =>
                setEditedContent((prev) => ({
                  ...prev,
                  [activeChapter.id]: e.target.value,
                }))
              }
              className="flex-1 w-full p-5 text-sm font-mono resize-none outline-none"
              style={{
                background: 'var(--shelf-bg)',
                color: 'var(--shelf-text)',
                lineHeight: '1.7',
              }}
              spellCheck
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--shelf-text-faint)' }}>
              Select a chapter to edit
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
