/**
 * 連江縣重陽敬老禮金（2026／民國 115 年）。
 * 依據：《連江縣發放重陽禮金實施要點》官方全文（103-03-11 訂定，113-01-11 最新修訂；使用者於 2026-11-09 提供 docx，
 * 已存於 scripts/import/lienchiang-chongyang-rules-113.docx）。要點以「當年度」為準，每年適用，不需逐年公告金額。
 * 用法：npx tsx scripts/import-lienchiang.ts
 */
import fs from 'node:fs';

const MEDIA = 'https://n.yam.com/Article/20260925754635'; // 2026-09-25 媒體報導：縣長親送敬老禮金（佐證 115 年已依要點發放）
const RULES_PDF = 'https://www.matsu.gov.tw/upload/f-20231231144620.pdf'; // 連江縣發放重陽禮金實施要點（連江縣政府網站）
const ELIG = '重陽節（含當日）年滿 65 歲以上，且於當年 6 月 30 日前設籍連江縣。';
const ELIG100 = '當年度（12 月 31 日止）滿 100 歲以上，且於當年 6 月 30 日前設籍連江縣。';
const METHOD65 = '由各鄉公所派員或以轉帳方式，於重陽節二日前親自送達或撥入帳戶。';
const METHOD100 = '恭請縣長親自送達長者住所致敬祝賀。';

const items = [
  { name: '重陽敬老禮金（65–79 歲）', amount: 1500, a: [65, 79], method: METHOD65 },
  { name: '重陽敬老禮金（80–89 歲）', amount: 2000, a: [80, 89], method: METHOD65 },
  { name: '重陽敬老禮金（90–99 歲）', amount: 3000, a: [90, 99], method: METHOD65 },
  { name: '重陽敬老禮金（100 歲以上）', amount: 10000, a: [100, null], method: METHOD100 },
] as const;

const summary = '連江縣 115 年重陽敬老禮金：65–79 歲 1,500 元、80–89 歲 2,000 元、90–99 歲 3,000 元、100 歲以上 10,000 元。';
const fmt = (n: number) => `${n.toLocaleString('en-US')} 元`;

const data = {
  status: 'verified',
  county: 'lienchiang',
  year: 2026,
  summary,
  items: items.map((i) => ({
    name: i.name,
    eligibility: i.a[0] === 100 ? ELIG100 : ELIG,
    amount: fmt(i.amount),
    how_to_apply: i.method,
    deadline: null,
    deadline_date: null,
    rules: { min_age: i.a[0], max_age: i.a[1], amount_twd: i.amount },
  })),
  source_url: RULES_PDF,
  source_label: '連江縣發放重陽禮金實施要點',
  additional_sources: [MEDIA, 'https://www.nankan.gov.tw/chhtml/Detail/2221?mcid=113732'],
  verified_at: '2026-11-09',
  notes:
    '依官方《連江縣發放重陽禮金實施要點》全文（113-01-11 修訂）：65–79 歲 1,500、80–89 歲 2,000、90–99 歲 3,000、當年度（12/31 止）滿百歲 10,000 元；重陽節（含當日）年滿 65 歲且當年 6/30 前設籍；65–99 歲由鄉公所於重陽節二日前送達或轉帳，百歲由縣長親送。要點以「當年度」為準；2026-09-25 媒體報導縣長已發放 115 年禮金。2026-11-09 取代先前僅有媒體報導的版本。',
  faq: [
    { q: '連江縣重陽敬老禮金領多少？', a: summary, source_url: RULES_PDF },
    { q: '誰可以領連江縣的重陽敬老禮金？', a: ELIG, source_url: RULES_PDF },
    { q: '連江縣重陽敬老禮金怎麼領？', a: `${METHOD65}${METHOD100}`, source_url: RULES_PDF },
    { q: '連江縣重陽敬老禮金最晚什麼時候可以領？', a: '65–99 歲長者由各鄉公所於重陽節二日前送達或撥入帳戶；若沒有收到，建議儘早向戶籍地鄉公所確認。', source_url: RULES_PDF },
    { q: '連江縣 100 歲以上的長者怎麼領重陽敬老禮金？', a: `10,000 元。${METHOD100}`, source_url: RULES_PDF },
  ],
};
fs.writeFileSync('data/chongyang-bonus/lienchiang.json', JSON.stringify(data, null, 2) + '\n');
console.log('lienchiang written');
