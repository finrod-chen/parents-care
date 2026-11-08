/**
 * 苗栗縣（假牙補助、敬老卡）：2026-11-08 由官方頁面逐項整理。
 * 來源皆為苗栗縣政府網域；查不到的欄位為 null（頁面顯示「待查證」）。
 * 用法：npx tsx scripts/import-miaoli.ts
 */
import fs from 'node:fs';

const VERIFIED_AT = '2026-11-08';
const FAQ_URL = 'https://service.miaoli.gov.tw/FAQTable.aspx?n=1797';
const CLINIC_PDF = 'https://webws.miaoli.gov.tw/Download.ashx?u=LzAwMS9VcGxvYWQvNDEwL3JlbGZpbGUvOTYyNy8zOTQzNjQvNjY1MDA5ZTAtYzQxOC00ODYwLTgyMDktNDc0ZThmMDc4ZTM0LnBkZg%3D%3D&n=5ZCI57SE54mZ56eR6Yar55mC6Ki6KOmZoinmiYDlkI3llq4tKDExMy0xMTXlubQpLnBkZg%3D%3D';
const IPD_PDF = 'https://webws.miaoli.gov.tw/Download.ashx?u=LzAwMS9VcGxvYWQvNDQ3L3JlbGZpbGUvMTM4MzEvOTI2MjA5L2M1ZDNlMjUxLTM5MDMtNDhkYS05MDFhLWU1NmYyMDViNjViYi5wZGY%3D&n=MTE15bm05bqm5YGH54mZ6KiI55WrLnBkZg%3D%3D';
const CARD_PAGE = 'https://www.miaoli.gov.tw/social_affairs/News_Content.aspx?n=682&s=404900';
const CARD_RULES_PDF = 'https://webws.miaoli.gov.tw/Download.ashx?u=LzAwMS9VcGxvYWQvNDEwL3JlbGZpbGUvOTQ2OC80MDQ5MDAvNmQ2ODlkZDEtMjBkNi00Y2U3LTg4MDQtNjkyOGFjYzU5MjY5LnBkZg%3d%3d&n=6IuX5qCX57ij5pS%2f5bqc5pWs6ICB5oSb5b%2bD5Y2h5a%2bm5pa96KaB6bueKDExNS4wMy4xNuS%2fruatoykucGRm';
const CARD_FORM_PDF = 'https://webws.miaoli.gov.tw/Download.ashx?u=LzAwMS9VcGxvYWQvNDEwL3JlbGZpbGUvOTQ2OC80MDQ5MDAvMjg3MWQyMzYtMzk2ZS00MDE3LWI1NzUtZDViMGJiMDgwZjVlLnBkZg%3d%3d&n=MTE15bm06IuX5qCX57ij5pWs6ICB5oSb5b%2bD5Y2h55Sz6KuL6KGoLnBkZg%3d%3d';

const ensure = (s: string) => (/[。！？]$/.test(s) ? s : `${s}。`);
const write = (topic: string, d: unknown) => fs.writeFileSync(`data/${topic}/miaoli.json`, JSON.stringify(d, null, 2) + '\n');

// ---------------- 老人假牙補助 ----------------
const dentureSummary =
  '苗栗縣有中低收入老人補助裝置假牙（設籍苗栗縣、年滿 65 歲且符合指定弱勢身分，向戶籍地公所申請），55 歲以上原住民另有專案，5 年內最高 4 萬元，115 年度申請已於 2026-10-31 截止。';
