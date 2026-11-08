/**
 * 產出 EVIDENCE-TODO.md：還需要補官方證據的數字。
 * 自動部分：資料檔中金額為 null 的項目；手動部分：目前有來源但證據層級不足的數字（在下方 MANUAL）。
 * 用法：npx tsx scripts/evidence-todo.ts
 */
import fs from 'node:fs';
import { loadAll } from '../src/lib/data';
import { countyName } from '../src/lib/counties';
import { topicOf } from '../src/lib/topics';

const MANUAL = [
  { n: '臺北市津貼第一級分界 29,635 元（以下）', where: '津貼檢核頁（選臺北市時）；data-national/low-income-elderly-allowance.json › min_living_cost', now: '臺北市社會局 115 年度發給標準與市府公報（2025-11-05）。與最低生活費 20,744 × 1.5 = 31,116 元差 1,481 元，官方未解釋；本站臺北市採市府公告值，其餘縣市採法定公式', need: '向臺北市社會局確認是否沿用舊基數或誤植' },
  { n: '津貼調增 5,142–10,286 元（預定 2026-07-01）', where: '津貼檢核頁（標為規劃）', now: '衛福部／行政院規劃與追加預算簡報；立法院議案進度為交付審查，未找到生效公告；不登記為已實施、不改寫現行金額', need: '修法完成與施行公告（施行後改 tier1_twd／tier2_twd）' },
  { n: '連江縣重陽敬老禮金 1,500／2,000／3,000／10,000 元與設籍日期', where: '/chongyang-bonus/lienchiang/', now: '媒體轉載（來源列標「新聞報導」）；縣府 115 年公告與要點全文、設籍基準未取得', need: '連江縣政府 115 年公告或《連江縣發放重陽禮金實施要點》全文' },
  { n: '新竹縣百歲人瑞重陽祝賀禮金 10,000 元', where: '/chongyang-bonus/hsinchu-county/', now: '縣府高齡長照處報導（2026-09-28）的官方搜尋索引摘要；頁面全文讀取逾時', need: '取得該報導頁全文' },
  { n: '金門縣老人假牙補助金額表（低收／中低收 4 萬、一般戶 2 萬等）', where: '/denture-subsidy/kinmen/', now: '我的E政府「金門縣老人假牙補助服務」現行服務頁；頁面未標更新日。金門法規庫僅有民國 100 年度計畫，其受理期（1/1–9/30）不可當 115 年期限', need: '金門縣社會處現行公告與版本日期' },
  { n: '苗栗縣中低收入老人假牙額度（5 萬等）與「每年 10/30 前受理」', where: '/denture-subsidy/miaoli/', now: '縣府《辦理中低收入老人補助裝置假牙實施計畫》114-10-30 修正本（已核對 PDF）；申辦頁仍連該 PDF，未找到 115 年新版；115 年合約院所名單只證明有院所', need: '115 年新版計畫或縣府確認沿用' },
  { n: '屏東縣一般長者假牙額度（雙顎 3 萬、單顎 1.5 萬）', where: '/denture-subsidy/pingtung/', now: '官方法規索引列出額度表（頁面抓取逾時）；115-01-02 衛生所公告確認健康牙門檻放寬，未調額度；未列日曆截止日', need: '法規全文與 115 年名額公告' },
  { n: '臺東縣一般重陽禮金補申請至 12/31', where: '/chongyang-bonus/taitung/', now: '縣級發放要點索引（節前 10 日至節後 15 日發放、未領可於當年 12/31 前補申請；頁面讀取逾時）；臺東市公告 115 年補發至 12/31。一般縣級規則，未證明適用百歲專案', need: '要點全文' },
  { n: '新竹市一般重陽禮金「於該年度最後一個上班日前領取」', where: '/chongyang-bonus/hsinchu-city/', now: '市府社會處常見問答（更新 2023-08-07），非 115 年專頁；百歲專案未另列期限', need: '115 年領取期限公告' },
];

const all = loadAll({ skipFreshness: true });
const nullAmounts: string[] = [];
const nullRules: string[] = [];
const nullDeadlineItems: string[] = [];
for (const e of all) {
  if (e.status !== 'verified') continue;
  for (const it of e.items) {
    const where = `${topicOf(e.topic).title}／${countyName(e.county)}／${it.name}`;
    if (it.amount === null) nullAmounts.push(where);
    if (it.rules && it.rules.amount_twd === null) nullRules.push(where);
    if (it.deadline === null && e.topic !== 'senior-card') nullDeadlineItems.push(where);
  }
}

const out = [
  '# 還要補證據的數字',
  '',
  `產生日期：${new Date().toISOString().slice(0, 10)}（\`npx tsx scripts/evidence-todo.ts\` 重新產生；手動清單在腳本的 MANUAL）`,
  '',
  '## 一、已上線、但證據層級仍可再補強的數字（9）',
  '',
  '| 數字 | 出現位置 | 目前的證據 | 要補什麼 |',
  '|---|---|---|---|',
  ...MANUAL.map((m) => `| ${m.n} | ${m.where} | ${m.now} | ${m.need} |`),
  '',
  `## 二、金額空白的項目（${nullAmounts.length}）`,
  '',
  ...nullAmounts.map((x) => `- ${x}`),
  '',
  `## 三、年齡級距已知、但金額未知的重陽敬老金（${nullRules.length}）`,
  '',
  ...nullRules.map((x) => `- ${x}`),
  '',
  `## 四、領取／申請期限空白的項目（${nullDeadlineItems.length}）`,
  '',
  '官方頁面沒寫明確截止日的項目；逐項名單如下（頁面顯示「依公告為準」）。',
  '',
  ...nullDeadlineItems.map((x) => `- ${x}`),
  '',
  '## 五、其他',
  '',
  '- 全站 FAQ 是依各縣市資料欄位生成，不是官方 Q&A；日後有官方常見問答可替換。',
  '',
].join('\n');
fs.writeFileSync('EVIDENCE-TODO.md', out);
console.log(`EVIDENCE-TODO.md：手動 ${MANUAL.length} 項、金額空白 ${nullAmounts.length} 項、級距有但金額未知 ${nullRules.length} 項、期限空白 ${nullDeadlineItems.length} 項`);
