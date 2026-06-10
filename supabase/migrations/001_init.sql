-- ─────────────────────────────────────────────────────────────────
-- Shelf — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Series ──────────────────────────────────────────────────────
CREATE TABLE series (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  cover_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own series"
  ON series FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Books ───────────────────────────────────────────────────────
CREATE TABLE books (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  author         TEXT NOT NULL DEFAULT '',
  description    TEXT,
  cover_url      TEXT,
  tags           TEXT[] NOT NULL DEFAULT '{}',
  series_id      UUID REFERENCES series(id) ON DELETE SET NULL,
  series_order   INTEGER,
  original_format TEXT NOT NULL DEFAULT 'epub',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own books"
  ON books FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Book Formats ─────────────────────────────────────────────────
CREATE TABLE book_formats (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id      UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  format       TEXT NOT NULL,
  file_key     TEXT NOT NULL,
  file_size    BIGINT NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(book_id, format)
);

ALTER TABLE book_formats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own book formats"
  ON book_formats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_formats.book_id
        AND books.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_formats.book_id
        AND books.user_id = auth.uid()
    )
  );

-- ─── Updated-at trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER series_updated_at
  BEFORE UPDATE ON series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Storage buckets (run separately in Supabase dashboard) ───────
-- Create bucket "books" with:
--   • Public: false
--   • Max file size: 100MB
--   • Allowed MIME types: application/epub+zip, application/pdf,
--     application/x-mobipocket-ebook, application/vnd.amazon.ebook

-- Storage policy — users can only access their own files
-- INSERT policy: storage.foldername(name)[1] = auth.uid()::text
-- SELECT/DELETE policy: storage.foldername(name)[1] = auth.uid()::text
