const AMOUNT_REGEX = /(?:(?:總計|合計|金額|應付|應收|應稅|未稅|含稅)\s*[:：]?\s*)?\$?\s*(?:NT\$?|NTD|TWD)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi;

function normalizeNumber(numStr: string): number | null {
  try {
    const cleaned = numStr.replace(/[,\s]/g, '');
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
    return null;
  } catch {
    return null;
  }
}

export function parseLikelyAmountFromText(text: string): number | null {
  const candidates: number[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(AMOUNT_REGEX)) {
    const raw = match[1];
    if (!raw) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);
    const n = normalizeNumber(raw);
    if (n !== null && n > 0) candidates.push(n);
  }

  if (!candidates.length) return null;
  // Heuristic: choose the LARGEST plausible amount (often total is max among prices)
  candidates.sort((a, b) => b - a);
  // Optionally filter out outliers (e.g., > 10 million) if needed
  return candidates[0];
}