const d1Elig = '設籍本縣年滿 65 歲，經醫師評估缺牙、需裝置假牙，並符合下列條件之一：列冊低收入戶或中低收入戶；領有中低收入老人生活津貼；經各級政府全額補助收容安置；領有身心障礙者生活補助；經各級政府補助身心障礙者托育費或養護費達 50% 以上。';
const d1Apply = '承辦單位為戶籍所在地鄉鎮市公所。應備文件：申請書、身分證正反面影本、福利身分別證明文件、印章。縣府公告有合約牙科醫療診（院）所名單（合約期間 113 年至 115 年）。';
const d1Restr = '補助額度與申請期間請洽戶籍地公所。';
const d2Elig = '年滿 55 歲以上原住民；經醫師評估缺牙需裝置假牙，且不是衛福部「中低收入老人補助裝置假牙實施計畫」的服務對象；未申請其他政府機關所辦的假牙補助。';
const d2Amount = '5 年內（含本年度）最高補助 4 萬元（假牙維修不在此限）。各態樣上限：上、下顎全口活動假牙 4 萬元；單顎全口活動假牙 2 萬元；單顎全口併另一顎部分活動假牙 3 萬 4,000 元；上、下顎部分活動假牙 2 萬 8,000 元；單顎部分活動假牙 1 萬 4,000 元；固定式假牙每顆 4,000 元（至多 10 顆）；活動假牙維修依項目上限 700 至 1,900 元。';
const d2Apply = '攜健保卡直接向健保特約牙科醫院（診所）提出申請，由院所做口腔檢查並線上送件；戶籍地縣政府審查（審查日不超過 10 個工作天），核准後才能製作或維修假牙。';
const d2Deadline = '115 年度補助申請最遲須於 2026-10-31 前完成；2026-11-01 起受理的案件依 116 年度計畫辦理；115 年度經費用罄即中止受理。';
const d2Restr = '同一顎或同一牙位已取得相同補助者，須滿 5 年且經評估有必要才能重新申請（維修不在此限）。製作費用超過補助上限的部分，由民眾自行負擔或由縣政府酌予補助。';

write('denture-subsidy', {
  status: 'verified',
  county: 'miaoli',
  year: 2026,
  summary: dentureSummary,
  items: [
    { name: '中低收入老人補助裝置假牙', eligibility: d1Elig, amount: null, how_to_apply: d1Apply, deadline: null, deadline_date: null, restrictions: d1Restr, source_url: FAQ_URL },
    { name: '115 年度原住民族長者裝置假牙', eligibility: d2Elig, amount: d2Amount, how_to_apply: d2Apply, deadline: d2Deadline, deadline_date: '2026-10-31', restrictions: d2Restr, source_url: IPD_PDF },
  ],
  source_url: FAQ_URL,
  additional_sources: [CLINIC_PDF, IPD_PDF],
  verified_at: VERIFIED_AT,
  notes:
    '來源：苗栗縣政府 1999 熱線常見問題「中低收入老人補助裝置假牙」（社會處，114-05-27 更新）；衛生局合約診所名單 PDF（合約期間 113–115 年）；苗栗縣政府 115 年度原住民族長者裝置假牙實施計畫申請表（114-11-25 送原民會）。' +
    ' 查證 2026-11-08：官方頁未找到中低收入老人假牙的補助額度。新聞整理文章（TVBS 等）寫苗栗全口最高 5 萬元、其他整理文章寫 4.4 萬元，兩者互相矛盾且無官方公告出處，故額度留 null，不採用。',
  public_notes: [
    '原住民族長者專案 115 年度申請已於 2026-10-31 截止，11 月 1 日起的案件依 116 年度計畫辦理。',
  ],
  faq: [
    { q: '苗栗縣老人假牙補助可以補助多少？', a: dentureSummary, source_url: FAQ_URL },
    { q: '誰可以申請苗栗縣的老人假牙補助？', a: ensure(d1Elig), source_url: FAQ_URL },
    { q: '苗栗縣老人假牙補助怎麼申請？', a: ensure(d1Apply), source_url: FAQ_URL },
    { q: '苗栗縣老人假牙補助有什麼限制？', a: ensure(d1Restr), source_url: FAQ_URL },
    { q: '苗栗縣有幾種老人假牙補助方案？', a: '共 2 種：中低收入老人補助裝置假牙、115 年度原住民族長者裝置假牙。兩者資格與額度不同，不能混用，請看上方各項說明。', source_url: FAQ_URL },
  ],
});

