import { useState } from 'preact/hooks';
import { calcLtc, twd, type LtcData } from '../lib/ltc';

const num = (v: string): number | null => (v.trim() === '' || Number.isNaN(Number(v)) || Number(v) < 0 ? null : Math.floor(Number(v)));

export default function LtcCalculator({ data }: { data: LtcData }) {
  const [level, setLevel] = useState(4);
  const [classId, setClassId] = useState(3);
  const [foreign, setForeign] = useState(false);
  const [wage, setWage] = useState('');
  const [other, setOther] = useState('');
  const [exempt, setExempt] = useState(false);

  const base = { level, classId, wage: null, otherMonthly: 0, feeExempt: false };
  const without = calcLtc(data, { ...base, foreignCaregiver: false });
  const withF = calcLtc(data, { ...base, foreignCaregiver: true, wage: num(wage), otherMonthly: num(other) ?? 0, feeExempt: exempt });
  const field = 'mt-1 rounded border border-slate-400 p-2 text-base';

  return (
    <div class="mt-3">
      <div class="flex flex-wrap gap-4">
        <label class="flex flex-col text-sm">長照需要等級
          <select class={field} value={level} onChange={(e) => setLevel(Number((e.target as HTMLSelectElement).value))}>
            {data.care_levels.map((l) => <option value={l.level}>第 {l.level} 級</option>)}
          </select>
        </label>
        <label class="flex flex-col text-sm">部分負擔身分別
          <select class={field} value={classId} onChange={(e) => setClassId(Number((e.target as HTMLSelectElement).value))}>
            {data.copay_classes.map((c) => <option value={c.id}>{c.name}（{c.pct}%）</option>)}
          </select>
        </label>
      </div>
      <p class="mt-1 text-xs text-slate-600">{data.copay_classes.find((c) => c.id === classId)?.description}</p>

      <label class="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" class="h-5 w-5" checked={foreign} onChange={(e) => setForeign((e.target as HTMLInputElement).checked)} />
        比較「聘僱外籍家庭看護工」的情況
      </label>

      {foreign && (
        <div class="mt-3 rounded-2xl bg-teal-50 p-4">
          <div class="flex flex-wrap gap-4">
            <label class="flex flex-col text-sm">外籍看護月薪（元）
              <input class={`${field} w-36`} type="number" inputMode="numeric" min={0} placeholder="請自行輸入" value={wage} onInput={(e) => setWage((e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex flex-col text-sm">其他每月費用（元）
              <input class={`${field} w-36`} type="number" inputMode="numeric" min={0} placeholder="例：仲介、保險" value={other} onInput={(e) => setOther((e.target as HTMLInputElement).value)} />
            </label>
          </div>
          <label class="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" class="mt-1 h-5 w-5" checked={exempt} onChange={(e) => setExempt((e.target as HTMLInputElement).checked)} />
            <span>被看護者或雇主屬於就業安定費免繳身分（低收入戶／中低收入戶、領中低收入老人生活津貼、領身心障礙者生活補助）</span>
          </label>
        </div>
      )}

      <div class="mt-4 overflow-x-auto" aria-live="polite">
        <table class="w-full border-collapse text-left text-sm">
          <caption class="sr-only">試算結果</caption>
          <thead>
            <tr class="bg-teal-100">
              <th scope="col" class="p-2">每月</th>
              <th scope="col" class="p-2">只用長照</th>
              {foreign && <th scope="col" class="p-2">聘外看</th>}
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-teal-100"><th scope="row" class="p-2 font-medium">可用的長照額度</th><td class="p-2">{twd(without.quota)}</td>{foreign && <td class="p-2">{twd(withF.quota)}（30%）</td>}</tr>
            <tr class="border-b border-teal-100"><th scope="row" class="p-2 font-medium">長照部分負擔（{without.pct}%）</th><td class="p-2">{twd(without.copay)}</td>{foreign && <td class="p-2">{twd(withF.copay)}</td>}</tr>
            <tr class="border-b border-teal-100"><th scope="row" class="p-2 font-medium">政府給付</th><td class="p-2">{twd(without.govPays)}</td>{foreign && <td class="p-2">{twd(withF.govPays)}</td>}</tr>
            {foreign && withF.foreign && (
              <>
                <tr class="border-b border-teal-100"><th scope="row" class="p-2 font-medium">外籍看護月薪</th><td class="p-2">—</td><td class="p-2">{withF.foreign.wage === null ? <span class="text-rose-700">請輸入</span> : twd(withF.foreign.wage)}</td></tr>
                <tr class="border-b border-teal-100"><th scope="row" class="p-2 font-medium">就業安定費</th><td class="p-2">—</td><td class="p-2">{twd(withF.foreign.fee)}{exempt ? '（免繳）' : ''}</td></tr>
                <tr class="border-b border-teal-100"><th scope="row" class="p-2 font-medium">其他每月費用</th><td class="p-2">—</td><td class="p-2">{twd(withF.foreign.other)}</td></tr>
              </>
            )}
            <tr class="bg-teal-50 font-bold"><th scope="row" class="p-2">家庭每月支出（估）</th><td class="p-2">{twd(without.copay)}</td>{foreign && <td class="p-2">{withF.familyTotal === null ? <span class="text-rose-700">輸入月薪後計算</span> : twd(withF.familyTotal)}</td>}</tr>
          </tbody>
        </table>
      </div>
      <p class="mt-2 text-xs text-slate-600">假設額度全部用完；未含超出額度的自費、交通接送、輔具、喘息服務與其他補助。「只用長照服務」一欄僅列部分負擔，實際照顧安排不同，支出會不同。</p>
    </div>
  );
}
