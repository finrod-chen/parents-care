/**
 * 一次性匯入：老人假牙補助、敬老卡（2026／民國 115 年）。
 * 來源：scripts/import/denture-senior-2026-detailed.json（主）、…-compact.json（交叉核對用）。
 * 原則同 import-chongyang.ts：不補充來源檔沒有的事實；null 保持 null（頁面顯示「待查證」）。
 * 用法：npx tsx scripts/import-denture-senior.ts
 */
import fs from 'node:fs';
import { COUNTIES } from '../src/lib/counties';

type Source = { 名稱: string; 網址: string; 更新?: string; 日期?: string; 備註?: string; 狀態?: string };
type Policy = { 政策: string; 資格: string | null; 額度: string | null; 申請: string | null; 限制: string | null; 來源: Source[] };
type Card = { 政策: string; 資格: string | null; 福利: string | null; 申請: string | null; 限制: string | null; 來源: Source[] };
type Row = { 名稱: string; 老人假牙補助: Policy[]; 敬老卡: Card };
const src = JSON.parse(fs.readFileSync('scripts/import/denture-senior-2026-detailed.json', 'utf8')) as { 縣市: Row[]; 資料截點: string };

const VERIFIED_AT = '2026-11-08';
const slugOf = (name: string) => COUNTIES.find((c) => c.name === name.replace('臺', '台'))?.slug;

// 去除重複縣市（詳細版金門縣出現兩次，取第一筆）
const seen = new Set<string>();
const rows = src.縣市.filter((r) => !seen.has(r.名稱) && !!seen.add(r.名稱));

// 連江縣第二個方案實為臺東縣的中央計畫（資格寫「設籍臺東縣」、來源為臺東縣社會處），疑似誤植，不匯入；精簡版亦無此項。
const EXCLUDE_POLICY: Record<string, (p: Policy) => boolean> = {
  連江縣: (p) => p.來源.some((s) => s.網址.includes('taitung.gov.tw')),
};

/** 假牙：各方案的期限說明與最後日期（只填文字寫得出明確日期者；額滿／用罄不當作日期） */
type Dl = { text: string; date: string | null } | null;
const DENTURE_DL: Record<string, Dl[]> = {
  keelung: [{ text: '115 年度計畫期間至 2026-12-31', date: '2026-12-31' }],
  taoyuan: [{ text: '計畫涵蓋 2025 至 2027 年（至 2027-12-31），經費用罄依規定辦理', date: '2027-12-31' }, null],
  hualien: [{ text: '2026-06-01 起受理，至經費用罄為止', date: null }],
  taitung: [{ text: '2026 年 1 月起受理，至經費用罄為止', date: null }],
  taichung: [
    { text: '115 年度計畫期至 2026-12-31 或預算用罄', date: '2026-12-31' },
    { text: '115 年度申請期限至 2026-10-31', date: '2026-10-31' },
  ],
  changhua: [
    { text: '每年 3/1 至 9/30 受理；115 年度已於 2026-09-30 結束', date: '2026-09-30' },
    { text: '每年 3/1 至 9/30 受理；115 年度已於 2026-09-30 結束', date: '2026-09-30' },
  ],
  nantou: [{ text: '即日起至經費用罄', date: null }],
  'chiayi-city': [{ text: '115 年度計畫期至 12/31；診治計畫書最後收件日 2026-12-18', date: '2026-12-18' }],
  tainan: [{ text: '2026-01-01 至 2026-12-10（經費用罄可能提前停止）', date: '2026-12-10' }],
  kaohsiung: [{ text: '一般方案已於 2026-03-07 額滿；弱勢專案期限依公告', date: null }],
  pingtung: [null, { text: '2026-04-20 起受理（剩餘名額未確認）', date: null }],
};

