import type { CountySlug } from './counties';
import { countyName } from './counties';
import type { Compare } from './schema';

/** 2026 年的「4 萬 4,000 元」寫法 */
export function twd(n: number): string {
  const wan = Math.floor(n / 10000);
  const rest = n % 10000;
  if (wan === 0) return `${rest.toLocaleString('en-US')} 元`;
  return rest === 0 ? `${wan} 萬元` : `${wan} 萬 ${rest.toLocaleString('en-US')} 元`;
}

export interface CompareRow { county: CountySlug; compare: Compare }
type Key = keyof Compare;

export interface Standing {
  key: Key;
  value: number | null;
  /** 有可比較金額的縣市數 */
  count: number;
  /** 名次（金額由高到低，同額並列）；確認沒有此方案時是 null */
  rank: number | null;
  /** 與本縣市同額的其他縣市數 */
  ties: number;
  max: number;
  maxCounties: CountySlug[];
  median: number;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2);
}

const num = (v: Compare[Key]): number | null => (typeof v === 'number' ? v : null);

/** 本縣市該欄是 null（有方案但無可比數字）→ 不比較，回傳 null */
export function standing(rows: CompareRow[], county: CountySlug, key: Key): Standing | null {
  const raw = rows.find((r) => r.county === county)?.compare[key];
  if (raw === undefined || raw === null) return null;
  const have = rows.filter((r) => num(r.compare[key]) !== null);
  if (have.length < 2) return null;
  const vals = have.map((r) => num(r.compare[key])!);
  const max = Math.max(...vals);
  const mine = num(raw);
  return {
    key,
    value: mine,
    count: have.length,
    rank: mine === null ? null : vals.filter((v) => v > mine).length + 1,
    ties: mine === null ? 0 : vals.filter((v) => v === mine).length - 1,
    max,
    maxCounties: have.filter((r) => num(r.compare[key]) === max).map((r) => r.county),
    median: median(vals),
  };
}

const LABEL: Record<Key, string> = {
  general_full_twd: '一般長者方案',
  welfare_full_twd: '低收／中低收等福利身分方案',
};

/** 產生一句比較敘述（全部由資料計算，不手寫） */
export function standingSentence(s: Standing, county: CountySlug): string {
  const name = countyName(county);
  const label = LABEL[s.key];
  const top = s.maxCounties.map(countyName).join('、');
  if (s.value === null) {
    return `${label}：${name}沒有這類方案。有公布全口金額的 ${s.count} 個縣市中，最高是${top}的 ${twd(s.max)}。`;
  }
  const tie = s.ties > 0 ? `（與另外 ${s.ties} 個縣市同額）` : '';
  const vsMedian =
    s.value > s.median ? `比各縣市中位數（${twd(s.median)}）多 ${twd(s.value - s.median)}` :
    s.value < s.median ? `比各縣市中位數（${twd(s.median)}）少 ${twd(s.median - s.value)}` :
    `剛好等於各縣市中位數`;
  const head = s.rank === 1 ? `是 ${s.count} 個有公布全口金額的縣市中最高的${tie}` : `在 ${s.count} 個有公布全口金額的縣市中排第 ${s.rank}${tie}，最高是${top}的 ${twd(s.max)}`;
  return `${label}：${name}全口活動假牙最高補助 ${twd(s.value)}，${head}；${vsMedian}。`;
}

export function compareSentences(rows: CompareRow[], county: CountySlug): string[] {
  const out: string[] = [];
  for (const key of ['general_full_twd', 'welfare_full_twd'] as Key[]) {
    const s = standing(rows, county, key);
    if (s) out.push(standingSentence(s, county));
  }
  return out;
}
