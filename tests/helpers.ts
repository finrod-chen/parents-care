import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** 測試用假資料（數字純屬測試，不可進 data/） */
export const fixtureVerified = (over: Record<string, unknown> = {}) => ({
  status: 'verified',
  county: 'taipei',
  year: 2026,
  summary: '測試用摘要。',
  items: [
    { name: '測試項目', eligibility: '測試資格', amount: '1,000 元', how_to_apply: null, deadline: null, rules: { min_age: 65, max_age: null, amount_twd: 1000 } },
  ],
  source_url: 'https://example.gov.tw/test',
  verified_at: '2026-10-01',
  notes: '',
  faq: [1, 2, 3].map((i) => ({ q: `問${i}`, a: `答${i}` })),
  ...over,
});

export function tmpData(files: Record<string, unknown>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-'));
  for (const [rel, obj] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, typeof obj === 'string' ? obj : JSON.stringify(obj));
  }
  return dir;
}
