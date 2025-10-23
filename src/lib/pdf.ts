import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { A4_LANDSCAPE, computeLayouts, InvoiceImage } from './layout';

type PdfOptions = {
  title?: string;
  pageSize?: { width: number; height: number };
  margin?: number;
};

export async function generateInvoicePdf(images: InvoiceImage[], opts: PdfOptions = {}) {
  const pageSize = opts.pageSize ?? A4_LANDSCAPE;
  const margin = opts.margin ?? 24;
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const layouts = computeLayouts(images, { pageWidth: pageSize.width, pageHeight: pageSize.height, margin, gutter: 12, maxCols: 3 });

  // embed images first to reuse
  const embedded = await Promise.all(images.map(async (img) => {
    try {
      let embed;
      // naive type sniffing; pdf-lib will try decode
      // Use try/catch to fall back
      try {
        embed = await pdf.embedPng(img.data);
      } catch {
        embed = await pdf.embedJpg(img.data);
      }
      return embed;
    } catch (e) {
      return null;
    }
  }));

  for (let p = 0; p < layouts.length; p++) {
    const page = pdf.addPage([pageSize.width, pageSize.height]);
    const { items, pageTotal } = layouts[p];

    // Draw images
    for (const placed of items) {
      const idx = images.findIndex((it) => it === placed);
      const imgEmbed = embedded[idx];
      if (!imgEmbed) continue;
      page.drawImage(imgEmbed, {
        x: placed.x,
        y: placed.y,
        width: placed.renderWidth,
        height: placed.renderHeight
      });
    }

    // Page header: per-page total (left-top)
    const totalText = `本頁合計：${pageTotal.toLocaleString('zh-TW')} 元`;
    page.drawText(totalText, { x: margin, y: pageSize.height - margin + 6, size: 10, font, color: rgb(0.1, 0.1, 0.1) });

    // Page footer: page index (right-bottom)
    const pageText = `第 ${p + 1} 頁 / 共 ${layouts.length} 頁`;
    const textWidth = font.widthOfTextAtSize(pageText, 10);
    page.drawText(pageText, { x: pageSize.width - margin - textWidth, y: margin - 14, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
  }

  // Document summary page (optional): skipped; overview can be rendered in UI
  return pdf.save();
}