// ---------------- 敬老卡 ----------------
const cardSummary = '苗栗縣 65 歲以上長者（原住民 55 歲）每月 700 點，限當月使用，用於縣內簽約客運、臺鐵、計程車與指定農會小舖。';
const cElig = '設籍本縣且符合下列條件之一（每人限申請一張）：年滿 65 歲老人；年滿 55 歲原住民（可提前 1 個月申辦，生日當天領卡）；領有身心障礙證明者；符合條件的就讀國中、高中（職）學生（列冊低收入戶或中低收入戶，或符合兒童及少年生活扶助規定者）。';
const cAmount = '每月補助社福點數 700 點（1 點 1 元），限當月使用，未用完的餘點不累計到次月。可用於：縣內簽約客運路線（國道路線除外，共 8 家客運）；臺鐵（起站或迄站任一在苗栗縣，單趟補助上限 100 點）；計程車（2026-06-01 起，每趟補助 100 點、每月 200 點，適用苗栗縣、新竹縣、新竹市、台中市的指定車隊）；指定農會小舖（2026-07-01 起，除酒類產品；2026-11-01 起每月最高補助由 100 點提高至 300 點、每週使用上限 100 點，並新增 6 家小舖）。';
const cApply = '攜國民身分證、印章、最近 1 年內 2 吋半身照片 2 張，到本縣任一鄉鎮市公所申請；原住民附可判別身分及族別的證明文件，身心障礙者附身心障礙證明，弱勢學生附學生證正反面影本；委託他人代辦需附受託人身分證與印章。';
const cRestr = '每月第一次乘車時由系統自動儲值 700 點；點數用完或不足時不會自動補，須自行到便利商店儲值現金錢包。限本人使用，轉讓或轉借他人者，第一次查獲停止補助半年、第二次收回票證。死亡、戶籍遷出本縣、喪失身心障礙資格、未在學（含休學）等情況會停止使用。';

write('senior-card', {
  status: 'verified',
  county: 'miaoli',
  year: 2026,
  summary: cardSummary,
  items: [{ name: '苗栗縣敬老愛心卡（敬老卡、愛心卡）', eligibility: cElig, amount: cAmount, how_to_apply: cApply, deadline: null, restrictions: cRestr, source_url: CARD_PAGE }],
  source_url: CARD_PAGE,
  additional_sources: [CARD_RULES_PDF, CARD_FORM_PDF],
  verified_at: VERIFIED_AT,
  notes:
    '來源：苗栗縣政府社會處「申辦須知—苗栗縣敬老愛心卡」（老人及身障福利科；頁面標示上版日期 110-04-15，內文已含 115 年新增的計程車、農會規定與 2026-11-01 起農會額度）；敬老愛心卡實施要點（115.03.16 修正）；115 年敬老愛心卡申請表。' +
    ' 部分公所頁面（如苗栗市公所）仍寫舊的臺鐵單趟上限 50 點，已以縣府社會處為準。新聞提到「計程車 200 點與農會 100 點整合為 300 點通用」為規劃中，官方頁未列，未採用。',
  public_notes: ['部分鄉鎮市公所頁面仍寫較舊的規定（例如臺鐵單趟補助上限 50 點），本頁以縣府社會處公告為準。'],
  faq: [
    { q: '苗栗縣敬老卡有什麼優惠？', a: cardSummary, source_url: CARD_PAGE },
    { q: '誰可以辦苗栗縣的敬老卡？', a: ensure(cElig), source_url: CARD_PAGE },
    { q: '苗栗縣敬老卡怎麼申請？', a: ensure(cApply), source_url: CARD_PAGE },
    { q: '苗栗縣敬老卡有什麼限制？', a: ensure(cRestr), source_url: CARD_PAGE },
    { q: '苗栗縣敬老卡的點數可以換現金嗎？', a: '不能。點數限用於指定範圍（客運、臺鐵、計程車、指定農會小舖），當月沒用完的餘點不累計到次月；用完或不足時需自行儲值現金錢包。', source_url: CARD_PAGE },
  ],
});
console.log('miaoli: denture + senior-card written');
