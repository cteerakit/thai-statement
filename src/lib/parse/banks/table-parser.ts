import { clusterIntoRows, splitColumns } from "../cluster";
import {
  extractAmounts,
  extractDateFromLine,
  maskAccountNumber,
  parseAmount,
  parseThaiDate,
} from "../thai";
import type {
  AmountColumnLayout,
  BankId,
  ClusteredRow,
  ParserResult,
  StatementRow,
  TextItem,
} from "../types";

const TRANSACTION_HEADER =
  /date|วันที่|transaction|รายการ|รายการเดินบัญชี|withdrawal|deposit|debit|credit|ถอน|ฝาก|เดบิต|เครดิต|balance|คงเหลือ/i;

const WITHDRAWAL_DEPOSIT_HEADER =
  /withdrawal|deposit|ถอน|ฝาก|เบิก|รับเข้า/i;

const DEBIT_CREDIT_HEADER = /debit|credit|เดบิต|เครดิต/i;

/** SCB savings: one Debit/Credit amount column, then Balance/Baht, then Description. */
const SCB_TXN_BALANCE_HEADER =
  /(?:debit\/credit|ลูกหนี้\/เจ้าหนี้)/i;

const SCB_BALANCE_COLUMN_HEADER = /(?:balance\/baht|ยอดเงินคงเหลือ)/i;

const BROUGHT_FORWARD_LINE =
  /brought forward|ยอดเงินคงเหลือยกมา/i;

const KBANK_OPENING_LINE = /ยอดยกมา/i;

const KBANK_TXN_BALANCE_MARKERS =
  /ถอนเงิน\s*\/\s*ฝากเงิน|ยอดคงเหลือ/i;

const SKIP_LINE =
  /^(page|หน้า|total|ยอดรวม|opening|closing| carried forward|สรุป)/i;

const METADATA_LINE =
  /statement\s+period|requested\s+date|ช่วงเวลา|วันที่ขอ|รอบระยะเวลา/i;

const WITHDRAWAL_KEYWORDS =
  /atm|withdraw|ถอน|โอนออก|payment|ชำระ|หัก|fee|ค่าธรรมเนียม/i;
const DEPOSIT_KEYWORDS =
  /salary|deposit|ฝาก|โอนเข้า|interest|ดอกเบี้ย|รับ/i;

const ACCOUNT_PATTERN =
  /(?:account|เลขที่บัญชี|a\/c|acc\.?)\s*(?:no\.?|number)?\s*[:.]?\s*([\d\-xX*]{6,})/i;

const PERIOD_PATTERN =
  /(?:period|ช่วงเวลา|statement\s+period|รอบระยะเวลา)\s*[:]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s*[-–toถึง]\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i;

const PERIOD_DASH_PATTERN =
  /(?:วันที่|date)\s*[:]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s*[-–]\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i;

const KBANK_PERIOD_PATTERN =
  /รอบระหว่างวันที่\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s*[-–]\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i;

export type ParseBankTableOptions = {
  columnGap?: number;
  amountColumnLayout?: AmountColumnLayout;
};

/** X positions from the statement header row (KTB: amount | balance | branch per line). */
type HeaderColumnMap = {
  dateX: number;
  withdrawalX: number;
  depositX: number;
  balanceX: number;
  branchX?: number;
};

const COLUMN_X_TOLERANCE = 55;

function rowLooksLikeTransaction(line: string): boolean {
  return extractDateFromLine(line) !== null;
}

function positiveAmount(raw: string): number | null {
  const n = parseAmount(raw);
  if (n === null || n === 0) return null;
  return Math.abs(n);
}

function rowHasTransactionAmount(row: StatementRow): boolean {
  return (
    (row.debit !== null && row.debit > 0) ||
    (row.credit !== null && row.credit > 0)
  );
}

function enforceExclusiveWithdrawalDeposit(
  withdrawal: number | null,
  deposit: number | null,
): { debit: number | null; credit: number | null } {
  const hasWithdrawal = withdrawal !== null && withdrawal > 0;
  const hasDeposit = deposit !== null && deposit > 0;
  if (hasWithdrawal && hasDeposit) {
    if ((withdrawal ?? 0) >= (deposit ?? 0)) {
      return { debit: withdrawal, credit: null };
    }
    return { debit: null, credit: deposit };
  }
  return {
    debit: hasWithdrawal ? withdrawal : null,
    credit: hasDeposit ? deposit : null,
  };
}

