# 爸媽福利與照顧站（parents-care）

讓 40–60 歲的子女查「我爸媽可以領什麼、照顧要花多少」的台灣 SEO 工具站。
Astro 全靜態輸出 + TypeScript + Tailwind v4 + zod；試算用 Preact island，全部在瀏覽器本機運算，不收集個資、無追蹤碼。

> 網域尚未決定，`src/lib/site.ts` 的 `SITE_URL` 目前是佔位 `https://example.tw`。

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
    "deadline": "…",
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

## SEO 檢查清單（已內建）

- 每頁獨立 `<title>`、meta description、canonical、唯一 `<h1>`。
- `sitemap-index.xml`（`@astrojs/sitemap`，排除 noindex 頁）與 `robots.txt` 於 build 時產生。
- 結構化資料：`BreadcrumbList`、`FAQPage`（已查證頁）、`WebApplication`（試算頁）。
- 每頁顯示「資料最後查證：YYYY-MM-DD」與官方來源連結（未查證顯示「待查證」）。
- 網址統一結尾斜線（`trailingSlash: 'always'`）。

## 部署到 Cloudflare（尚未部署）

純靜態輸出，不需 adapter。Pages 或 Workers Static Assets 皆可：

- Build command：`npm run build`
- Output directory：`dist`
- Node：`.node-version`（22）
- 標頭與快取：`public/_headers`；轉址：`public/_redirects`（目前為空）

上線前：改 `SITE_URL`、確認真實資料皆已查證、跑 Lighthouse。
