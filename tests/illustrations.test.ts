import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ILLUSTRATIONS, MAX_ILLUSTRATIONS } from '../src/lib/illustrations';

describe('いらすとや 素材點數', () => {
  it(`不重複插圖不超過 ${MAX_ILLUSTRATIONS} 點（超過需有償授權）`, () => {
    const files = fs.readdirSync('src/assets/illust').filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f));
    expect(files.length).toBeLessThanOrEqual(MAX_ILLUSTRATIONS);
    expect(Object.keys(ILLUSTRATIONS).length).toBeLessThanOrEqual(MAX_ILLUSTRATIONS);
  });
  it('登記的插圖都有 alt', () => {
    for (const v of Object.values(ILLUSTRATIONS)) expect(v.alt.length).toBeGreaterThan(3);
  });
});