function inferFromDescription(
  description: string,
  txn: number,
): { debit: number | null; credit: number | null } {
  if (WITHDRAWAL_KEYWORDS.test(description)) {
    return { debit: txn, credit: null };
  }
  if (DEPOSIT_KEYWORDS.test(description)) {
    return { debit: null, credit: txn };
  }
  return { debit: null, credit: txn };
}

function inferFromBalanceDelta(
  txn: number,
  balance: number | null,
  previousBalance: number | null,
): { debit: number | null; credit: number | null } | null {
  if (balance === null || previousBalance === null) return null;
  const delta = balance - previousBalance;
  const txnAbs = Math.abs(txn);
  if (Math.abs(Math.abs(delta) - txnAbs) > 0.02) return null;
  if (delta < 0) return { debit: txnAbs, credit: null };
  if (delta > 0) return { debit: null, credit: txnAbs };
  return null;
}

function depositSlotLooksLikeBalance(
  withdrawal: number | null,
  depositSlot: number,
  balanceSlot: number | null,
  previousBalance: number | null,
): boolean {
  if (balanceSlot !== null) return false;
  if (withdrawal !== null && depositSlot > withdrawal * 3) return true;
  if (previousBalance !== null) {
    if (Math.abs(depositSlot - previousBalance) < 0.02) return true;
    if (withdrawal !== null) {
      const expected = previousBalance - withdrawal;
      if (Math.abs(depositSlot - expected) < 0.02) return true;
    }
  }
  return false;
}

/** Withdrawal, deposit, balance — last three columns (KTB and similar). */
function parseWithdrawalDepositBalanceColumns(
  columns: string[],
  previousBalance: number | null,
): { debit: number | null; credit: number | null; balance: number | null } {
  let withdrawal = positiveAmount(columns[columns.length - 3] ?? "");
  let deposit = positiveAmount(columns[columns.length - 2] ?? "");
  let balance = parseAmount(columns[columns.length - 1] ?? "");

  const depositSlotRaw = parseAmount(columns[columns.length - 2] ?? "");

  if (
    depositSlotRaw !== null &&
    depositSlotLooksLikeBalance(withdrawal, depositSlotRaw, balance, previousBalance)
  ) {
    balance = depositSlotRaw;
    deposit = null;
  }

  return {
    debit: withdrawal,
    credit: deposit,
    balance,
  };
}

/** Debit, credit, balance — last three columns (KBank-style). */
function parseDebitCreditBalanceColumns(columns: string[]): {
  debit: number | null;
  credit: number | null;
  balance: number | null;
} {
  const debit = positiveAmount(columns[columns.length - 3] ?? "");
  const credit = positiveAmount(columns[columns.length - 2] ?? "");
  const balance = parseAmount(columns[columns.length - 1] ?? "");
  return { debit, credit, balance };
}

function isScbTxnBalanceHeaderLine(line: string): boolean {
  return (
    SCB_TXN_BALANCE_HEADER.test(line) && SCB_BALANCE_COLUMN_HEADER.test(line)
  );
}

/** SCB: txn amount, balance, description — last three columns. */
function parseScbTxnBalanceColumns(
  columns: string[],
  txnCode: string,
  description: string,
  previousBalance: number | null,
): { debit: number | null; credit: number | null; balance: number | null } {
  const txn = positiveAmount(columns[columns.length - 3] ?? "");
  const balance = parseAmount(columns[columns.length - 2] ?? "");
  if (txn === null) {
    return { debit: null, credit: null, balance };
  }

  const { debit, credit } = inferScbDebitCredit(
    txnCode,
    description,
    txn,
    balance,
    previousBalance,
  );
  return { debit, credit, balance };
}

