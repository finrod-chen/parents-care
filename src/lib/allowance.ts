import type { Allowance } from './national';
import type { CountySlug } from './counties';

export type AllowanceData = Pick<Allowance, 'age_min' | 'income' | 'assets' | 'amounts' | 'min_living_cost'>;

export type RealEstate = 'ok' | 'over' | 'unknown';
export type CheckInput = {
  county: CountySlug;
  age: number | null;
  residesAtRegistered: boolean; // 實際居住於戶籍所在地的縣市
  overseasOk: boolean; // 最近一年居住國內超過 183 日
  notInCare: boolean; // 未接受政府公費收容安置
  notInPrison: boolean; // 未入獄服刑、羈押或依法拘禁
  listedLowIncome: boolean; // 列冊低收入戶或中低收入戶（免審查收入與財產）
  household: number; // 家庭應計算人口數
  totalIncome: number | null; // 家庭每月總收入
  deposits: number | null; // 全家存款本金、投資與有價證券合計
  realEstate: RealEstate;
};

export type Status = 'pass' | 'fail' | 'unknown' | 'skip';
export type CheckItem = { id: string; label: string; status: Status; detail: string };
export type CheckResult = {
  items: CheckItem[];
  verdict: 'likely' | 'unlikely' | 'incomplete';
  tier: 1 | 2 | null;
  amount: number | null;
  perCapita: number | null;
  area: string;
  minLiving: number;
  effectiveCap: number;
  tier1Cut: number;
  depositsLimit: number;
};

const fmt = (n: number) => `${Math.round(n * 100) / 100 === Math.round(n) ? Math.round(n).toLocaleString('en-US') : n.toLocaleString('en-US')} 元`;

/** 初步檢核（辦法第 2、5 條）。不判斷土地房屋「合理價值」（各縣市自訂，第 4 條）。 */
export function checkAllowance(d: AllowanceData, i: CheckInput): CheckResult {
  const area = d.min_living_cost.find((m) => m.counties.includes(i.county));
  if (!area) throw new Error(`找不到縣市最低生活費：${i.county}`);
  const minLiving = area.twd;
  const cap25 = minLiving * d.income.max_multiple_of_min_living;
  const capConsumption = d.income.consumption_per_capita_monthly_twd * d.income.consumption_multiple;
  const effectiveCap = Math.min(cap25, capConsumption);
  const tier1Cut = area.tier1_cut_twd ?? minLiving * d.income.tier1_below_multiple;
  const tier1Inclusive = area.tier1_cut_inclusive ?? false;
  const n = Math.max(1, Math.floor(i.household || 1));
  const depositsLimit = d.assets.deposits_single_twd + d.assets.deposits_per_extra_person_twd * (n - 1);

  const items: CheckItem[] = [];
  const add = (id: string, label: string, status: Status, detail: string) => items.push({ id, label, status, detail });

  add('age', `年滿 ${d.age_min} 歲`, i.age === null ? 'unknown' : i.age >= d.age_min ? 'pass' : 'fail', i.age === null ? '請輸入年齡' : `${i.age} 歲`);
  add('residence', '實際居住在戶籍所在地的縣市', i.residesAtRegistered ? 'pass' : 'fail', i.residesAtRegistered ? '符合' : '不符合');
  add('overseas', '最近一年居住國內超過 183 日', i.overseasOk ? 'pass' : 'fail', i.overseasOk ? '符合' : '不符合');
  add('care', '未接受政府公費收容安置', i.notInCare ? 'pass' : 'fail', i.notInCare ? '符合' : '不符合');
  add('prison', '未入獄服刑、羈押或依法拘禁', i.notInPrison ? 'pass' : 'fail', i.notInPrison ? '符合' : '不符合');

  let perCapita: number | null = null;
  let tier: 1 | 2 | null = null;

  if (i.listedLowIncome) {
    add('income', '家庭總收入', 'skip', '列冊低收入戶、中低收入戶免審查收入與財產');
    add('deposits', '存款、投資與有價證券', 'skip', '免審查');
    add('realestate', '土地與房屋價值', 'skip', '免審查');
    tier = 1;
  } else {
    if (i.totalIncome === null) {
      add('income', '家庭每人每月平均收入', 'unknown', '請輸入家庭每月總收入');
    } else {
      perCapita = i.totalIncome / n;
      const ok = i.totalIncome <= effectiveCap * n;
      add('income', '家庭每人每月平均收入', ok ? 'pass' : 'fail', `平均 ${fmt(perCapita)}；上限 ${fmt(effectiveCap)}（${area.area}最低生活費 ${fmt(minLiving)} 的 ${d.income.max_multiple_of_min_living} 倍為 ${fmt(cap25)}，與消費支出 ${d.income.consumption_multiple} 倍 ${fmt(capConsumption)} 取低者）`);
      if (ok) tier = (tier1Inclusive ? i.totalIncome <= tier1Cut * n : i.totalIncome < tier1Cut * n) ? 1 : 2;
    }
    add('deposits', `全家存款、投資與有價證券（${n} 人，上限 ${fmt(depositsLimit)}）`, i.deposits === null ? 'unknown' : i.deposits <= depositsLimit ? 'pass' : 'fail', i.deposits === null ? '請輸入合計金額' : fmt(i.deposits));
    add('realestate', '土地與房屋價值未超過縣市標準', i.realEstate === 'ok' ? 'pass' : i.realEstate === 'over' ? 'fail' : 'unknown', i.realEstate === 'unknown' ? '各縣市標準不同，本工具不判斷，請向戶籍地公所確認' : i.realEstate === 'ok' ? '你已自行確認' : '超過標準');
  }

  const anyFail = items.some((x) => x.status === 'fail');
  const missing = items.some((x) => x.status === 'unknown' && x.id !== 'realestate');
  const verdict = anyFail ? 'unlikely' : missing ? 'incomplete' : 'likely';
  const amount = verdict === 'likely' && tier ? (tier === 1 ? d.amounts.tier1_twd : d.amounts.tier2_twd) : null;
  return { items, verdict, tier: verdict === 'likely' ? tier : null, amount, perCapita, area: area.area, minLiving, effectiveCap, tier1Cut, depositsLimit };
}
