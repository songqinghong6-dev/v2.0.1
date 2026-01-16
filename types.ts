
export enum Rarity {
  BLUE = 'BLUE',
  SILVER = 'SILVER',
  PURPLE = 'PURPLE',
  GOLD = 'GOLD',
  CROWN = 'CROWN'
}

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  image: string;
  description: string;
}

export interface GachaResult {
  cards: Card[];
  highestRarity: Rarity;
  newPityCount: number;
}

export interface GachaRates {
  [Rarity.CROWN]: number;
  [Rarity.GOLD]: number;
  [Rarity.PURPLE]: number;
  [Rarity.SILVER]: number;
  [Rarity.BLUE]: number;
}

export interface RechargeRequest {
  id: string;
  amount: number;
  gems: number;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

// --- 新增战斗相关类型 ---

export interface BattleStats {
  maxHp: number;
  currentHp: number;
  critRate: number;
  dodgeRate: number;
}

export interface Skill {
  name: string;
  minDmg: number;
  maxDmg: number;
  maxPp: number;      // 最大使用次数
  currentPp: number;  // 当前剩余次数
  critRate?: number;  // 技能特定暴击率 (可选，若无则使用角色基础暴击率)
  effect?: 'heal' | 'damage';
}

export interface BattleEntity extends BattleStats {
  instanceId: string; // 运行时唯一ID
  card: Card;
  isEnemy: boolean;
  skills: Skill[];
  isDead: boolean;
  turnCount: number; // 存活回合数
  hasAttemptedFlee: boolean; // 是否尝试过逃跑
}

export type BattleItemType = 'poke' | 'great' | 'ultra' | 'master' | 'potion' | 'super' | 'max';
