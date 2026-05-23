export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_PAGES = 20;
export const PREVIEW_ROW_LIMIT = 50;
export const MAX_ROWS = 10_000;
export const MAX_PASSWORD_LENGTH = 256;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_MAP_MAX_ENTRIES = 10_000;

function evictRateLimitEntries(): void {
  if (rateLimitMap.size <= RATE_LIMIT_MAP_MAX_ENTRIES) return;

  const entries = [...rateLimitMap.entries()].sort(
    (a, b) => a[1].resetAt - b[1].resetAt,
  );
  const toRemove = entries.length - RATE_LIMIT_MAP_MAX_ENTRIES + 500;
  for (let i = 0; i < toRemove; i++) {
    const key = entries[i]?.[0];
    if (key) rateLimitMap.delete(key);
  }
}

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    evictRateLimitEntries();
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}
