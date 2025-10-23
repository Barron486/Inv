import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '發票辨識與彙整系統',
  description: '上傳、辨識、搜尋、排版、匯出 PDF 與 Google Sheets'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans TC, PingFang TC, Microsoft JhengHei, sans-serif' }}>
        <nav style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', gap: 12 }}>
          <a href="/" style={{ fontWeight: 600 }}>首頁</a>
          <a href="/upload">上傳發票</a>
          <a href="/search">搜尋發票</a>
          <a href="/report">報告總覽</a>
        </nav>
        <main style={{ padding: 16 }}>{children}</main>
      </body>
    </html>
  );
}


