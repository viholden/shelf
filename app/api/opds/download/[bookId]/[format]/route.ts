import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Format } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; format: string }> }
) {
  const { bookId, format } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Verify ownership and get file key
  const { data: fmt, error } = await supabase
    .from('book_formats')
    .select('file_key, books(title, user_id)')
    .eq('book_id', bookId)
    .eq('format', format)
    .single();

  if (error || !fmt) {
    return new NextResponse('Not found', { status: 404 });
  }

  const book = (fmt as Record<string, unknown>).books as Record<string, unknown>;
  if (book?.user_id !== user.id) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Stream the file from Supabase Storage
  const { data, error: storageError } = await supabase.storage
    .from('books')
    .download(fmt.file_key as string);

  if (storageError || !data) {
    return new NextResponse('File not found', { status: 404 });
  }

  const mimeTypes: Record<string, string> = {
    epub: 'application/epub+zip',
    kepub: 'application/epub+zip',
    pdf: 'application/pdf',
    mobi: 'application/x-mobipocket-ebook',
    azw3: 'application/vnd.amazon.ebook',
  };

  const title = ((book?.title as string) ?? 'book').replace(/[^a-z0-9 ._-]/gi, '_');

  return new NextResponse(data, {
    headers: {
      'Content-Type': mimeTypes[format] ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${title}.${format}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