function inferScbDebitCredit(
  txnCode: string,
  description: string,
  txn: number,
  balance: number | null,
  previousBalance: number | null,
): { debit: number | null; credit: number | null } {
  const fromDelta = inferFromBalanceDelta(
    txn,
    balance,
    previousBalance,
  );
  if (fromDelta) return fromDelta;

  const code = txnCode.trim().toUpperCase();
  if (code === "X2") return { debit: txn, credit: null };
  if (code === "X1" || code === "QN") return { debit: null, credit: txn };

  if (/จ่ายบิล|payment|หัก|fee|ค่าธรรมเนียม/i.test(description)) {
    return { debit: txn, credit: null };
  }
  if (
    /รับโอน|transfer from|โอนเข้า|deposit|ฝาก|interest|ดอกเบี้ย/i.test(
      description,
    )
  ) {
    return { debit: null, credit: txn };
  }

  return { debit: null, credit: txn };
}

type ScbHeaderColumnMap = {
  dateX: number;
  txnX: number;
  balanceX: number;
};

function buildScbHeaderColumnMap(row: ClusteredRow): ScbHeaderColumnMap | null {
  const findCell = (re: RegExp) =>
    row.cells.find((c) => re.test(c.text.trim()));

  const dateCell = findCell(/date|วันที่/i);
  const txnCell = findCell(/debit\/credit|ลูกหนี้\/เจ้าหนี้/i);
  const balanceCell = findCell(/balance\/baht|ยอดเงินคงเหลือ/i);

  if (!dateCell || !txnCell || !balanceCell) return null;

  return {
    dateX: dateCell.x,
    txnX: txnCell.x,
    balanceX: balanceCell.x,
  };
}

function findScbHeaderColumnMap(rows: ClusteredRow[]): ScbHeaderColumnMap | null {
  for (const row of rows) {
    if (!isScbTxnBalanceHeaderLine(row.line)) continue;
    const map = buildScbHeaderColumnMap(row);
    if (map) return map;
  }
  return null;
}

function parseScbRowWithHeaderColumnMap(
  row: ClusteredRow,
  map: ScbHeaderColumnMap,
  previousBalance: number | null,
): StatementRow | null {
  const date =
    extractDateFromLine(row.line) ??
    parseThaiDate(
      row.cells.find((c) => Math.abs(c.x - map.dateX) < COLUMN_X_TOLERANCE)
        ?.text ?? "",
    );
  if (!date) return null;

  let txn: number | null = null;
  let balance: number | null = null;
  let txnCode = "";
  const descriptionParts: string[] = [];

  const txnCandidates: { x: number; amount: number }[] = [];

  for (const cell of row.cells) {
    const amt = parseAmount(cell.text);
    if (amt !== null) {
      const distBal = Math.abs(cell.x - map.balanceX);
      if (distBal <= COLUMN_X_TOLERANCE) {
        balance = amt;
        continue;
      }
      if (cell.x > map.dateX + 30 && cell.x < map.balanceX - 20) {
        txnCandidates.push({ x: cell.x, amount: Math.abs(amt) });
      }
      continue;
    }

    if (extractDateFromLine(cell.text)) continue;
    if (/^X[12]$|^QN$/i.test(cell.text.trim())) {
      txnCode = cell.text.trim();
      continue;
    }
    if (cell.x > map.balanceX + 15) {
      descriptionParts.push(cell.text);
    }
  }

  if (txnCandidates.length > 0) {
    txnCandidates.sort((a, b) => b.x - a.x);
    txn = txnCandidates[0].amount;
  }

  const description = descriptionParts.join(" ").replace(/\s+/g, " ").trim();
  if (txn === null) return null;

  const { debit, credit } = inferScbDebitCredit(
    txnCode,
    description,
    txn,
    balance,
    previousBalance,
  );

  if (debit === null && credit === null && balance === null) return null;

  return { date, description: description || "Transaction", debit, credit, balance };
}

function hasKbankTxnBalanceLayout(rows: ClusteredRow[]): boolean {
  const text = rows.map((r) => r.line).join("\n");
  return (
    /ถอนเงิน\s*\/\s*ฝากเงิน/.test(text) &&
    /ยอดคงเหลือ/.test(text)
  );
}

