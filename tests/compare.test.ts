import { describe, expect, it } from 'vitest';
import { compareSentences, standing, twd, type CompareRow } from '../src/lib/compare';
import { byTopic } from '../src/lib/data';

const rows: CompareRow[] = [
  { county: 'taipei', compare: { general_full_twd: 'none', welfare_full_twd: 55000 } },
  { county: 'penghu', compare: { general_full_twd: 50000, welfare_full_twd: null } },
  { county: 'tainan', compare: { general_full_twd: 44000, welfare_full_twd: 44000 } },
  { county: 'changhua', compare: { general_full_twd: 40000, welfare_full_twd: 44000 } },
  { county: 'yilan', compare: { general_full_twd: 40000, welfare_full_twd: null } },
  { county: 'hualien', compare: { general_full_twd: null, welfare_full_twd: null } },
];

describe('twd', () => {
  it('萬與千的寫法', () => {
    expect(twd(44000)).toBe('4 萬 4,000 元');
    expect(twd(40000)).toBe('4 萬元');
    expect(twd(6600)).toBe('6,600 元');
  });
});

describe('standing', () => {
  it('名次、並列、最高與中位數', () => {
    const s = standing(rows, 'changhua', 'general_full_twd')!;
    expect(s.count).toBe(4);
    expect(s.rank).toBe(3);
    expect(s.ties).toBe(1);
    expect(s.max).toBe(50000);
    expect(s.maxCounties).toEqual(['penghu']);
    expect(s.median).toBe(42000);
  });
  it('沒有方案的縣市 rank 為 null', () => {
    expect(standing(rows, 'taipei', 'general_full_twd')!.rank).toBeNull();
  });
});

describe('compareSentences', () => {
  it('第一名的寫法', () => {
    expect(compareSentences(rows, 'penghu')[0]).toContain('最高的');
  });
  it('沒有方案時說明全台有幾個縣市有', () => {
    expect(compareSentences(rows, 'taipei')[0]).toMatch(/沒有這類方案。有公布全口金額的 4 個縣市中/);
  });
  it('null（有方案但沒有可比數字）不產生句子', () => {
    expect(compareSentences(rows, 'hualien')).toEqual([]);
    expect(compareSentences(rows, 'yilan')).toHaveLength(1);
  });
  it('實際資料：每個有 compare 的縣市都產生不同的句子', () => {
    const real = byTopic('denture-subsidy').flatMap((e) =>
      e.status === 'verified' && e.compare ? [{ county: e.county, compare: e.compare }] : [],
    );
    const all = real.map((r) => compareSentences(real, r.county).join('')).filter(Boolean);
    expect(new Set(all).size).toBe(all.length);
  });
});
