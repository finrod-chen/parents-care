/** 由 brand-src/logo-horizontal.png 產生社群分享圖 public/og.png（1200×630）。用法：npx tsx scripts/make-og.ts */
import sharp from 'sharp';

const W = 1200, H = 630;
const logo = await sharp('brand-src/logo-horizontal.png').resize({ width: 820 }).toBuffer();
await sharp({ create: { width: W, height: H, channels: 4, background: '#F6FBFA' } })
  .composite([{ input: logo, gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toFile('public/og.png');
console.log('public/og.png');
