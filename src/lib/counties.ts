/**
 * 22 縣市固定 slug 表。slug 一經上線不得更改（會影響 SEO 與外部連結）。
 * 顯示名稱用日常寫法「台」，與搜尋習慣一致。
 */
export const COUNTIES = [
  { slug: 'taipei', name: '台北市', kind: 'municipality' },
  { slug: 'new-taipei', name: '新北市', kind: 'municipality' },
  { slug: 'taoyuan', name: '桃園市', kind: 'municipality' },
  { slug: 'taichung', name: '台中市', kind: 'municipality' },
  { slug: 'tainan', name: '台南市', kind: 'municipality' },
  { slug: 'kaohsiung', name: '高雄市', kind: 'municipality' },
  { slug: 'keelung', name: '基隆市', kind: 'city' },
  { slug: 'hsinchu-city', name: '新竹市', kind: 'city' },
  { slug: 'chiayi-city', name: '嘉義市', kind: 'city' },
  { slug: 'hsinchu-county', name: '新竹縣', kind: 'county' },
  { slug: 'miaoli', name: '苗栗縣', kind: 'county' },
  { slug: 'changhua', name: '彰化縣', kind: 'county' },
  { slug: 'nantou', name: '南投縣', kind: 'county' },
  { slug: 'yunlin', name: '雲林縣', kind: 'county' },
  { slug: 'chiayi-county', name: '嘉義縣', kind: 'county' },
  { slug: 'pingtung', name: '屏東縣', kind: 'county' },
  { slug: 'yilan', name: '宜蘭縣', kind: 'county' },
  { slug: 'hualien', name: '花蓮縣', kind: 'county' },
  { slug: 'taitung', name: '台東縣', kind: 'county' },
  { slug: 'penghu', name: '澎湖縣', kind: 'county' },
  { slug: 'kinmen', name: '金門縣', kind: 'county' },
  { slug: 'lienchiang', name: '連江縣', kind: 'county' },
] as const;

export type CountySlug = (typeof COUNTIES)[number]['slug'];

export const COUNTY_SLUGS = COUNTIES.map((c) => c.slug) as unknown as readonly [CountySlug, ...CountySlug[]];

const byslug = new Map<string, (typeof COUNTIES)[number]>(COUNTIES.map((c) => [c.slug, c]));

export function countyName(slug: string): string {
  const c = byslug.get(slug);
  if (!c) throw new Error(`未知的縣市 slug：${slug}`);
  return c.name;
}
