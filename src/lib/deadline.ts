/** 以台灣時間（Asia/Taipei）判斷領取期限，build 與瀏覽器共用。 */
export const todayTW = (now: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

export type DeadlineState = 'open' | 'closed' | 'unknown';

/** deadline_date 當天仍可領；隔天起為已截止。 */
export function deadlineState(date: string | null | undefined, now: Date = new Date()): DeadlineState {
  if (!date) return 'unknown';
  return date < todayTW(now) ? 'closed' : 'open';
}

export const BADGE_CLASS = {
  open: 'inline-block rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900',
  closed: 'inline-block rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800',
} as const;

export const badgeText = (state: Exclude<DeadlineState, 'unknown'>, date: string) =>
  state === 'closed' ? '已截止' : `領取中・至 ${date} 止`;

/** 所有有日期的項目都已截止、且沒有日期不明的項目 → 整頁顯示「本年度已截止」 */
export function allClosed(dates: (string | null | undefined)[], now: Date = new Date()): boolean {
  return dates.length > 0 && dates.every((d) => deadlineState(d, now) === 'closed');
}
