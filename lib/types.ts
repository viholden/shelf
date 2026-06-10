// ─── Format Types ──────────────────────────────────────────────────────────

export type Format = 'epub' | 'kepub' | 'pdf' | 'mobi' | 'azw3';

export const FORMAT_LABELS: Record<Format, string> = {
  epub: 'EPUB',
  kepub: 'KEPUB',
  pdf: 'PDF',
  mobi: 'MOBI',
  azw3: 'AZW3',
};

export const ACCEPTED_FORMATS: Format[] = ['epub', 'kepub', 'pdf', 'mobi', 'azw3'];

export const ACCEPTED_MIME_TYPES: Record<string, Format> = {
  'application/epub+zip': 'epub',
  'application/x-mobipocket-ebook': 'mobi',
  'application/vnd.amazon.ebook': 'azw3',
  'application/pdf': 'pdf',
};

export const CONVERSION_MATRIX: Partial<Record<Format, Format[]>> = {
  epub: ['kepub', 'pdf', 'mobi', 'azw3'],
  kepub: ['epub'],
  pdf: ['epub', 'kepub'],
  mobi: ['epub'],
  azw3: ['epub'],
};

export const LOSSY_CONVERSIONS: Array<`${Format}->${Format}`> = [
  'pdf->epub',
  'pdf->kepub',
  'mobi->epub',
  'azw3->epub',
];

// ─── Book Types ─────────────────────────────────────────────────────────────

export interface BookFormat {
  id: string;
  bookId: string;
  format: Format;
  fileKey: string; // storage key / path
  fileSize: number;
  generatedAt: string;
}

export interface Book {
  id: string;
  userId?: string; // undefined for guest
  title: string;
  author: string;
  description?: string;
  coverUrl?: string;
  coverData?: string; // base64 data URL for guest
  tags: string[];
  seriesId?: string;
  seriesOrder?: number;
  originalFormat: Format;
  formats: BookFormat[];
  createdAt: string;
  updatedAt: string;
}

// ─── Series Types ────────────────────────────────────────────────────────────

export interface Series {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  coverUrl?: string;
  coverData?: string;
  bookCount?: number;
  books?: Book[];
  createdAt: string;
  updatedAt: string;
}

// ─── EPUB Types ──────────────────────────────────────────────────────────────

export interface EpubChapter {
  id: string;
  title: string;
  href: string;
  content: string;
  order: number;
}

export interface EpubMetadata {
  title: string;
  author: string;
  description?: string;
  language?: string;
  publisher?: string;
  coverHref?: string;
  spine: string[];
  manifest: Record<string, { href: string; mediaType: string }>;
  chapters: EpubChapter[];
}

// ─── Storage Types ───────────────────────────────────────────────────────────

export type StorageMode = 'cloud' | 'guest';

export interface StorageAdapter {
  getBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | null>;
  saveBook(book: Book): Promise<void>;
  deleteBook(id: string): Promise<void>;
  getFileData(key: string): Promise<ArrayBuffer | null>;
  saveFileData(key: string, data: ArrayBuffer): Promise<void>;
  deleteFileData(key: string): Promise<void>;
  getSeries(): Promise<Series[]>;
  getSeriesById(id: string): Promise<Series | null>;
  saveSeries(series: Series): Promise<void>;
  deleteSeries(id: string): Promise<void>;
}

// ─── Conversion Types ────────────────────────────────────────────────────────

export interface ConversionJob {
  id: string;
  bookId: string;
  fromFormat: Format;
  toFormat: Format;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  createdAt: string;
}

// ─── OPDS Types ───────────────────────────────────────────────────────────────

export interface OpdsFeed {
  id: string;
  title: string;
  updated: string;
  entries: OpdsEntry[];
}

export interface OpdsEntry {
  id: string;
  title: string;
  author: string;
  updated: string;
  summary?: string;
  coverUrl?: string;
  links: OpdsLink[];
}

export interface OpdsLink {
  rel: string;
  href: string;
  type: string;
  title?: string;
}

// ─── UI Types ────────────────────────────────────────────────────────────────

export interface SearchFilters {
  query: string;
  format?: Format;
  seriesId?: string;
  tags?: string[];
}
