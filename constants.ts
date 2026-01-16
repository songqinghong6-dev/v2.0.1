
import { Rarity, Card } from './types';

const POKEMON_NAMES_151 = [
  "妙蛙种子", "妙蛙草", "妙蛙花", "小火龙", "火恐龙", "喷火龙", "杰尼龟", "卡米龟", "水箭龟", "绿毛虫",
  "铁甲蛹", "巴大蝶", "独角虫", "铁壳蛹", "大针蜂", "波波", "比比鸟", "大比鸟", "小拉达", "拉达",
  "烈雀", "大嘴雀", "阿柏蛇", "阿柏怪", "皮卡丘", "雷丘", "穿山鼠", "穿山王", "尼多兰", "尼多娜",
  "尼多后", "尼多朗", "尼多力诺", "尼多王", "皮皮", "皮可西", "六尾", "九尾", "胖丁", "胖可丁",
  "超音蝠", "大嘴蝠", "走路草", "臭臭花", "霸王花", "派拉斯", "派拉斯特", "毛球", "摩鲁蛾", "地鼠",
  "三地鼠", "喵喵", "猫老大", "可达鸭", "哥达鸭", "猴怪", "火暴猴", "卡蒂狗", "风速狗", "蚊香蝌蚪",
  "蚊香君", "蚊香泳士", "凯西", "勇基拉", "胡地", "腕力", "豪力", "怪力", "喇叭芽", "口呆花",
  "大食花", "玛瑙水母", "毒刺水母", "小拳石", "隆隆石", "隆隆岩", "小火马", "烈焰马", "呆呆兽", "呆壳兽",
  "小磁怪", "三合一磁怪", "大葱鸭", "嘟嘟", "嘟嘟利", "小海狮", "白海狮", "臭泥", "臭臭泥", "大舌贝",
  "刺甲贝", "鬼斯", "鬼斯通", "耿鬼", "大岩蛇", "素利普", "引梦貘人", "大钳蟹", "巨钳蟹", "雷电球",
  "顽皮雷弹", "蛋蛋", "椰蛋树", "可拉可拉", "嘎啦嘎啦", "飞腿郎", "快拳郎", "大舌头", "瓦斯弹", "双弹瓦斯",
  "独角犀牛", "钻角犀兽", "吉利蛋", "蔓藤怪", "袋兽", "墨海马", "海刺龙", "角金鱼", "金鱼王", "海星星",
  "宝石海星", "魔墙人偶", "飞天螳螂", "迷唇姐", "电击兽", "鸭嘴火兽", "凯罗斯", "肯泰罗", "鲤鱼王", "暴鲤龙",
  "拉普拉斯", "百变怪", "伊布", "水伊布", "雷伊布", "火伊布", "多边兽", "菊石兽", "多刺菊石兽", "化石盔",
  "镰刀盔", "化石翼龙", "卡比兽", "急冻鸟", "闪电鸟", "火焰鸟", "迷你龙", "哈克龙", "快龙", "超梦", "梦幻"
];

const EX_INDICES = [3, 6, 9, 24, 40, 65, 76, 115, 124, 145, 151];

