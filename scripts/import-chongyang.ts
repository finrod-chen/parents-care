/**
 * 一次性匯入：把整理好的 scripts/import/chongyang-bonus-2026-all.json 轉成 data/chongyang-bonus/*.json。
 * 原則：金額一律來自來源檔（amount_twd），年齡級距 rules 另以明確表格標注並與名稱人工核對；
 * 來源檔寫「待查證」的欄位一律轉成 null。FAQ 的答案全部取自該縣市的資料欄位，不補充任何來源檔沒有的事實。
 * 用法：npx tsx scripts/import-chongyang.ts
 */
import fs from 'node:fs';
import { countyName } from '../src/lib/counties';

type SrcItem = { name: string; eligibility: string; amount_twd: number | null; method: string; deadline: string; extra?: string };
type SrcCounty = { county: string; year: number; items: SrcItem[]; source_url: string; additional_sources?: string[]; verified_at: string; notes: string };
const src = JSON.parse(fs.readFileSync('scripts/import/chongyang-bonus-2026-all.json', 'utf8')) as { counties: SrcCounty[] };

/** [min_age, max_age]：僅一般（非原住民）長者的年齡級距；null = 此項不參與年齡試算（需另符合其他條件或非現金） */
const AGE: Record<string, ([number, number | null] | null)[]> = {
  keelung: [[65, 99], [100, null]],
  taipei: [[65, 84], [85, 98], [99, null]],
  'new-taipei': [[65, 79], [80, 89], [90, 99], [100, null]],
  taoyuan: [[65, 98], [99, null]],
  'hsinchu-city': [[65, 99], [100, null]],
  'hsinchu-county': [null, [100, null]],
  miaoli: [[65, null]],
  taichung: [[65, 89], [90, 94], [95, 99], [100, null]],
  changhua: [[65, 99], null, null, null, [100, null]],
  nantou: [null, [65, 99], [100, null]],
  yunlin: [[65, 69], [70, 79], [80, 89], [90, 99], [100, null]],
  'chiayi-city': [[65, 79], [80, 89], [90, 99], [100, null]],
  'chiayi-county': [[65, 89], [90, 99], [100, null]],
  tainan: [[65, 99], [100, null]],
  kaohsiung: [[65, 89], [90, 99], [100, null]],
  pingtung: [[90, 99], [100, null]],
  yilan: [[90, 99], [100, null]],
  hualien: [[65, 84], [85, 89], [90, 99], [100, null]],
  taitung: [[65, 99], [100, null]],
  penghu: [[65, 79], [80, 89], [90, 99], [100, null]],
  kinmen: [null, null, null],
};

/**
 * 各項目「最後可領／可申請日」（含補發）。只填官方文字寫得出明確日期的；null = 待查證，不推算。
 * 例：台北取自「依自治條例第6條得於115/12/31前申請補發」；彰化福利身分戶取自「福利身分差額補領截止116/2/26」。
 */
const DEADLINE: Record<string, (string | null)[]> = {
  keelung: [null, null],
  taipei: ['2026-12-31', '2026-12-31', '2026-12-31'],
  'new-taipei': ['2026-12-31', '2026-12-31', '2026-12-31', '2026-12-31'],
  taoyuan: [null, null],
  'hsinchu-city': [null, null],
  'hsinchu-county': ['2026-09-30', null],
  miaoli: ['2027-01-07'],
  taichung: ['2026-11-30', '2026-11-30', '2026-11-30', '2026-11-30'],
  changhua: ['2026-12-18', '2027-02-26', '2027-02-26', '2027-02-26', null],
  nantou: [null, null, null],
  yunlin: ['2026-11-02', '2026-11-02', '2026-11-02', '2026-11-02', '2026-11-02'],
  'chiayi-city': [null, null, null, null],
  'chiayi-county': [null, null, null],
  tainan: ['2026-12-11', '2026-12-11'],
  kaohsiung: ['2026-12-31', '2026-12-31', null],
  pingtung: [null, null],
  yilan: ['2026-10-18', '2026-10-18'],
  hualien: ['2026-11-27', '2026-11-27', '2026-11-27', null],
  taitung: ['2026-11-02', null],
  penghu: ['2026-11-12', '2026-11-12', '2026-11-12', '2026-11-12'],
  kinmen: [null, null, null],
};

