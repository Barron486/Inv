'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/debug');
        const data = await res.json();
        setStatus(data);
      } catch (err: any) {
        setStatus({ error: err.message || String(err) });
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  if (loading) return <div>檢查中...</div>;

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h2>系統診斷</h2>
      <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto' }}>
        {JSON.stringify(status, null, 2)}
      </pre>
    </div>
  );
}