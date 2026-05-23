import type { ParserResult, TextItem } from "../types";
import { parseBankTable } from "./table-parser";

/** KTB (Krungthai) statement parser. */
export function parseKtb(items: TextItem[]): ParserResult {
  return parseBankTable(items, "ktb", { columnGap: 18 });
}
