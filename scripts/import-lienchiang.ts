/**
 * 連江縣重陽敬老禮金（2026／民國 115 年）。
 * 注意：這一筆「不是」官方 115 年公告——連江縣政府 115 年公告查不到。
 * 依使用者指示（2026-11-08）先採媒體報導的金額，並在頁面明確標示；
 * 現行要點（109/6/1 修訂）的分級與媒體報導一致。待取得官方公告後請替換並移除 public_notes 的警語。
 * 用法：npx tsx scripts/import-lienchiang.ts
 */
import fs from 'node:fs';

const MEDIA = 'https://n.yam.com/Article/20260925754635'; // 2026-09-25 媒體報導：縣長親送敬老禮金
const RULES_PDF = 'https://www.matsu.gov.tw/upload/f-20231231144620.pdf'; // 連江縣發放重陽禮金實施要點（109/6/1 修訂）
const ELIG = '重陽節（2026-10-18）當日年滿 65 歲，且於 115 年 6 月 30 日前已設籍連江縣。';
const METHOD65 = '由各鄉公所於重陽節前派員送達，或以轉帳方式撥入帳戶。';
const METHOD100 = '年滿 100 歲者由縣長親送住所。';

const items = [
  { name: '重陽敬老禮金（65–79 歲）', amount: 1500, a: [65, 79], method: METHOD65 },
  { name: '重陽敬老禮金（80–89 歲）', amount: 2000, a: [80, 89], method: METHOD65 },
  { name: '重陽敬老禮金（90–99 歲）', amount: 3000, a: [90, 99], method: METHOD65 },
  { name: '重陽敬老禮金（100 歲以上）', amount: 10000, a: [100, null], method: METHOD100 },
] as const;

const summary = '連江縣 115 年重陽敬老禮金（媒體報導，官方公告待確認）：65–79 歲 1,500 元、80–89 歲 2,000 元、90–99 歲 3,000 元、100 歲以上 10,000 元。';
const fmt = (n: number) => `${n.toLocaleString('en-US')} 元`;

const data = {
  status: 'verified',
  county: 'lienchiang',
  year: 2026,
  summary,
  items: items.map((i) => ({
    name: i.name,
    eligibility: ELIG,
    amount: fmt(i.amount),
    how_to_apply: i.method,
    deadline: null,
    deadline_date: null,
    rules: { min_age: i.a[0], max_age: i.a[1], amount_twd: i.amount },
  })),
  source_url: MEDIA,
  additional_sources: [RULES_PDF],
  verified_at: '2026-11-08',
  notes:
    '【非官方 115 年公告】連江縣政府 115 年重陽禮金公告查不到（主站 www.matsu.gov.tw 對本環境拒絕連線；法規系統 law.matsu.gov.tw 掃描 GL000001–700 未找到要點本文，僅在 GL000616 相關法規清單提到名稱）。' +
    ' 金額、年齡分級與設籍日期取自 2026-09-25 媒體報導（縣長已發放 115 年禮金），並與使用者提供資料中記載的現行要點（109/6/1 修訂；65–79 歲 1,500、80–89 歲 2,000、90–99 歲 3,000、當年度滿百歲 10,000）一致。' +
    ' 發放時間、領取期限、補發方式未取得，留 null。依使用者 2026-11-08 指示先採用；取得官方公告後請替換。',
  public_notes: [
    '連江縣政府 115 年的官方公告尚未找到，本頁金額與資格來自媒體報導，並與現行要點的分級一致；請向縣府社會處或戶籍地鄉公所確認後再依此行動。',
    '發放時間與補領期限官方資料未取得，待查證。',
  ],
  faq: [
    { q: '連江縣重陽敬老禮金領多少？', a: summary, source_url: MEDIA },
    { q: '誰可以領連江縣的重陽敬老禮金？', a: `${ELIG}（資格取自媒體報導，官方公告待確認。）`, source_url: MEDIA },
    { q: '連江縣重陽敬老禮金怎麼領？', a: `${METHOD65}${METHOD100}`, source_url: MEDIA },
    { q: '連江縣重陽敬老禮金最晚什麼時候可以領？', a: '官方頁面沒有寫明確的截止日，待查證。', source_url: MEDIA },
    { q: '連江縣 100 歲以上的長者怎麼領重陽敬老禮金？', a: `10,000 元。${METHOD100}`, source_url: MEDIA },
  ],
};
fs.writeFileSync('data/chongyang-bonus/lienchiang.json', JSON.stringify(data, null, 2) + '\n');
console.log('lienchiang written');
