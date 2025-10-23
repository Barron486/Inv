import { NextRequest, NextResponse } from 'next/server';
import { generateInvoicePdf } from '@/lib/pdf';
import type { InvoiceImage } from '@/lib/layout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type InputImage = {
  width: number;
  height: number;
  amount: number;
  dataBase64: string; // data URL or base64 string
  fileName?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const images: InputImage[] = body?.images ?? [];
    if (!images.length) return new NextResponse('No images', { status: 400 });

    const parsed: InvoiceImage[] = images.map((im) => ({
      width: im.width,
      height: im.height,
      amount: im.amount,
      data: base64ToBytes(im.dataBase64),
      fileName: im.fileName
    }));

    const pdfBytes = await generateInvoicePdf(parsed, {});
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="invoices.pdf"'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function base64ToBytes(input: string): Uint8Array {
  const base64 = input.includes(',') ? input.split(',')[1] : input;
  return Uint8Array.from(Buffer.from(base64, 'base64'));
}


