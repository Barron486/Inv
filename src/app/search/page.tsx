'use client';

import { useEffect, useMemo, useState } from 'react';
import { getMonthPresetRange, getLast30DaysRange } from '@/lib/datePresets';

type InvoiceItem = {
  invoiceNumber?: string;
  date?: string; // YYYY-MM-DD
  buyerId?: string; // 統編
  sellerName?: string;
  amount?: number;
};

export default function SearchPage() {
  const [buyerId, setBuyerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    const { start, end } = getLast30DaysRange();
    setStartDate(start);
    setEndDate(end);
  }, []);

  const count = useMemo(() => items.length, [items]);
  const total = useMemo(() => items.reduce((acc, it) => acc + (it.amount ?? 0), 0), [items]);

  const applyMonth = (month: number) => {
    const { start, end } = getMonthPresetRange(month);
    setStartDate(start);
    setEndDate(end);
  };

  const applyLast30 = () => {
    const { start, end } = getLast30DaysRange();
    setStartDate(start);
    setEndDate(end);
  };

  const search = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setItems([]);
    const params = new URLSearchParams({ startDate, endDate });
    if (buyerId) params.set('buyerId', buyerId.trim());
    try {
      const res = await fetch(`/api/einvoices?${params.toString()}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>搜尋電子發票（開放資料）</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <button key={m} onClick={() => applyMonth(m)} style={{ padding: '6px 8px' }}>{m} 月</button>
        ))}
        <button onClick={applyLast30} style={{ padding: '6px 8px' }}>近 30 天</button>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'grid', gap: 6 }}>
            起日
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
        </div>
        <div>
          <label style={{ display: 'grid', gap: 6 }}>
            迄日
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>
        <div>
          <label style={{ display: 'grid', gap: 6 }}>
            買方統一編號（選填）
            <input placeholder="統編" value={buyerId} onChange={(e) => setBuyerId(e.target.value)} />
          </label>
        </div>
        <button onClick={search} disabled={loading || !startDate || !endDate} style={{ padding: '8px 12px', borderRadius: 8 }}>
          {loading ? '查詢中…' : '查詢'}
        </button>
      </div>

      <div style={{ color: '#666' }}>共 {count} 筆，合計 {total.toLocaleString('zh-TW')} 元</div>

      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((it, idx) => (
          <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
            <div><strong>{it.invoiceNumber ?? '—'}</strong>（{it.date ?? '—'}）</div>
            <div>買方：{it.buyerId ?? '—'} | 賣方：{it.sellerName ?? '—'}</div>
            <div>金額：{(it.amount ?? 0).toLocaleString('zh-TW')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


