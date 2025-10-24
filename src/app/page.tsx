export default function HomePage() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>發票辨識與彙整系統</h1>
      <p>功能：上傳辨識、開放資料搜尋、A4 橫式排版、PDF 與 Sheets 匯出、雲端佈署。</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a href="/upload" style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>開始上傳</a>
        <a href="/search" style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>搜尋發票</a>
        <a href="/report" style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}>報告總覽</a>
        <a href="/debug" style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: '#fff3cd' }}>系統診斷</a>
      </div>
    </div>
  );
}


