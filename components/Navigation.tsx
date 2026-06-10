'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  BookOpen,
  Layers,
  Upload,
  Settings,
  LogOut,
  LogIn,
  Wifi,
  Menu,
  X,
  User2,
} from 'lucide-react';

const navItems = [
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/series', label: 'Series', icon: Layers },
  { href: '/kobo', label: 'Kobo Sync', icon: Wifi },
  { href: '/calibre', label: 'Import Calibre', icon: Upload },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isGuest, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:flex flex-col w-56 min-h-dvh border-r py-6 px-4 gap-1 fixed top-0 left-0 z-40"
        style={{ background: 'var(--shelf-surface)', borderColor: 'var(--shelf-border)' }}
      >
        <Link href="/library" className="flex items-center gap-2 px-2 mb-8">
          <BookOpen size={20} style={{ color: 'var(--shelf-gold)' }} />
          <span className="font-bold text-lg" style={{ color: 'var(--shelf-gold)' }}>
            shelf
          </span>
        </Link>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                style={{
                  background: active ? 'var(--shelf-gold-subtle)' : 'transparent',
                  color: active ? 'var(--shelf-gold)' : 'var(--shelf-text-muted)',
                  borderRadius: 'var(--shelf-radius-sm)',
                }}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div
          className="border-t pt-4 mt-4 flex flex-col gap-1"
          style={{ borderColor: 'var(--shelf-border)' }}
        >
          {isGuest ? (
            <>
              <p className="px-3 text-xs mb-2" style={{ color: 'var(--shelf-text-faint)' }}>
                Guest mode · stored locally
              </p>
              <Link
                href="/login"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded transition-colors"
                style={{ color: 'var(--shelf-text-muted)', borderRadius: 'var(--shelf-radius-sm)' }}
              >
                <LogIn size={17} />
                Sign in
              </Link>
            </>
          ) : (
            <>
              <div className="px-3 flex items-center gap-2 mb-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--shelf-gold-subtle)', color: 'var(--shelf-gold)' }}
                >
                  <User2 size={14} />
                </div>
                <span
                  className="text-xs truncate max-w-[120px]"
                  style={{ color: 'var(--shelf-text-muted)' }}
                >
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded transition-colors w-full text-left"
                style={{ color: 'var(--shelf-text-muted)', borderRadius: 'var(--shelf-radius-sm)' }}
              >
                <LogOut size={17} />
                Sign out
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <header
        className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b"
        style={{
          background: 'var(--shelf-surface)',
          borderColor: 'var(--shelf-border)',
        }}
      >
        <Link href="/library" className="flex items-center gap-2">
          <BookOpen size={18} style={{ color: 'var(--shelf-gold)' }} />
          <span className="font-bold text-lg" style={{ color: 'var(--shelf-gold)' }}>
            shelf
          </span>
        </Link>
        <button onClick={() => setMobileOpen(true)} style={{ color: 'var(--shelf-text-muted)' }}>
          <Menu size={22} />
        </button>
      </header>

      {/* ── Mobile menu overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-64 flex flex-col py-6 px-4 gap-1"
            style={{ background: 'var(--shelf-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8 px-2">
              <span className="font-bold text-lg" style={{ color: 'var(--shelf-gold)' }}>shelf</span>
              <button onClick={() => setMobileOpen(false)} style={{ color: 'var(--shelf-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded transition-colors"
                    style={{
                      background: active ? 'var(--shelf-gold-subtle)' : 'transparent',
                      color: active ? 'var(--shelf-gold)' : 'var(--shelf-text-muted)',
                      borderRadius: 'var(--shelf-radius-sm)',
                    }}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div
              className="border-t pt-4 mt-4 flex flex-col gap-1"
              style={{ borderColor: 'var(--shelf-border)' }}
            >
              {isGuest ? (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded"
                  style={{ color: 'var(--shelf-text-muted)' }}
                >
                  <LogIn size={17} />
                  Sign in
                </Link>
              ) : (
                <button
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded w-full text-left"
                  style={{ color: 'var(--shelf-text-muted)' }}
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
