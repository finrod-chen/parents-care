import { z } from 'zod';
import { COUNTY_SLUGS } from './counties';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式須為 YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), '不是有效日期');

const httpUrl = z.string().url().refine((u) => /^https?:\/\//.test(u), '須為 http(s) 網址');

/** 找不到官方來源的欄位必須明確填 null（頁面顯示「待查證」），不可省略 key，也不可填空字串。 */
const nullableText = z.string().trim().min(1, '不可為空字串，查不到請填 null').nullable();

/** 結構化規則：試算只吃這裡，不解析中文敘述。null = 待查證。 */
export const RulesSchema = z
  .object({
    min_age: z.number().int().min(0).max(120).nullable(),
    max_age: z.number().int().min(0).max(120).nullable(),
    amount_twd: z.number().int().nonnegative().nullable(),
  })
  .strict();

export const ItemSchema = z
  .object({
    name: z.string().trim().min(1),
    eligibility: nullableText,
    amount: nullableText,
    how_to_apply: nullableText,
    deadline: nullableText,
    /** 限制與注意事項（重複申請限制、名額、資料較舊等）；沒有就省略 */
    restrictions: nullableText.optional(),
    /** 最後可領／可申請日（含補發，ISO 日期）。官方文字沒有明確日期就填 null，不推算 */
    deadline_date: isoDate.nullable().optional(),
    rules: RulesSchema.optional(),
    source_url: httpUrl.optional(),
  })
  .strict();

export const FaqSchema = z
  .object({
    q: z.string().trim().min(1),
    a: z.string().trim().min(1),
    source_url: httpUrl.optional(),
  })
  .strict();

const base = {
  county: z.enum(COUNTY_SLUGS),
  year: z.number().int().min(2020).max(2100),
  notes: z.string(),
};

export const VerifiedSchema = z
  .object({
    ...base,
    status: z.literal('verified'),
    /** 一句話先講答案（人工撰寫，須與來源一致） */
    summary: z.string().trim().min(1),
    items: z.array(ItemSchema).min(1),
    source_url: httpUrl,
    verified_at: isoDate,
    faq: z.array(FaqSchema).min(3).max(5),
    /** 輔助的官方來源（例如各區公所、新聞稿、我的E政府） */
    additional_sources: z.array(httpUrl).optional(),
    /** 給讀者看的重要提醒（短句）；notes 為內部查證紀錄，不會顯示在頁面上 */
    public_notes: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export const TodoSchema = z
  .object({
    ...base,
    status: z.literal('todo'),
    items: z.array(ItemSchema).length(0),
    source_url: z.null(),
    verified_at: z.null(),
  })
  .strict();

export const CountyDataSchema = z.discriminatedUnion('status', [VerifiedSchema, TodoSchema]);

export type Item = z.infer<typeof ItemSchema>;
export type Rules = z.infer<typeof RulesSchema>;
export type Faq = z.infer<typeof FaqSchema>;
export type VerifiedData = z.infer<typeof VerifiedSchema>;
export type TodoData = z.infer<typeof TodoSchema>;
export type CountyData = z.infer<typeof CountyDataSchema>;

export const MAX_AGE_DAYS = 365;

/** verified_at 超過 365 天或在未來 → 回傳錯誤訊息，否則 null */
export function freshnessError(verifiedAt: string, now: Date = new Date()): string | null {
  const t = Date.parse(verifiedAt);
  const days = Math.floor((now.getTime() - t) / 86_400_000);
  if (days < 0) return `verified_at ${verifiedAt} 在未來`;
  if (days > MAX_AGE_DAYS) return `verified_at ${verifiedAt} 已超過 ${MAX_AGE_DAYS} 天（${days} 天），請重新查證`;
  return null;
}
