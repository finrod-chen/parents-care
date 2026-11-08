import { useState } from 'preact/hooks';
import { calcItem, formatTwd } from '../lib/calc';
import type { Rules } from '../lib/schema';

interface Row {
  slug: string;
  name: string;
  verifiedAt: string | null;
  verified: boolean;
  items: { name: string; rules: Rules | null }[];
}

export default function ChongyangCalculator({ rows }: { rows: Row[] }) {
  const [slug, setSlug] = useState(rows[0]?.slug ?? '');
  const [age, setAge] = useState('');
  const row = rows.find((r) => r.slug === slug);
  const n = Number(age);
  const valid = age !== '' && Number.isInteger(n) && n >= 0 && n <= 120;

  return (
    <div class="mt-3">
      <div class="flex flex-wrap gap-4">
        <label class="flex flex-col text-sm">縣市
          <select class="mt-1 rounded border border-slate-400 p-2 text-base" value={slug} onChange={(e) => setSlug((e.target as HTMLSelectElement).value)}>
            {rows.map((r) => <option value={r.slug}>{r.name}</option>)}
          </select>
        </label>
        <label class="flex flex-col text-sm">年齡（歲）
          <input class="mt-1 w-28 rounded border border-slate-400 p-2 text-base" type="number" inputMode="numeric" min={0} max={120}
            value={age} onInput={(e) => setAge((e.target as HTMLInputElement).value)} />
        </label>
      </div>

      <div class="mt-4" aria-live="polite">
        {!valid ? (
          <p class="text-slate-600">請輸入 0–120 的整數年齡。</p>
        ) : !row || !row.verified || row.items.length === 0 ? (
          <p>{row?.name}的重陽敬老金資料<strong class="text-amber-700">待查證</strong>，目前無法試算。</p>
        ) : (
          <ul class="space-y-2">
            {row.items.map((it) => {
              const r = calcItem(it.rules ?? undefined, n);
              return (
                <li class="rounded border border-slate-200 p-3">
                  <span class="font-medium">{it.name}：</span>
                  {r.status === 'amount' && <strong class="text-brand-dark">{formatTwd(r.amount)}</strong>}
                  {r.status === 'not_eligible' && <span>{n} 歲不符此項年齡條件</span>}
                  {r.status === 'unknown' && <strong class="text-amber-700">待查證</strong>}
                </li>
              );
            })}
          </ul>
        )}
        {valid && row && row.verified && (
          <p class="mt-2 text-sm text-slate-600">
            僅依年齡試算，其他條件（戶籍、所得等）請見<a class="underline" href={`/chongyang-bonus/${row.slug}/`}>{row.name}說明頁</a>。資料最後查證：{row.verifiedAt}
          </p>
        )}
      </div>
    </div>
  );
}
