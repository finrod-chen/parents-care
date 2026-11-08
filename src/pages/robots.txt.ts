import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/site';

/**
 * 一般搜尋引擎全部允許；AI 模型訓練與 AI 代理類爬蟲維持封鎖（沿用 Cloudflare 預設的封鎖名單）。
 * 要放行某個爬蟲，從下方清單移除即可。
 * 注意：Cloudflare 的「Bot Preference Sync／Managed robots.txt」已在 zone 關閉，
 * 否則它會在最前面插入 Lighthouse 不認得的 Content-Signal 指令，使 SEO 稽核扣分。
 */
export const AI_TRAINING_BOTS = [
  'Amazonbot', 'Applebot-Extended', 'Bytespider', 'CCBot', 'ClaudeBot', 'Diffbot', 'Google-Extended', 'GPTBot', 'omgili',
  'anthropic-ai', 'Claude-Web', 'cohere-ai', 'MistralAI-Training', 'meta-externalagent', 'GoogleOther', 'Baiduspider', 'PetalBot',
  'AwarioSmartBot', 'AwarioRssBot', 'Google-CloudVertexBot', 'QualifiedBot', 'Cotoyogi', 'ICC-Crawler', 'atlassian-bot', 'FishBot',
  'BorderxBot', 'NavuBot', 'SemrushBot-SWA', 'WARDBot', 'magpie-crawler', 'KimiBot', 'CitibotSiteCrawler',
];
export const AI_AGENT_BOTS = [
  'Perplexity-User', 'FireCrawl', 'FirecrawlAgent', 'Claude-User', 'ChatGPT-User', 'Google-Agent', 'Google-GeminiNotebook',
  'Google-NotebookLM', 'MistralAI-User', 'Kimi-User', 'Amzn-User', 'meta-externalfetcher', 'Retool', 'Instapaper', 'ChathiveCrawler',
];

export const robotsTxt = () =>
  [
    '# AI 模型訓練爬蟲',
    ...AI_TRAINING_BOTS.map((b) => `User-agent: ${b}\nDisallow: /\n`),
    '# AI 代理',
    ...AI_AGENT_BOTS.map((b) => `User-agent: ${b}\nDisallow: /\n`),
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE_URL}/sitemap-index.xml`,
    '',
  ].join('\n');

export const GET: APIRoute = () => new Response(robotsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
