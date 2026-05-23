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
import { PREVIEW_ROW_LIMIT } from "@/lib/limits";
import type { StatementRow } from "@/lib/parse/types";

function fmt(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type StatementPreviewProps = {
  rows: StatementRow[];
  dict: PreviewDictionary;
};

export function StatementPreview({ rows, dict }: StatementPreviewProps) {
  const preview = rows.slice(0, PREVIEW_ROW_LIMIT);

  return (
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{dict.date}</TableHead>
            <TableHead>{dict.description}</TableHead>
            <TableHead className="text-right">{dict.debit}</TableHead>
            <TableHead className="text-right">{dict.credit}</TableHead>
            <TableHead className="text-right">{dict.balance}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.map((row, i) => (
            <TableRow key={`${row.date}-${i}`}>
              <TableCell className="whitespace-nowrap">{row.date}</TableCell>
              <TableCell className="max-w-xs truncate">
                {row.description}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {fmt(row.debit)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {fmt(row.credit)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {fmt(row.balance)}
              </TableCell>
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
