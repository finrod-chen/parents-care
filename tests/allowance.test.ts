import { describe, expect, it } from 'vitest';
import { checkAllowance, type CheckInput } from '../src/lib/allowance';
import { loadNational } from '../src/lib/national';
import { COUNTIES } from '../src/lib/counties';

const { allowance: d } = loadNational();
const base: CheckInput = {
  county: 'taipei', age: 70, residesAtRegistered: true, overseasOk: true, notInCare: true, notInPrison: true,
  listedLowIncome: false, household: 1, totalIncome: 20000, deposits: 100000, realEstate: 'ok',
};

describe('資料', () => {
  it('22 縣市都有最低生活費', () => {
    for (const c of COUNTIES) expect(() => checkAllowance(d, { ...base, county: c.slug })).not.toThrow();
  });
  it('各區 115 年最低生活費（衛福部一覽表）', () => {
    const m = Object.fromEntries(d.min_living_cost.map((x) => [x.area, x.twd]));
    expect(m).toMatchObject({ 臺北市: 20744, 新北市: 17750, 桃園市: 17186, 臺中市: 16431, 臺南市: 15515, 高雄市: 16970, 臺灣省: 15515, 福建省: 15173 });
  });
  it('消費支出 26,640（113 年）', () => expect(d.income.consumption_per_capita_monthly_twd).toBe(26640));
});

describe('checkAllowance', () => {
  it('台北單身、每月 20,000 元：低於 1.5 倍最低生活費 → 第一級 8,329', () => {
    const r = checkAllowance(d, base);
    expect(r.verdict).toBe('likely');
    expect(r.tier).toBe(1);
    expect(r.amount).toBe(8329);
  });
  it('台北單身、每月 35,000 元：介於 1.5 倍與上限之間 → 第二級 4,164', () => {
    const r = checkAllowance(d, { ...base, totalIncome: 35000 });
    expect(r.tier).toBe(2);
    expect(r.amount).toBe(4164);
  });
  it('台北上限是消費支出 1.5 倍 39,960（低於 2.5 倍 51,860）', () => {
    const r = checkAllowance(d, base);
    expect(r.effectiveCap).toBe(39960);
    expect(checkAllowance(d, { ...base, totalIncome: 39960 }).verdict).toBe('likely');
    expect(checkAllowance(d, { ...base, totalIncome: 39961 }).verdict).toBe('unlikely');
  });
  it('臺灣省上限是 2.5 倍最低生活費 38,787.5（低於 39,960）', () => {
    const r = checkAllowance(d, { ...base, county: 'miaoli' });
    expect(r.effectiveCap).toBe(38787.5);
  });
  it('多人家庭按人頭平均', () => {
    expect(checkAllowance(d, { ...base, household: 2, totalIncome: 79920 }).verdict).toBe('likely');
    expect(checkAllowance(d, { ...base, household: 2, totalIncome: 79921 }).verdict).toBe('unlikely');
  });
  it('存款上限：單身 250 萬，每增 1 人加 25 萬', () => {
    expect(checkAllowance(d, { ...base, deposits: 2500000 }).verdict).toBe('likely');
    expect(checkAllowance(d, { ...base, deposits: 2500001 }).verdict).toBe('unlikely');
    expect(checkAllowance(d, { ...base, household: 3, totalIncome: 30000, deposits: 3000000 }).depositsLimit).toBe(3000000);
  });
  it('未滿 65 歲不符', () => expect(checkAllowance(d, { ...base, age: 64 }).verdict).toBe('unlikely'));
  it('列冊低收／中低收入戶免審查收入與財產', () => {
    const r = checkAllowance(d, { ...base, listedLowIncome: true, totalIncome: 999999, deposits: 99999999, realEstate: 'over' });
    expect(r.verdict).toBe('likely');
    expect(r.amount).toBe(8329);
  });
  it('缺資料不下結論；不動產未確認不阻擋但會標示', () => {
    expect(checkAllowance(d, { ...base, totalIncome: null }).verdict).toBe('incomplete');
    const r = checkAllowance(d, { ...base, realEstate: 'unknown' });
    expect(r.verdict).toBe('likely');
    expect(r.items.find((x) => x.id === 'realestate')?.status).toBe('unknown');
  });
});

describe('臺北市第一級分界採市府公告 29,635（含）', () => {
  it('29,635 以下 → 第一級；超過 → 第二級', () => {
    expect(checkAllowance(d, { ...base, totalIncome: 29635 }).tier).toBe(1);
    expect(checkAllowance(d, { ...base, totalIncome: 29636 }).tier).toBe(2);
  });
  it('其他縣市仍用法定公式（未達 1.5 倍）', () => {
    const cut = 17750 * 1.5;
    expect(checkAllowance(d, { ...base, county: 'new-taipei', totalIncome: cut - 1 }).tier).toBe(1);
    expect(checkAllowance(d, { ...base, county: 'new-taipei', totalIncome: cut }).tier).toBe(2);
  });
  it('消費支出已有一手來源', () => expect(d.income.consumption_source_status).toBe('primary'));
});
