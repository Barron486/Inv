export type InvoiceImage = {
  width: number; // px
  height: number; // px
  amount: number; // TWD
  data: Uint8Array; // image bytes (PNG/JPG)
  fileName?: string;
};

export type PlacedImage = InvoiceImage & {
  pageIndex: number;
  x: number; // in PDF points
  y: number; // bottom-left origin in PDF points
  renderWidth: number; // in points
  renderHeight: number; // in points
};

export type PageLayout = {
  pageIndex: number;
  items: PlacedImage[];
  pageTotal: number;
};

// PDF points: A4 portrait 595 x 842; landscape 842 x 595
export const A4_LANDSCAPE = { width: 842, height: 595 } as const;

type LayoutOptions = {
  pageWidth?: number;
  pageHeight?: number;
  margin?: number;
  gutter?: number;
  maxCols?: number; // try up to N columns
};

export function computeLayouts(images: InvoiceImage[], options: LayoutOptions = {}): PageLayout[] {
  const pageWidth = options.pageWidth ?? A4_LANDSCAPE.width;
  const pageHeight = options.pageHeight ?? A4_LANDSCAPE.height;
  const margin = options.margin ?? 24;
  const gutter = options.gutter ?? 12;
  const maxCols = options.maxCols ?? 3;

  const working = [...images];
  const pages: PageLayout[] = [];

  while (working.length) {
    const best = pickBestGridForPage(working, { pageWidth, pageHeight, margin, gutter, maxCols });
    pages.push(best.page);
    // remove placed
    const placedSet = new Set(best.page.items.map((it) => it.fileName ?? `${it.width}x${it.height}:${it.amount}`));
    for (let i = working.length - 1; i >= 0; i--) {
      const key = working[i].fileName ?? `${working[i].width}x${working[i].height}:${working[i].amount}`;
      if (placedSet.has(key)) working.splice(i, 1);
    }
  }

  return pages.map((p, i) => ({ ...p, pageIndex: i }));
}

function pickBestGridForPage(images: InvoiceImage[], {
  pageWidth, pageHeight, margin, gutter, maxCols
}: Required<Pick<LayoutOptions, 'margin' | 'gutter' | 'maxCols'>> & { pageWidth: number; pageHeight: number; }) {
  // Try a few candidates of columns 1..maxCols; place as many as fit top-down, left-right
  let bestScore = -Infinity;
  let best: PageLayout = { pageIndex: 0, items: [], pageTotal: 0 };
  for (let cols = 1; cols <= maxCols; cols++) {
    const availableW = pageWidth - margin * 2 - gutter * (cols - 1);
    const colW = availableW / cols;
    // estimate row-height by average aspect ratio
    const placements: PlacedImage[] = [];
    let x = margin;
    let y = pageHeight - margin; // from top to bottom
    let rowMaxH = 0;
    let colIndex = 0;
    let pageTotal = 0;

    for (const img of images) {
      const scale = colW / img.width;
      const renderW = colW;
      const renderH = img.height * scale;

      if (colIndex === 0) {
        // new row: check vertical space
        if (y - renderH < margin) break; // cannot place new row
        rowMaxH = renderH;
      } else {
        rowMaxH = Math.max(rowMaxH, renderH);
      }

      const placed: PlacedImage = {
        ...img,
        pageIndex: 0,
        x,
        // convert top-left logic to PDF bottom-left by subtracting height later in renderer
        y: y - renderH,
        renderWidth: renderW,
        renderHeight: renderH
      };
      placements.push(placed);
      pageTotal += img.amount;

      colIndex++;
      if (colIndex === cols) {
        // move to next row
        y = y - rowMaxH - gutter;
        x = margin;
        colIndex = 0;
      } else {
        x = x + renderW + gutter;
      }
    }

    const score = placements.length * 1000 + pageTotal / 1000; // prioritize more items, then amount as tie-breaker
    if (placements.length > 0 && score > bestScore) {
      bestScore = score;
      best = { pageIndex: 0, items: placements, pageTotal };
    }
  }
  return { page: best };
}


