import fs from 'node:fs';
import path from 'node:path';
import { COUNTIES, COUNTY_SLUGS, type CountySlug } from './counties';
import { TOPIC_SLUGS, type TopicSlug } from './topics';
import { CountyDataSchema, freshnessError, type CountyData } from './schema';
import { SITE_URL } from './site';

export type Entry = CountyData & { topic: TopicSlug };

const DATA_DIR = path.resolve(process.cwd(), 'data');

/** 讀取並驗證所有資料。任何錯誤（缺欄位、檔名與 county 不符、過期）一次全部列出並 throw → build fail。 */
export function loadAll(opts: { dir?: string; now?: Date; skipFreshness?: boolean } = {}): Entry[] {
  const dir = opts.dir ?? DATA_DIR;
  const now = opts.now ?? new Date();
  const errors: string[] = [];
  const out: Entry[] = [];

  for (const topic of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!topic.isDirectory()) continue;
    if (!(TOPIC_SLUGS as readonly string[]).includes(topic.name)) {
      errors.push(`data/${topic.name}/：不在主題表內（src/lib/topics.ts）`);
      continue;
    }
    for (const f of fs.readdirSync(path.join(dir, topic.name))) {
      if (!f.endsWith('.json')) continue;
      const rel = `data/${topic.name}/${f}`;
      const slug = f.replace(/\.json$/, '');
      let raw: unknown;
      try {
        raw = JSON.parse(fs.readFileSync(path.join(dir, topic.name, f), 'utf8'));
      } catch (e) {
        errors.push(`${rel}：JSON 解析失敗（${(e as Error).message}）`);
        continue;
      }
      const parsed = CountyDataSchema.safeParse(raw);
      if (!parsed.success) {
        for (const i of parsed.error.issues) errors.push(`${rel}：${i.path.join('.') || '(根)'} ${i.message}`);
        continue;
      }
      const d = parsed.data;
      if (d.county !== slug) errors.push(`${rel}：檔名 ${slug} 與 county 欄位 ${d.county} 不一致`);
      if (d.status === 'verified' && !opts.skipFreshness) {
        const fe = freshnessError(d.verified_at, now);
        if (fe) errors.push(`${rel}：${fe}`);
      }
      out.push({ ...d, topic: topic.name as TopicSlug });
    }
  }
  if (errors.length) throw new Error(`資料驗證失敗（${errors.length} 項）：\n- ${errors.join('\n- ')}`);
  return out;
}

let cache: Entry[] | undefined;
export function all(): Entry[] {
  return (cache ??= loadAll());
}

/** 依 22 縣市固定順序回傳某主題的資料 */
export function byTopic(topic: TopicSlug): Entry[] {
  const order = new Map(COUNTY_SLUGS.map((s, i) => [s, i]));
  return all()
    .filter((e) => e.topic === topic)
    .sort((a, b) => order.get(a.county)! - order.get(b.county)!);
}

export function find(topic: TopicSlug, county: CountySlug): Entry | undefined {
  return all().find((e) => e.topic === topic && e.county === county);
}

export const isVerified = (e: Entry) => e.status === 'verified';

/** 總覽頁只有在至少一個縣市有已查證資料時才允許索引，避免薄內容頁 */
export function overviewIndexable(topic: TopicSlug): boolean {
  return byTopic(topic).some(isVerified);
}

/** 固定不索引、不進 sitemap 的頁面（骨架頁等） */
export const STATIC_NOINDEX_PATHS = ['/waitlist/'] as const;

/** 所有 noindex 頁面的完整網址（供 sitemap 排除） */
export function noindexUrls(): Set<string> {
  const s = new Set<string>();
  for (const p of STATIC_NOINDEX_PATHS) s.add(`${SITE_URL}${p}`);
  for (const e of all()) if (e.status === 'todo') s.add(`${SITE_URL}/${e.topic}/${e.county}/`);
  for (const t of TOPIC_SLUGS) if (!overviewIndexable(t)) s.add(`${SITE_URL}/${t}/`);
  return s;
}

export const countyNameOf = (slug: CountySlug) => COUNTIES.find((c) => c.slug === slug)!.name;
