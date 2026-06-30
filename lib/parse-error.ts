type AxiosLike = { response?: { data?: { message?: string | string[] } } };

function bytesToMB(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function rawMessage(err: unknown): string | string[] {
  if (typeof err === 'string') return err;
  const msg = (err as AxiosLike)?.response?.data?.message;
  if (msg !== undefined) return msg;
  if (err instanceof Error) return err.message;
  return '';
}

export function parseApiError(err: unknown): string {
  const raw = rawMessage(err);
  const text = Array.isArray(raw) ? raw[0] : raw;

  // File size: "Validation failed (current file size is X, expected size is less than Y)"
  const sizeMatch = text.match(/current file size is (\d+), expected size is less than (\d+)/);
  if (sizeMatch) {
    const actual = bytesToMB(Number(sizeMatch[1]));
    const limit  = bytesToMB(Number(sizeMatch[2]));
    return `File too large (${actual} MB). Maximum allowed size is ${limit} MB.`;
  }

  // File type
  if (/invalid file type/i.test(text)) {
    return 'Invalid file type. Please upload an image (JPG, PNG, WebP) or PDF.';
  }

  // File required (no file sent)
  if (/file is required/i.test(text)) {
    return 'No file selected. Please choose a file to upload.';
  }

  // Conflict
  if (/already exists/i.test(text)) return text;

  // Not found
  if (/not found/i.test(text)) return 'Record not found.';

  // Unauthorized / forbidden
  if (/unauthorized/i.test(text) || /forbidden/i.test(text)) {
    return 'You do not have permission to perform this action.';
  }

  // Validation array — join first message
  if (Array.isArray(raw) && raw.length > 0) return raw[0];

  return text || 'Something went wrong. Please try again.';
}
