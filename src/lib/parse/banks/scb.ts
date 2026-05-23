import type { ParserResult, TextItem } from "../types";
import { parseBankTable } from "./table-parser";

/** SCB (Siam Commercial Bank) statement parser. */
export function parseScb(items: TextItem[]): ParserResult {
  return parseBankTable(items, "scb", { columnGap: 22 });
}
