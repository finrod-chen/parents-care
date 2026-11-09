import { useState } from 'preact/hooks';
import { calcLtc, twd, type LtcData } from '../lib/ltc';

const n = (v: number) => v.toLocaleString('en-US'); // 表格內只放數字，單位寫在表頭
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
  const th = 'px-2.5 py-3 text-left font-medium sm:px-4';
  const td = 'whitespace-nowrap px-2.5 py-3 sm:px-4';
  const row = 'border-t border-line-subtle';

  return (
    <div class="mt-4">
      <div class="flex flex-wrap gap-4">
        <label class="flex flex-col text-sm text-text-secondary">長照需要等級
          <select class="field mt-1 text-body" value={level} onChange={(e) => setLevel(Number((e.target as HTMLSelectElement).value))}>
            {data.care_levels.map((l) => <option value={l.level}>第 {l.level} 級</option>)}
          </select>
        </label>
        <label class="flex flex-col text-sm text-text-secondary">部分負擔身分別
          <select class="field mt-1 text-body" value={classId} onChange={(e) => setClassId(Number((e.target as HTMLSelectElement).value))}>
            {data.copay_classes.map((c) => <option value={c.id}>{c.name}（{c.pct}%）</option>)}
          </select>
        </label>
      </div>
      <p class="mt-2 max-w-[40em] text-sm text-text-muted">{data.copay_classes.find((c) => c.id === classId)?.description}</p>

      <label class="check mt-3 text-body">
        <input type="checkbox" checked={foreign} onChange={(e) => setForeign((e.target as HTMLInputElement).checked)} />
        <span>比較「聘僱外籍家庭看護工」的情況</span>
      </label>

      {foreign && (
        <div class="mt-3 border-t border-line-subtle pt-4">
          <div class="flex flex-wrap gap-4">
            <label class="flex flex-col text-sm text-text-secondary">外籍看護月薪（元）
              <input class="field mt-1 w-40 text-body" type="number" inputMode="numeric" min={0} placeholder="請自行輸入" value={wage} onInput={(e) => setWage((e.target as HTMLInputElement).value)} />
            </label>
            <label class="flex flex-col text-sm text-text-secondary">其他每月費用（元）
              <input class="field mt-1 w-40 text-body" type="number" inputMode="numeric" min={0} placeholder="例：仲介、保險" value={other} onInput={(e) => setOther((e.target as HTMLInputElement).value)} />
            </label>
          </div>
          <label class="check mt-2 text-body">
            <input type="checkbox" checked={exempt} onChange={(e) => setExempt((e.target as HTMLInputElement).checked)} />
            <span>被看護者或雇主屬於就業安定費免繳身分（低收入戶、中低收入戶、領中低收入老人生活津貼、領身心障礙者生活補助）</span>
          </label>
        </div>
      )}

      <div class="mt-5 overflow-hidden rounded-xl border border-line" aria-live="polite">
        <div class="overflow-x-auto overscroll-x-contain">
          <table class="tabular w-full min-w-[20rem] border-collapse text-sm">
            <caption class="sr-only">試算結果</caption>
            <thead>
              <tr class="border-b border-line bg-surface-muted text-text-secondary">
                <th scope="col" class={th}>每月（元）</th>
                <th scope="col" class={th}>只用長照</th>
                {foreign && <th scope="col" class={th}>聘外看</th>}
              </tr>
            </thead>
            <tbody>
              <tr class={row}><th scope="row" class={`${th} w-[32%]`}>可用的長照額度</th><td class={td}>{n(without.quota)}</td>{foreign && <td class={td}>{n(withF.quota)}<span class="block text-xs text-text-muted">額度的 30%</span></td>}</tr>
              <tr class={row}><th scope="row" class={th}>長照部分負擔（{without.pct}%）</th><td class={td}>{n(without.copay)}</td>{foreign && <td class={td}>{n(withF.copay)}</td>}</tr>
              <tr class={row}><th scope="row" class={th}>政府給付</th><td class={td}>{n(without.govPays)}</td>{foreign && <td class={td}>{n(withF.govPays)}</td>}</tr>
              {foreign && withF.foreign && (
                <>
                  <tr class={row}><th scope="row" class={th}>外籍看護月薪</th><td class={`${td} text-text-muted`}>無</td><td class={td}>{withF.foreign.wage === null ? <span class="text-text-secondary">請輸入月薪</span> : n(withF.foreign.wage)}</td></tr>
                  <tr class={row}><th scope="row" class={th}>就業安定費</th><td class={`${td} text-text-muted`}>無</td><td class={td}>{n(withF.foreign.fee)}{exempt ? '（免繳）' : ''}</td></tr>
                  <tr class={row}><th scope="row" class={th}>其他每月費用</th><td class={`${td} text-text-muted`}>無</td><td class={td}>{n(withF.foreign.other)}</td></tr>
                </>
              )}
              <tr class={`${row} bg-accent-subtle`}><th scope="row" class={`${th} text-accent-strong`}>家庭每月支出（估）</th><td class={`${td} font-medium`}>{n(without.copay)}</td>{foreign && <td class={`${td} font-medium`}>{withF.familyTotal === null ? <span class="font-normal text-text-secondary">輸入月薪後計算</span> : n(withF.familyTotal)}</td>}</tr>
            </tbody>
          </table>
        </div>
      </div>
      <p class="mt-3 max-w-[40em] text-sm text-text-muted">假設額度全部用完；未含超出額度的自費、交通接送、輔具、喘息服務與其他補助。「只用長照」一欄僅列部分負擔，實際照顧安排不同，支出會不同。</p>
    </div>
  );
}
