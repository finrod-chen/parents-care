import type { Entry } from './data';
import { countyName } from './counties';
import { topicOf } from './topics';
import { withSite } from './seo';

const endSentence = (s: string) => (/[。！？]$/.test(s) ? s : `${s}。`);

/**
 * 縣市頁的 title／description。
 * - title：資料檔有 seo.title 就用它（符合該縣市實際搜尋用字），否則「縣市＋主題＋年份：金額、資格與申請方式」。年份取資料自己的 year。
 * - description：第一句是具體數字（來自 summary，或 seo.description），「資料最後查證」放句尾。
 */
export function countyPageMeta(e: Entry): { h1: string; headline: string; title: string; description: string } {
  const topic = topicOf(e.topic);
  const name = countyName(e.county);
  const h1 = `${name}${topic.title}`;
  if (e.status !== 'verified') return { h1, headline: h1, title: withSite(h1), description: `${h1}的資格、金額與申請方式。` };
  const headline = e.seo?.title ?? `${h1}${e.year}：${topic.amountLabel}、資格與申請方式`;
  const title = withSite(headline);
  const description = `${endSentence(e.seo?.description ?? e.summary)}資料最後查證：${e.verified_at}。`;
  return { h1, headline, title, description };
}
