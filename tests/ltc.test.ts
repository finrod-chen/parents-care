import { describe, expect, it } from 'vitest';
import { calcLtc } from '../src/lib/ltc';
import { loadNational } from '../src/lib/national';

const { ltc } = loadNational();
const base = { level: 4, classId: 3, foreignCaregiver: false, wage: null, otherMonthly: 0, feeExempt: false };

describe('長照給付資料（官方附表）', () => {
  it('第 2–8 級額度與附表二一致', () => {
    expect(ltc.care_levels.map((l) => l.monthly_quota_twd)).toEqual([10020, 15460, 18580, 24100, 28070, 32090, 36180]);
  });
  it('部分負擔比率 0／5／16', () => expect(ltc.copay_classes.map((c) => c.pct)).toEqual([0, 5, 16]));
});

describe('calcLtc', () => {
  it('一般戶第 4 級：額度 18,580、自付 16%（無條件捨去）', () => {
    const r = calcLtc(ltc, base);
    expect(r.quota).toBe(18580);
    expect(r.copay).toBe(Math.floor((18580 * 16) / 100)); // 2,972
    expect(r.copay).toBe(2972);
    expect(r.govPays).toBe(18580 - 2972);
  });
  it('低收入戶（第一類）自付 0', () => expect(calcLtc(ltc, { ...base, classId: 1 }).copay).toBe(0));
  it('聘外籍看護：額度只剩 30%', () => {
    const r = calcLtc(ltc, { ...base, foreignCaregiver: true });
    expect(r.quota).toBe(5574);
    expect(r.copay).toBe(Math.floor((5574 * 16) / 100));
  });
  it('就安費：一般 2,000；符合免繳身分為 0', () => {
    const a = calcLtc(ltc, { ...base, foreignCaregiver: true, wage: 25000 });
    expect(a.foreign?.fee).toBe(2000);
    expect(a.foreign?.total).toBe(27000);
    const b = calcLtc(ltc, { ...base, foreignCaregiver: true, wage: 25000, feeExempt: true });
    expect(b.foreign?.fee).toBe(0);
  });
  it('沒輸入薪資就不算外籍看護總支出，不假設數字', () => {
    const r = calcLtc(ltc, { ...base, foreignCaregiver: true });
    expect(r.foreign?.total).toBeNull();
    expect(r.familyTotal).toBeNull();
  });
  it('所有等級×身分別的 30% 額度都是整數', () => {
    for (const l of ltc.care_levels) expect(Number.isInteger((l.monthly_quota_twd * 30) / 100)).toBe(true);
  });
});
