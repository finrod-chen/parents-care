import { SITE_NAME, SITE_URL } from './site';
import type { Faq } from './schema';

export const absUrl = (p: string) => new URL(p, SITE_URL).toString();

export type Crumb = { name: string; path: string };

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absUrl(c.path),
    })),
  };
}

export function faqLd(faq: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function webAppLd(o: { name: string; path: string; description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: o.name,
    url: absUrl(o.path),
    description: o.description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    inLanguage: 'zh-TW',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
  };
}

export const withSite = (title: string) => `${title}｜${SITE_NAME}`;

/** JSON-LD 內嵌用：避免 </script> 提前結束 */
export const ldString = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c');

/** 發布者（Article、WebSite 共用同一個 @id，讓搜尋引擎認得是同一個實體） */
export const ORG_ID = `${SITE_URL}/#organization`;
const logoUrl = () => absUrl('/apple-touch-icon.png');

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: logoUrl() },
  };
}

/** 本站沒有站內搜尋，所以不宣告 SearchAction（不標示不存在的功能） */
export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'zh-TW',
    publisher: { '@id': ORG_ID },
  };
}

/** 縣市頁：dateModified＝最後查證日，publisher＝爸媽領 */
export function articleLd(o: { headline: string; description: string; path: string; dateModified: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: o.headline,
    description: o.description,
    inLanguage: 'zh-TW',
    mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl(o.path) },
    image: absUrl('/og.png'),
    dateModified: o.dateModified,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: logoUrl() } },
  };
}
