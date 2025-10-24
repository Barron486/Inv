import { NextRequest, NextResponse } from 'next/server';
import { detectTextAndAmount } from '@/lib/ocr';
import { autoCropAndEnhance } from '@/lib/image';
import { getEnvironmentStatus } from '@/lib/envCheck';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 檢查環境配置
    const envStatus = getEnvironmentStatus();
    if (!envStatus.googleVision) {
      return NextResponse.json({ 
        error: 'Google Cloud Vision API 未配置。請檢查環境變量設置。',
        details: envStatus.issues
      }, { status: 503 });
    }

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
        try {
          const enhanced = await autoCropAndEnhance(bytes, { autoCrop, sharpen: enhance, normalize: enhance, threshold: true, output: 'png' });
          bytes = Buffer.from(enhanced);
        } catch (imageErr: any) {
          console.error('Image enhancement failed:', imageErr);
          // 繼續使用原始圖片
        }
      }
      buffers.push({ name: f.name, bytes });
    }
    
    const results = await Promise.all(
      buffers.map(async (b) => {
        try {
          const r = await detectTextAndAmount(b.bytes);
          return { fileName: b.name, amount: r.amount ?? null, currency: 'TWD', text: r.text };
        } catch (err: any) {
          console.error(`OCR failed for ${b.name}:`, err);
          return { fileName: b.name, amount: null, error: `OCR 處理失敗: ${err.message || String(err)}` };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('OCR API error:', err);
    return NextResponse.json({ 
      error: `伺服器錯誤: ${err.message || String(err)}`,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
