import { loadAll } from '../src/lib/data';

try {
  const entries = loadAll();
  const v = entries.filter((e) => e.status === 'verified').length;
  console.log(`✔ 資料驗證通過：${entries.length} 檔（已查證 ${v}、待補 ${entries.length - v}）`);
} catch (e) {
  console.error(`✘ ${(e as Error).message}`);
  process.exit(1);
}
