import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** 設計規範守門（依 Arc 規範精簡）：用語意 token，不用色板類別；不用 em dash、全大寫、粗體、漸層。 */
const files: string[] = [];
(function walk(dir: string) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(astro|tsx|ts|css)$/.test(f.name)) files.push(p);
  }
})('src');

const scan = (re: RegExp, only?: RegExp) =>
  files
    .filter((f) => !only || only.test(f))
    .flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').map((l, i) => ({ f, n: i + 1, l })).filter(({ l }) => re.test(l)))
    .map(({ f, n, l }) => `${f}:${n} ${l.trim().slice(0, 80)}`);

describe('設計規範', () => {
  it('不使用 Tailwind 色板類別（改用語意 token：bg-surface、text-text-secondary、border-line…）', () => {
    expect(scan(/\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d/)).toEqual([]);
  });
  it('介面文字沒有 em dash（空值用「無」）', () => {
    expect(scan(/—/, /\.(astro|tsx)$/)).toEqual([]);
  });
  it('沒有全大寫、粗體、漸層、100vw', () => {
    expect(scan(/\buppercase\b|font-(bold|extrabold|black)\b|gradient|100vw/)).toEqual([]);
  });
  it('.astro／.tsx 內沒有原始色碼（theme-color meta 除外）', () => {
    expect(scan(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/, /\.(astro|tsx)$/).filter((x) => !x.includes('theme-color'))).toEqual([]);
  });
});