function inferKbankDebitCredit(
  txnType: string,
  description: string,
  txn: number,
  balance: number | null,
  previousBalance: number | null,
): { debit: number | null; credit: number | null } {
  const fromDelta = inferFromBalanceDelta(
    txn,
    balance,
    previousBalance,
  );
  if (fromDelta) return fromDelta;

  const context = `${txnType} ${description}`;
  if (/ชำระเงิน|โอนเงิน|โอนไป|ถอน|หัก|payment/i.test(context)) {
    return { debit: txn, credit: null };
  }
  if (/รับเงิน|ฝาก|โอนเข้า|deposit/i.test(context)) {
    return { debit: null, credit: txn };
  }
  return { debit: txn, credit: null };
}

type KbankHeaderColumnMap = {
  dateX: number;
  txnX: number;
  balanceX: number;
  channelX?: number;
  descriptionX?: number;
};

function findKbankHeaderColumnMap(
  rows: ClusteredRow[],
): KbankHeaderColumnMap | null {
  let dateX: number | undefined;
  let txnX: number | undefined;
  let balanceX: number | undefined;
  let channelX: number | undefined;
  let descriptionX: number | undefined;

  for (const row of rows) {
    for (const cell of row.cells) {
      const text = cell.text.trim();
      if (/^วันที่$/.test(text)) dateX = cell.x;
      if (/ถอนเงิน\s*\/\s*ฝากเงิน|^รายการ$/.test(text)) txnX = cell.x;
      if (/ยอดคงเหลือ/.test(text)) balanceX = cell.x;
      if (/^ช่องทาง$/.test(text)) channelX = cell.x;
      if (/^รายละเอียด$/.test(text)) descriptionX = cell.x;
    }
  }

  if (dateX === undefined || txnX === undefined || balanceX === undefined) {
    return null;
  }
  return { dateX, txnX, balanceX, channelX, descriptionX };
}

function parseKbankRowWithHeaderColumnMap(
  row: ClusteredRow,
  map: KbankHeaderColumnMap,
  previousBalance: number | null,
): StatementRow | null {
  const date = extractDateFromLine(row.line);
  if (!date) return null;

  let txn: number | null = null;
  let balance: number | null = null;
  let txnType = "";
  let time = "";
  let channel = "";
  const descriptionParts: string[] = [];

  for (const cell of row.cells) {
    const amt = parseAmount(cell.text);
    if (amt !== null) {
      const distTxn = Math.abs(cell.x - map.txnX);
      const distBal = Math.abs(cell.x - map.balanceX);
      if (distBal <= distTxn) {
        balance = amt;
      } else {
        txn = Math.abs(amt);
      }
      continue;
    }

    if (extractDateFromLine(cell.text)) continue;
    if (/^\d{1,2}:\d{2}$/.test(cell.text.trim())) {
      time = cell.text.trim();
      continue;
    }
    if (/ชำระเงิน|โอนเงิน|รับเงิน|ฝาก/i.test(cell.text)) {
      txnType = cell.text.trim();
      continue;
    }
    if (
      map.channelX !== undefined &&
      Math.abs(cell.x - map.channelX) <= COLUMN_X_TOLERANCE
    ) {
      channel = cell.text.trim();
      continue;
    }
    if (
      map.descriptionX !== undefined &&
      cell.x >= map.descriptionX - COLUMN_X_TOLERANCE
    ) {
      descriptionParts.push(cell.text);
    }
  }

  const detail = descriptionParts.join(" ").replace(/\s+/g, " ").trim();
  const description =
    [time, txnType, channel, detail].filter(Boolean).join(" ").trim() ||
    "Transaction";

  if (KBANK_OPENING_LINE.test(row.line)) {
    return null;
  }

  if (txn === null) return null;

  const { debit, credit } = inferKbankDebitCredit(
    txnType,
    detail,
    txn,
    balance,
    previousBalance,
  );

  if (debit === null && credit === null && balance === null) return null;

  return { date, description, debit, credit, balance };
}