const SUMMARY: Record<string, string> = {
  'hsinchu-county': '新竹縣沒有全縣普發的重陽敬老禮金；115 年有申請制、需通過排富審查的敬老禮金 10,000 元（65 歲以上、設籍滿 10 年），百歲人瑞另有重陽祝賀禮金，金額待查證。',
  changhua: '彰化縣 115 年重陽敬老禮金：一般戶 65–99 歲 1,000 元；符合福利身分者 65–79 歲 3,000 元、80–89 歲 6,000 元、90–99 歲 9,000 元；百歲人瑞 10,000 元。',
  pingtung: '屏東縣府的重陽敬老慰問金只發 90 歲以上：90–99 歲 2,000 元、100 歲以上 10,000 元；65–89 歲縣府沒有這項，部分鄉鎮市公所另有自辦（待查證）。',
  yilan: '宜蘭縣府的重陽節敬老禮金發給 90–99 歲 2,000 元（原住民 80–89 歲）、100 歲以上 20,000 元；65–89 歲（非原住民）縣府不發，部分鄉鎮市另有加碼。',
  kinmen: '金門縣重陽節不發現金，改送 65 歲以上長者敬老酒禮盒一份（需符合設籍條件）；烈嶼鄉與 90 歲以上加贈項目的細節待查證。',
};

const PUBLIC_NOTES: Record<string, string[]> = {
  keelung: ['基隆市 115 年另有一次性的「長樂65專案」敬老禮金 6,500 元，與重陽慰問金是不同制度。'],
  taipei: ['年齡以 115 年 12 月 31 日前是否年滿認定；試算以目前年齡估算，實際以公告為準。', '匯款僅限長者本人帳戶。'],
  'new-taipei': ['99 歲加贈禮品的內容待查證。', '可用身分證字號到新北市社會局系統查詢領取方式。'],
  'hsinchu-city': ['百歲人瑞的禮金金額，不同官方來源說法不一，已留待查證。'],
  'hsinchu-county': ['新竹縣長者 94 年 7 月 31 日前設籍者，另有每月發放的敬老福利津貼，屬不同制度，本頁未收錄。', '部分鄉鎮市公所另有自辦重陽禮金，未逐一核對。'],
  miaoli: ['縣府已宣布 116 年起敬老禮金改為春節一次發放、放寬為當年度滿 65 歲；116 年起可能不再有重陽節這一筆，詳情待公告。'],
  taichung: ['65–99 歲各級金額均含敬老活動代金 350 元。'],
  changhua: ['福利身分戶指重陽當月已核定為本縣低收入戶、中低收入戶、領有身障生活補助或中低收入老人生活津貼者。', '部分鄉鎮市公所另有加碼，其他鄉鎮待查證。'],
  nantou: ['各鄉鎮市另有加碼，待查證。'],
  yunlin: ['各鄉鎮市公所另有加碼，待查證。'],
  tainan: ['115 年由 1,300 元調高為 1,500 元（市府社會局公告）。'],
  pingtung: ['縣府只發 90 歲以上；65–89 歲請洽戶籍地鄉鎮市公所是否自辦。'],
  yilan: ['各鄉鎮市另有自辦加碼，可與縣府的禮金累計，其中宜蘭市、南澳鄉的 115 年金額已核對官方頁，其餘鄉鎮待查證。'],
  hualien: ['115 年 65–84 歲由 600 元調高為 1,000 元。', '現金領取日期各鄉鎮市公所不同。'],
  taitung: ['115 年起縣府禮金由 500 元提高為 2,000 元。', '臺東市公所另加發 1,000 元；其他鄉鎮待查證。'],
  penghu: ['馬公市等鄉市公所另有加碼，115 年金額待查證。'],
  kinmen: ['金門縣另有按月發放的戰地軍管時期老人慰助金，屬不同制度，本頁未收錄。'],
};

const nul = (v: string | undefined | null) => (v === undefined || v === null || v.trim() === '' || v.trim() === '待查證' ? null : v.trim());
const twd = (n: number) => `${n.toLocaleString('en-US')} 元`;
const range = (a: number, b: number | null) => (b === null ? `${a} 歲以上` : `${a}–${b} 歲`);

