import { useState } from 'preact/hooks';
import { calcItem, formatTwd } from '../lib/calc';
import type { Rules } from '../lib/schema';
import { deadlineState } from '../lib/deadline';

interface Row {
  slug: string;
  name: string;
  verifiedAt: string | null;
  verified: boolean;
  items: { name: string; rules: Rules | null; deadline_date: string | null }[];
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
        <label class="flex flex-col text-sm text-text-secondary">縣市
          <select class="field mt-1 text-body" value={slug} onChange={(e) => setSlug((e.target as HTMLSelectElement).value)}>
            {rows.map((r) => <option value={r.slug}>{r.name}</option>)}
          </select>
        </label>
        <label class="flex flex-col text-sm text-text-secondary">年齡（歲）
          <input class="field mt-1 w-28 text-body" type="number" inputMode="numeric" min={0} max={120}
            value={age} onInput={(e) => setAge((e.target as HTMLInputElement).value)} />
        </label>
      </div>

      <div class="mt-4" aria-live="polite">
        {!valid ? (
          <p class="text-text-secondary">請輸入 0–120 的整數年齡。</p>
        ) : !row || !row.verified || row.items.length === 0 ? (
          <p>{row?.name}的重陽敬老金請見說明頁。</p>
        ) : (
          <ul class="space-y-2">
            {row.items.map((it) => {
              const r = calcItem(it.rules ?? undefined, n);
              return (
                <li class="rounded-xl border border-line bg-surface px-4 py-3">
                  <span class="font-medium">{it.name}：</span>
                  {r.status === 'amount' && <strong class="font-medium text-accent-strong">{formatTwd(r.amount)}</strong>}
                  {r.status === 'amount' && deadlineState(it.deadline_date) === 'closed' && <span class="ml-2 inline-block rounded-full border border-line bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text-secondary">已截止</span>}
                  {r.status === 'not_eligible' && <span>{n} 歲不符此項年齡條件</span>}
                  {r.status === 'unknown' && <strong class="text-text-secondary">依公告或需另符合其他條件，請見說明頁</strong>}
                </li>
              );
            })}
          </ul>
        )}
        {valid && row && row.verified && (
          <p class="mt-2 text-sm text-text-secondary">
            僅依一般長者的年齡級距試算；各縣市年齡認定日不同（重陽節當日、年底等），原住民的年齡門檻也較低，其他條件（設籍、所得等）請見<a class="underline" href={`/chongyang-bonus/${row.slug}/`}>{row.name}說明頁</a>。資料最後查證：{row.verifiedAt}
          </p>
        )}
      </div>
    </div>
  );
}