function parseKbankTxnBalanceColumns(
  columns: string[],
  previousBalance: number | null,
): { debit: number | null; credit: number | null; balance: number | null } {
  const date = extractDateFromLine(columns[0] ?? "");
  if (!date) {
    return { debit: null, credit: null, balance: null };
  }

  if (KBANK_OPENING_LINE.test(columns.join(" "))) {
    const balance = parseAmount(columns.at(-1) ?? "");
    return { debit: null, credit: null, balance };
  }

  const txnType = columns[2] ?? "";
  const txn = positiveAmount(columns[3] ?? "");
  const balance = parseAmount(columns[4] ?? "");
  if (txn === null) {
    return { debit: null, credit: null, balance };
  }

  const detail = columns.slice(6).join(" ").trim();
  const time = columns[1] ?? "";
  const channel = columns[5] ?? "";
  const description = [time, txnType, channel, detail].filter(Boolean).join(" ");

  const { debit, credit } = inferKbankDebitCredit(
    txnType,
    description,
    txn,
    balance,
    previousBalance,
  );
  return { debit, credit, balance };
}

function parseKtbFourColumnRow(
  columns: string[],
  description: string,
  previousBalance: number | null,
): { debit: number | null; credit: number | null; balance: number | null } {
  const col2 = parseAmount(columns[2] ?? "");
  const balance = parseAmount(columns[3] ?? "");
  if (col2 === null && balance === null) {
    return { debit: null, credit: null, balance: null };
  }

  const txnAbs = col2 !== null ? Math.abs(col2) : null;
  if (txnAbs === null) {
    return { debit: null, credit: null, balance };
  }

  const fromDelta = inferFromBalanceDelta(
    txnAbs,
    balance,
    previousBalance ?? null,
  );
  if (fromDelta) return { ...fromDelta, balance };

  if (WITHDRAWAL_KEYWORDS.test(description)) {
    return { debit: txnAbs, credit: null, balance };
  }
  if (DEPOSIT_KEYWORDS.test(description)) {
    return { debit: null, credit: txnAbs, balance };
  }

  return { debit: txnAbs, credit: null, balance };
}

function buildHeaderColumnMap(row: ClusteredRow): HeaderColumnMap | null {
  const findCell = (re: RegExp) =>
    row.cells.find((c) => re.test(c.text.trim()));

  const dateCell = findCell(/date|วันที่/i);
  const withdrawalCell = findCell(/withdrawal|ถอน/i);
  const depositCell = findCell(/deposit|ฝาก/i);
  const balanceCell = findCell(/balance|คงเหลือ/i);
  const branchCell = findCell(/branch|สาขา/i);

  if (!dateCell || !withdrawalCell || !depositCell || !balanceCell) {
    return null;
  }

  return {
    dateX: dateCell.x,
    withdrawalX: withdrawalCell.x,
    depositX: depositCell.x,
    balanceX: balanceCell.x,
    branchX: branchCell?.x,
  };
}

function findHeaderColumnMap(rows: ClusteredRow[]): HeaderColumnMap | null {
  for (const row of rows) {
    if (!WITHDRAWAL_DEPOSIT_HEADER.test(row.line)) continue;
    const map = buildHeaderColumnMap(row);
    if (map) return map;
  }
  return null;
}

type AmountColumnKind = "withdrawal" | "deposit" | "balance" | "branch" | "text";

function classifyCellColumn(
  x: number,
  map: HeaderColumnMap,
): AmountColumnKind {
  const candidates: { kind: AmountColumnKind; distance: number }[] = [
    { kind: "withdrawal", distance: Math.abs(x - map.withdrawalX) },
    { kind: "deposit", distance: Math.abs(x - map.depositX) },
    { kind: "balance", distance: Math.abs(x - map.balanceX) },
  ];
  if (map.branchX !== undefined) {
    candidates.push({
      kind: "branch",
      distance: Math.abs(x - map.branchX),
    });
  }
  candidates.sort((a, b) => a.distance - b.distance);
  const nearest = candidates[0];
  if (nearest.distance > COLUMN_X_TOLERANCE) return "text";
  return nearest.kind;
}

function inferWithdrawalDepositFromTxnType(
  txnType: string,
): "withdrawal" | "deposit" | null {
  const text = txnType.toLowerCase();
  if (
    /transfer out|payment|withdraw|sell|ถอน|โอนออก|หัก|ชำระ/i.test(text)
  ) {
    return "withdrawal";
  }
  if (/transfer in|deposit|buy|ฝาก|โอนเข้า|รับ/i.test(text)) {
    return "deposit";
  }
  return null;
}

