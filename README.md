# 爸媽領（bamaling.tw）

讓 40–60 歲的子女查「我爸媽可以領什麼、照顧要花多少」的台灣 SEO 工具站。
Astro 全靜態輸出 + TypeScript + Tailwind v4 + zod；試算用 Preact island，全部在瀏覽器本機運算，不收集個資、無追蹤碼。

> 站名「爸媽領」，網域 `bamaling.tw`（設定在 `src/lib/site.ts`）。repo 名稱 `parents-care` 為專案代號。

## 指令

| 指令 | 說明 |
|---|---|
| `npm run dev` | 本機開發 |
| `npm run validate` | 只驗證 `data/`（欄位、檔名、365 天規則） |
| `npm run build` | 先 validate 再 build；資料不合格會直接 fail |
| `npm test` | vitest：schema、365 天規則、試算邏輯、22 縣市表 |
| `npm run check-sources` | 逐一抓 `source_url`，輸出 `report.md`（只回報，不改資料） |

## 目錄

```
data/{topic}/{county}.json   一縣市一檔，核心資產
src/lib/   counties.ts（22 縣市固定 slug）topics.ts schema.ts data.ts calc.ts seo.ts site.ts
src/components/  版型元件（Breadcrumb、Faq、ItemCard、CompareTable、VerifiedBadge、頁面模板）
src/islands/     ChongyangCalculator、HomeFinder（互動，靜態 HTML 已含完整內容）
src/pages/       index、{topic}/index、{topic}/[county]、robots.txt、404
scripts/         validate.ts、check-sources.ts
tests/
```

網址格式：`/{主題}/{縣市slug}/`，例如 `/chongyang-bonus/new-taipei/`。
主題 slug：`chongyang-bonus`、`denture-subsidy`、`senior-card`。**slug 上線後不可更改。**

## 資料格式

`status: "verified"`（已查證，會被索引並進 sitemap）：

```jsonc
{
  "status": "verified",
  "county": "new-taipei",          // 必須與檔名、縣市表一致
  "year": 2026,
  "summary": "一句話先講答案（人工撰寫，須與來源一致）",
  "items": [{
    "name": "…",
    "eligibility": "…" ,           // 查不到 → null（頁面顯示「待查證」），不可省略 key、不可填空字串
    "amount": "…",
    "how_to_apply": "…",
    "deadline": "…",                // 官方原文
    "deadline_date": "2026-12-31",  // 選填：最後可領／可申請日（含補發）。官方文字沒寫明確日期就填 null，不推算
    "rules": { "min_age": 65, "max_age": null, "amount_twd": 1500 },  // 選填；試算只吃這裡，null = 待查證
    "source_url": "https://…"      // 選填；該項目的專屬來源
  }],
  "source_url": "https://官方頁面",
  "verified_at": "2026-11-08",     // 超過 365 天 → build fail
  "notes": "",
  "faq": [{ "q": "…", "a": "…" }]  // 3–5 則，來自真實常見問題
}
```

`status: "todo"`（佔位）：`items: []`、`source_url: null`、`verified_at: null`。頁面一律 `noindex`，且不進 sitemap。

**禁止編數字**：找不到官方來源的欄位填 `null`。`rules.min_age` 為 null 時試算一律顯示「待查證」。

## SOP：新增縣市資料

1. 找到該縣市主管機關的官方公告頁，確認年度與條文。
2. 編輯 `data/{topic}/{county}.json`，把 `status` 改為 `verified`，依上方格式補齊所有欄位。
   - 每個欄位都要能在官方頁找到；找不到填 `null`。
   - 年齡級距要同步寫進 `rules`（試算用）。
   - FAQ 3–5 則，題目取自官方 Q&A 或公告中的常見疑問，附 `source_url`。
3. `verified_at` 填實際查證日。
4. `npm run validate && npm test && npm run build`。
5. 該頁自動變為可索引並進 sitemap；總覽頁在至少一縣市已查證後才可索引。

新增「敬老卡」這類只有部分縣市實施的主題：只建有實施縣市的檔案，沒有檔案就沒有頁面。

## SOP：每年更新（建議每年 11 月前完成）

重陽節前後各縣市會公告新年度數字，越早更新越有優勢。

1. `npm run check-sources`，看 `report.md`：404 的網址要找新連結；「內容有變」的要人工開啟確認。
2. 逐檔更新 `year`、金額、資格、期限、`rules`、`summary`、FAQ，**並更新 `verified_at`**。
3. 首次或全部確認後可 `npm run check-sources -- --update-hashes` 更新雜湊基準（只寫 `data/.source-hashes.json`）。
4. `npm run build` 通過再部署。

注意：`verified_at` 超過 365 天，任何一次 build 都會失敗（包含只改文案）。這是刻意的，避免上線過期資料；請在到期前完成年度更新。

## 第二階段：全國性工具

全國性（非縣市別）資料放在 `data-national/`，同樣以 zod 驗證、必須附官方來源與 `verified_at`，超過 365 天 build 即失敗，來源也納入 `check-sources`。

