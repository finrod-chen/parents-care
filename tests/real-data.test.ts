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

describe('假牙與敬老卡資料', () => {
  const others = verified.filter((e) => e.topic !== 'chongyang-bonus');
  it('已查證頁都有摘要與官方來源', () => {
    expect(others.length).toBeGreaterThan(0);
    for (const e of others) {
      if (e.status !== 'verified') continue;
      expect(e.summary.length, `${e.topic}/${e.county}`).toBeGreaterThan(10);
      expect(e.source_url).toMatch(/^https:\/\//);
    }
  });
  it('有 deadline_date 的項目一定附期限說明', () => {
    for (const e of others) {
      if (e.status !== 'verified') continue;
      for (const it of e.items) if (it.deadline_date) expect(it.deadline, `${e.county} ${it.name}`).not.toBeNull();
    }
  });
  it('連江縣假牙不含誤植的臺東縣方案', () => {
    const l = others.find((e) => e.topic === 'denture-subsidy' && e.county === 'lienchiang');
    expect(l && l.status === 'verified' && l.items.length).toBe(1);
  });
});

describe('來源性質', () => {
  it('連江縣重陽敬老金已是官方要點，不再標為新聞來源', () => {
    const l = verified.find((e) => e.topic === 'chongyang-bonus' && e.county === 'lienchiang');
    expect(l && l.status === 'verified' && l.source_type).toBeUndefined();
    expect(l && l.status === 'verified' && l.source_label).toBe('連江縣發放重陽禮金實施要點');
  });
});
