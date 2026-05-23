export type BankId = "scb" | "kbank" | "ktb";

/** How amount columns are labeled on the source statement. */
export type AmountColumnLayout = "withdrawal_deposit" | "debit_credit";

export type StatementRow = {
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  reference?: string;
};

export type StatementMetadata = {
  bank: BankId;
  accountNumber?: string;
  periodStart?: string;
  periodEnd?: string;
  currency?: string;
  amountColumnLayout?: AmountColumnLayout;
};

export type ParserResult = {
  rows: StatementRow[];
  warnings: string[];
  metadata: StatementMetadata;
};

export type TextItem = {
  str: string;
  x: number;
  y: number;
  page: number;
};

export type ClusteredRow = {
  page: number;
  y: number;
  cells: { x: number; text: string }[];
  line: string;
};

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "UNSUPPORTED_BANK"
      | "NO_TRANSACTIONS"
      | "INVALID_PDF"
      | "TOO_MANY_PAGES"
      | "FILE_TOO_LARGE"
      | "PDF_PASSWORD_REQUIRED"
      | "PDF_PASSWORD_INVALID"
      | "TOO_MANY_ROWS",
  ) {
    super(message);
    this.name = "ParseError";
  }
}
