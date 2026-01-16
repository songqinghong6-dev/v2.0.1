
import { Rarity, Card, BattleEntity, Skill } from '../types';
import { CARD_POOL } from '../constants';

// 技能数据库配置
// min: 最小伤害, max: 最大伤害, pp: 最大次数, crit: 暴击率 (0-1), fixed: 是否固定伤害
const SKILL_DB: Record<string, { min: number, max: number, pp: number, crit?: number, fixed?: boolean }> = {
  // 普通技能
  "抓": { min: 20, max: 20, pp: 20, fixed: true },
  
  // 中级技能
  "撞击": { min: 30, max: 50, pp: 5 },
  "飞踢": { min: 40, max: 60, pp: 5 },
  
  // 高级技能
  "喷射火焰": { min: 70, max: 100, pp: 5, crit: 0.20 }, // 20% 暴击
  "地震": { min: 80, max: 120, pp: 5, crit: 0.15 },     // 15% 暴击
  "冰冻射线": { min: 50, max: 80, pp: 5, crit: 0.30 },  // 30% 暴击
  
  // 神话技能
  "破坏死光": { min: 150, max: 200, pp: 1, crit: 0.30 }, // 30% 暴击
  
  // 敌人专属技能
  "宇宙冲击": { min: 100, max: 120, pp: 5 },
  "灾难旋风": { min: 90, max: 110, pp: 5 }
};

// 基础属性配置
const BASE_STATS = {
  [Rarity.BLUE]:   { hp: 100, crit: 0.05, dodge: 0.05 },
  [Rarity.SILVER]: { hp: 150, crit: 0.10, dodge: 0.08 },
  [Rarity.PURPLE]: { hp: 200, crit: 0.15, dodge: 0.10 },
  [Rarity.GOLD]:   { hp: 250, crit: 0.20, dodge: 0.12 },
  [Rarity.CROWN]:  { hp: 300, crit: 0.30, dodge: 0.15 },
};

export const getMaxHp = (rarity: Rarity): number => {
    return BASE_STATS[rarity]?.hp || 100;
};

const getSkillsForRarity = (rarity: Rarity, isEnemy: boolean): Skill[] => {
  let skillNames: string[] = [];

  // 技能池
  const normal = ["抓"];
  const intermediate = ["撞击", "飞踢"];
  const advanced = ["喷射火焰", "地震", "冰冻射线"];
  const mythical = ["破坏死光"];
  const enemySkills = ["宇宙冲击", "灾难旋风"];

  // 辅助函数：从数组中随机取N个不重复项
  const pickRandom = (arr: string[], n: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  };

  if (isEnemy) {
    // 敌人配置简化，确保强度
    if (rarity === Rarity.BLUE) skillNames = ["抓", "撞击"];
    else if (rarity === Rarity.SILVER) skillNames = ["撞击", "飞踢", "抓"];
    else if (rarity === Rarity.PURPLE) skillNames = ["喷射火焰", "地震", "抓"];
    else if (rarity === Rarity.GOLD) skillNames = ["喷射火焰", "地震", "冰冻射线"];
    else if (rarity === Rarity.CROWN) skillNames = ["破坏死光", "宇宙冲击", "灾难旋风"];
  } else {
    // 玩家配置 (严格按照要求)
    switch (rarity) {
      case Rarity.BLUE:
        skillNames = [...normal];
        break;
      case Rarity.SILVER:
        skillNames = ["抓", "撞击", "飞踢"];
        break;
      case Rarity.PURPLE:
        skillNames = ["抓", ...pickRandom(intermediate, 1), ...pickRandom(advanced, 1)];
        break;
      case Rarity.GOLD:
        skillNames = ["抓", ...pickRandom(intermediate, 2), ...pickRandom(advanced, 1)];
        break;
      case Rarity.CROWN:
        skillNames = [...pickRandom(intermediate, 1), ...pickRandom(advanced, 2), ...mythical];
        break;
    }
  }

  // 映射为 Skill 对象
  return skillNames.map(name => {
    const data = SKILL_DB[name] || { min: 10, max: 10, pp: 10 };
    return { 
      name, 
      minDmg: data.min, 
      maxDmg: data.max, 
      maxPp: data.pp,
      currentPp: data.pp,
      critRate: data.crit
    };
  });
};

export const createBattleEntity = (card: Card, isEnemy: boolean, currentHp?: number): BattleEntity => {
  const stats = BASE_STATS[card.rarity] || BASE_STATS[Rarity.BLUE];
  const hpMultiplier = isEnemy ? 1.2 : 1;
  const maxHp = Math.floor(stats.hp * hpMultiplier);

  return {
    instanceId: `${isEnemy ? 'enemy' : 'player'}-${Math.random().toString(36).substr(2, 9)}`,
    card,
    isEnemy,
    maxHp: maxHp,
    currentHp: currentHp !== undefined ? currentHp : maxHp,
    critRate: stats.crit,
    dodgeRate: stats.dodge,
    skills: getSkillsForRarity(card.rarity, isEnemy),
    isDead: currentHp !== undefined ? currentHp <= 0 : false,
    turnCount: 0,
    hasAttemptedFlee: false
  };
};

