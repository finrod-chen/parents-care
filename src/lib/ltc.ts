import type { LongTermCare } from './national';

export type LtcData = Pick<LongTermCare, 'care_levels' | 'copay_classes' | 'foreign_caregiver' | 'employment_stability_fee'>;

export type LtcInput = {
  level: number; // 2–8
  classId: number; // 部分負擔身分別 1–3
  foreignCaregiver: boolean;
  wage: number | null; // 外籍看護月薪（使用者輸入）
  otherMonthly: number; // 其他每月費用（使用者輸入）
  feeExempt: boolean; // 就業安定費免繳身分
};

export type LtcResult = {
  quota: number; // 可使用的照顧及專業服務額度（月）
  copay: number; // 部分負擔（額度全用完時）
  govPays: number;
  pct: number;
  foreign: null | { wage: number | null; fee: number; other: number; total: number | null };
  familyTotal: number | null; // 部分負擔 + 外籍看護月支出（輸入薪資後才有值）
};

/** 部分負擔以小數點後無條件捨去計算（附表五備註）；額度 30% 亦以整數運算。 */
export function calcLtc(d: LtcData, i: LtcInput): LtcResult {
  const lv = d.care_levels.find((l) => l.level === i.level);
  const cls = d.copay_classes.find((c) => c.id === i.classId);
  if (!lv || !cls) throw new Error('無效的等級或身分別');
  const full = lv.monthly_quota_twd;
  const quota = i.foreignCaregiver ? Math.floor((full * d.foreign_caregiver.quota_ratio_pct) / 100) : full;
  const copay = Math.floor((quota * cls.pct) / 100);
  let foreign: LtcResult['foreign'] = null;
  if (i.foreignCaregiver) {
    const fee = i.feeExempt ? 0 : d.employment_stability_fee.home_caregiver_monthly_twd;
    const other = Math.max(0, i.otherMonthly || 0);
    const total = i.wage === null ? null : i.wage + fee + other;
    foreign = { wage: i.wage, fee, other, total };
  }
  return {
    quota,
    copay,
    govPays: quota - copay,
    pct: cls.pct,
    foreign,
    familyTotal: foreign ? (foreign.total === null ? null : copay + foreign.total) : copay,
  };
}

export const twd = (n: number) => `${n.toLocaleString('en-US')} 元`;
