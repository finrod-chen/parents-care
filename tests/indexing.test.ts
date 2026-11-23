import { describe, expect, it } from 'vitest';
import { all, hasLocalContent, noindexUrls } from '../src/lib/data';
import { SITE_URL } from '../src/lib/site';

describe('薄內容頁面的索引規則', () => {
  const excluded = noindexUrls();
  it('沒有在地導覽（guide）的縣市頁一律在 noindex 清單（也就是不進 sitemap）', () => {
    for (const e of all().filter((x) => !hasLocalContent(x))) {
      expect(excluded.has(`${SITE_URL}/${e.topic}/${e.county}/`), `${e.topic}/${e.county}`).toBe(true);
    }
  });
  it('有在地導覽的縣市頁不會被排除', () => {
    for (const e of all().filter(hasLocalContent)) {
      expect(excluded.has(`${SITE_URL}/${e.topic}/${e.county}/`), `${e.topic}/${e.county}`).toBe(false);
    }
  });
  it('目前：假牙 22 縣市有在地導覽，重陽與敬老卡尚未補上', () => {
    const idx = (t: string) => all().filter((e) => e.topic === t && hasLocalContent(e)).length;
    expect(idx('denture-subsidy')).toBe(22);
    expect(idx('chongyang-bonus')).toBe(0);
    expect(idx('senior-card')).toBe(0);
  });
  it('總覽頁與關於、資料來源頁不在 noindex 清單', () => {
    for (const p of ['/denture-subsidy/', '/chongyang-bonus/', '/senior-card/', '/about/', '/sources/'])
      expect(excluded.has(`${SITE_URL}${p}`), p).toBe(false);
  });
});
