import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildOpdsCatalog, buildOpdsSearchDescription } from '@/lib/opds/catalog';
import type { Book, BookFormat, Format } from '@/lib/types';

function rowToBook(row: Record<string, unknown>): Book {
  const formats = (row.book_formats as Record<string, unknown>[] ?? []).map(
    (f): BookFormat => ({
      id: f.id as string,
      bookId: f.book_id as string,
      format: f.format as Format,
      fileKey: f.file_key as string,
      fileSize: (f.file_size as number) ?? 0,
      generatedAt: f.generated_at as string,
    })
  );
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    author: (row.author as string) ?? '',
    description: (row.description as string) ?? undefined,
    coverUrl: (row.cover_url as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
    seriesId: (row.series_id as string) ?? undefined,
    seriesOrder: (row.series_order as number) ?? undefined,
    originalFormat: (row.original_format as Format) ?? 'epub',
    formats,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  let dbQuery = supabase
    .from('books')
    .select('*, book_formats(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (query) {
    dbQuery = dbQuery.or(
      `title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`
    );
  }

  const { data, error } = await dbQuery;
  if (error) return new NextResponse(error.message, { status: 500 });

  const books = (data ?? []).map((row) => rowToBook(row as Record<string, unknown>));
  const xml = buildOpdsCatalog(baseUrl, books);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/atom+xml;profile=opds-catalog;kind=navigation',
      'Cache-Control': 'no-store',
    },
  });
}