const SUMMARY_DENTURE: Record<string, string> = {
  taipei: '台北市有中低收入老人假牙補助：活動假牙依身分與型式約最高 2 萬至 5 萬 5,000 元，須先經院所篩檢、送審核准才能製作。',
  'new-taipei': '新北市有中低收入老人補助裝置假牙：活動假牙依型式最高約 1 萬 7,000 至 4 萬 4,000 元，須事前檢查並經社會局核准。',
  keelung: '基隆市 115 年度有中低收入老人假牙補助（活動假牙約 1 萬 7,000 至 4 萬 4,000 元），計畫期間至 2026-12-31，須事前核准。',
  taoyuan: '桃園市 65 歲以上一般戶設籍滿 1 年可申請活動假牙補助，約 1 萬 7,000 至 4 萬 4,000 元（終身一次）；中低收入另有專案。',
  'hsinchu-city': '新竹市 115 年度有長者免費裝置全口活動假牙計畫：裝置費 4 萬元（依核定項目最高約 6 萬元），名額有限，須事前向衛生局申請。',
  'hsinchu-county': '新竹縣 115 年度有高齡友善活動假牙補助：全口活動假牙 4 萬元（加計項目最高 6 萬元），名額約 30 名。',
  yilan: '宜蘭縣 115 年度有老人全口假牙補助（一般方案最高 4 萬元），但一般方案在官方索引顯示已截止，11 月是否還有名額未確認；中低收入另有方案。',
  hualien: '花蓮縣 115 年度有 65 歲以上長者假牙補助：一般長者 5 年累計最高 5 萬元、福利身分者最高 5 萬 5,000 元，2026-06-01 起受理至經費用罄。',
  taitung: '臺東縣 115 年度有中低收入老人假牙補助，裝置最高 4 萬 4,000 元，須具指定弱勢身分並向特約診所申請，至經費用罄。',
  lienchiang: '連江縣有老人裝置假牙補助：上下顎全口最高 4 萬元，須設籍連續 10 年或累計 20 年等條件；規定頁較舊，現行年度請向縣府確認。',
  kinmen: '金門縣有老人裝置假牙補助，但官方頁面查不到現行額度，額度待查證。',
  taichung: '台中市 115 年度一般戶銀髮族假牙：雙顎全口 4 萬 4,000 元；中低收入另有方案（最高 4 萬 4,000 元，115 年度申請已於 2026-10-31 截止）。',
  changhua: '彰化縣 65 歲以上一般戶全口活動假牙：雙顎 4 萬元、單顎 2 萬元；115 年度申請期已於 2026-09-30 結束。',
  nantou: '南投縣 115 年有老人裝置假牙補助：福利身分者全口最高 4 萬 4,000 元；一般戶終身合計最高 4 萬元，至經費用罄。',
  yunlin: '雲林縣有中低收入老人假牙補助：雙顎全口 4 萬 4,000 元，須具指定弱勢身分並經牙醫評估。',
  'chiayi-city': '嘉義市 115 年度一般身分長者（75 歲以上、設籍滿 5 年）假牙補助：雙顎全口 4 萬 4,000 元，診治計畫書最後收件日 2026-12-18。',
  'chiayi-county': '嘉義縣有樂齡活動假牙計畫：全口 4 萬元、半口 2 萬元；是否為 115 年度新版公告待查證。',
  tainan: '台南市 115 年度長者全口活動假牙：每顎最高 2 萬 2,000 元、雙顎 4 萬 4,000 元，申請至 2026-12-10。',
  kaohsiung: '高雄市 115 年老人免費裝假牙：一般方案已於 2026-03-07 額滿；弱勢專案最高 4 萬 4,000 元。',
  pingtung: '屏東縣有一般與中低收入兩種長者假牙補助；一般方案金額待查證，中低收入活動假牙約 4,400 至 4 萬 4,000 元。',
  penghu: '澎湖縣有老人補助假牙：全口 5 萬元、半口 2 萬 5,000 元；官方附件年度標示較舊，現行版本待確認。',
};

