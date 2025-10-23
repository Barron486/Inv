import { NextRequest, NextResponse } from 'next/server';

// NOTE: 開放資料實際欄位需依官方格式調整。
// 這裡先以簡化模型示意，日後可擴充欄位對應與分頁。

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const buyerId = searchParams.get('buyerId')?.trim();

    if (!startDate || !endDate) {
      return NextResponse.json({ items: [] });
    }

    // TODO: 依據官方提供的 API 介面與查詢參數實作。
    // 目前先抓取資料源並以簡單方式過濾，實務上要確認欄位名稱與篩選條件。
    const odsUrl = process.env.EINV_BASE_URL || 'https://www.einvoice.nat.gov.tw/portal/ods/ODS318E/einvoice_open_data';

    // 某些開放資料可能是 CSV/ZIP，實際需下載、解析或改用 JSON API。
    // 這裡先回傳示意資料。
    const demo = [
      { invoiceNumber: 'AB12345678', date: startDate, buyerId: buyerId || '12345678', sellerName: '範例商店', amount: 1200 },
      { invoiceNumber: 'CD87654321', date: endDate, buyerId: buyerId || '12345678', sellerName: '測試行號', amount: 980 }
    ];

    return NextResponse.json({ source: odsUrl, items: demo });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}


