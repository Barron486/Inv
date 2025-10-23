import { format } from 'date-fns';

export function getMonthPresetRange(month: number): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return { start: format(startDate, 'yyyy-MM-dd'), end: format(endDate, 'yyyy-MM-dd') };
}

export function getLast30DaysRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
}


