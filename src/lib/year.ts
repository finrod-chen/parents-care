/**
 * 年度常數。頁面標題的年份一律取該筆資料的 year（資料更新為 116 年度才會變成 2027），
 * 這裡只負責「現在是哪一年」與「資料是否落後」，不會單獨改字。
 */
export const rocYear = (adYear: number): number => adYear - 1911;

/** 台灣時間的西元年 */
export function taipeiYear(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric' }).format(now));
}

/** 建置當下的年度（台灣時間） */
export const CURRENT_YEAR = taipeiYear();

/** 資料年度落後於現在年度時回傳說明（頁面顯示「某年度待公告」），否則 null */
export function pendingYear(dataYear: number, current: number = CURRENT_YEAR): { current: number; currentRoc: number; dataRoc: number } | null {
  return dataYear < current ? { current, currentRoc: rocYear(current), dataRoc: rocYear(dataYear) } : null;
}
