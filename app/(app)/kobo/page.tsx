'use client';

import { useAuth } from '@/lib/auth-context';
import { Wifi, Copy, ExternalLink, Check, BookOpen, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function KoboPage() {
  const { isGuest, user } = useAuth();
  const [copied, setCopied] = useState(false);

  const opdsUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/opds${!isGuest ? `?token=${encodeURIComponent(user?.id ?? '')}` : ''}`
      : '';

  function copyUrl() {
    navigator.clipboard.writeText(opdsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const steps = [
    {
      n: 1,
      title: 'Open your Kobo',
      desc: 'From the home screen, go to Settings → Beta Features → OPDS Browser.',
    },
    {
      n: 2,
      title: 'Add your library',
      desc: 'Tap "Add OPDS Catalog" and paste the URL below. Give it any name, like "My Shelf".',
    },
    {
      n: 3,
      title: 'Browse & download',
      desc: 'Open the catalog on your Kobo, browse your library, and tap any book to download it wirelessly. No cable needed.',
    },
  ];

  return (
    <div className="flex flex-col flex-1 p-4 lg:p-8 gap-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--shelf-text)' }}>
          Kobo Wireless Sync
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--shelf-text-muted)' }}>
          Send books to your Kobo over Wi-Fi — no cable, no Calibre, no desktop app.
        </p>
      </div>

      {/* Guest notice */}
      {isGuest && (
        <div
          className="flex items-start gap-3 p-4 rounded-lg border"
          style={{
            background: 'color-mix(in srgb, var(--shelf-warning) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--shelf-warning) 40%, transparent)',
            borderRadius: 'var(--shelf-radius)',
          }}
        >
          <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--shelf-warning)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--shelf-text)' }}>
              OPDS sync requires a cloud account
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--shelf-text-muted)' }}>
              Guest books are stored in your browser and can't be served to Kobo. Create a free
              account to unlock wireless sync.
            </p>
          </div>
        </div>
      )}

      {/* OPDS URL */}
      {!isGuest && (
        <div
          className="border rounded-xl p-5 flex flex-col gap-4"
          style={{
            background: 'var(--shelf-card)',
            borderColor: 'var(--shelf-border)',
            borderRadius: 'var(--shelf-radius-lg)',
          }}
        >
          <div className="flex items-center gap-2">
            <Wifi size={18} style={{ color: 'var(--shelf-gold)' }} />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--shelf-text)' }}>
              Your OPDS Catalog URL
            </h2>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded border font-mono text-xs break-all"
            style={{
              background: 'var(--shelf-surface)',
              borderColor: 'var(--shelf-border)',
              color: 'var(--shelf-text-muted)',
              borderRadius: 'var(--shelf-radius-sm)',
            }}
          >
            <span className="flex-1 break-all">{opdsUrl}</span>
          </div>
          <button
            onClick={copyUrl}
            className="self-start flex items-center gap-2 px-4 py-2 text-sm font-medium rounded border transition-colors"
            style={{
              background: copied ? 'var(--shelf-gold-subtle)' : 'var(--shelf-card)',
              borderColor: copied ? 'var(--shelf-gold-dim)' : 'var(--shelf-border)',
              color: copied ? 'var(--shelf-gold)' : 'var(--shelf-text-muted)',
              borderRadius: 'var(--shelf-radius-sm)',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      )}

      {/* Steps */}
      <div className="flex flex-col gap-4">
        <h2 className="font-semibold" style={{ color: 'var(--shelf-text)' }}>
          How to connect
        </h2>
        {steps.map((step) => (
          <div key={step.n} className="flex gap-4">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
              style={{ background: 'var(--shelf-gold-subtle)', color: 'var(--shelf-gold)' }}
            >
              {step.n}
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--shelf-text)' }}>
                {step.title}
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--shelf-text-muted)' }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Format note */}
      <div
        className="border rounded-xl p-5 flex flex-col gap-2"
        style={{
          background: 'var(--shelf-card)',
          borderColor: 'var(--shelf-border)',
          borderRadius: 'var(--shelf-radius-lg)',
        }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={15} style={{ color: 'var(--shelf-gold)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--shelf-text)' }}>
            Tip: use KEPUB for best Kobo experience
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--shelf-text-muted)' }}>
          KEPUB files render better on Kobo with proper pagination, typography, and reading stats. 
          Convert your EPUBs to KEPUB in the Formats tab before downloading.
        </p>
      </div>
    </div>
  );
}