const SUMMARY_CARD: Record<string, string> = {
  taipei: '台北市 65 歲以上長者可辦敬老悠遊卡，2026 年 7 月起每月 600 點（1 點 1 元），用於公告指定的公車、捷運等。',
  'new-taipei': '新北市 65 歲以上長者（原住民 55 歲）可辦敬老悠遊卡，2026 年 7 月起每月 600 點，用於指定公車、捷運、臺鐵等。',
  keelung: '基隆市 65 歲以上長者可辦敬老卡，市區公車免費搭乘（非月點數制）；官方頁最後可辨識更新為 2021 年，現行適用範圍待確認。',
  taoyuan: '桃園市 65 歲以上長者（原住民 55 歲）每月 800 點，復興區設籍者 1,000 點，用於公告的公車、臺鐵、愛心計程車等。',
  'hsinchu-city': '新竹市 65 歲以上長者（原住民 55 歲）2026 年 10 月起每月 1,200 點，月底歸零，用於指定公車、計程車、臺鐵等。',
  'hsinchu-county': '新竹縣 65 歲以上長者（原住民 55 歲）2026 年 10 月起每月 1,000 點，限指定交通與長照交通用途，月末歸零。',
  yilan: '宜蘭縣 65 歲以上長者（原住民 55 歲）的敬老卡非點數制：縣內指定客運免費，捷運與國道客運半價（須先儲值）。',
  hualien: '花蓮縣 65 歲以上長者的敬老愛心卡：指定縣內客運路段免費，縣內臺鐵按月核實補助最高 1,000 元，合作計程車每月上限 1,500 點。',
  taitung: '臺東縣 65 歲以上長者的臺東卡每月 1,500 點，當月未用不累計，用於縣內公車、愛心計程車、臺鐵等。',
  lienchiang: '連江縣 65 歲以上長者的敬老卡非點數制：縣內公車免費、南竿至北竿航線半票；縣府頁面較舊，需核對最新公告。',
  kinmen: '金門縣 65 歲以上長者可辦縣民卡（實體敬老卡），縣內公車適用縣民優惠；官方頁未列每月點數，待查證。',
  taichung: '台中市 65 歲以上長者每月 1,000 點（原住民 1,500 點），月底歸零，用於合作公車、捷運、臺鐵、計程車等。',
  changhua: '彰化縣 65 歲以上長者的長青幸福卡每月 1,000 點，不累積，用於指定客運、臺鐵、診所、計程車等。',
  nantou: '南投縣 65 歲以上長者（原住民 60 歲）每月 1,000 點，月底歸零，用於合作客運、計程車、臺鐵、捷運等。',
  yunlin: '雲林縣 65 歲以上長者的敬老愛心卡：公告合作的縣內公車免費搭乘，非月點數制。',
  'chiayi-city': '嘉義市 65 歲以上長者每月 1,200 點，月底歸零，用於公車、客運、臺鐵、合作計程車等。',
  'chiayi-county': '嘉義縣 65 歲以上長者每月 1,000 點（阿里山、大埔 1,200 點），月末歸零，用於縣內公車、客運、臺鐵等。',
  tainan: '台南市 65 歲以上長者的敬老卡：臺南市公車免費，外縣市公車、捷運半價；官方頁未列月點數。',
  kaohsiung: '高雄市 65 歲以上長者（原住民 55 歲）2026 年 10 月起每季 1,800 點、年最高 7,200 點，用於公車、捷運、渡輪、計程車等。',
  pingtung: '屏東縣 65 歲以上長者每月 1,000 點，用於指定客運、臺鐵、小黃公車等；月點是否歸零待查證。',
  penghu: '澎湖縣 65 歲以上長者的 iPASS 社福卡需自行儲值，捷運、臺鐵、公車、公共自行車半價，非每月縣府點數。',
};

/** 確定是「每月／每季發點數」的縣市，才放「點數可以換現金嗎」這則 FAQ */
const POINT_BASED = new Set(['taipei', 'new-taipei', 'taoyuan', 'hsinchu-city', 'hsinchu-county', 'taitung', 'taichung', 'changhua', 'nantou', 'chiayi-city', 'chiayi-county', 'kaohsiung', 'pingtung']);

const nul = (v: string | null | undefined) => (v === null || v === undefined || v.trim() === '' ? null : v.trim());
const srcDate = (s: Source) => s.更新 ?? s.日期 ?? s.狀態 ?? s.備註 ?? null;
const STALE = /較舊|未確認|未找到|未能|索引|未標示|最後可辨識|待核對|待查證/;

function build(topic: 'denture-subsidy' | 'senior-card', slug: string, name: string, items: Record<string, unknown>[], srcs: Source[], summary: string, faq: { q: string; a: string }[], staleText: string) {
  const urls = [...new Set(srcs.map((s) => s.網址))];
  const publicNotes: string[] = [];
  if (STALE.test(staleText)) publicNotes.push('部分內容的官方頁面較舊或未能完整核實，已標示在各項目的「限制與注意」；申請前請向主管機關確認。');
  const data: Record<string, unknown> = {
    status: 'verified',
    county: slug,
    year: 2026,
    summary,
    items,
    source_url: urls[0],
    verified_at: VERIFIED_AT,
    notes: `${src.資料截點} 來源更新日：${srcs.map((s) => `${s.名稱}（${srcDate(s) ?? '未標示'}）`).join('；')}`,
    faq: faq.map((f) => ({ ...f, source_url: urls[0] })),
  };
  if (urls.length > 1) data.additional_sources = urls.slice(1);
  if (publicNotes.length) data.public_notes = publicNotes;
  fs.writeFileSync(`data/${topic}/${slug}.json`, JSON.stringify(data, null, 2) + '\n');
}