export const generateEnemyTeam = (difficulty: Rarity): BattleEntity[] => {
  let pool = CARD_POOL;
  if (difficulty === Rarity.BLUE) pool = pool.filter(c => c.rarity === Rarity.BLUE); 
  else if (difficulty === Rarity.PURPLE) pool = pool.filter(c => c.rarity === Rarity.SILVER || c.rarity === Rarity.PURPLE);
  else if (difficulty === Rarity.GOLD) pool = pool.filter(c => c.rarity === Rarity.PURPLE || c.rarity === Rarity.GOLD);
  else if (difficulty === Rarity.CROWN) pool = pool.filter(c => c.rarity === Rarity.GOLD || c.rarity === Rarity.CROWN);

  const enemies: BattleEntity[] = [];
  for (let i = 0; i < 3; i++) {
    let randomCard = pool[Math.floor(Math.random() * pool.length)];
    while (randomCard.id.startsWith('item-')) {
       randomCard = pool[Math.floor(Math.random() * pool.length)];
    }
    enemies.push(createBattleEntity(randomCard, true));
  }
  return enemies;
};

export const calculateDamage = (attacker: BattleEntity, defender: BattleEntity, skill: Skill): { damage: number; isCrit: boolean; isDodge: boolean } => {
  if (Math.random() < defender.dodgeRate) {
    return { damage: 0, isCrit: false, isDodge: true };
  }
  const critChance = skill.critRate !== undefined ? skill.critRate : attacker.critRate;
  const isCrit = Math.random() < critChance;
  
  let damage = 0;
  const skillData = SKILL_DB[skill.name];
  if (skillData && skillData.fixed) {
      damage = skillData.min;
  } else {
      damage = Math.floor(skill.minDmg + Math.random() * (skill.maxDmg - skill.minDmg + 1));
  }
  
  if (isCrit) damage = Math.floor(damage * 1.5); 

  return { damage, isCrit, isDodge: false };
};

export const shouldFlee = (enemy: BattleEntity): boolean => {
  if (enemy.hasAttemptedFlee) return false;
  const hpPercent = enemy.currentHp / enemy.maxHp;
  if (hpPercent >= 0.3) return false;

  let fleeChance = 0.1;
  if (enemy.card.rarity === Rarity.GOLD) fleeChance = 0.3;
  if (enemy.card.rarity === Rarity.CROWN) fleeChance = 0.5;
  if (enemy.turnCount > 5) fleeChance += 0.2;

  return Math.random() < fleeChance;
};

export const getCatchRate = (enemy: BattleEntity, ballType: string): number => {
  // 1. 大师球始终 100%
  if (ballType.includes('master')) return 1.0;

  // 2. 基础概率
  let baseRate = 0.20; // 默认精灵球
  if (ballType.includes('ultra')) baseRate = 0.60;
  else if (ballType.includes('great')) baseRate = 0.40;

  // 3. 稀有度惩罚
  if (enemy.card.rarity === Rarity.GOLD || enemy.card.rarity === Rarity.CROWN) {
      baseRate *= 0.5;
  }

  // 4. 血量修正：血量越低，成功率越高
  // 满血时：factor = 1.0
  // 空血时：factor = 2.0 (最大提升1倍概率)
  const hpPercent = enemy.currentHp / enemy.maxHp;
  const hpFactor = 1 + (1 - hpPercent); 

  // 5. 死亡额外加成 (理论上HP修正已覆盖，但保留作为极低血量保底)
  if (enemy.currentHp <= 0) {
      baseRate += 0.15;
  }

  return Math.min(1.0, baseRate * hpFactor);
};

// 掉落配置
interface DropConfig {
  pool: { id: string; weight: number }[];
}

const DROP_TABLE: Record<Rarity, DropConfig> = {
  [Rarity.BLUE]: {
    pool: [
      { id: 'item-ball-poke', weight: 50 },
      { id: 'item-potion-normal', weight: 40 },
      { id: 'item-ball-great', weight: 10 }
    ] 
  },
  [Rarity.SILVER]: { 
    pool: [
      { id: 'item-ball-poke', weight: 30 },
      { id: 'item-potion-normal', weight: 30 },
      { id: 'item-ball-great', weight: 30 },
      { id: 'item-potion-super', weight: 10 }
    ]
  },
  [Rarity.PURPLE]: {
    pool: [
      { id: 'item-ball-great', weight: 40 },
      { id: 'item-ball-ultra', weight: 20 },
      { id: 'item-potion-super', weight: 35 },
      { id: 'item-potion-max', weight: 5 }
    ] 
  },
  [Rarity.GOLD]: {
    pool: [
      { id: 'item-ball-ultra', weight: 40 },
      { id: 'item-potion-max', weight: 30 },
      { id: 'item-ball-master', weight: 5 },
      { id: 'item-potion-super', weight: 25 }
    ] 
  },
  [Rarity.CROWN]: {
    pool: [
      { id: 'item-ball-ultra', weight: 30 },
      { id: 'item-potion-max', weight: 30 },
      { id: 'item-ball-master', weight: 20 },
      { id: 'item-potion-super', weight: 20 }
    ] 
  }
};

export const calculateBattleDrops = (realm: Rarity): string[] => {
  // 掉落数量上限设定
  const maxDrops = {
      [Rarity.BLUE]: 2,
      [Rarity.SILVER]: 3, // 平滑过渡
      [Rarity.PURPLE]: 3,
      [Rarity.GOLD]: 4,
      [Rarity.CROWN]: 5
  }[realm] || 2;

  const drops: string[] = [];
  const config = DROP_TABLE[realm] || DROP_TABLE[Rarity.BLUE];

  // 决定本次掉落数量：1 到 Max 之间随机
  const count = Math.floor(Math.random() * maxDrops) + 1;

  for (let i = 0; i < count; i++) {
    const rand = Math.random() * 100;
    let cumulative = 0;
    let selected = config.pool[0].id; // 默认第一个

    for (const item of config.pool) {
      cumulative += item.weight;
      if (rand < cumulative) {
        selected = item.id;
        break;
      }
    }
    drops.push(selected);
  }

  return drops;
};
