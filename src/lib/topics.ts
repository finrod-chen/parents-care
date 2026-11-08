/** 主題表。slug 要帶關鍵字且一經上線不得更改。 */
export const TOPICS = [
  {
    slug: 'chongyang-bonus',
    title: '重陽敬老金',
    overviewTitle: '重陽敬老金各縣市比較與試算',
    intro: '各縣市重陽敬老金（重陽節禮金）的發放對象、金額與領取方式。',
  },
  {
    slug: 'denture-subsidy',
    title: '老人假牙補助',
    overviewTitle: '老人假牙補助各縣市比較',
    intro: '各縣市長者活動假牙（全口、部分）補助的資格、金額與申請方式。',
  },
  {
    slug: 'senior-card',
    title: '敬老卡／愛心卡點數',
    overviewTitle: '敬老卡／愛心卡點數各縣市比較',
    intro: '有實施敬老卡或愛心卡點數的縣市，點數額度、用途與領取方式。',
  },
] as const;

export type TopicSlug = (typeof TOPICS)[number]['slug'];
export const TOPIC_SLUGS = TOPICS.map((t) => t.slug) as unknown as readonly [TopicSlug, ...TopicSlug[]];

export function topicOf(slug: string) {
  const t = TOPICS.find((x) => x.slug === slug);
  if (!t) throw new Error(`未知的主題 slug：${slug}`);
  return t;
}
