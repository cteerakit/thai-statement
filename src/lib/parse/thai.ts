const THAI_MONTHS: Record<string, number> = {
  มกราคม: 1,
  กุมภาพันธ์: 2,
  มีนาคม: 3,
  เมษายน: 4,
  พฤษภาคม: 5,
  มิถุนายน: 6,
  กรกฎาคม: 7,
  สิงหาคม: 8,
  กันยายน: 9,
  ตุลาคม: 10,
  พฤศจิกายน: 11,
  ธันวาคม: 12,
};

const EN_MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

/** Buddhist era (25xx) or CE year → four-digit CE year */
export function toChristianYear(year: number): number {
  if (year >= 2400) return year - 543;
  if (year < 100) return year + 2000;
  return year;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD (Buddhist or CE years). */
export function parseThaiDate(input: string): string | null {
  const trimmed = input.trim();

  const numeric = trimmed.match(
    /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/,
  );
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    let year = Number(numeric[3]);
    year = toChristianYear(year);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  const iso = trimmed.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (iso) {
    let year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    year = toChristianYear(year);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  const named = trimmed.match(/^(\d{1,2})\s+([A-Za-zก-๙]+)\s+(\d{2,4})$/);
  if (named) {
    const day = Number(named[1]);
    const monthKey = named[2].toLowerCase();
    let year = Number(named[3]);
    year = toChristianYear(year);
    const month =
      THAI_MONTHS[named[2]] ?? EN_MONTHS[monthKey] ?? null;
    if (month && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  return null;
}

/** Extract first date-like token from a line. */
export function extractDateFromLine(line: string): string | null {
  const patterns = [
    /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/,
    /\b(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b/,
    /\b(\d{1,2}\s+[A-Za-zก-๙]+\s+\d{2,4})\b/,
  ];
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const parsed = parseThaiDate(match[1]);
      if (parsed) return parsed;
    }
  }
  return null;
}

/** Parse amount strings: 1,234.56, (1,234.56), -1234.56 */
export function parseAmount(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed === "-" || trimmed === "—") return null;

  const paren = trimmed.match(/^\(([\d,]+\.?\d*)\)$/);
  if (paren) {
    const n = Number(paren[1].replace(/,/g, ""));
    return Number.isFinite(n) ? -n : null;
  }

  const cleaned = trimmed.replace(/,/g, "").replace(/\s/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Find all monetary amounts in a line (right-aligned columns often last). */
export function extractAmounts(line: string): number[] {
  const matches = line.match(/-?\(?[\d,]+\.\d{2}\)?/g) ?? [];
  return matches
    .map((m) => parseAmount(m))
    .filter((n): n is number => n !== null);
}

export function maskAccountNumber(account?: string): string | undefined {
  if (!account) return undefined;
  const digits = account.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `****${digits.slice(-4)}`;
}
