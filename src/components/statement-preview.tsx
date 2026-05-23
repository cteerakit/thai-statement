"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMessage } from "@/i18n/format";
import type { PreviewDictionary } from "@/i18n/types";
import {
  getOutputCellValue,
  normalizeOutputTablePreset,
  PREVIEW_COLUMNS,
  type OutputColumnKey,
  type OutputTablePreset,
} from "@/lib/export/output-preset";
import { PREVIEW_ROW_LIMIT } from "@/lib/limits";
import type { StatementRow } from "@/lib/parse/types";

function fmt(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCellValue(value: string | number | null): string {
  if (typeof value === "number") return fmt(value);
  return value ?? "—";
}

const AMOUNT_COLUMNS = new Set<OutputColumnKey>([
  "withdrawal",
  "deposit",
  "amount",
  "balance",
]);

type StatementPreviewProps = {
  rows: StatementRow[];
  dict: PreviewDictionary;
  columnPreset: OutputTablePreset;
};

export function StatementPreview({
  rows,
  dict,
  columnPreset,
}: StatementPreviewProps) {
  const preview = rows.slice(0, PREVIEW_ROW_LIMIT);
  const columns = PREVIEW_COLUMNS[normalizeOutputTablePreset(columnPreset)];
  const labels: Record<OutputColumnKey, string> = {
    date: dict.date,
    description: dict.description,
    withdrawal: dict.withdrawal,
    deposit: dict.deposit,
    amount: dict.amount,
    balance: dict.balance,
    reference: dict.reference,
  };

  return (
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((key) => (
              <TableHead
                key={key}
                className={AMOUNT_COLUMNS.has(key) ? "text-right" : undefined}
              >
                {labels[key]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.map((row, i) => (
            <TableRow key={`${row.date}-${i}`}>
              {columns.map((key) => {
                const value = getOutputCellValue(row, key);
                const isAmount = AMOUNT_COLUMNS.has(key);
                return (
                  <TableCell
                    key={key}
                    className={
                      key === "description"
                        ? "max-w-xs truncate"
                        : isAmount
                          ? "text-right tabular-nums"
                          : key === "date"
                            ? "whitespace-nowrap"
                            : undefined
                    }
                  >
                    {formatCellValue(value)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > PREVIEW_ROW_LIMIT && (
        <p className="px-4 py-2 text-sm text-muted-foreground border-t">
          {formatMessage(dict.showingRows, {
            limit: PREVIEW_ROW_LIMIT,
            total: rows.length,
          })}
        </p>
      )}
    </div>
  );
}
