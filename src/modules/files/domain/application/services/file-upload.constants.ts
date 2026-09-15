export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES =
  /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;

export const ALLOWED_MIME_SET = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export const DEFAULT_PRESIGN_EXPIRES_SECONDS = 300;
