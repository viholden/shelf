import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Format, ACCEPTED_MIME_TYPES } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function detectFormatFromFile(file: File): Format {
  const mime = file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ACCEPTED_MIME_TYPES[mime]) return ACCEPTED_MIME_TYPES[mime];
  if (ext === 'epub') return 'epub';
  if (ext === 'kepub') return 'kepub';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'mobi') return 'mobi';
  if (ext === 'azw3') return 'azw3';
  return 'epub';
}

export function getFormatExtension(format: Format): string {
  return format; // format names match file extensions
}

export function isLossyConversion(from: Format, to: Format): boolean {
  const lossy = ['pdf->epub', 'pdf->kepub', 'mobi->epub', 'azw3->epub'];
  return lossy.includes(`${from}->${to}`);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