function parseRowWithHeaderColumnMap(
  row: ClusteredRow,
  map: HeaderColumnMap,
): StatementRow | null {
  const dateCell =
    row.cells.find((c) => Math.abs(c.x - map.dateX) < COLUMN_X_TOLERANCE) ??
    row.cells[0];
  const date =
    parseThaiDate(dateCell?.text ?? "") ?? extractDateFromLine(row.line);
  if (!date) return null;

  let withdrawal: number | null = null;
  let deposit: number | null = null;
  let balance: number | null = null;
  const textParts: string[] = [];
  let txnType = "";

  for (const cell of row.cells) {
    const kind = classifyCellColumn(cell.x, map);
    const amt = parseAmount(cell.text);

    if (kind === "withdrawal" && amt !== null) {
      withdrawal = Math.abs(amt);
      continue;
    }
    if (kind === "deposit" && amt !== null) {
      deposit = Math.abs(amt);
      continue;
    }
    if (kind === "balance" && amt !== null) {
      balance = amt;
      continue;
    }
    if (kind === "branch") continue;

    if (kind === "text" && !parseThaiDate(cell.text)) {
      if (
        !txnType &&
        row.cells[1] === cell &&
        /transfer|payment|sell|buy|atm/i.test(cell.text)
      ) {
        txnType = cell.text;
      }
      textParts.push(cell.text);
    }
  }

  if (withdrawal === null && deposit === null) {
    const inferred = inferWithdrawalDepositFromTxnType(txnType);
    const loneAmount = row.cells
      .map((c) => ({ kind: classifyCellColumn(c.x, map), amt: parseAmount(c.text) }))
      .find(
        (c) =>
          c.amt !== null &&
          (c.kind === "withdrawal" || c.kind === "deposit"),
      );
    if (loneAmount?.amt != null && inferred) {
      if (inferred === "withdrawal") withdrawal = Math.abs(loneAmount.amt);
      else deposit = Math.abs(loneAmount.amt);
    }
  }

  let description = textParts.join(" ").replace(/\s+/g, " ").trim();
  if (!description) description = txnType || "Transaction";

  const { debit, credit } = enforceExclusiveWithdrawalDeposit(
    withdrawal,
    deposit,
  );

  if (debit === null && credit === null && balance === null) return null;

  return { date, description, debit, credit, balance };
}

function detectAmountColumnLayout(
  rows: ClusteredRow[],
  transactionStart: number,
  bank: BankId,
  override?: AmountColumnLayout,
): AmountColumnLayout {
  if (override) return override;
  if (bank === "ktb") return "withdrawal_deposit";
  if (bank === "kbank" && hasKbankTxnBalanceLayout(rows)) {
    return "kbank_txn_balance";
  }

  for (let i = Math.max(0, transactionStart - 5); i < transactionStart; i++) {
    const line = rows[i]?.line ?? "";
    if (!TRANSACTION_HEADER.test(line)) continue;
    if (isScbTxnBalanceHeaderLine(line)) return "txn_balance";
    if (WITHDRAWAL_DEPOSIT_HEADER.test(line)) return "withdrawal_deposit";
    if (DEBIT_CREDIT_HEADER.test(line)) return "debit_credit";
  }

  return "debit_credit";
}

