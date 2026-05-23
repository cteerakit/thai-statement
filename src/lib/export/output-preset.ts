import { z } from "zod";
import type { StatementRow } from "@/lib/parse/types";

export const outputTablePresetSchema = z.enum([
  "withdrawal_deposit",
  "signed_amount",
  /** @deprecated Use withdrawal_deposit */
  "debit_credit",
]);

export type OutputTablePreset = z.infer<typeof outputTablePresetSchema>;

export const DEFAULT_OUTPUT_TABLE_PRESET: OutputTablePreset =
  "withdrawal_deposit";

export type OutputColumnKey =
  | "date"
  | "description"
  | "withdrawal"
  | "deposit"
  | "amount"
  | "balance"
  | "reference";

export type OutputColumnLabels = {
  date: string;
  description: string;
  withdrawal: string;
  deposit: string;
  amount: string;
  balance: string;
  reference: string;
};

export const EXPORT_COLUMNS: Record<
  "withdrawal_deposit" | "signed_amount",
  OutputColumnKey[]
> = {
  withdrawal_deposit: [
    "date",
    "description",
    "withdrawal",
    "deposit",
    "balance",
    "reference",
  ],
  signed_amount: ["date", "description", "amount", "balance", "reference"],
};

export const PREVIEW_COLUMNS: Record<
  "withdrawal_deposit" | "signed_amount",
  OutputColumnKey[]
> = {
  withdrawal_deposit: [
    "date",
    "description",
    "withdrawal",
    "deposit",
    "balance",
  ],
  signed_amount: ["date", "description", "amount", "balance"],
};

export function normalizeOutputTablePreset(
  raw: string | undefined,
): "withdrawal_deposit" | "signed_amount" {
  if (raw === "signed_amount") return "signed_amount";
  return "withdrawal_deposit";
}

/** Signed amount: deposits positive, withdrawals negative. */
export function signedAmount(row: StatementRow): number | null {
  const hasDeposit = row.credit !== null;
  const hasWithdrawal = row.debit !== null;
  if (!hasDeposit && !hasWithdrawal) return null;
  return (row.credit ?? 0) - (row.debit ?? 0);
}

export function getOutputCellValue(
  row: StatementRow,
  key: OutputColumnKey,
): string | number | null {
  switch (key) {
    case "date":
      return row.date;
    case "description":
      return row.description;
    case "withdrawal":
      return row.debit;
    case "deposit":
      return row.credit;
    case "amount":
      return signedAmount(row);
    case "balance":
      return row.balance;
    case "reference":
      return row.reference ?? null;
  }
}

export function projectOutputTable(
  rows: StatementRow[],
  columns: OutputColumnKey[],
  labels: OutputColumnLabels,
): { headers: string[]; rows: (string | number | null)[][] } {
  const headers = columns.map((key) => labels[key]);
  const projected = rows.map((row) =>
    columns.map((key) => getOutputCellValue(row, key)),
  );
  return { headers, rows: projected };
}

export function parseOutputTablePreset(
  raw: unknown,
): OutputTablePreset | undefined {
  const parsed = outputTablePresetSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}
