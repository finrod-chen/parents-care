/** 主題表。slug 要帶關鍵字且一經上線不得更改。 */
export const TOPICS = [
  {
    slug: 'chongyang-bonus',
    title: '重陽敬老金',
    overviewTitle: '重陽敬老金各縣市比較與試算',
    intro: '各縣市重陽敬老金（重陽節禮金）的發放對象、金額與領取方式。',
    amountLabel: '金額',
    showDeadline: true,
    notice: [] as string[],
  },
  {
    slug: 'denture-subsidy',
    title: '老人假牙補助',
    overviewTitle: '老人假牙補助各縣市比較',
    intro: '各縣市長者活動假牙（全口、部分）補助的資格、金額與申請方式。',
    amountLabel: '補助額度',
    showDeadline: true,
    notice: [
      '假牙補助通常須牙醫評估、事前核准，並到特約院所施作；已先做的通常不補助。',
      '一般戶、弱勢身分、原住民專案可能是不同計畫，資格與額度不能混用。',
    ] as string[],
  },
  {
    slug: 'senior-card',
    title: '敬老卡／愛心卡優惠',
    overviewTitle: '敬老卡／愛心卡優惠各縣市比較',
    intro: '各縣市敬老卡、愛心卡的資格、點數或乘車優惠，以及申請方式。',
    amountLabel: '福利內容',
    showDeadline: false,
    notice: [
      '點數是指定用途的社福點，不是現金；路線、合作店家、單趟上限與月底是否歸零，依各縣市公告。',
      '有些縣市不是點數制，而是公車免費或半價。',
    ] as string[],
  },
] as const;

export type TopicSlug = (typeof TOPICS)[number]['slug'];
export const TOPIC_SLUGS = TOPICS.map((t) => t.slug) as unknown as readonly [TopicSlug, ...TopicSlug[]];

export function topicOf(slug: string) {
  const t = TOPICS.find((x) => x.slug === slug);
  if (!t) throw new Error(`未知的主題 slug：${slug}`);
  return t;
}
