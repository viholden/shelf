'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/library');
      router.refresh();
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--shelf-bg)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-10">
          <BookOpen size={24} style={{ color: 'var(--shelf-gold)' }} />
          <span className="font-bold text-xl" style={{ color: 'var(--shelf-gold)' }}>
            shelf
          </span>
        </Link>

        <div
          className="border p-8"
          style={{
            background: 'var(--shelf-card)',
            borderColor: 'var(--shelf-border)',
            borderRadius: 'var(--shelf-radius-lg)',
          }}
        >
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--shelf-text)' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--shelf-text-muted)' }}>
            Sign in to access your library
          </p>

          {error && (
            <div
              className="text-sm px-3 py-2 rounded mb-4"
              style={{
                background: 'color-mix(in srgb, var(--shelf-error) 15%, transparent)',
                color: 'var(--shelf-error)',
                borderRadius: 'var(--shelf-radius-sm)',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--shelf-text-muted)' }}>
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm outline-none border transition-colors"
                style={{
                  background: 'var(--shelf-surface)',
                  borderColor: 'var(--shelf-border)',
                  color: 'var(--shelf-text)',
                  borderRadius: 'var(--shelf-radius-sm)',
                }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--shelf-text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 text-sm outline-none border transition-colors"
                  style={{
                    background: 'var(--shelf-surface)',
                    borderColor: 'var(--shelf-border)',
                    color: 'var(--shelf-text)',
                    borderRadius: 'var(--shelf-radius-sm)',
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--shelf-text-faint)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 mt-2 transition-colors disabled:opacity-60"
              style={{
                background: 'var(--shelf-gold)',
                color: 'var(--shelf-bg)',
                borderRadius: 'var(--shelf-radius-sm)',
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin-slow" />}
              Sign in
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm" style={{ color: 'var(--shelf-text-muted)' }}>
              No account?{' '}
              <Link href="/signup" style={{ color: 'var(--shelf-gold)' }} className="font-medium">
                Sign up free
              </Link>
            </span>
          </div>

          <div
            className="mt-4 pt-4 border-t text-center"
            style={{ borderColor: 'var(--shelf-border)' }}
          >
            <Link
              href="/library"
              className="text-sm"
              style={{ color: 'var(--shelf-text-faint)' }}
            >
              Continue without account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
