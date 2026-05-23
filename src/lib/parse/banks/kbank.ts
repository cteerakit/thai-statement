import type { ParserResult, TextItem } from "../types";
import { parseBankTable } from "./table-parser";

/** KBank (Kasikorn) statement parser. */
export function parseKbank(items: TextItem[]): ParserResult {
  return parseBankTable(items, "kbank", { columnGap: 20 });
}