| 頁面 | 資料檔 | 說明 |
|---|---|---|
| `/long-term-care/` 長照給付與外籍看護費用試算 | `long-term-care.json` | 額度、部分負擔、外籍看護 30%（《長期照顧服務申請及給付辦法》附表二、附表五、第 10、14 條）；就業安定費（行政院公報刊登的勞動部數額表）。外籍看護的薪資、仲介費等官方未規範的費用由使用者輸入，不內建數字 |
| `/low-income-elderly-allowance/` 中低收入老人生活津貼資格檢核 | `low-income-elderly-allowance.json` | 資格與財產標準（《中低收入老人生活津貼發給辦法》）、115 年各縣市最低生活費（衛福部）、現行金額與規劃（衛福部／行政院 115-03-12 簡報） |
| `/waitlist/` 名單登記 | 無 | 只有骨架：noindex、不進 sitemap、站內無連結、表單停用、沒有任何第三方 |

### 每年／每次公告後的更新

- **長照額度、部分負擔**：到全國法規資料庫看《長期照顧服務申請及給付辦法》附表二、附表五是否修正（資料檔 `law_amended` 記錄版本日期）。
- **就業安定費**：勞動部數額表若修正，更新 `employment_stability_fee`。目前取自 2023-06-15 的公報版本；網路摘要顯示勞動部外國人勞動權益網（2026-08-10 更新）仍是 2,000 元，但本站尚未直接核對該頁。
- **津貼金額與最低生活費**：每年 1 月前後衛福部與各直轄市公告新的最低生活費；津貼金額每 4 年依 CPI 調整，並新增每 2 年期中檢討。**衛福部規劃調增 23.5%（預定 2026-07），查證日 2026-11-08 查不到已正式施行**，資料檔 `amounts.planned_*` 只作為「規劃」顯示，施行後再改 `tier1_twd`／`tier2_twd`。
- **還要補證據的數字**：見 [EVIDENCE-TODO.md](EVIDENCE-TODO.md)（`npx tsx scripts/evidence-todo.ts` 重新產生）。

### 啟用名單登記頁之前

必須先決定並寫在頁面上：收集哪些欄位、用途與保存期限、資料存放位置與處理者、如何取消與刪除。決定前請維持 noindex、停用狀態、不接任何第三方。

## 「已截止」標示

- 有 `deadline_date` 的項目，會在項目卡片、比較表、試算結果顯示「已截止」或「領取中・至 YYYY-MM-DD 止」；當天仍算可領，隔天起為已截止（以台灣時間計）。
- 所有項目都已截止時，縣市頁頂端顯示「今年度的領取期限已過」。
- 標示在 build 時寫入 HTML，瀏覽器載入後再用台灣時間重算一次，所以即使網站很久沒重新 build 也不會顯示過期的資訊。
- 為了讓搜尋引擎看到的 HTML 也保持最新，每週一會由 GitHub Actions 重新 build 並部署（見下方「每週部署」）。

## 資料匯入紀錄

- 重陽敬老金（2026／民國 115 年）：由 `scripts/import/chongyang-bonus-2026-all.json` 經 `scripts/import-chongyang.ts` 轉成 `data/chongyang-bonus/*.json`（21 縣市已查證，連江縣官方尚未公告，維持 `todo`）。
- 金額一律來自來源檔；`rules` 的年齡級距只收「一般（非原住民）長者」，需另符合福利身分、排富或非現金的項目不放 `rules`（試算顯示「待查證，或需另符合其他條件」）。
- 每縣市 FAQ 4–5 則（領多少、誰可以領、怎麼領、最晚何時、百歲／高齡級距怎麼領），答案全部取自該縣市資料欄位，沒有補充來源檔沒有的事實。日後若有官方 Q&A，建議替換。
- `notes` 為內部查證紀錄，不顯示在頁面；要給讀者看的提醒寫在 `public_notes`。

- 老人假牙補助、敬老卡（2026／民國 115 年）：由 `scripts/import/denture-senior-2026-detailed.json`（主）與 `…-compact.json`（交叉核對）經 `scripts/import-denture-senior.ts` 轉成 `data/denture-subsidy/*.json`、`data/senior-card/*.json`（各 21 縣市已查證；苗栗縣不在來源檔內，另由 `scripts/import-miaoli.ts` 依苗栗縣政府官方頁面補齊，見下）。
  - 詳細版的連江縣第二個假牙方案內容其實是臺東縣的中央計畫（疑似誤植），精簡版也沒有，故不匯入；詳細版金門縣重複出現，取第一筆。
  - 額度、資格、限制原文保留；來源檔寫 `null` 的額度（屏東一般方案、金門）維持 `null`（顯示「待查證」）。
  - `deadline_date` 只填文字寫得出明確日期者（例：台中中低收入 2026-10-31、彰化 2026-09-30、台南 2026-12-10、嘉義市 2026-12-18）；「額滿」「經費用罄」「申請期較舊」等不當作日期，只寫在「申請期限」或「限制與注意」文字裡。
  - 敬老卡沒有申請期限概念，頁面不顯示該欄；敬老卡 FAQ 的「點數可以換現金嗎」只放在確定是點數制的縣市。
  - 敬老卡主題標題由「敬老卡／愛心卡點數」改為「敬老卡／愛心卡優惠」，因為基隆、宜蘭、連江、雲林、台南、澎湖不是點數制。

