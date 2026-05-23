import type { ClusteredRow, TextItem } from "./types";

const Y_TOLERANCE = 4;

export function clusterIntoRows(
  items: TextItem[],
  yTolerance = Y_TOLERANCE,
): ClusteredRow[] {
  const byPage = new Map<number, TextItem[]>();
  for (const item of items) {
    const list = byPage.get(item.page) ?? [];
    list.push(item);
    byPage.set(item.page, list);
  }

  const rows: ClusteredRow[] = [];

  for (const page of [...byPage.keys()].sort((a, b) => a - b)) {
    const pageItems = [...byPage.get(page)!].sort((a, b) => {
      if (Math.abs(b.y - a.y) > yTolerance) return b.y - a.y;
      return a.x - b.x;
    });

    let current: TextItem[] = [];
    let currentY = 0;

    const flush = () => {
      if (current.length === 0) return;
      const cells = [...current]
        .sort((a, b) => a.x - b.x)
        .map((i) => ({ x: i.x, text: i.str }));
      const line = cells.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim();
      rows.push({
        page,
        y: currentY,
        cells,
        line,
      });
      current = [];
    };

    for (const item of pageItems) {
      if (
        current.length > 0 &&
        Math.abs(item.y - currentY) > yTolerance
      ) {
        flush();
      }
      if (current.length === 0) currentY = item.y;
      current.push(item);
    }
    flush();
  }

  return rows;
}

/** Split a clustered row into column texts using x-gap thresholds. */
export function splitColumns(
  row: ClusteredRow,
  minGap = 18,
): string[] {
  if (row.cells.length === 0) return [];
  const columns: { x: number; texts: string[] }[] = [];

  for (const cell of row.cells) {
    const last = columns[columns.length - 1];
    if (!last || cell.x - last.x > minGap) {
      columns.push({ x: cell.x, texts: [cell.text] });
    } else {
      last.texts.push(cell.text);
    }
  }

  return columns.map((c) => c.texts.join(" ").trim());
}
