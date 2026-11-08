import { useState } from 'preact/hooks';
import { checkAllowance, type AllowanceData, type RealEstate, type Status } from '../lib/allowance';
import type { CountySlug } from '../lib/counties';

const num = (v: string): number | null => (v.trim() === '' || Number.isNaN(Number(v)) || Number(v) < 0 ? null : Number(v));
const icon: Record<Status, string> = { pass: '✔', fail: '✘', unknown: '？', skip: '－' };
const tone: Record<Status, string> = { pass: 'text-teal-800', fail: 'text-rose-700', unknown: 'text-slate-600', skip: 'text-slate-500' };
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
  const field = 'mt-1 rounded border border-slate-400 p-2 text-base';
  const chk = 'h-5 w-5 mt-0.5';

  return (
    <div class="mt-3">
      <div class="flex flex-wrap gap-4">
        <label class="flex flex-col text-sm">戶籍縣市
          <select class={field} value={county} onChange={(e) => setCounty((e.target as HTMLSelectElement).value as CountySlug)}>
            {counties.map((c) => <option value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label class="flex flex-col text-sm">年齡（歲）
          <input class={`${field} w-24`} type="number" inputMode="numeric" min={0} value={age} onInput={(e) => setAge((e.target as HTMLInputElement).value)} />
        </label>
      </div>

      <label class="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" class={chk} checked={listed} onChange={(e) => setListed((e.target as HTMLInputElement).checked)} />
        <span>已列冊為低收入戶或中低收入戶（免審查收入與財產）</span>
      </label>

      {!listed && (
        <div class="mt-3 rounded-2xl bg-teal-50 p-4">
          <div class="flex flex-wrap gap-4">
            <label class="flex flex-col text-sm">家庭應計算人口（人）
              <input class={`${field} w-24`} type="number" inputMode="numeric" min={1} value={household} onInput={(e) => setHousehold((e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex flex-col text-sm">家庭每月總收入（元）
              <input class={`${field} w-36`} type="number" inputMode="numeric" min={0} value={income} onInput={(e) => setIncome((e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex flex-col text-sm">全家存款、投資與有價證券合計（元）
              <input class={`${field} w-44`} type="number" inputMode="numeric" min={0} value={deposits} onInput={(e) => setDeposits((e.target as HTMLInputElement).value)} />
            </label>
          </div>
          <label class="mt-3 flex flex-col text-sm">土地與房屋價值是否未超過戶籍縣市的標準
            <select class={field} value={estate} onChange={(e) => setEstate((e.target as HTMLSelectElement).value as RealEstate)}>
              <option value="unknown">不確定／尚未確認</option>
              <option value="ok">已確認未超過</option>
              <option value="over">已確認超過</option>
            </select>
          </label>
        </div>
      )}

      <fieldset class="mt-4 space-y-2 text-sm">
        <legend class="font-medium">其他條件（預設為符合，不符請取消勾選）</legend>
        <label class="flex items-start gap-2"><input type="checkbox" class={chk} checked={reside} onChange={(e) => setReside((e.target as HTMLInputElement).checked)} />實際居住在戶籍所在地的縣市</label>
        <label class="flex items-start gap-2"><input type="checkbox" class={chk} checked={overseas} onChange={(e) => setOverseas((e.target as HTMLInputElement).checked)} />最近一年居住國內超過 183 日</label>
        <label class="flex items-start gap-2"><input type="checkbox" class={chk} checked={care} onChange={(e) => setCare((e.target as HTMLInputElement).checked)} />沒有接受政府公費收容安置</label>
        <label class="flex items-start gap-2"><input type="checkbox" class={chk} checked={prison} onChange={(e) => setPrison((e.target as HTMLInputElement).checked)} />沒有入獄服刑、羈押或依法拘禁</label>
      </fieldset>

      <div class="mt-5" aria-live="polite">
        <ul class="space-y-1 text-sm">
          {r.items.map((it) => (
            <li class="flex gap-2">
              <span class={`w-5 text-center font-bold ${tone[it.status]}`} aria-hidden="true">{icon[it.status]}</span>
              <span><strong>{it.label}</strong>：<span class={tone[it.status]}>{word[it.status]}</span>　<span class="text-slate-600">{it.detail}</span></span>
            </li>
          ))}
        </ul>

        <div class={`mt-4 rounded-2xl p-4 ${r.verdict === 'likely' ? 'bg-teal-100' : r.verdict === 'unlikely' ? 'bg-rose-50' : 'bg-slate-100'}`}>
          {r.verdict === 'likely' && (
            <>
              <p class="text-lg font-bold">初步看起來可能符合{r.amount ? `，每月約 ${r.amount.toLocaleString('en-US')} 元` : ''}</p>
              {r.tier && <p class="mt-1 text-sm">{r.tier === 1 ? `家庭每人每月平均收入未達${r.area}最低生活費 1.5 倍，適用第一級金額。` : `家庭每人每月平均收入在${r.area}最低生活費 1.5 倍以上，適用第二級金額。`}另有 {data.amounts.bonus_period} 每月加發 {data.amounts.bonus_twd} 元。</p>}
              {r.items.some((x) => x.id === 'realestate' && x.status === 'unknown') && <p class="mt-1 text-sm text-slate-700">還需向公所確認土地與房屋價值是否超過標準。</p>}
            </>
          )}
          {r.verdict === 'unlikely' && <p class="font-bold text-rose-800">依你輸入的條件，初步看起來不符合（見上方打叉項目）。</p>}
          {r.verdict === 'incomplete' && <p class="font-bold">還缺資料，請補上年齡、收入或存款。</p>}
        </div>
        <p class="mt-2 text-xs text-slate-600">初步檢核，不代表核定結果；實際以戶籍地公所審查為準。同時符合老農津貼、國民年金老年基本保證年金、身障生活補助費等資格者只能擇一領取。</p>
      </div>
    </div>
  );
}