- 苗栗縣假牙補助、敬老卡（2026-11-08 查證，來源皆為苗栗縣政府網域）：
  - 敬老卡：社會處「申辦須知—苗栗縣敬老愛心卡」，每月 700 點，含 115 年新增的計程車與農會規定（2026-11-01 起農會每月最高 300 點）。頁面上版日期標 110-04-15，但內文已含 115 年更新。
  - 假牙：中低收入老人方案的資格取自縣府 1999 熱線問答（114-05 更新）；**補助額度官方沒寫，維持 `null`**。新聞整理文章有寫 5 萬元、也有寫 4.4 萬元，互相矛盾又無官方出處，不採用。
  - 假牙另收錄縣府 115 年度原住民族長者裝置假牙計畫（5 年內最高 4 萬元；115 年度申請至 2026-10-31，已截止）。

## 品牌與網域

- 站名「爸媽領」、網域 `bamaling.tw`、品牌色 `#1F6F5C`（深綠），設定在 `src/lib/site.ts` 與 `src/styles/global.css`。
- logo 原檔在 `brand-src/`；網站用的 SVG 在 `public/brand/`，favicon／apple-touch-icon 在 `public/`，社群分享圖 `public/og.png` 由 `scripts/make-og.ts` 產生。
- Cloudflare：`bamaling.tw` 的 Zone 在帳號內；Pages 專案 `parents-care`（`parents-care.pages.dev`）已建立，**尚未綁定網域、尚無部署**。綁定網域會改動 DNS（目前指向 Porkbun 停放頁），請在確定上線時再做。

## 插圖素材（いらすとや）

溫馨風插圖取自 [いらすとや](https://www.irasutoya.com/)（作者：みふねたかし）。
規約（https://www.irasutoya.com/p/terms.html）：個人、法人、商用皆可免費使用，**但商用設計使用 21 點以上素材（重複算 1 點）需有償授權**；著作權未放棄；不得把素材當主體再散布或販售。

- 本站有廣告屬商用，所以全站不重複插圖上限 **20 張**，目前用 8 張。`tests/illustrations.test.ts` 會在超過時讓測試失敗。
- 原圖放 `src/assets/illust/`，登記在 `src/lib/illustrations.ts`，用 `<Illust id="…" />` 呈現（Astro 自動轉 webp、帶寬高避免版面跳動）。
- 每頁頁尾標示「插圖：いらすとや」並連回原站。
- 新增插圖：下載到 `src/assets/illust/` → 登記 alt → `npm test`。

## SEO 檢查清單（已內建）

- 每頁獨立 `<title>`、meta description、canonical、唯一 `<h1>`。
- `sitemap-index.xml`（`@astrojs/sitemap`，排除 noindex 頁）與 `robots.txt` 於 build 時產生。
- 結構化資料：`BreadcrumbList`、`FAQPage`（已查證頁）、`WebApplication`（試算頁）。
- 每頁顯示「資料最後查證：YYYY-MM-DD」與官方來源連結（未查證顯示「待查證」）。
- 網址統一結尾斜線（`trailingSlash: 'always'`）。

## 每週重建

Pages 已連接本 repo，push 到 `main` 會自動建置部署。`.github/workflows/weekly-rebuild.yml` 每週一（台灣 08:00）請 Pages 重跑一次 `main`，讓靜態 HTML 裡的「已截止」標示與 365 天查證檢查保持最新。資料過期或欄位缺漏時 build 會失敗，Cloudflare 不會替換線上版本。

啟用方式（只需一次；沒設定時排程會略過、不會失敗）：GitHub repo → Settings → Secrets and variables → Actions → 新增 `CLOUDFLARE_API_TOKEN`（Cloudflare → My Profile → API Tokens，權限 `Account · Cloudflare Pages · Edit`）與 `CLOUDFLARE_ACCOUNT_ID`。

## Cloudflare

- Pages 專案 `parents-care`，連接 GitHub `finrod-chen/parents-care`；正式部署只來自 `main`（不建預覽部署）。Build：`npm run build`，輸出 `dist`，`NODE_VERSION=22`。
- 自訂網域：`bamaling.tw`、`www.bamaling.tw`（DNS 為指向 `parents-care.pages.dev` 的 CNAME）。
- 標頭與快取：`public/_headers`；轉址：`public/_redirects`（目前為空）。
- zone 設定（已調整，勿重新開啟）：
  - **Web Analytics 自動注入已關閉**（否則 Cloudflare 會在 HTML 注入 `beacon.min.js`，違反「不加追蹤碼」）。
  - **Bot Preference Sync／Managed robots.txt 已關閉**（否則會在 robots.txt 最前面插入 Lighthouse 不認得的 `Content-Signal` 指令，SEO 稽核扣分）。AI 爬蟲封鎖清單改在 `src/pages/robots.txt.ts` 維護。
- 上線後請用 Lighthouse 對 `https://bamaling.tw` 實測（本機預覽與 Cloudflare 邊緣的結果可能不同）。
