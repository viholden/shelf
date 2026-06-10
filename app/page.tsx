import Link from 'next/link';
import { BookOpen, Layers, RefreshCw, Wifi, ArrowRight, Star } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Your Library, Your Way',
    desc: 'Upload EPUB, PDF, MOBI, AZW3, and KEPUB files. Edit metadata, covers, and chapter text directly in the browser.',
  },
  {
    icon: RefreshCw,
    title: 'Format Converter',
    desc: 'Convert between EPUB, KEPUB, PDF, MOBI, and AZW3. Send the right format to the right device, every time.',
  },
  {
    icon: Layers,
    title: 'Series Management',
    desc: 'Group books into series, set reading order, drag to reorder. Your library stays organized automatically.',
  },
  {
    icon: Wifi,
    title: 'Wireless Kobo Sync',
    desc: 'Add your personal OPDS link to Kobo and browse your library wirelessly — no cable, no desktop app.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-dvh flex flex-col" style={{ background: 'var(--shelf-bg)' }}>
      <nav className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ borderColor: 'var(--shelf-border)', background: 'color-mix(in srgb, var(--shelf-bg) 85%, transparent)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-xl tracking-tight" style={{ color: 'var(--shelf-gold)' }}>shelf</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm transition-colors" style={{ color: 'var(--shelf-text-muted)' }}>
              Sign in
            </Link>
            <Link
              href="/library"
              className="text-sm font-semibold px-4 py-2 rounded transition-colors"
              style={{ background: 'var(--shelf-gold)', color: 'var(--shelf-bg)', borderRadius: 'var(--shelf-radius-sm)' }}
            >
              Open as guest
            </Link>
          </div>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 border"
          style={{ borderColor: 'var(--shelf-gold-dim)', background: 'var(--shelf-gold-subtle)', color: 'var(--shelf-gold)' }}
        >
          <Star size={12} fill="currentColor" />
          Free · No signup required
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-tight mb-6" style={{ color: 'var(--shelf-text)' }}>
          Your books,{' '}
          <span style={{ color: 'var(--shelf-gold)' }}>beautifully kept.</span>
        </h1>

        <p className="max-w-xl text-lg leading-relaxed mb-10" style={{ color: 'var(--shelf-text-muted)' }}>
          Upload, edit, convert, and send ebooks to your Kobo — wirelessly. Works completely
          offline without an account, or sync to the cloud when you sign up.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded transition-colors text-base"
            style={{ background: 'var(--shelf-gold)', color: 'var(--shelf-bg)', borderRadius: 'var(--shelf-radius)' }}
          >
            Open my library
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 border px-6 py-3 rounded transition-colors text-base"
            style={{ borderColor: 'var(--shelf-border)', color: 'var(--shelf-text-muted)', borderRadius: 'var(--shelf-radius)' }}
          >
            Create free account
          </Link>
        </div>

        <p className="mt-5 text-xs" style={{ color: 'var(--shelf-text-faint)' }}>
          Guest mode stores everything in your browser. Nothing leaves your device.
        </p>
      </section>

      <section className="max-w-6xl mx-auto w-full px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="border p-6"
              style={{ background: 'var(--shelf-card)', borderColor: 'var(--shelf-border)', borderRadius: 'var(--shelf-radius-lg)' }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center mb-4"
                style={{ background: 'var(--shelf-gold-subtle)', borderRadius: 'var(--shelf-radius-sm)' }}
              >
                <Icon size={20} style={{ color: 'var(--shelf-gold)' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--shelf-text)' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--shelf-text-muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 px-6 text-center text-xs" style={{ borderColor: 'var(--shelf-border)', color: 'var(--shelf-text-faint)' }}>
        shelf · open source · no tracking
      </footer>
    </main>
  );
}