const ensure = (s: string) => (/[。！？]$/.test(s) ? s : `${s}。`);
const log: string[] = [];

for (const r of rows) {
  const slug = slugOf(r.名稱);
  if (!slug) throw new Error(`找不到縣市：${r.名稱}`);
  const name = COUNTIES.find((c) => c.slug === slug)!.name;

  // ---- 假牙 ----
  const pols = r.老人假牙補助.filter((p) => !EXCLUDE_POLICY[r.名稱]?.(p));
  const dl = DENTURE_DL[slug] ?? [];
  const dItems = pols.map((p, i) => ({
    name: p.政策,
    eligibility: nul(p.資格),
    amount: nul(p.額度),
    how_to_apply: nul(p.申請),
    deadline: dl[i]?.text ?? null,
    deadline_date: dl[i]?.date ?? null,
    restrictions: nul(p.限制),
    source_url: p.來源[0]?.網址,
  }));
  const f = pols[0]!;
  const dFaq = [
    { q: `${name}老人假牙補助可以補助多少？`, a: SUMMARY_DENTURE[slug]! },
    { q: `誰可以申請${name}的老人假牙補助？`, a: ensure(nul(f.資格) ?? '官方頁面未載明，待查證') },
    { q: `${name}老人假牙補助怎麼申請？`, a: ensure(nul(f.申請) ?? '官方頁面未載明，待查證') },
    { q: `${name}老人假牙補助有什麼限制？`, a: ensure(nul(f.限制) ?? '官方頁面未載明，待查證') },
  ];
  if (pols.length > 1) dFaq.push({ q: `${name}有幾種老人假牙補助方案？`, a: `共 ${pols.length} 種：${pols.map((p) => p.政策).join('、')}。方案的資格與額度不同，不能混用，請看上方各項說明。` });
  build('denture-subsidy', slug, name, dItems, pols.flatMap((p) => p.來源), SUMMARY_DENTURE[slug]!, dFaq, pols.map((p) => `${p.限制 ?? ''}${p.額度 ?? ''}`).join(' ') + (pols.some((p) => p.額度 === null) ? '未確認' : ''));

  // ---- 敬老卡 ----
  const c = r.敬老卡;
  const cItems = [{
    name: c.政策,
    eligibility: nul(c.資格),
    amount: nul(c.福利),
    how_to_apply: nul(c.申請),
    deadline: null,
    restrictions: nul(c.限制),
    source_url: c.來源[0]?.網址,
  }];
  const cFaq = [
    { q: `${name}敬老卡有什麼優惠？`, a: SUMMARY_CARD[slug]! },
    { q: `誰可以辦${name}的敬老卡？`, a: ensure(nul(c.資格) ?? '官方頁面未載明，待查證') },
    { q: `${name}敬老卡怎麼申請？`, a: ensure(nul(c.申請) ?? '官方頁面未載明，待查證') },
    { q: `${name}敬老卡有什麼限制？`, a: ensure(nul(c.限制) ?? '官方頁面未載明，待查證') },
  ];
  if (POINT_BASED.has(slug)) cFaq.push({ q: `${name}敬老卡的點數可以換現金嗎？`, a: '不行。官方資料說明點數是指定用途的社福點，不是現金；可用的路線、店家與扣點方式依各縣市公告。' });
  build('senior-card', slug, name, cItems, c.來源, SUMMARY_CARD[slug]!, cFaq, `${c.限制 ?? ''}${c.福利 ?? ''}`);
  log.push(`${slug}: 假牙 ${dItems.length} 方案 / 敬老卡 1`);
}

// 苗栗縣：兩份資料都沒有 → 維持待補（todo）
for (const topic of ['denture-subsidy', 'senior-card'] as const) {
  fs.writeFileSync(`data/${topic}/miaoli.json`, JSON.stringify({ status: 'todo', county: 'miaoli', year: 2026, items: [], source_url: null, verified_at: null, notes: '來源資料未涵蓋苗栗縣，待補。' }, null, 2) + '\n');
}
console.log(log.join('\n'));
