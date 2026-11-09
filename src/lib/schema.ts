import { z } from 'zod';
import { COUNTY_SLUGS } from './counties';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式須為 YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), '不是有效日期');

const httpUrl = z.string().url().refine((u) => /^https?:\/\//.test(u), '須為 http(s) 網址');

/** 找不到官方來源的欄位必須明確填 null（頁面顯示中性占位字，如「依公告」），不可省略 key，也不可填空字串。 */
const nullableText = z.string().trim().min(1, '不可為空字串，查不到請填 null').nullable();

/** 結構化規則：試算只吃這裡，不解析中文敘述。null = 未取得官方數字（頁面顯示占位字，不編造）。 */
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

export const ContactSchema = z
  .object({
    unit: z.string().trim().min(1),
    phone: nullableText,
    address: nullableText,
    url: httpUrl.nullable(),
  })
  .strict();

/** 縣市專屬的申辦導覽（人工撰寫，每句都要能在官方頁找到；沒有就省略該 key） */
export const GuideSchema = z
  .object({
    /** 在地重點：這個縣市跟別的縣市不一樣的地方，2–3 段 */
    intro: z.array(z.string().trim().min(1)).min(1).max(4),
    steps: z.array(z.string().trim().min(1)).min(2).max(8).optional(),
    documents: z.array(z.string().trim().min(1)).min(1).optional(),
    contacts: z.array(ContactSchema).min(1).optional(),
  })
  .strict();

/** 跨縣市比較用的結構化數字（整數元）；'none' = 確認沒有這類方案；null = 有方案但沒有可比較的官方數字 */
export const CompareSchema = z
  .object({
    /** 一般長者方案：上下顎全口活動假牙最高補助 */
    general_full_twd: z.union([z.number().int().positive(), z.literal('none')]).nullable(),
    /** 低收／中低收等福利身分方案：上下顎全口活動假牙最高補助 */
    welfare_full_twd: z.union([z.number().int().positive(), z.literal('none')]).nullable(),
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
    /** 主要來源的顯示名稱（預設「{縣市}官方公告」）；來源不是官方公告時使用，例如「新聞報導」 */
    source_label: z.string().trim().min(1).optional(),
    /** 主要來源性質：預設官方；若是新聞報導等非官方來源，標 'media'，頁面標題會顯示「資料來源」而非「官方來源」 */
    source_type: z.enum(['official', 'media']).optional(),
    /** 給讀者看的重要提醒（短句）；notes 為內部查證紀錄，不會顯示在頁面上 */
    public_notes: z.array(z.string().trim().min(1)).optional(),
    guide: GuideSchema.optional(),
    compare: CompareSchema.optional(),
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
export type Guide = z.infer<typeof GuideSchema>;
export type Compare = z.infer<typeof CompareSchema>;
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
