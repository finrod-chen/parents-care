import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ADSENSE_CLIENT, ADSENSE_SRC } from '../src/lib/site';

const base = fs.readFileSync('src/layouts/Base.astro', 'utf8');

describe('AdSense', () => {
  it('發佈商 ID 與腳本網址', () => {
    expect(ADSENSE_CLIENT).toBe('ca-pub-0107538119751408');
    expect(ADSENSE_SRC).toBe('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0107538119751408');
  });
  it('只在可被索引的頁面載入（noindex 骨架頁不載入）', () => {
    expect(base).toMatch(/\{!noindex && <script is:inline async src=\{ADSENSE_SRC\} crossorigin="anonymous"><\/script>\}/);
  });
  it('ads.txt 內容正確（pub- 前綴、DIRECT、Google 認證 ID）', () => {
    const t = fs.readFileSync('public/ads.txt', 'utf8').trim();
    expect(t).toBe('google.com, pub-0107538119751408, DIRECT, f08c47fec0942fa0');
  });
  it('robots.txt 不封鎖 AdSense 爬蟲 Mediapartners-Google', async () => {
    const { robotsTxt } = await import('../src/pages/robots.txt');
    expect(robotsTxt()).not.toMatch(/Mediapartners-Google/);
  });
});
