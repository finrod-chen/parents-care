import { describe, expect, it } from 'vitest';
import { loadAll } from '../src/lib/data';

const verified = loadAll().filter((e) => e.status === 'verified');

describe('真實資料一致性', () => {
  it('有已查證的縣市', () => expect(verified.length).toBeGreaterThan(0));

  it('rules.amount_twd 與顯示金額字串一致（避免兩邊不同步）', () => {
    for (const e of verified) {
      if (e.status !== 'verified') continue;
      for (const it of e.items) {
        if (!it.rules || it.rules.amount_twd === null) continue;
        const shown = it.rules.amount_twd.toLocaleString('en-US') + ' 元';
        expect(it.amount, `${e.topic}/${e.county} ${it.name}`).toContain(shown);
      }
    }
  });

  it('同一縣市的年齡級距不重疊', () => {
    for (const e of verified) {
      if (e.status !== 'verified') continue;
      const rs = e.items.flatMap((i) => (i.rules && i.rules.min_age !== null ? [i.rules] : []));
      for (let a = 0; a < rs.length; a++)
        for (let b = a + 1; b < rs.length; b++) {
          const [x, y] = [rs[a]!, rs[b]!];
          const overlap = x.min_age! <= (y.max_age ?? 999) && y.min_age! <= (x.max_age ?? 999);
          expect(overlap, `${e.county} 級距重疊`).toBe(false);
        }
    }
  });
});
