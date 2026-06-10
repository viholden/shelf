'use client';

import { LocalStorageAdapter } from './local';
import { CloudStorageAdapter } from './cloud';
import type { StorageAdapter } from '@/lib/types';

let _adapter: StorageAdapter | null = null;

export function getStorageAdapter(isGuest: boolean): StorageAdapter {
  if (!_adapter) {
    _adapter = isGuest ? new LocalStorageAdapter() : new CloudStorageAdapter();
  }
  return _adapter;
}

export function resetStorageAdapter() {
  _adapter = null;
}

export { LocalStorageAdapter, CloudStorageAdapter };
export type { StorageAdapter };
