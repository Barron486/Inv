'use client';

import { useState } from 'react';

type ReportItem = {
  fileName?: string;
  width: number;
  height: number;
  amount: number;
  dataBase64: string; // data URL/base64
};

export default function ReportPage() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enableSheets = process.env.NEXT_PUBLIC_ENABLE_SHEETS === '1';

  const total = items.reduce((acc, it) => acc + (it.amount || 0), 0);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr = await Promise.all(
      Array.from(files).map(async (f) => {
        const data = await f.arrayBuffer();
        const base64 = Buffer.from(data).toString('base64');
        // image size unknown: rely on client decode to read width/height
        const img = document.createElement('img');
        const dataUrl = `data:${f.type};base64,${base64}`;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = dataUrl;
        });
        return { fileName: f.name, width: img.naturalWidth, height: img.naturalHeight, amount: 0, dataBase64: dataUrl } as ReportItem;
      })
    );
    setItems((prev) => [...prev, ...arr]);
  };

  const updateAmount = (idx: number, amount: number) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, amount } : it)));
  };

  const generatePdf = async () => {
    if (!items.length) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch('/api/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: items }) });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        let message = res.statusText || 'Request failed';
        if (contentType.includes('application/json')) {
          try {
            const errJson = await res.json();
            message = errJson?.error || JSON.stringify(errJson);
          } catch {}
        } else {
          try {
            message = (await res.text()) || message;
          } catch {}
        }
        setError(`${res.status} ${message}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoices.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const exportSheets = async () => {
    if (!items.length) return;
    setExporting(true);
    setError(null);
    try {
      const rows = items.map((it) => [it.fileName ?? '', '', '', it.amount, '']);
      const res = await fetch('/api/sheets-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows })
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        let message = res.statusText || 'Request failed';
        if (contentType.includes('application/json')) {
          try {
            const errJson = await res.json();
            message = errJson?.error || JSON.stringify(errJson);
          } catch {}
        } else {
          try {
            message = (await res.text()) || message;
          } catch {}
        }
        setError(`${res.status} ${message}`);
        return;
      }
      if (contentType.includes('application/json')) {
        const data = await res.json();
        alert(data?.message || '完成');
      } else {
        const text = await res.text();
        alert(text || '完成');
      }
    } catch (e: any) {
      alert(String(e));
    } finally {
      setExporting(false);
    }
  };
  if (!enableSheets) { void exporting; void exportSheets; }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>報告總覽</h2>
      {error && <div style={{ color: '#b00' }}>錯誤：{error}</div>}
      <div>總金額：{total.toLocaleString('zh-TW')}</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ padding: '8px 12px', border: '1px dashed #aaa', borderRadius: 8, cursor: 'pointer' }}>
          新增發票圖片
          <input type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        </label>
        <button onClick={generatePdf} disabled={downloading || !items.length} style={{ padding: '8px 12px', borderRadius: 8 }}>
          {downloading ? '產生中…' : '一鍵產生 PDF'}
        </button>
        {enableSheets && (
          <button onClick={exportSheets} disabled={exporting || !items.length} style={{ padding: '8px 12px', borderRadius: 8 }}>
            {exporting ? '匯出中…' : '一鍵匯出到 Google Sheets'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((it, idx) => (
          <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <img src={it.dataBase64} alt={it.fileName} style={{ width: 160, height: 100, objectFit: 'cover', borderRadius: 6 }} />
              <div style={{ display: 'grid', gap: 6 }}>
                <div>{it.fileName}</div>
                <div>尺寸：{it.width}×{it.height}</div>
                <label>
                  金額：
                  <input type="number" value={it.amount} onChange={(e) => updateAmount(idx, Number(e.target.value || 0))} style={{ width: 120 }} />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


