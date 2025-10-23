'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SelectedImage = {
  file: File;
  previewUrl: string;
  sizeKb: number;
};

type OcrResult = {
  fileName: string;
  amount: number | null;
  currency?: string;
  text?: string;
  error?: string;
};

export default function UploadPage() {
  const [selected, setSelected] = useState<SelectedImage[]>([]);
  const [results, setResults] = useState<OcrResult[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [autoCrop, setAutoCrop] = useState(true);
  const [enhance, setEnhance] = useState(true);

  // Crop workspace state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  const onFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const list: SelectedImage[] = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      sizeKb: Math.round(file.size / 1024)
    }));
    setSelected((prev) => [...prev, ...list]);
  }, []);

  const totalSizeMb = useMemo(() => {
    const totalKb = selected.reduce((acc, it) => acc + it.sizeKb, 0);
    return Math.round((totalKb / 1024) * 100) / 100;
  }, [selected]);

  const removeItem = (idx: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!selected.length) return;
    setSubmitting(true);
    setResults(null);
    try {
      const form = new FormData();
      selected.forEach((img) => form.append('files', img.file, img.file.name));
      form.append('autoCrop', autoCrop ? '1' : '0');
      form.append('enhance', enhance ? '1' : '0');
      const res = await fetch('/api/ocr', { method: 'POST', body: form });
      const data = await res.json();
      setResults(data.results ?? []);
    } catch (err: any) {
      setResults([{ fileName: 'N/A', amount: null, error: String(err) }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>上傳發票並自動辨識金額</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ padding: '8px 12px', border: '1px dashed #aaa', borderRadius: 8, cursor: 'pointer' }}>
          從圖庫選擇
          <input type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        </label>
        <label style={{ padding: '8px 12px', border: '1px dashed #aaa', borderRadius: 8, cursor: 'pointer' }}>
          使用相機
          <input type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        </label>
        <div style={{ color: '#666' }}>已選擇 {selected.length} 張，合計約 {totalSizeMb} MB</div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={autoCrop} onChange={(e) => setAutoCrop(e.target.checked)} /> 自動裁切
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} /> 影像銳化/強化
        </label>
      </div>

      {selected.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {selected.map((item, idx) => (
            <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, display: 'grid', gap: 8 }}>
              <img src={item.previewUrl} alt={item.file.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />
              <div style={{ fontSize: 12, color: '#555' }}>{item.file.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{item.sizeKb} KB</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setCropIndex(idx); setCropOpen(true); }} style={{ padding: '6px 8px' }}>裁切</button>
                <button onClick={() => removeItem(idx)} style={{ padding: '6px 8px' }}>移除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <button onClick={handleSubmit} disabled={submitting || selected.length === 0} style={{ padding: '10px 14px', borderRadius: 8 }}>
          {submitting ? '辨識中…' : '開始辨識金額'}
        </button>
      </div>

      {results && (
        <div style={{ display: 'grid', gap: 8 }}>
          <h3>辨識結果</h3>
          {results.map((r, i) => (
            <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
              <div><strong>{r.fileName}</strong></div>
              {r.error ? (
                <div style={{ color: '#b00' }}>錯誤：{r.error}</div>
              ) : (
                <div>金額：{r.amount !== null ? r.amount.toLocaleString('zh-TW', { style: 'currency', currency: 'TWD' }) : '未偵測'}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {cropOpen && cropIndex !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, width: '90vw', height: '80vh', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>裁切工作區</strong>
              <button onClick={() => { setCropOpen(false); setCropIndex(null); setCropRect(null); }}>關閉</button>
            </div>
            <div style={{ position: 'relative', overflow: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
              <img
                ref={imgRef}
                src={selected[cropIndex].previewUrl}
                alt="crop"
                style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
                onLoad={() => {
                  const el = imgRef.current;
                  if (!el) return;
                  const w = el.naturalWidth; const h = el.naturalHeight;
                  const cx = Math.round(w * 0.1); const cy = Math.round(h * 0.1);
                  const cw = Math.round(w * 0.8); const ch = Math.round(h * 0.8);
                  setCropRect({ x: cx, y: cy, w: cw, h: ch });
                }}
              />
              {cropRect && imgRef.current && (
                <svg
                  style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                  viewBox={`0 0 ${imgRef.current.naturalWidth} ${imgRef.current.naturalHeight}`}
                  preserveAspectRatio="xMinYMin meet"
                >
                  <rect x={cropRect.x} y={cropRect.y} width={cropRect.w} height={cropRect.h} fill="rgba(0,128,255,0.1)" stroke="#08f" strokeWidth={2} />
                </svg>
              )}
              {/* Transparent interaction layer */}
              <div
                style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
                onMouseDown={(e) => {
                  const el = imgRef.current; if (!el) return;
                  const rect = el.getBoundingClientRect();
                  const scaleX = el.naturalWidth / rect.width;
                  const scaleY = el.naturalHeight / rect.height;
                  const x = (e.clientX - rect.left) * scaleX;
                  const y = (e.clientY - rect.top) * scaleY;
                  setDragging(true); setStartPos({ x, y }); setCropRect({ x, y, w: 0, h: 0 });
                }}
                onMouseMove={(e) => {
                  if (!dragging || !startPos) return; const el = imgRef.current; if (!el) return;
                  const rect = el.getBoundingClientRect(); const scaleX = el.naturalWidth / rect.width; const scaleY = el.naturalHeight / rect.height;
                  const x = (e.clientX - rect.left) * scaleX; const y = (e.clientY - rect.top) * scaleY;
                  const w = Math.max(1, x - startPos.x); const h = Math.max(1, y - startPos.y);
                  setCropRect({ x: Math.min(startPos.x, x), y: Math.min(startPos.y, y), w: Math.abs(w), h: Math.abs(h) });
                }}
                onMouseUp={() => { setDragging(false); setStartPos(null); }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={async () => {
                if (cropIndex === null || !cropRect) return;
                const base = selected[cropIndex];
                const imageBitmap = await createImageBitmap(base.file);
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(cropRect.w); canvas.height = Math.round(cropRect.h);
                const ctx = canvas.getContext('2d'); if (!ctx) return;
                ctx.drawImage(imageBitmap, Math.round(-cropRect.x), Math.round(-cropRect.y));
                const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, base.file.type || 'image/png', 0.95));
                if (!blob) return;
                const newFile = new File([blob], base.file.name.replace(/(\.[a-z]+)?$/i, '_crop$1'), { type: blob.type });
                const previewUrl = URL.createObjectURL(newFile);
                setSelected((prev) => prev.map((it, i) => (i === cropIndex ? { file: newFile, previewUrl, sizeKb: Math.round(newFile.size / 1024) } : it)));
                setCropOpen(false); setCropIndex(null); setCropRect(null);
              }}>套用裁切</button>
              <button onClick={() => { setCropOpen(false); setCropIndex(null); setCropRect(null); }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


