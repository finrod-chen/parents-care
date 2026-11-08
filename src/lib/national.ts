/**
 * 全國性（非縣市別）資料：data-national/*.json。
 * 與縣市資料相同的規則：必須附官方來源、verified_at，超過 365 天 build 即 fail。
 */
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { FaqSchema, freshnessError } from './schema';

const httpUrl = z.string().url().refine((u) => /^https?:\/\//.test(u));
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Source = z.object({ label: z.string().min(1), url: httpUrl }).strict();
const Money = z.number().int().nonnegative();

export const LongTermCareSchema = z
  .object({
    year: z.number().int(),
    verified_at: isoDate,
    law_amended: isoDate,
    sources: z.array(Source).min(1),
    care_levels: z.array(z.object({ level: z.number().int().min(2).max(8), monthly_quota_twd: Money }).strict()).length(7),
    copay_classes: z
      .array(z.object({ id: z.number().int(), name: z.string(), description: z.string(), pct: z.number().min(0).max(100) }).strict())
      .length(3),
    foreign_caregiver: z.object({ quota_ratio_pct: z.number().min(0).max(100), rule: z.string() }).strict(),
    employment_stability_fee: z
      .object({ home_caregiver_monthly_twd: Money, home_caregiver_daily_twd: Money, exempt_rules: z.array(z.string()).min(1) })
      .strict(),
    notes: z.string(),
    public_notes: z.array(z.string()).optional(),
    faq: z.array(FaqSchema).min(3).max(5),
  })
  .strict();

export type LongTermCare = z.infer<typeof LongTermCareSchema>;

const DIR = path.resolve(process.cwd(), 'data-national');

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
}

/** 讀取並驗證全國性資料；錯誤一次列出並 throw。 */
export function loadNational(opts: { now?: Date; skipFreshness?: boolean } = {}) {
  const errors: string[] = [];
  const out: { ltc?: LongTermCare } = {};

  const ltc = LongTermCareSchema.safeParse(readJson('long-term-care.json'));
  if (!ltc.success) for (const i of ltc.error.issues) errors.push(`data-national/long-term-care.json：${i.path.join('.') || '(根)'} ${i.message}`);
  else {
    const fe = opts.skipFreshness ? null : freshnessError(ltc.data.verified_at, opts.now);
    if (fe) errors.push(`data-national/long-term-care.json：${fe}`);
    out.ltc = ltc.data;
  }

  if (errors.length) throw new Error(`全國性資料驗證失敗（${errors.length} 項）：\n- ${errors.join('\n- ')}`);
  return out as Required<typeof out>;
}

let cache: ReturnType<typeof loadNational> | undefined;
export const national = () => (cache ??= loadNational());
