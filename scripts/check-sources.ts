/**
 * 逐一抓取資料檔中的 source_url（含 items[].source_url、faq[].source_url），
 * 回報 404／連線失敗，以及頁面內容雜湊與上次基準不同者，輸出 report.md。
 *
 * 只回報，絕不修改 data/*.json。
 * 雜湊基準存在 data/.source-hashes.json；只有加 --update-hashes 才會寫入（且只寫雜湊）。
 *
 * 用法：npm run check-sources [-- --update-hashes] [-- --fail-on-issues]
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadAll } from '../src/lib/data';

const HASH_FILE = path.resolve('data/.source-hashes.json');
const args = new Set(process.argv.slice(2));

type Hashes = Record<string, { hash: string; checked_at: string }>;
const baseline: Hashes = fs.existsSync(HASH_FILE) ? JSON.parse(fs.readFileSync(HASH_FILE, 'utf8')) : {};

/** 去掉 script/style/標籤與空白，降低因版型／統計碼造成的假警報 */
function normalize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, '')
    .trim();
}

// url → 使用到它的資料檔
const usage = new Map<string, Set<string>>();
for (const e of loadAll({ skipFreshness: true /* 過期正是要靠本腳本重新查證，不應在此中斷 */ })) {
  if (e.status !== 'verified') continue;
  const where = `${e.topic}/${e.county}`;
  const urls = [e.source_url, ...(e.additional_sources ?? []), ...e.items.map((i) => i.source_url), ...e.faq.map((f) => f.source_url)];
  for (const u of urls) if (u) (usage.get(u) ?? usage.set(u, new Set()).get(u)!).add(where);
}

type Row = { url: string; files: string[]; status: 'ok' | 'changed' | 'new' | 'broken'; detail: string; hash?: string };
const rows: Row[] = [];

async function check(url: string, files: string[]): Promise<Row> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
      headers: { 'user-agent': 'parents-care-source-checker/0.1', 'accept-language': 'zh-TW' },
    });
    if (res.status === 404 || res.status === 410) return { url, files, status: 'broken', detail: `HTTP ${res.status}` };
    if (!res.ok) return { url, files, status: 'broken', detail: `HTTP ${res.status}` };
    const body = normalize(await res.text());
    const hash = crypto.createHash('sha256').update(body).digest('hex');
    const prev = baseline[url]?.hash;
    if (!prev) return { url, files, status: 'new', detail: '尚無基準雜湊（首次檢查）', hash };
    if (prev !== hash) return { url, files, status: 'changed', detail: `內容雜湊改變（上次檢查 ${baseline[url]!.checked_at}）`, hash };
    return { url, files, status: 'ok', detail: '未變動', hash };
  } catch (err) {
    return { url, files, status: 'broken', detail: `連線失敗：${(err as Error).message}` };
  }
}

const queue = [...usage.entries()];
const worker = async () => {
  for (let job = queue.shift(); job; job = queue.shift()) rows.push(await check(job[0], [...job[1]].sort()));
};
await Promise.all(Array.from({ length: 4 }, worker));
rows.sort((a, b) => a.url.localeCompare(b.url));

const today = new Date().toISOString().slice(0, 10);
const section = (title: string, list: Row[]) =>
  list.length
    ? `## ${title}（${list.length}）\n\n${list.map((r) => `- ${r.url}\n  - ${r.detail}\n  - 使用於：${r.files.join('、')}`).join('\n')}\n`
    : '';
const by = (s: Row['status']) => rows.filter((r) => r.status === s);

const report = [
  `# 來源檢查報告`,
  ``,
  `產生時間：${today}　檢查網址數：${rows.length}`,
  ``,
  `> 本報告只回報，不會修改任何資料檔。請人工開啟連結確認後，再更新對應 JSON 的內容與 verified_at。`,
  ``,
  section('❌ 404／連線失敗', by('broken')) || '## ❌ 404／連線失敗（0）\n',
  section('⚠️ 頁面內容有變', by('changed')) || '## ⚠️ 頁面內容有變（0）\n',
  section('ℹ️ 首次檢查（尚無基準）', by('new')),
  `## ✅ 未變動（${by('ok').length}）`,
  ``,
].join('\n');

fs.writeFileSync('report.md', report);
console.log(`report.md 已產生：失敗 ${by('broken').length}、有變 ${by('changed').length}、首次 ${by('new').length}、未變 ${by('ok').length}`);

if (args.has('--update-hashes')) {
  const next: Hashes = { ...baseline };
  for (const r of rows) if (r.hash) next[r.url] = { hash: r.hash, checked_at: today };
  fs.writeFileSync(HASH_FILE, JSON.stringify(next, null, 2) + '\n');
  console.log('已更新 data/.source-hashes.json（僅雜湊基準，未改動任何資料檔）');
}
if (args.has('--fail-on-issues') && (by('broken').length || by('changed').length)) process.exit(1);
