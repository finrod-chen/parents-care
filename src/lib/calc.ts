import type { Rules } from './schema';

export type CalcResult =
  | { status: 'amount'; amount: number }
  | { status: 'not_eligible' }
  | { status: 'unknown' };

/**
 * 依年齡判斷單一給付項目。不推測：
 * - min_age 或 amount 缺（null）→ 待查證（unknown）
 * - 年齡不在 [min_age, max_age] → 不符資格
 * 注意：只判斷年齡條件，其他資格（戶籍、所得…）仍須依各縣市公告。
 */
export function calcItem(rules: Rules | undefined, age: number): CalcResult {
  if (!rules || rules.min_age === null) return { status: 'unknown' };
  if (!Number.isFinite(age) || age < 0) return { status: 'unknown' };
  if (age < rules.min_age) return { status: 'not_eligible' };
  if (rules.max_age !== null && age > rules.max_age) return { status: 'not_eligible' };
  if (rules.amount_twd === null) return { status: 'unknown' };
  return { status: 'amount', amount: rules.amount_twd };
}

export const formatTwd = (n: number) => `${n.toLocaleString('en-US')} 元`;