const buildPool = (): Card[] => {
  // 1. 皇冠级 (CROWN) - 极高稀有 SAR
  const crownData = [
    { num: 203, name: "莉佳的招待 (SAR)" },
    { num: 204, name: "坂木的魄力 (SAR)" },
    { num: 205, name: "梦幻ex (SAR)" }
  ];
  const crown: Card[] = crownData.map(data => ({
    id: `crown-${data.num}`,
    name: data.name,
    rarity: Rarity.CROWN,
    image: (data as any).isCustom 
      ? (data as any).customImg 
      : `https://images.pokemontcg.io/sv3pt5/${data.num}_hires.png`,
    description: (data as any).desc || '至高无上的皇冠级珍藏。'
  }));

  // 2. 金色 (GOLD)
  const sarGoldData = [
    { num: 198, name: "妙蛙花ex (SAR)" },
    { num: 199, name: "喷火龙ex (SAR)" },
    { num: 200, name: "水箭龟ex (SAR)" },
    { num: 201, name: "胡地ex (SAR)" },
    { num: 202, name: "闪电鸟ex (SAR)" },
    { num: 182, name: "妙蛙花ex (SR)" }, 
    { num: 183, name: "喷火龙ex (SR)" }
  ];
  const gold: Card[] = sarGoldData.map(data => ({
    id: `gold-${data.num}`,
    name: data.name,
    rarity: Rarity.GOLD,
    image: `https://images.pokemontcg.io/sv3pt5/${data.num}_hires.png`,
    description: '金色的荣耀收藏。'
  }));

  // 3. 紫色 (PURPLE)
  const arData = [
    { num: 166, name: "妙蛙种子 (AR)" }, { num: 167, name: "妙蛙草 (AR)" }, { num: 168, name: "小火龙 (AR)" },
    { num: 169, name: "火恐龙 (AR)" }, { num: 170, name: "杰尼龟 (AR)" }, { num: 171, name: "卡米龟 (AR)" },
    { num: 172, name: "绿毛虫 (AR)" }, { num: 173, name: "皮卡丘 (AR)" }, { num: 174, name: "尼多王 (AR)" },
    { num: 175, name: "可达鸭 (AR)" }, { num: 176, name: "蚊香君 (AR)" }, { num: 177, name: "豪力 (AR)" },
    { num: 178, name: "蔓藤怪 (AR)" }, { num: 179, name: "魔墙人偶 (AR)" }, { num: 180, name: "飞天螳螂 (AR)" },
    { num: 181, name: "哈克龙 (AR)" }
  ];
  const purple: Card[] = arData.map(data => ({
    id: `purple-${data.num}`,
    name: data.name,
    rarity: Rarity.PURPLE,
    image: `https://images.pokemontcg.io/sv3pt5/${data.num}_hires.png`,
    description: '艺术插画卡。'
  }));

  // 4. 道具卡 (ITEMS)
  const itemDataRaw = [
    { id: 'item-ball-poke', name: '精灵球', rarity: Rarity.BLUE, img: 'sv1-185', desc: '投掷1次硬币若为正面，则从自己的牌库抽出1张宝可梦卡。' },
    { id: 'item-potion-normal', name: '伤药', rarity: Rarity.BLUE, img: 'sv1-188', desc: '将自己的1只宝可梦恢复「30」HP。' },
    { id: 'item-ball-great', name: '超级球', rarity: Rarity.SILVER, img: 'sv2-183', desc: '查看自己的牌库上方7张卡。' },
    { id: 'item-potion-super', name: '厉害伤药', rarity: Rarity.PURPLE, img: 'swsh1-166', desc: '将自己的1只宝可梦恢复「120」HP。' },
    { id: 'item-ball-ultra', name: '高级球', rarity: Rarity.PURPLE, img: 'sv1-196', desc: '从自己的牌库选择1张宝可梦卡加入手牌。' },
    { id: 'item-potion-max', name: '全满药', rarity: Rarity.GOLD, img: 'sm2-128', desc: '将自己的1只宝可梦的HP全部恢复。' },
    { id: 'item-ball-master', name: '大师球 (ACE)', rarity: Rarity.CROWN, img: 'sv5-153', desc: '必定能捕捉野生宝可梦的究极球。' }
  ];

  const items: Card[] = itemDataRaw.map(data => ({
    id: data.id,
    name: data.name,
    rarity: data.rarity,
    image: `https://images.pokemontcg.io/${data.img.split('-')[0]}/${data.img.split('-')[1]}_hires.png`,
    description: data.desc
  }));

  const basePool: Card[] = POKEMON_NAMES_151.map((name, idx) => {
    const num = idx + 1;
    const isEx = EX_INDICES.includes(num);
    return {
      id: `b-${num.toString().padStart(3, '0')}`,
      name: isEx ? `${name}ex` : name,
      rarity: isEx ? Rarity.SILVER : Rarity.BLUE,
      image: `https://images.pokemontcg.io/sv3pt5/${num}_hires.png`,
      description: isEx ? '银色 RR 卡牌。' : `No.${num.toString().padStart(3, '0')} 基础成员。`
    };
  });

  return [...crown, ...gold, ...items, ...purple, ...basePool];
};

export const CARD_POOL = buildPool();

// 概率调整
export const GACHA_RATES = { 
  [Rarity.CROWN]: 0.001,   // 0.1%
  [Rarity.GOLD]: 0.0058,  // 0.58% (用户要求)
  [Rarity.PURPLE]: 0.05,   // 5.0%
  [Rarity.SILVER]: 0.15,   // 15.0%
  [Rarity.BLUE]: 0.7932    // 剩余部分 79.32%
};

export const DEFAULT_GACHA_RATES = { ...GACHA_RATES };
