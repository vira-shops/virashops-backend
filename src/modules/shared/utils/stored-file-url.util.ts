export function isStoredFileKey(key: string): boolean {
  const trimmed = key.trim();
  return trimmed.startsWith('uploads/') || trimmed.includes('/uploads/');
}

export function isStoredFileUrl(url: string): boolean {
  try {
    return decodeURIComponent(new URL(url).pathname).includes('/uploads/');
  } catch {
    return url.includes('/uploads/');
  }
}

/** Accepts either a storage key (`uploads/...`) or a URL that contains `/uploads/`. */
export function resolveStoredFileKey(keyOrUrl: string): string | null {
  const trimmed = keyOrUrl.trim();
  if (!trimmed) {
    return null;
  }
  if (isStoredFileKey(trimmed) && !trimmed.includes('://')) {
    const i = trimmed.indexOf('uploads/');
    return i >= 0 ? trimmed.slice(i) : trimmed;
  }
  return extractStorageKeyFromUrl(trimmed);
}

export function extractStorageKeyFromUrl(url: string): string | null {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const i = pathname.indexOf('/uploads/');
    if (i >= 0) {
      return pathname.slice(i + 1);
    }
    return pathname.replace(/^\//, '') || null;
  } catch {
    const i = url.indexOf('/uploads/');
    if (i >= 0) {
      return url.slice(i + 1).split('?')[0] ?? null;
    }
    return null;
  }
}