function parseTransactionLine(
  line: string,
  columns: string[] | undefined,
  amountLayout: AmountColumnLayout,
  previousBalance: number | null,
): StatementRow | null {
  const date =
    (columns?.[0] && extractDateFromLine(columns[0])) ||
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

  if (
    columns &&
    columns.length >= 4 &&
    amountLayout !== "txn_balance" &&
    amountLayout !== "kbank_txn_balance"
  ) {
    const descCols = columns.slice(1, -3).join(" ").trim();
    if (descCols) description = descCols;
  }

  description = description.replace(/\s+/g, " ").trim();
  if (!description) description = "Transaction";

  let debit: number | null = null;
  let credit: number | null = null;
  let balance: number | null = null;

  if (columns && columns.length >= 5) {
    if (amountLayout === "txn_balance") {
      const txnCode = columns[1] ?? "";
      const descCol = (columns[columns.length - 1] ?? "").trim();
      if (descCol) description = descCol;
      ({ debit, credit, balance } = parseScbTxnBalanceColumns(
        columns,
        txnCode,
        description,
        previousBalance,
      ));
    } else if (amountLayout === "kbank_txn_balance") {
      ({ debit, credit, balance } = parseKbankTxnBalanceColumns(
        columns,
        previousBalance,
      ));
      const time = columns[1] ?? "";
      const txnType = columns[2] ?? "";
      const channel = columns[5] ?? "";
      const detail = columns.slice(6).join(" ").trim();
      description =
        [time, txnType, channel, detail].filter(Boolean).join(" ").trim() ||
        description;
    } else if (amountLayout === "withdrawal_deposit") {
      ({ debit, credit, balance } = parseWithdrawalDepositBalanceColumns(
        columns,
        previousBalance,
      ));
    } else {
      ({ debit, credit, balance } = parseDebitCreditBalanceColumns(columns));
    }
  } else if (
    columns &&
    columns.length === 4 &&
    amountLayout === "withdrawal_deposit"
  ) {
    ({ debit, credit, balance } = parseKtbFourColumnRow(
      columns,
      description,
      previousBalance,
    ));
  } else if (columns && columns.length === 4) {
    const txn = parseAmount(columns[2] ?? "");
    balance = parseAmount(columns[3] ?? "");
    if (txn !== null) {
      const txnAbs = Math.abs(txn);
      const fromDelta = inferFromBalanceDelta(
        txnAbs,
        balance,
        previousBalance,
      );
      if (fromDelta) {
        ({ debit, credit } = fromDelta);
      } else if (txn < 0) {
        debit = txnAbs;
      } else {
        ({ debit, credit } = inferFromDescription(description, txnAbs));
      }
    }
  } else if (amounts.length >= 3) {
    const colA = amounts[amounts.length - 3];
    const colB = amounts[amounts.length - 2];
    balance = amounts[amounts.length - 1];
    const withdrawal =
      colA > 0 ? colA : colA < 0 ? Math.abs(colA) : null;
    const deposit =
      colB > 0 ? colB : colB < 0 ? Math.abs(colB) : null;
    debit = withdrawal;
    credit = deposit;
    if (
      amountLayout === "withdrawal_deposit" &&
      credit !== null &&
      balance === null
    ) {
      const shifted = credit;
      if (depositSlotLooksLikeBalance(debit, shifted, null, previousBalance)) {
        balance = shifted;
        credit = null;
      }
    }
  } else if (amounts.length === 2) {
    const [txn, bal] = amounts;
    balance = bal;
    const txnAbs = Math.abs(txn);
    if (amountLayout === "txn_balance") {
      const codeMatch = line.match(/\b(X[12]|QN)\b/i);
      ({ debit, credit } = inferScbDebitCredit(
        codeMatch?.[1] ?? "",
        description,
        txnAbs,
        bal,
        previousBalance,
      ));
    } else {
      const fromDelta = inferFromBalanceDelta(
        txnAbs,
        bal,
        previousBalance,
      );
      if (fromDelta) {
        ({ debit, credit } = fromDelta);
      } else if (txn < 0) {
        debit = txnAbs;
      } else {
        ({ debit, credit } = inferFromDescription(description, txnAbs));
      }
    }
  } else if (amounts.length === 1) {
    const v = amounts[0];
    if (v < 0) debit = Math.abs(v);
    else credit = v;
  }

  ({ debit, credit } = enforceExclusiveWithdrawalDeposit(debit, credit));

  if (debit === null && credit === null && balance === null) return null;

  return {
    date,
    description,
    debit,
    credit,
    balance,
  };
}

function isTableHeaderRow(line: string): boolean {
  return (
    /date|วันที่/i.test(line) &&
    /balance|คงเหลือ/i.test(line) &&
    (WITHDRAWAL_DEPOSIT_HEADER.test(line) ||
      DEBIT_CREDIT_HEADER.test(line) ||
      isScbTxnBalanceHeaderLine(line) ||
      /ถอนเงิน\s*\/\s*ฝากเงิน/.test(line))
  );
}

