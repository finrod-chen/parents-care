import { describe, expect, it } from 'vitest';
import { all, byCounty, lastmodFor } from '../src/lib/data';
import { COUNTIES, NEIGHBORS } from '../src/lib/counties';
import { countyPageMeta } from '../src/lib/page-meta';
import { CURRENT_YEAR, pendingYear, rocYear, taipeiYear } from '../src/lib/year';
import { articleLd, organizationLd, websiteLd } from '../src/lib/seo';
import fs from 'node:fs';

describe('鄰近縣市', () => {
  it('每縣市 3–4 個、不含自己、不重複、都是合法 slug', () => {
    const slugs = new Set(COUNTIES.map((c) => c.slug));
    for (const c of COUNTIES) {
      const n = NEIGHBORS[c.slug];
      expect(n.length, c.slug).toBeGreaterThanOrEqual(3);
      expect(n.length, c.slug).toBeLessThanOrEqual(4);
      expect(n).not.toContain(c.slug);
      expect(new Set(n).size).toBe(n.length);
      for (const x of n) expect(slugs.has(x)).toBe(true);
    }
  });
});

describe('sitemap lastmod', () => {
  it('縣市頁＝該頁查證日；縣市總覽＝該縣市最新查證日', () => {
    const e = all().find((x) => x.topic === 'denture-subsidy' && x.county === 'keelung')!;
    expect(lastmodFor('https://bamaling.tw/denture-subsidy/keelung/')).toBe(e.status === 'verified' ? e.verified_at : undefined);
    const latest = byCounty('keelung').map((x) => (x.status === 'verified' ? x.verified_at : '')).sort().pop();
    expect(lastmodFor('https://bamaling.tw/county/keelung/')).toBe(latest);
  });
  it('沒有資料依據的頁面不給 lastmod', () => {
    expect(lastmodFor('https://bamaling.tw/privacy/')).toBeUndefined();
  });
  it('/sitemap.xml 轉址到 sitemap-index.xml', () => {
    expect(fs.readFileSync('public/_redirects', 'utf8')).toMatch(/^\/sitemap\.xml\s+\/sitemap-index\.xml\s+301/m);
  });
});

describe('縣市頁 title / description', () => {
  const verified = all().filter((e) => e.status === 'verified');
  it('description 的「資料最後查證」在句尾，不在句首', () => {
    for (const e of verified) {
      const d = countyPageMeta(e).description;
      expect(d.endsWith(`資料最後查證：${e.status === 'verified' ? e.verified_at : ''}。`), `${e.topic}/${e.county}`).toBe(true);
      expect(d.startsWith('資料最後查證')).toBe(false);
    }
  });
  it('description 第一句含具體數字（金額或年齡）', () => {
    for (const e of verified) {
      const first = countyPageMeta(e).description.split(/(?<=。)/)[0]!;
      // 新竹縣的重陽頁第一句是「沒有普發」的說明，數字在第二段，不強制
      if (e.topic === 'chongyang-bonus' && e.county === 'hsinchu-county') continue;
      expect(first, `${e.topic}/${e.county}`).toMatch(/\d/);
    }
  });
  it('title 用的年份取自資料自己的 year', () => {
    for (const e of verified) if (!e.seo?.title) expect(countyPageMeta(e).title).toContain(String(e.year));
  });
  it('搜尋用字：桃園用官方名稱「敬老愛心卡」、雲林寫「點數」、澎湖寫「敬老津貼」', () => {
    const t = (topic: string, county: string) => countyPageMeta(all().find((e) => e.topic === topic && e.county === county)!).title;
    expect(t('senior-card', 'taoyuan')).toContain('敬老愛心卡');
    expect(t('senior-card', 'yunlin')).toContain('點數');
    expect(t('chongyang-bonus', 'penghu')).toContain('敬老津貼');
  });
});

describe('年度', () => {
  it('民國年換算', () => expect(rocYear(2026)).toBe(115));
  it('以台灣時間判斷年度（12/31 16:00 UTC 已是台灣隔年）', () => {
    expect(taipeiYear(new Date('2026-12-31T16:00:00Z'))).toBe(2027);
    expect(taipeiYear(new Date('2026-12-31T15:59:00Z'))).toBe(2026);
    expect(CURRENT_YEAR).toBeGreaterThanOrEqual(2026);
  });
  it('資料年度落後才顯示待更新說明', () => {
    expect(pendingYear(2026, 2026)).toBeNull();
    expect(pendingYear(2026, 2027)).toEqual({ current: 2027, currentRoc: 116, dataRoc: 115 });
  });
});

describe('結構化資料', () => {
  it('Article 帶 dateModified 與 publisher', () => {
    const a = articleLd({ headline: 'x', description: 'y', path: '/a/', dateModified: '2026-11-09' });
    expect(a['@type']).toBe('Article');
    expect(a.dateModified).toBe('2026-11-09');
    expect(a.publisher.name).toBe('爸媽領');
  });
  it('WebSite 與 Organization 互相指向；不宣告不存在的 SearchAction', () => {
    expect(websiteLd().publisher['@id']).toBe(organizationLd()['@id']);
    expect(JSON.stringify(websiteLd())).not.toContain('SearchAction');
  });
});
