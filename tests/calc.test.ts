import { describe, expect, it } from 'vitest';
import { calcItem } from '../src/lib/calc';

const r = (min_age: number | null, max_age: number | null, amount_twd: number | null) => ({ min_age, max_age, amount_twd });

describe('calcItem', () => {
  it('在年齡區間內回傳金額', () => {
    expect(calcItem(r(65, 69, 1000), 65)).toEqual({ status: 'amount', amount: 1000 });
    expect(calcItem(r(65, 69, 1000), 69)).toEqual({ status: 'amount', amount: 1000 });
  });
  it('不符年齡', () => {
    expect(calcItem(r(65, 69, 1000), 64)).toEqual({ status: 'not_eligible' });
    expect(calcItem(r(65, 69, 1000), 70)).toEqual({ status: 'not_eligible' });
  });
  it('無上限', () => {
    expect(calcItem(r(70, null, 2000), 100)).toEqual({ status: 'amount', amount: 2000 });
  });
  it('資料缺漏一律待查證，不推測', () => {
    expect(calcItem(undefined, 70).status).toBe('unknown');
    expect(calcItem(r(null, null, 1000), 70).status).toBe('unknown');
    expect(calcItem(r(65, null, null), 70).status).toBe('unknown');
  });
  it('年齡不合法', () => {
    expect(calcItem(r(65, null, 1000), Number.NaN).status).toBe('unknown');
  });
});
