import { describe, expect, it } from 'vitest';
import { loadAll } from '../src/lib/data';
import { COUNTIES } from '../src/lib/counties';
import { fixtureVerified, tmpData } from './helpers';

const now = new Date('2026-11-08');

describe('counties', () => {
  it('22 縣市、slug 唯一且為小寫連字號', () => {
    expect(COUNTIES).toHaveLength(22);
    expect(new Set(COUNTIES.map((c) => c.slug)).size).toBe(22);
    for (const c of COUNTIES) expect(c.slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });
});

describe('loadAll', () => {
  it('repo 內 data/ 目前全數通過', () => {
    expect(() => loadAll({ now })).not.toThrow();
  });
  it('合法的 verified 資料通過', () => {
    const dir = tmpData({ 'chongyang-bonus/taipei.json': fixtureVerified() });
    expect(loadAll({ dir, now })).toHaveLength(1);
  });
  it('verified_at 超過 365 天 → fail', () => {
    const dir = tmpData({ 'chongyang-bonus/taipei.json': fixtureVerified({ verified_at: '2025-11-01' }) });
    expect(() => loadAll({ dir, now })).toThrow(/超過 365 天/);
  });
  it('剛好 365 天仍通過', () => {
    const dir = tmpData({ 'chongyang-bonus/taipei.json': fixtureVerified({ verified_at: '2025-11-08' }) });
    expect(() => loadAll({ dir, now })).not.toThrow();
  });
  it('缺欄位（source_url）→ fail', () => {
    const f: Record<string, unknown> = fixtureVerified();
    delete f.source_url;
    const dir = tmpData({ 'chongyang-bonus/taipei.json': f });
    expect(() => loadAll({ dir, now })).toThrow(/source_url/);
  });
  it('item 缺 key（amount）→ fail；空字串也不行', () => {
    const bad = fixtureVerified({ items: [{ name: 'x', eligibility: null, how_to_apply: null, deadline: null }] });
    expect(() => loadAll({ dir: tmpData({ 'chongyang-bonus/taipei.json': bad }), now })).toThrow(/amount/);
    const empty = fixtureVerified({ items: [{ name: 'x', eligibility: '', amount: null, how_to_apply: null, deadline: null }] });
    expect(() => loadAll({ dir: tmpData({ 'chongyang-bonus/taipei.json': empty }), now })).toThrow(/空字串/);
  });
  it('FAQ 少於 3 則 → fail', () => {
    const dir = tmpData({ 'chongyang-bonus/taipei.json': fixtureVerified({ faq: [{ q: 'a', a: 'b' }] }) });
    expect(() => loadAll({ dir, now })).toThrow(/faq/);
  });
  it('檔名與 county 不一致 → fail', () => {
    const dir = tmpData({ 'chongyang-bonus/taoyuan.json': fixtureVerified() });
    expect(() => loadAll({ dir, now })).toThrow(/不一致/);
  });
  it('未知主題目錄 → fail', () => {
    const dir = tmpData({ 'unknown-topic/taipei.json': fixtureVerified() });
    expect(() => loadAll({ dir, now })).toThrow(/主題表/);
  });
  it('todo 不受 365 天限制，但不可帶 verified_at', () => {
    const todo = { status: 'todo', county: 'taipei', year: 2026, items: [], source_url: null, verified_at: null, notes: '' };
    expect(loadAll({ dir: tmpData({ 'chongyang-bonus/taipei.json': todo }), now })).toHaveLength(1);
    const bad = { ...todo, verified_at: '2026-01-01' };
    expect(() => loadAll({ dir: tmpData({ 'chongyang-bonus/taipei.json': bad }), now })).toThrow();
  });
});
