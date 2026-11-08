/**
 * 全國性（非縣市別）資料：data-national/*.json。
 * 與縣市資料相同的規則：必須附官方來源、verified_at，超過 365 天 build 即 fail。
 */
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { FaqSchema, freshnessError } from './schema';
import { COUNTY_SLUGS } from './counties';

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

export const AllowanceSchema = z
  .object({
    year: z.number().int(),
    verified_at: isoDate,
    law_amended: isoDate,
    sources: z.array(Source).min(1),
    age_min: z.number().int(),
    income: z
      .object({
        max_multiple_of_min_living: z.number().positive(),
        tier1_below_multiple: z.number().positive(),
        consumption_multiple: z.number().positive(),
        consumption_per_capita_monthly_twd: Money,
        consumption_source_status: z.enum(['primary', 'secondary']),
        consumption_year: z.string().optional(),
      })
      .strict(),
    assets: z.object({ deposits_single_twd: Money, deposits_per_extra_person_twd: Money }).strict(),
    amounts: z
      .object({
        tier1_twd: Money,
        tier2_twd: Money,
        bonus_twd: Money,
        bonus_period: z.string(),
        planned_tier1_twd: Money,
        planned_tier2_twd: Money,
        planned_status: z.string(),
      })
      .strict(),
    min_living_cost: z
      .array(
        z
          .object({
            area: z.string(),
            twd: Money,
            counties: z.array(z.enum(COUNTY_SLUGS)).min(1),
            /** 地方政府公告的第一級分界（與 最低生活費×1.5 不同時使用）；inclusive = 公告寫「以下」 */
            tier1_cut_twd: Money.optional(),
            tier1_cut_inclusive: z.boolean().optional(),
          })
          .strict(),
      )
      .min(1),
    notes: z.string(),
    public_notes: z.array(z.string()).optional(),
    faq: z.array(FaqSchema).min(3).max(5),
  })
  .strict();

export type Allowance = z.infer<typeof AllowanceSchema>;

const DIR = path.resolve(process.cwd(), 'data-national');

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
}

/** 讀取並驗證全國性資料；錯誤一次列出並 throw。 */
export function loadNational(opts: { now?: Date; skipFreshness?: boolean } = {}) {
  const errors: string[] = [];
  const out: { ltc?: LongTermCare; allowance?: Allowance } = {};

  const ltc = LongTermCareSchema.safeParse(readJson('long-term-care.json'));
  if (!ltc.success) for (const i of ltc.error.issues) errors.push(`data-national/long-term-care.json：${i.path.join('.') || '(根)'} ${i.message}`);
  else {
    const fe = opts.skipFreshness ? null : freshnessError(ltc.data.verified_at, opts.now);
    if (fe) errors.push(`data-national/long-term-care.json：${fe}`);
    out.ltc = ltc.data;
  }

  const al = AllowanceSchema.safeParse(readJson('low-income-elderly-allowance.json'));
  if (!al.success) for (const i of al.error.issues) errors.push(`data-national/low-income-elderly-allowance.json：${i.path.join('.') || '(根)'} ${i.message}`);
  else {
    const fe = opts.skipFreshness ? null : freshnessError(al.data.verified_at, opts.now);
    if (fe) errors.push(`data-national/low-income-elderly-allowance.json：${fe}`);
    // 22 縣市必須各出現一次，不可重複或遺漏
    const seen = al.data.min_living_cost.flatMap((m) => m.counties);
    if (new Set(seen).size !== seen.length || seen.length !== COUNTY_SLUGS.length)
      errors.push('data-national/low-income-elderly-allowance.json：min_living_cost 須涵蓋 22 縣市且不可重複');
    out.allowance = al.data;
  }

  if (errors.length) throw new Error(`全國性資料驗證失敗（${errors.length} 項）：\n- ${errors.join('\n- ')}`);
  return out as Required<typeof out>;
}

let cache: ReturnType<typeof loadNational> | undefined;
export const national = () => (cache ??= loadNational());
