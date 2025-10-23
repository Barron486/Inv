import { NextRequest, NextResponse } from 'next/server';
import { appendRowsToSheet } from '@/lib/sheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SHEETS_SPREADSHEET_ID) {
      return NextResponse.json({ error: 'Sheets export disabled' }, { status: 501 });
    }
    const body = await req.json();
    const rows: (string | number)[][] = body?.rows ?? [];
    if (!rows.length) return NextResponse.json({ message: 'No rows' });
    const updates = await appendRowsToSheet(rows);
    return NextResponse.json({ message: '已匯出', updates });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}


