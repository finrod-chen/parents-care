import { useState } from 'preact/hooks';
import { checkAllowance, type AllowanceData, type RealEstate, type Status } from '../lib/allowance';
import type { CountySlug } from '../lib/counties';

const num = (v: string): number | null => (v.trim() === '' || Number.isNaN(Number(v)) || Number(v) < 0 ? null : Number(v));
// 狀態一律「符號＋文字」，不只靠顏色
const icon: Record<Status, string> = { pass: '✔', fail: '✘', unknown: '？', skip: '免' };
const tone: Record<Status, string> = { pass: 'text-accent-strong', fail: 'text-danger', unknown: 'text-text-secondary', skip: 'text-text-muted' };
const word: Record<Status, string> = { pass: '符合', fail: '不符合', unknown: '待確認', skip: '免審' };

export default function AllowanceChecker({ data, counties }: { data: AllowanceData; counties: { slug: CountySlug; name: string }[] }) {
  const [county, setCounty] = useState<CountySlug>('taipei');
  const [age, setAge] = useState('');
  const [household, setHousehold] = useState('1');
  const [income, setIncome] = useState('');
  const [deposits, setDeposits] = useState('');
  const [listed, setListed] = useState(false);
  const [reside, setReside] = useState(true);
  const [overseas, setOverseas] = useState(true);
  const [care, setCare] = useState(true);
  const [prison, setPrison] = useState(true);
  const [estate, setEstate] = useState<RealEstate>('unknown');

  const r = checkAllowance(data, {
    county, age: num(age), residesAtRegistered: reside, overseasOk: overseas, notInCare: care, notInPrison: prison,
    listedLowIncome: listed, household: Math.max(1, Math.floor(num(household) ?? 1)), totalIncome: num(income), deposits: num(deposits), realEstate: estate,
  });
  const lab = 'flex flex-col text-sm text-text-secondary';
  const on = (set: (v: boolean) => void) => (e: Event) => set((e.target as HTMLInputElement).checked);

  return (
    <div class="mt-4">
      <div class="flex flex-wrap gap-4">
        <label class={lab}>戶籍縣市
          <select class="field mt-1 text-body" value={county} onChange={(e) => setCounty((e.target as HTMLSelectElement).value as CountySlug)}>
            {counties.map((c) => <option value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label class={lab}>年齡（歲）
          <input class="field mt-1 w-28 text-body" type="number" inputMode="numeric" min={0} value={age} onInput={(e) => setAge((e.target as HTMLInputElement).value)} />
        </label>
      </div>

      <label class="check mt-3 text-body">
        <input type="checkbox" checked={listed} onChange={on(setListed)} />
        <span>已列冊為低收入戶或中低收入戶（免審查收入與財產）</span>
      </label>

      {!listed && (
        <div class="mt-3 border-t border-line-subtle pt-4">
          <div class="flex flex-wrap gap-4">
            <label class={lab}>家庭應計算人口（人）
              <input class="field mt-1 w-28 text-body" type="number" inputMode="numeric" min={1} value={household} onInput={(e) => setHousehold((e.target as HTMLInputElement).value)} />
            </label>
            <label class={lab}>家庭每月總收入（元）
              <input class="field mt-1 w-40 text-body" type="number" inputMode="numeric" min={0} value={income} onInput={(e) => setIncome((e.target as HTMLInputElement).value)} />
            </label>
            <label class={lab}>全家存款、投資與有價證券合計（元）
              <input class="field mt-1 w-48 text-body" type="number" inputMode="numeric" min={0} value={deposits} onInput={(e) => setDeposits((e.target as HTMLInputElement).value)} />
            </label>
          </div>
          <label class={`${lab} mt-4`}>土地與房屋價值是否未超過戶籍縣市的標準
            <select class="field mt-1 max-w-sm text-body" value={estate} onChange={(e) => setEstate((e.target as HTMLSelectElement).value as RealEstate)}>
              <option value="unknown">不確定，尚未確認</option>
              <option value="ok">已確認未超過</option>
              <option value="over">已確認超過</option>
            </select>
          </label>
        </div>
      )}

      <fieldset class="mt-4 border-t border-line-subtle pt-3">
        <legend class="text-sm font-medium text-text-secondary">其他條件（預設為符合，不符請取消勾選）</legend>
        <label class="check text-body"><input type="checkbox" checked={reside} onChange={on(setReside)} /><span>實際居住在戶籍所在地的縣市</span></label>
        <label class="check text-body"><input type="checkbox" checked={overseas} onChange={on(setOverseas)} /><span>最近一年居住國內超過 183 日</span></label>
        <label class="check text-body"><input type="checkbox" checked={care} onChange={on(setCare)} /><span>沒有接受政府公費收容安置</span></label>
        <label class="check text-body"><input type="checkbox" checked={prison} onChange={on(setPrison)} /><span>沒有入獄服刑、羈押或依法拘禁</span></label>
      </fieldset>

      <div class="mt-5" aria-live="polite">
        <div class={`rounded-xl p-4 ${r.verdict === 'likely' ? 'bg-accent-subtle' : 'bg-surface-muted'}`}>
          {r.verdict === 'likely' && (
            <>
              <p class="text-lg font-medium text-accent-strong">初步看起來可能符合{r.amount ? `，每月約 ${r.amount.toLocaleString('en-US')} 元` : ''}</p>
              {r.tier && <p class="mt-1 text-sm text-text-secondary">{r.tier === 1 ? `家庭每人每月平均收入未達${r.area}最低生活費 1.5 倍，適用第一級金額。` : `家庭每人每月平均收入在${r.area}最低生活費 1.5 倍以上，適用第二級金額。`}另有 {data.amounts.bonus_period} 每月加發 {data.amounts.bonus_twd} 元。</p>}
              {r.items.some((x) => x.id === 'realestate' && x.status === 'unknown') && <p class="mt-1 text-sm text-text-secondary">還需向公所確認土地與房屋價值是否超過標準。</p>}
            </>
          )}
          {r.verdict === 'unlikely' && <p class="font-medium">依你輸入的條件，初步看起來不符合（見下方標示「不符合」的項目）。</p>}
          {r.verdict === 'incomplete' && <p class="font-medium">還缺資料，請補上年齡、收入或存款。</p>}
        </div>

        <ul class="mt-4 divide-y divide-line-subtle overflow-hidden rounded-xl border border-line text-sm">
          {r.items.map((it) => (
            <li class="flex gap-3 px-4 py-3">
              <span class={`w-5 flex-none text-center font-medium ${tone[it.status]}`} aria-hidden="true">{icon[it.status]}</span>
              <span><span class="font-medium">{it.label}</span>　<span class={`font-medium ${tone[it.status]}`}>{word[it.status]}</span>{it.detail !== '符合' && it.detail !== '不符合' && <><br /><span class="text-text-muted">{it.detail}</span></>}</span>
            </li>
          ))}
        </ul>
        <p class="mt-3 max-w-[40em] text-sm text-text-muted">初步檢核，不代表核定結果；實際以戶籍地公所審查為準。同時符合老農津貼、國民年金老年基本保證年金、身障生活補助費等資格者只能擇一領取。</p>
      </div>
    </div>
  );
}
