import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { SITE_URL } from './src/lib/site';
import { lastmodFor, noindexUrls } from './src/lib/data';

// 全靜態輸出，可直接部署到 Cloudflare Pages / Workers Static Assets（不需 adapter）。
// 網址一律以結尾斜線 + directory 格式輸出，避免 /x 與 /x/ 兩版本競爭 canonical。
const excluded = noindexUrls();

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    preact(),
    // noindex 的頁面（無在地導覽的縣市頁、骨架頁、404）不進 sitemap：noindex 與 sitemap 同時出現會是互相矛盾的訊號
    sitemap({
      filter: (page) => !excluded.has(page) && !page.endsWith('/404/'),
      // lastmod＝該頁資料的最後查證日（沒有資料依據的頁面不給）
      serialize: (item) => {
        const d = lastmodFor(item.url);
        return d ? { ...item, lastmod: new Date(`${d}T12:00:00+08:00`).toISOString() } : item;
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
