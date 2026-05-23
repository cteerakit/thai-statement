"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PreviewDictionary, UploadDictionary } from "@/i18n/types";
import {
  CONVERT_API_HEADER,
  CONVERT_API_HEADER_VALUE,
} from "@/lib/security/api";
import { cn } from "@/lib/utils";
import type { StatementRow } from "@/lib/parse/types";
import { StatementPreview } from "./statement-preview";

type BankOption = "auto" | "scb" | "kbank" | "ktb";
type FormatOption = "csv" | "xlsx";

type ConvertMeta = {
  bank: string;
  confidence: number;
  rowCount: number;
  accountNumber?: string;
  periodStart?: string;
  periodEnd?: string;
  conversionId?: string | null;
};

type UploadZoneProps = {
  isSignedIn: boolean;
  dict: UploadDictionary;
  previewDict: PreviewDictionary;
};

export function UploadZone({ isSignedIn, dict, previewDict }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState<BankOption>("auto");
  const [format, setFormat] = useState<FormatOption>("csv");
  const [saveHistory, setSaveHistory] = useState(false);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<StatementRow[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [meta, setMeta] = useState<ConvertMeta | null>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f?.type === "application/pdf" || f?.name.endsWith(".pdf")) {
        setFile(f);
        setError(null);
        setRows(null);
        setPassword("");
        setNeedsPassword(false);
      } else {
        setError(dict.errorPdf);
      }
    },
    [dict.errorPdf],
  );

  const convert = async (downloadFormat?: FormatOption) => {
    if (!file) {
      setError(dict.errorChooseFile);
      return;
    }

    if (needsPassword && !password) {
      setError(dict.errorPasswordRequired);
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bank", bank);
    formData.append("format", downloadFormat ? downloadFormat : "json");
    if (password) {
      formData.append("password", password);
    }
    if (isSignedIn && saveHistory) {
      formData.append("saveHistory", "true");
    }

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: {
          [CONVERT_API_HEADER]: CONVERT_API_HEADER_VALUE,
        },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.code === "PDF_PASSWORD_REQUIRED") {
          setNeedsPassword(true);
          setError(dict.errorPasswordRequired);
          return;
        }
        if (body.code === "PDF_PASSWORD_INVALID") {
          setNeedsPassword(true);
          setError(body.error ?? dict.errorPasswordInvalid);
          return;
        }
        setError(body.error ?? dict.errorConversion);
        return;
      }

      if (downloadFormat) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          downloadFormat === "xlsx" ? "statement.xlsx" : "statement.csv";
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const data = await res.json();
      setRows(data.rows);
      setWarnings(data.warnings ?? []);
      setMeta(data.meta);
    } catch {
      setError(dict.errorNetwork);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-14 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setError(null);
              setRows(null);
              setPassword("");
              setNeedsPassword(false);
            }
          }}
        />
        <p className="text-lg font-medium">
          {file ? file.name : dict.dropzone}
        </p>
        <p className="text-sm text-muted-foreground">{dict.dropzoneHint}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bank">{dict.bank}</Label>
          <Select
            value={bank}
            onValueChange={(v) => setBank(v as BankOption)}
            items={[
              { value: "auto", label: dict.autoDetect },
              { value: "scb", label: "SCB" },
              { value: "kbank", label: "KBank" },
              { value: "ktb", label: "KTB" },
            ]}
          >
            <SelectTrigger id="bank" className="w-full">
              <SelectValue placeholder={dict.autoDetect} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{dict.autoDetect}</SelectItem>
              <SelectItem value="scb">SCB</SelectItem>
              <SelectItem value="kbank">KBank</SelectItem>
              <SelectItem value="ktb">KTB</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="format">{dict.downloadFormat}</Label>
          <Select
            value={format}
            onValueChange={(v) => setFormat(v as FormatOption)}
            items={[
              { value: "csv", label: dict.formatCsv },
              { value: "xlsx", label: dict.formatXlsx },
            ]}
          >
            <SelectTrigger id="format" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">{dict.formatCsv}</SelectItem>
              <SelectItem value="xlsx">{dict.formatXlsx}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {needsPassword && (
        <div className="space-y-2">
          <Label htmlFor="pdf-password">{dict.pdfPassword}</Label>
          <input
            id="pdf-password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={dict.pdfPassword}
            className={cn(
              "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "dark:bg-input/30",
            )}
          />
          <p className="text-sm text-muted-foreground">{dict.pdfPasswordHint}</p>
        </div>
      )}

      {isSignedIn && (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={saveHistory}
            onChange={(e) => setSaveHistory(e.target.checked)}
            className="cursor-pointer rounded border-border"
          />
          {dict.saveHistory}
        </label>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => convert()} disabled={loading || !file}>
          {loading ? dict.processing : dict.preview}
        </Button>
        <Button
          variant="secondary"
          onClick={() => convert(format)}
          disabled={loading || !file}
        >
          {dict.download} {format.toUpperCase()}
        </Button>
      </div>

      {warnings.length > 0 && (
        <Alert>
          <AlertDescription>{warnings.join(" ")}</AlertDescription>
        </Alert>
      )}

      {meta && rows && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            {dict.bankLabel}:{" "}
            <span className="font-medium text-foreground uppercase">
              {meta.bank}
            </span>
            {meta.confidence < 1 && (
              <>
                {" "}
                · {dict.detectionConfidence}{" "}
                {(meta.confidence * 100).toFixed(0)}%
              </>
            )}
          </p>
          {meta.accountNumber && (
            <p>
              {dict.account}: {meta.accountNumber}
            </p>
          )}
          {(meta.periodStart || meta.periodEnd) && (
            <p>
              {dict.period}: {meta.periodStart ?? "?"} — {meta.periodEnd ?? "?"}
            </p>
          )}
          <p>
            {meta.rowCount} {dict.transactions}
          </p>
        </div>
      )}

      {rows && <StatementPreview rows={rows} dict={previewDict} />}
    </div>
  );
}
