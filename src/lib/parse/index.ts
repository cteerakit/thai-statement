import { MAX_ROWS } from "@/lib/limits";
import { parseKbank } from "./banks/kbank";
import { parseKtb } from "./banks/ktb";
import { parseScb } from "./banks/scb";
import { detectBank, resolveBank } from "./detect-bank";
import { extractTextItems, itemsToPlainText } from "./pdf-extract";
import type { BankId, ParserResult } from "./types";
import { ParseError } from "./types";

export type BankHint = BankId | "auto";

const PARSERS: Record<
  BankId,
  (items: Awaited<ReturnType<typeof extractTextItems>>) => ParserResult
> = {
  scb: parseScb,
  kbank: parseKbank,
  ktb: parseKtb,
};

export async function parseStatement(
  buffer: Buffer,
  bankHint: BankHint = "auto",
  password?: string,
): Promise<ParserResult & { detectedBank: BankId; confidence: number }> {
  const items = await extractTextItems(buffer, undefined, password);
  const fullText = itemsToPlainText(items);

  let bank: BankId;
  let confidence: number;

  try {
    const resolved = resolveBank(fullText, bankHint);
    bank = resolved.bank;
    confidence = resolved.confidence;
  } catch {
    throw new ParseError(
      "Could not identify the bank. Select your bank manually and try again.",
      "UNSUPPORTED_BANK",
    );
  }

  const result = PARSERS[bank](items);

  if (result.rows.length === 0) {
    throw new ParseError(
      "No transactions found in this PDF. Ensure it is a digital statement from SCB, KBank, or KTB.",
      "NO_TRANSACTIONS",
    );
  }

  if (result.rows.length > MAX_ROWS) {
    throw new ParseError(
      `Too many transactions (${result.rows.length}). Maximum is ${MAX_ROWS}.`,
      "TOO_MANY_ROWS",
    );
  }

  return {
    ...result,
    detectedBank: bank,
    confidence,
  };
}

export { detectBank, ParseError };
export type { BankId, ParserResult, StatementRow } from "./types";
