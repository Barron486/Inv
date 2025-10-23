import { NextRequest, NextResponse } from 'next/server';
import { detectTextAndAmount } from '@/lib/ocr';
import { autoCropAndEnhance } from '@/lib/image';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll('files').filter((f): f is File => f instanceof File);
    if (!files.length) {
      return NextResponse.json({ results: [] });
    }

    const autoCrop = (form.get('autoCrop') ?? '1') === '1';
    const enhance = (form.get('enhance') ?? '1') === '1';

    const buffers: { name: string; bytes: Buffer }[] = [];
    for (const f of files) {
      const arrayBuffer = await f.arrayBuffer();
         let bytes = Buffer.from(new Uint8Array(arrayBuffer));
      if (autoCrop || enhance) {
        bytes = await autoCropAndEnhance(bytes, { autoCrop, sharpen: enhance, normalize: enhance, threshold: true, output: 'png' });
      }
      buffers.push({ name: f.name, bytes });
    }

    const results = await Promise.all(
      buffers.map(async (b) => {
        try {
          const r = await detectTextAndAmount(b.bytes);
          return { fileName: b.name, amount: r.amount ?? null, currency: 'TWD', text: r.text };
        } catch (err: any) {
          return { fileName: b.name, amount: null, error: String(err) };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}


