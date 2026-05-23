import { clusterIntoRows, splitColumns } from "../cluster";
import {
  extractAmounts,
  extractDateFromLine,
  maskAccountNumber,
  parseThaiDate,
} from "../thai";
import type {
  BankId,
  ClusteredRow,
  ParserResult,
  StatementRow,
  TextItem,
} from "../types";

const TRANSACTION_HEADER =
  /date|วันที่|transaction|รายการ|รายการเดินบัญชี|withdrawal|deposit|debit|credit|ถอน|ฝาก|เดบิต|เครดิต|balance|คงเหลือ/i;

const SKIP_LINE =
  /^(page|หน้า|total|ยอดรวม|opening|closing| brought forward| carried forward|สรุป|balance forward)/i;

const METADATA_LINE =
  /statement\s+period|requested\s+date|ช่วงเวลา|วันที่ขอ|รอบระยะเวลา/i;

const ACCOUNT_PATTERN =
  /(?:account|เลขที่บัญชี|a\/c|acc\.?)\s*(?:no\.?|number)?\s*[:.]?\s*([\d\-xX*]{6,})/i;

const PERIOD_PATTERN =
  /(?:period|ช่วงเวลา|statement\s+period|รอบระยะเวลา)\s*[:]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s*[-–toถึง]\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i;

function rowLooksLikeTransaction(line: string): boolean {
  return extractDateFromLine(line) !== null;
}

function parseTransactionLine(
  line: string,
  columns?: string[],
): StatementRow | null {
  const date =
    (columns?.[0] && parseThaiDate(columns[0])) ||
    extractDateFromLine(line);
  if (!date) return null;

  const amounts = extractAmounts(line);
  if (amounts.length === 0 && !columns?.length) return null;

  let description = line;
  const dateToken = line.match(
    /\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{1,2}\s+[A-Za-zก-๙]+\s+\d{2,4}/,
  );
  if (dateToken) {
    description = description.replace(dateToken[0], "").trim();
  }

  for (const amt of amounts) {
    const amtStr = Math.abs(amt).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    description = description
      .replace(new RegExp(`-?\\(?${amtStr.replace(".", "\\.")}\\)?`, "g"), "")
      .replace(/-?\(?[\d,]+\.\d{2}\)?/g, "")
      .trim();
  }

  description = description.replace(/\s+/g, " ").trim();
  if (!description) description = "Transaction";

  let debit: number | null = null;
  let credit: number | null = null;
  let balance: number | null = null;

  if (amounts.length >= 3) {
    const a = amounts[amounts.length - 3];
    const b = amounts[amounts.length - 2];
    const bal = amounts[amounts.length - 1];
    if (a < 0 || (a > 0 && b === 0)) {
      debit = a < 0 ? Math.abs(a) : a;
      credit = b > 0 ? b : null;
    } else if (b < 0) {
      debit = Math.abs(b);
      credit = a > 0 ? a : null;
    } else {
      debit = a > 0 ? a : null;
      credit = b > 0 ? b : null;
    }
    balance = bal;
  } else if (amounts.length === 2) {
    const [first, second] = amounts;
    if (second > 1000 || Math.abs(second) > Math.abs(first) * 5) {
      if (first < 0) {
        debit = Math.abs(first);
      } else {
        debit = first > 0 ? first : null;
        credit = first < 0 ? Math.abs(first) : null;
      }
      balance = second;
    } else {
      if (first < 0) debit = Math.abs(first);
      else if (first > 0) credit = first;
      balance = second;
    }
  } else if (amounts.length === 1) {
    const v = amounts[0];
    if (v < 0) debit = Math.abs(v);
    else credit = v;
  }

  if (columns && columns.length >= 4) {
    const colAmounts = columns
      .slice(-3)
      .map((c) => c.replace(/,/g, ""))
      .filter((c) => /^-?\d/.test(c));
    if (colAmounts.length >= 2) {
      const nums = columns
        .flatMap((c) => extractAmounts(c))
        .filter((n) => n !== null);
      if (nums.length >= 2) {
        balance = nums[nums.length - 1];
        const txn = nums[nums.length - 2];
        if (txn < 0) debit = Math.abs(txn);
        else credit = txn;
      }
    }
    const descCols = columns.slice(1, -2).join(" ").trim();
    if (descCols) description = descCols;
  }

  if (debit === null && credit === null && balance === null) return null;

  return {
    date,
    description,
    debit,
    credit,
    balance,
  };
}

function findTransactionStart(rows: ClusteredRow[]): number {
  for (let i = 0; i < rows.length; i++) {
    if (TRANSACTION_HEADER.test(rows[i].line)) return i + 1;
  }
  for (let i = 0; i < rows.length; i++) {
    if (rowLooksLikeTransaction(rows[i].line)) return i;
  }
  return 0;
}

function extractMetadata(
  fullText: string,
  bank: BankId,
): ParserResult["metadata"] {
  const accountMatch = fullText.match(ACCOUNT_PATTERN);
  const periodMatch = fullText.match(PERIOD_PATTERN);

  return {
    bank,
    accountNumber: maskAccountNumber(accountMatch?.[1]),
    periodStart: periodMatch?.[1]
      ? parseThaiDate(periodMatch[1]) ?? undefined
      : undefined,
    periodEnd: periodMatch?.[2]
      ? parseThaiDate(periodMatch[2]) ?? undefined
      : undefined,
    currency: /THB|บาท/i.test(fullText) ? "THB" : undefined,
  };
}

export function parseBankTable(
  items: TextItem[],
  bank: BankId,
  options?: { columnGap?: number },
): ParserResult {
  const warnings: string[] = [];
  const rows = clusterIntoRows(items);
  const fullText = rows.map((r) => r.line).join("\n");
  const metadata = extractMetadata(fullText, bank);

  const start = findTransactionStart(rows);
  const transactions: StatementRow[] = [];
  let skipped = 0;

  for (let i = start; i < rows.length; i++) {
    const row = rows[i];
    if (
      !row.line.trim() ||
      SKIP_LINE.test(row.line) ||
      METADATA_LINE.test(row.line)
    ) {
      continue;
    }

    if (!rowLooksLikeTransaction(row.line)) {
      skipped++;
      continue;
    }

    const columns = splitColumns(row, options?.columnGap ?? 20);
    const parsed = parseTransactionLine(row.line, columns);
    if (parsed) {
      transactions.push(parsed);
    }
  }

  if (skipped > 0) {
    warnings.push(`Skipped ${skipped} non-transaction lines.`);
  }

  if (transactions.length === 0) {
    warnings.push("No transactions found using table layout.");
  }

  return { rows: transactions, warnings, metadata };
}
