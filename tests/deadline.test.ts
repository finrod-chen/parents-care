import { describe, expect, it } from 'vitest';
import { allClosed, deadlineState, todayTW } from '../src/lib/deadline';
import { loadAll } from '../src/lib/data';

describe('deadline（台灣時間）', () => {
  it('截止日當天仍可領，隔天起已截止', () => {
    const d = new Date('2026-12-31T10:00:00+08:00');
    expect(deadlineState('2026-12-31', d)).toBe('open');
    expect(deadlineState('2026-12-30', d)).toBe('closed');
  });
  it('跨時區：UTC 還是前一天、台灣已是隔天', () => {
    const d = new Date('2026-12-31T17:00:00Z'); // 台灣 2027-01-01 01:00
    expect(todayTW(d)).toBe('2027-01-01');
    expect(deadlineState('2026-12-31', d)).toBe('closed');
  });
  it('沒有日期 → unknown，不標示', () => {
    expect(deadlineState(null)).toBe('unknown');
    expect(deadlineState(undefined)).toBe('unknown');
  });
  it('allClosed：只要有一項日期不明或仍開放就不算整頁截止', () => {
    const now = new Date('2026-11-08T12:00:00+08:00');
    expect(allClosed(['2026-10-18', '2026-10-18'], now)).toBe(true);
    expect(allClosed(['2026-10-18', null], now)).toBe(false);
    expect(allClosed(['2026-10-18', '2026-12-31'], now)).toBe(false);
    expect(allClosed([], now)).toBe(false);
  });
});

describe('deadline_date 資料', () => {
  it('格式合法且落在合理範圍（查證年度內）', () => {
    for (const e of loadAll()) {
      if (e.status !== 'verified') continue;
      for (const it of e.items) {
        if (!it.deadline_date) continue;
        expect(it.deadline_date >= `${e.year}-01-01` && it.deadline_date <= `${e.year + 1}-12-31`, `${e.county} ${it.deadline_date}`).toBe(true);
      }
    }
  });
});
