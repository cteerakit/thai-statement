import type { BankId } from "./types";

type BankSignature = {
  id: BankId;
  patterns: RegExp[];
  weight: number;
};

const SIGNATURES: BankSignature[] = [
  {
    id: "scb",
    patterns: [
      /siam commercial bank/i,
      /ธนาคารไทยพาณิชย์/,
      /\bSCB\b/,
      /www\.scb\.co\.th/i,
    ],
    weight: 1,
  },
  {
    id: "kbank",
    patterns: [
      /kasikornbank/i,
      /k\s*asikorn/i,
      /ธนาคารกสิกรไทย/,
      /\bKBank\b/i,
      /www\.kasikornbank\.com/i,
    ],
    weight: 1,
  },
  {
    id: "ktb",
    patterns: [
      /krungthai/i,
      /krung thai/i,
      /ธนาคารกรุงไทย/,
      /\bKTB\b/,
      /www\.krungthai\.com/i,
    ],
    weight: 1,
  },
];

export type DetectResult = {
  bank: BankId | null;
  confidence: number;
  scores: Record<BankId, number>;
};

export function detectBank(fullText: string): DetectResult {
  const scores: Record<BankId, number> = { scb: 0, kbank: 0, ktb: 0 };

  for (const sig of SIGNATURES) {
    for (const pattern of sig.patterns) {
      if (pattern.test(fullText)) {
        scores[sig.id] += sig.weight;
      }
    }
  }

  const entries = Object.entries(scores) as [BankId, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [topBank, topScore] = entries[0];
  const secondScore = entries[1]?.[1] ?? 0;

  if (topScore === 0) {
    return { bank: null, confidence: 0, scores };
  }

  const confidence =
    topScore > secondScore
      ? topScore / (topScore + secondScore + 0.01)
      : 0.5;

  return {
    bank: topBank,
    confidence,
    scores,
  };
}

export function resolveBank(
  fullText: string,
  hint?: BankId | "auto",
): { bank: BankId; confidence: number } {
  if (hint && hint !== "auto") {
    return { bank: hint, confidence: 1 };
  }

  const detected = detectBank(fullText);
  if (!detected.bank || detected.confidence < 0.4) {
    throw new Error("UNSUPPORTED_BANK");
  }
  return { bank: detected.bank, confidence: detected.confidence };
}
