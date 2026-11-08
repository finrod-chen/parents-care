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
