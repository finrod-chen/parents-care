/**
 * 插圖來源：いらすとや（https://www.irasutoya.com/）作者：みふねたかし
 * 規約（https://www.irasutoya.com/p/terms.html）：個人／法人／商用皆可免費使用，
 * 但「商用設計使用 21 點以上素材（重複算 1 點）需有償授權」。
 * → 全站不重複插圖數上限 20，tests/illustrations.test.ts 會把關；本站目前遠低於上限。
 * 著作權未放棄：每頁頁尾標示出處；不得把素材當成主體再散布／販售。
 */
import grandparentsSmile from '../assets/illust/grandparents-smile.png';
import worriedDaughter from '../assets/illust/worried-daughter.png';
import coupleFlower from '../assets/illust/couple-flower.png';
import familyKeirou from '../assets/illust/family-keirou.png';
import grandkidMassage from '../assets/illust/grandkid-massage.png';
import grandma from '../assets/illust/grandma.png';
import grandmaSmile from '../assets/illust/grandma-smile.png';
import grandmaCrossword from '../assets/illust/grandma-crossword.png';

export const ILLUSTRATIONS = {
  'grandparents-smile': { img: grandparentsSmile, alt: '笑咪咪的爺爺和奶奶' },
  'worried-daughter': { img: worriedDaughter, alt: '想著爸媽、有點擔心的子女' },
  'couple-flower': { img: coupleFlower, alt: '捧著花束開心的爺爺和奶奶' },
  'family-keirou': { img: familyKeirou, alt: '和爺爺奶奶一起過節的一家人' },
  'grandkid-massage': { img: grandkidMassage, alt: '孫子幫爺爺奶奶搥背' },
  grandma: { img: grandma, alt: '笑容可掬的奶奶' },
  'grandma-smile': { img: grandmaSmile, alt: '微笑的奶奶' },
  'grandma-crossword': { img: grandmaCrossword, alt: '正在玩填字遊戲的奶奶' },
} as const;

export type IllustId = keyof typeof ILLUSTRATIONS;
export const MAX_ILLUSTRATIONS = 20;

/** 各主題頁使用的插圖 */
export const TOPIC_ILLUST: Record<string, IllustId> = {
  'chongyang-bonus': 'couple-flower',
  'denture-subsidy': 'grandma',
  'senior-card': 'grandkid-massage',
};

export const CREDIT = { name: 'いらすとや', url: 'https://www.irasutoya.com/' };