const out: string[] = [];
for (const c of src.counties) {
  const name = countyName(c.county as never);
  const age = AGE[c.county];
  const file = `data/chongyang-bonus/${c.county}.json`;

  // 沒有任何已查證內容（全為待查證）→ 維持 todo
  const hasReal = c.items.some((i) => i.amount_twd !== null || nul(i.eligibility) || nul(i.method) || nul(i.deadline));
  if (!hasReal) {
    fs.writeFileSync(file, JSON.stringify({ status: 'todo', county: c.county, year: c.year, items: [], source_url: null, verified_at: null, notes: c.notes }, null, 2) + '\n');
    out.push(`${c.county}: todo`);
    continue;
  }

  let prev: SrcItem | undefined;
  const items = c.items.map((it, idx) => {
    const method = nul(/^同(上|一般長者)$/.test(it.method.trim()) && prev ? prev.method : it.method);
    const deadline = nul(/^同(上|一般長者)$/.test(it.deadline.trim()) && prev ? prev.deadline : it.deadline);
    prev = { ...it, method: method ?? '待查證', deadline: deadline ?? '待查證' };
    const extra = nul(it.extra);
    const amount = it.amount_twd !== null ? twd(it.amount_twd) + (extra ? `；${extra}` : '') : extra;
    const a = age?.[idx];
    const item: Record<string, unknown> = {
      name: it.name,
      eligibility: nul(it.eligibility),
      amount,
      how_to_apply: method,
      deadline,
      deadline_date: DEADLINE[c.county]?.[idx] ?? null,
    };
    if (a) item.rules = { min_age: a[0], max_age: a[1], amount_twd: it.amount_twd };
    return item;
  });

  // 摘要：有 rules 的項目自動組出，特殊縣市用人工撰寫的 SUMMARY
  const parts = c.items.flatMap((it, i) => {
    const a = age?.[i];
    return a ? [`${range(a[0], a[1])}${it.amount_twd === null ? '金額待查證' : ` ${twd(it.amount_twd)}`}`] : [];
  });
  const summary = SUMMARY[c.county] ?? `${name} 115 年重陽敬老禮金：${parts.join('、')}。`;

  // ---- 簡單 FAQ：最多 5 則，答案全部取自本縣市資料欄位 ----
  const first = c.items[0]!;
  const mins = c.items.flatMap((_, i) => (age?.[i] ? [age[i]![0]] : []));
  const dates = (DEADLINE[c.county] ?? []).filter((d): d is string => !!d).sort();
  const lastItem = c.items[c.items.length - 1]!;
  const lastAge = age?.[c.items.length - 1];
  const elig = nul(first.eligibility);
  const faq: { q: string; a: string; source_url: string }[] = [
    { q: `${name}重陽敬老禮金領多少？`, a: summary, source_url: c.source_url },
    {
      q: `誰可以領${name}的重陽敬老禮金？`,
      a: `${mins.length ? `一般長者 ${Math.min(...mins)} 歲起可領。` : ''}設籍等詳細條件：${elig ?? '官方頁面未載明，待查證'}`,
      source_url: c.source_url,
    },
    { q: `${name}重陽敬老禮金怎麼領？`, a: nul(first.method) ?? '官方頁面未載明，待查證。', source_url: c.source_url },
    {
      q: `${name}重陽敬老禮金最晚什麼時候可以領？`,
      a: dates.length
        ? `最晚可領到 ${dates[dates.length - 1]}（含補發；各項目期限略有不同，請看各項目的「申請期限」）。`
        : `官方頁面沒有寫明確的截止日，待查證。${nul(first.deadline) ? `官方原文：${nul(first.deadline)}` : ''}`,
      source_url: c.source_url,
    },
  ];
  if (lastAge && lastAge[0] >= 99) {
    faq.push({
      q: `${name} ${lastAge[0]} 歲以上的長者怎麼領重陽敬老禮金？`,
      a: `${lastItem.amount_twd === null ? '金額待查證' : twd(lastItem.amount_twd)}。${nul(lastItem.method) ?? '領取方式待查證。'}`,
      source_url: c.source_url,
    });
  }
  for (const f of faq) f.a = f.a.replace(/。。/g, '。').replace(/([^。！？])$/, '$1。');

  const data: Record<string, unknown> = {
    status: 'verified',
    county: c.county,
    year: c.year,
    summary,
    items,
    source_url: c.source_url,
    verified_at: c.verified_at,
    notes: c.notes,
    faq,
  };
  if (c.additional_sources?.length) data.additional_sources = c.additional_sources;
  if (PUBLIC_NOTES[c.county]) data.public_notes = PUBLIC_NOTES[c.county];
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  out.push(`${c.county}: verified (${items.length} 項, rules ${items.filter((i) => i.rules).length})`);
}
console.log(out.join('\n'));