function findTransactionStart(
  rows: ClusteredRow[],
  headerColumnMap: HeaderColumnMap | null,
): number {
  for (let i = 0; i < rows.length; i++) {
    if (isTableHeaderRow(rows[i].line)) return i + 1;
  }
  if (headerColumnMap) {
    for (let i = 0; i < rows.length; i++) {
      if (rowLooksLikeTransaction(rows[i].line)) return i;
    }
  }
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
  amountColumnLayout: AmountColumnLayout,
): ParserResult["metadata"] {
  const accountMatch = fullText.match(ACCOUNT_PATTERN);
  const periodMatch =
    fullText.match(PERIOD_PATTERN) ??
    fullText.match(PERIOD_DASH_PATTERN) ??
    fullText.match(KBANK_PERIOD_PATTERN);

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
    amountColumnLayout,
  };
}

export function parseBankTable(
  items: TextItem[],
  bank: BankId,
  options?: ParseBankTableOptions,
): ParserResult {
  const warnings: string[] = [];
  const rows = clusterIntoRows(items);
  const fullText = rows.map((r) => r.line).join("\n");

  const headerColumnMap = findHeaderColumnMap(rows);
  const scbHeaderColumnMap = findScbHeaderColumnMap(rows);
  const kbankHeaderColumnMap = findKbankHeaderColumnMap(rows);
  const start = findTransactionStart(rows, headerColumnMap);
  const amountColumnLayout = detectAmountColumnLayout(
    rows,
    start,
    bank,
    options?.amountColumnLayout,
  );
  const metadata = extractMetadata(fullText, bank, amountColumnLayout);

  const transactions: StatementRow[] = [];
  let skipped = 0;
  let previousBalance: number | null = null;

  for (let i = start; i < rows.length; i++) {
    const row = rows[i];
    if (!row.line.trim() || METADATA_LINE.test(row.line)) {
      continue;
    }

    if (BROUGHT_FORWARD_LINE.test(row.line) || KBANK_OPENING_LINE.test(row.line)) {
      const broughtForward =
        extractAmounts(row.line).at(-1) ??
        parseAmount(row.cells.at(-1)?.text ?? "");
      if (broughtForward !== null) previousBalance = broughtForward;
      continue;
    }

    if (SKIP_LINE.test(row.line)) {
      continue;
    }

    if (
      !rowLooksLikeTransaction(row.line) &&
      amountColumnLayout === "kbank_txn_balance" &&
      transactions.length > 0 &&
      kbankHeaderColumnMap &&
      !SKIP_LINE.test(row.line) &&
      !/^KBPDF|K Contact Center|ออกโดย/i.test(row.line) &&
      row.cells.length > 0 &&
      row.cells.every(
        (c) =>
          parseAmount(c.text) === null &&
          !extractDateFromLine(c.text) &&
          c.x >= kbankHeaderColumnMap.descriptionX! - COLUMN_X_TOLERANCE,
      )
    ) {
      const last = transactions[transactions.length - 1]!;
      const extra = row.line.trim();
      if (extra && extra !== ".") {
        last.description = `${last.description} ${extra}`
          .replace(/\s+/g, " ")
          .trim();
      }
      continue;
    }

    if (!rowLooksLikeTransaction(row.line)) {
      skipped++;
      continue;
    }

    const parsed: StatementRow | null = headerColumnMap
      ? parseRowWithHeaderColumnMap(row, headerColumnMap)
      : kbankHeaderColumnMap && amountColumnLayout === "kbank_txn_balance"
        ? parseKbankRowWithHeaderColumnMap(
            row,
            kbankHeaderColumnMap,
            previousBalance,
          )
        : scbHeaderColumnMap && amountColumnLayout === "txn_balance"
          ? parseScbRowWithHeaderColumnMap(
              row,
              scbHeaderColumnMap,
              previousBalance,
            )
          : parseTransactionLine(
              row.line,
              splitColumns(row, options?.columnGap ?? 20),
              amountColumnLayout,
              previousBalance,
            );
    if (parsed) {
      if (rowHasTransactionAmount(parsed)) {
        transactions.push(parsed);
      }
      if (parsed.balance !== null) {
        previousBalance = parsed.balance;
      }
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
