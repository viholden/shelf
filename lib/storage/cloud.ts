import { createClient } from '@/lib/supabase/client';
import type { Book, Series, StorageAdapter } from '@/lib/types';

const BUCKET = 'books';

function toBook(row: Record<string, unknown>, formats: Record<string, unknown>[]): Book {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    author: row.author as string,
    description: (row.description as string) ?? undefined,
    coverUrl: (row.cover_url as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
    seriesId: (row.series_id as string) ?? undefined,
    seriesOrder: (row.series_order as number) ?? undefined,
    originalFormat: row.original_format as 'epub' | 'kepub' | 'pdf' | 'mobi' | 'azw3',
    formats: formats.map((f) => ({
      id: f.id as string,
      bookId: f.book_id as string,
      format: f.format as 'epub' | 'kepub' | 'pdf' | 'mobi' | 'azw3',
      fileKey: f.file_key as string,
      fileSize: (f.file_size as number) ?? 0,
      generatedAt: f.generated_at as string,
    })),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toSeries(row: Record<string, unknown>): Series {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    coverUrl: (row.cover_url as string) ?? undefined,
    bookCount: (row.book_count as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class CloudStorageAdapter implements StorageAdapter {
  private supabase = createClient();

  async getBooks(): Promise<Book[]> {
    const { data: books, error } = await this.supabase
      .from('books')
      .select('*, book_formats(*)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (books ?? []).map((b) =>
      toBook(b as Record<string, unknown>, (b.book_formats ?? []) as Record<string, unknown>[])
    );
  }

  async getBook(id: string): Promise<Book | null> {
    const { data, error } = await this.supabase
      .from('books')
      .select('*, book_formats(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return toBook(
      data as Record<string, unknown>,
      ((data as Record<string, unknown>).book_formats ?? []) as Record<string, unknown>[]
    );
  }

  async saveBook(book: Book): Promise<void> {
    const { error } = await this.supabase.from('books').upsert({
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description,
      cover_url: book.coverUrl,
      tags: book.tags,
      series_id: book.seriesId,
      series_order: book.seriesOrder,
      original_format: book.originalFormat,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }

  async deleteBook(id: string): Promise<void> {
    // book_formats will cascade; storage files must be deleted separately
    const book = await this.getBook(id);
    if (book) {
      const keys = book.formats.map((f) => f.fileKey);
      if (keys.length > 0) {
        await this.supabase.storage.from(BUCKET).remove(keys);
      }
    }
    const { error } = await this.supabase.from('books').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getFileData(key: string): Promise<ArrayBuffer | null> {
    const { data, error } = await this.supabase.storage.from(BUCKET).download(key);
    if (error || !data) return null;
    return await data.arrayBuffer();
  }

  async saveFileData(key: string, data: ArrayBuffer): Promise<void> {
    const blob = new Blob([data]);
    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(key, blob, { upsert: true });
    if (error) throw new Error(error.message);
  }

  async deleteFileData(key: string): Promise<void> {
    await this.supabase.storage.from(BUCKET).remove([key]);
  }

  async getSeries(): Promise<Series[]> {
    const { data, error } = await this.supabase
      .from('series')
      .select('*, books(count)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((s) => {
      const row = s as Record<string, unknown>;
      const booksArr = row.books as Array<{ count: number }> | null;
      const bookCount = booksArr?.[0]?.count ?? 0;
      return { ...toSeries(row), bookCount };
    });
  }

  async getSeriesById(id: string): Promise<Series | null> {
    const { data, error } = await this.supabase
      .from('series')
      .select('*, books(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    const booksRows = (row.books ?? []) as Record<string, unknown>[];
    const series = toSeries(row);
    series.books = booksRows.map((b) => toBook(b, []));
    return series;
  }

  async saveSeries(series: Series): Promise<void> {
    const { error } = await this.supabase.from('series').upsert({
      id: series.id,
      name: series.name,
      description: series.description,
      cover_url: series.coverUrl,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }

  async deleteSeries(id: string): Promise<void> {
    const { error } = await this.supabase.from('series').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
