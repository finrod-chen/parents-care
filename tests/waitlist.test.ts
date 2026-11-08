import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { noindexUrls } from '../src/lib/data';

const page = fs.readFileSync('src/pages/waitlist/index.astro', 'utf8');

describe('名單收集頁骨架', () => {
  it('不進 sitemap（列在 noindex 清單）', () => expect(noindexUrls().has('https://example.tw/waitlist/')).toBe(true));
  it('頁面是 noindex', () => expect(page).toMatch(/<Base[^>]*\bnoindex\b/));
  it('沒有送出資料的機制：無 action、無 fetch、無外部腳本或嵌入', () => {
    expect(page).not.toMatch(/\baction\s*=/);
    expect(page).not.toMatch(/fetch\s*\(|XMLHttpRequest|sendBeacon/);
    expect(page).not.toMatch(/<script|<iframe|https?:\/\//);
  });
  it('表單欄位全部停用', () => expect(page).toMatch(/<fieldset disabled/));
});
