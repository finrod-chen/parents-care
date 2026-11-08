import { describe, expect, it } from 'vitest';
import { robotsTxt } from '../src/pages/robots.txt';

describe('robots.txt', () => {
  const t = robotsTxt();
  it('只使用標準指令（Lighthouse 認得）', () => {
    for (const line of t.split('\n')) {
      if (line.trim() === '' || line.startsWith('#')) continue;
      expect(line, line).toMatch(/^(User-agent|Allow|Disallow|Sitemap): /);
    }
  });
  it('一般爬蟲允許、含 sitemap', () => {
    expect(t).toMatch(/User-agent: \*\nAllow: \//);
    expect(t).toContain('Sitemap: https://bamaling.tw/sitemap-index.xml');
  });
  it('不封鎖 Googlebot / Bingbot', () => {
    expect(t).not.toMatch(/User-agent: (Googlebot|Bingbot)\b/);
  });
  it('AI 訓練爬蟲被封鎖', () => expect(t).toMatch(/User-agent: GPTBot\nDisallow: \//));
});
