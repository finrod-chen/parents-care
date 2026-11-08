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
  { n: '臺灣地區平均每人每月消費支出 26,640 元（×1.5 = 39,960 元）', where: '津貼檢核頁；data-national/low-income-elderly-allowance.json › income', now: '臺北市、新北市、嘉義市、彰化縣、桃園市蘆竹區公所等地方政府 115 年公告一致引用（二次引用）', need: '主計總處或衛福部的原始公告' },
  { n: '臺北市津貼第一級分界：本站用 115 年最低生活費 20,744 × 1.5 = 31,116 元', where: '津貼檢核頁（選臺北市時）', now: '臺北市社會局頁面的搜尋摘要寫 29,635 元，疑為舊年度', need: '臺北市社會局 115 年中低收入老人生活津貼公告' },
  { n: '外籍家庭看護就業安定費每月 2,000 元（每日 67 元）', where: '長照試算頁；data-national/long-term-care.json › employment_stability_fee', now: '行政院公報 2023-06-15 勞動部數額表；搜尋摘要顯示勞動部外國人勞動權益網（2026-08-10 更新）同為 2,000 元，未直接讀取', need: '勞動部／外國人勞動權益網現行頁面' },
  { n: '津貼調增 5,142–10,286 元（預定 2026-07 實施）', where: '津貼檢核頁（標為規劃）', now: '衛福部／行政院 115-03-12 簡報；查不到已正式施行', need: '施行公告（施行後改 tier1_twd／tier2_twd）' },
  { n: '連江縣重陽敬老禮金 1,500／2,000／3,000／10,000 元與設籍日期', where: '/chongyang-bonus/lienchiang/', now: '2026-09-25 媒體報導，與現行要點（109/6/1）分級一致；官方 115 年公告與要點本文沒讀到', need: '連江縣政府 115 年公告或《連江縣發放重陽禮金實施要點》本文' },
];

const all = loadAll({ skipFreshness: true });
const nullAmounts: string[] = [];
const nullRules: string[] = [];
let nullDeadlines = 0;
for (const e of all) {
  if (e.status !== 'verified') continue;
  for (const it of e.items) {
    const where = `${topicOf(e.topic).title}／${countyName(e.county)}／${it.name}`;
    if (it.amount === null) nullAmounts.push(where);
    if (it.rules && it.rules.amount_twd === null) nullRules.push(where);
    if (it.deadline === null && e.topic !== 'senior-card') nullDeadlines++;
  }
}

const out = [
  '# 還要補證據的數字',
  '',
  `產生日期：${new Date().toISOString().slice(0, 10)}（\`npx tsx scripts/evidence-todo.ts\` 重新產生；手動清單在腳本的 MANUAL）`,
  '',
  '## 一、已上線、但證據層級不足的數字',
  '',
  '| 數字 | 出現位置 | 目前的證據 | 要補什麼 |',
  '|---|---|---|---|',
  ...MANUAL.map((m) => `| ${m.n} | ${m.where} | ${m.now} | ${m.need} |`),
  '',
  `## 二、金額為「待查證」的項目（${nullAmounts.length}）`,
  '',
  ...nullAmounts.map((x) => `- ${x}`),
  '',
  `## 三、年齡級距已知、但金額未知的重陽敬老金（${nullRules.length}）`,
  '',
  ...nullRules.map((x) => `- ${x}`),
  '',
  '## 四、其他',
  '',
  `- 領取／申請期限為「待查證」的重陽敬老金與假牙項目共 ${nullDeadlines} 項（多數縣市官方頁面沒寫明確截止日）。`,
  '- 全站 FAQ 是依各縣市資料欄位生成，不是官方 Q&A；日後有官方常見問答可替換。',
  '',
].join('\n');
fs.writeFileSync('EVIDENCE-TODO.md', out);
console.log(`EVIDENCE-TODO.md：手動 ${MANUAL.length} 項、金額待查證 ${nullAmounts.length} 項、級距有但金額未知 ${nullRules.length} 項、期限待查證 ${nullDeadlines} 項`);
