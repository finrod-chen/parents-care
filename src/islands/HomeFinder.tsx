import { useState } from 'preact/hooks';

interface Props {
  topics: { slug: string; title: string }[];
  counties: { slug: string; name: string }[];
  /** availability[topic][county] = 'verified' | 'todo'；沒有 key = 該縣市沒有此主題頁 */
  availability: Record<string, Record<string, 'verified' | 'todo'>>;
}

export default function HomeFinder({ topics, counties, availability }: Props) {
  const [age, setAge] = useState('');
  const [county, setCounty] = useState(counties[0]?.slug ?? '');
  const n = Number(age);
  const valid = age !== '' && Number.isInteger(n) && n >= 0 && n <= 120;
  const cname = counties.find((c) => c.slug === county)?.name ?? '';

  return (
    <div>
      <div class="flex flex-wrap gap-4">
        <label class="flex flex-col text-sm">爸媽幾歲
          <input class="mt-1 w-28 rounded border border-slate-400 p-2 text-base" type="number" inputMode="numeric" min={0} max={120}
            value={age} onInput={(e) => setAge((e.target as HTMLInputElement).value)} />
        </label>
        <label class="flex flex-col text-sm">住哪個縣市
          <select class="mt-1 rounded border border-slate-400 p-2 text-base" value={county} onChange={(e) => setCounty((e.target as HTMLSelectElement).value)}>
            {counties.map((c) => <option value={c.slug}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <div class="mt-4" aria-live="polite">
        {!valid ? (
          <p class="text-slate-600">輸入年齡與縣市，列出可查的項目。</p>
        ) : (
          <ul class="space-y-2">
            <li class="text-slate-600">{n} 歲、{cname}可查：</li>
            {topics.map((t) => {
              const st = availability[t.slug]?.[county];
              return (
                <li class="rounded border border-teal-200 p-3">
                  {st ? <a class="font-medium text-brand-dark underline" href={`/${t.slug}/${county}/`}>{t.title}</a> : <span class="font-medium">{t.title}</span>}
                  {st === 'verified' && <span class="ml-2 text-sm">已查證，點進去看資格與金額</span>}
                  {st === 'todo' && <span class="ml-2 text-sm text-rose-700">資料準備中</span>}
                  {!st && <span class="ml-2 text-sm text-slate-600">此縣市沒有這項</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
