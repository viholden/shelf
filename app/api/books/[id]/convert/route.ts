import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { convertClientSide, isClientSideConversion } from '@/lib/conversion';
import type { Format } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { from, to } = (await request.json()) as { from: Format; to: Format };

  if (!from || !to) {
    return new NextResponse('Missing from/to parameters', { status: 400 });
  }

  // Verify book ownership
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id, user_id, title')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (bookError || !book) {
    return new NextResponse('Book not found', { status: 404 });
  }

  // Get source file
  const { data: srcFmt, error: fmtError } = await supabase
    .from('book_formats')
    .select('file_key, file_size')
    .eq('book_id', id)
    .eq('format', from)
    .single();

  if (fmtError || !srcFmt) {
    return new NextResponse('Source format not found', { status: 404 });
  }

  // Download source from storage
  const { data: srcBlob, error: dlError } = await supabase.storage
    .from('books')
    .download(srcFmt.file_key as string);

  if (dlError || !srcBlob) {
    return new NextResponse('Source file not found in storage', { status: 500 });
  }

  const srcBuffer = await srcBlob.arrayBuffer();

  // Perform conversion
  let convertedBuffer: ArrayBuffer;

  if (isClientSideConversion(from, to)) {
    convertedBuffer = await convertClientSide(srcBuffer, from, to);
  } else {
    // Future: spawn Calibre here
    // exec(`ebook-convert input.${from} output.${to}`)
    return new NextResponse(
      `Server-side conversion from ${from} to ${to} requires Calibre to be installed on the server. See SETUP.md for instructions.`,
      { status: 501 }
    );
  }

  // Upload converted file to storage
  const destKey = `${user.id}/${id}/${to}.${to}`;
  const { error: uploadError } = await supabase.storage
    .from('books')
    .upload(destKey, new Blob([convertedBuffer]), { upsert: true });

  if (uploadError) {
    return new NextResponse(`Storage upload failed: ${uploadError.message}`, { status: 500 });
  }

  // Upsert format record in DB
  await supabase.from('book_formats').upsert({
    book_id: id,
    format: to,
    file_key: destKey,
    file_size: convertedBuffer.byteLength,
    generated_at: new Date().toISOString(),
  });

  // Return the converted file directly
  return new NextResponse(convertedBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="converted.${to}"`,
    },
  });
}
