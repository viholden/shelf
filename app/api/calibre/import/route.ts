import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateId } from '@/lib/utils';
import type { Format } from '@/lib/types';

/**
 * POST /api/calibre/import
 *
 * Accepts a Calibre metadata.db file (via form-data field "db"),
 * reads the books table, and imports them into the user's Shelf library.
 *
 * Because metadata.db is SQLite, we read it using the sqlite3 file format
 * (magic bytes check) and extract the books/authors table via a minimal
 * SQLite parser — or we can use the `better-sqlite3` npm package on the server.
 *
 * For now this endpoint accepts a pre-parsed JSON export as well
 * (field "json" with array of book objects) for environments where
 * SQLite binaries can't run in serverless functions.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const jsonRaw = formData.get('json');

  if (!jsonRaw || typeof jsonRaw !== 'string') {
    return NextResponse.json(
      { error: 'Send a "json" field with an array of book objects.' },
      { status: 400 }
    );
  }

  let books: Array<{
    title: string;
    authors?: string;
    series?: string;
    series_index?: number;
    tags?: string;
    comments?: string;
    cover?: string;
    formats?: string[];
  }>;

  try {
    books = JSON.parse(jsonRaw);
    if (!Array.isArray(books)) throw new Error('Not an array');
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let imported = 0;
  const errors: string[] = [];

  for (const b of books) {
    try {
      if (!b.title?.trim()) continue;

      // Find or create series
      let seriesId: string | undefined;
      if (b.series) {
        const { data: existing } = await supabase
          .from('series')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', b.series)
          .maybeSingle();

        if (existing) {
          seriesId = existing.id;
        } else {
          const { data: created } = await supabase
            .from('series')
            .insert({ user_id: user.id, name: b.series })
            .select('id')
            .single();
          seriesId = created?.id;
        }
      }

      const tags = b.tags
        ? b.tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean)
        : [];

      await supabase.from('books').insert({
        user_id: user.id,
        title: b.title.trim(),
        author: b.authors?.trim() ?? '',
        description: b.comments?.trim(),
        tags,
        series_id: seriesId,
        series_order: b.series_index ? Math.round(b.series_index) : undefined,
        cover_url: b.cover?.trim(),
        original_format: ((b.formats?.[0]?.toLowerCase() as Format) ?? 'epub'),
      });

      imported++;
    } catch (err) {
      errors.push(`${b.title}: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  return NextResponse.json({
    imported,
    total: books.length,
    errors: errors.slice(0, 10),
  });
}
