import { openDB, type IDBPDatabase } from 'idb';
import type { Book, Series, StorageAdapter } from '@/lib/types';

const DB_NAME = 'shelf-local';
const DB_VERSION = 1;

interface ShelfDB {
  books: {
    key: string;
    value: Book;
    indexes: { by_series: string };
  };
  series: {
    key: string;
    value: Series;
  };
  files: {
    key: string;
    value: { key: string; data: ArrayBuffer };
  };
}

async function getDB(): Promise<IDBPDatabase<ShelfDB>> {
  return openDB<ShelfDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('books')) {
        const bookStore = db.createObjectStore('books', { keyPath: 'id' });
        bookStore.createIndex('by_series', 'seriesId');
      }
      if (!db.objectStoreNames.contains('series')) {
        db.createObjectStore('series', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'key' });
      }
    },
  });
}

export class LocalStorageAdapter implements StorageAdapter {
  async getBooks(): Promise<Book[]> {
    const db = await getDB();
    const books = await db.getAll('books');
    return books.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getBook(id: string): Promise<Book | null> {
    const db = await getDB();
    return (await db.get('books', id)) ?? null;
  }

  async saveBook(book: Book): Promise<void> {
    const db = await getDB();
    await db.put('books', book);
  }

  async deleteBook(id: string): Promise<void> {
    const db = await getDB();
    const book = await db.get('books', id);
    if (book) {
      for (const fmt of book.formats) {
        await db.delete('files', fmt.fileKey);
      }
    }
    await db.delete('books', id);
  }

  async getFileData(key: string): Promise<ArrayBuffer | null> {
    const db = await getDB();
    const record = await db.get('files', key);
    return record?.data ?? null;
  }

  async saveFileData(key: string, data: ArrayBuffer): Promise<void> {
    const db = await getDB();
    await db.put('files', { key, data });
  }

  async deleteFileData(key: string): Promise<void> {
    const db = await getDB();
    await db.delete('files', key);
  }

  async getSeries(): Promise<Series[]> {
    const db = await getDB();
    const all = await db.getAll('series');
    return all.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getSeriesById(id: string): Promise<Series | null> {
    const db = await getDB();
    return (await db.get('series', id)) ?? null;
  }

  async saveSeries(series: Series): Promise<void> {
    const db = await getDB();
    await db.put('series', series);
  }

  async deleteSeries(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('series', id);
  }
}
