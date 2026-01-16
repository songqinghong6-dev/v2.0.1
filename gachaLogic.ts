
import { Rarity, Card, GachaResult, GachaRates } from '../types';
import { CARD_POOL } from '../constants';

const getRandomCardByRarity = (rarity: Rarity, ownedIds: Set<string>): Card => {
  const pool = CARD_POOL.filter(c => c.rarity === rarity);
  
  if (rarity === Rarity.CROWN) {
    const available = pool.filter(c => !ownedIds.has(c.id));
    if (available.length > 0) {
        return available[Math.floor(Math.random() * available.length)];
    }
    // 如果皇冠卡已经全收集，允许抽取重复的皇冠卡，不再降级
  }

  if (pool.length === 0) return CARD_POOL[0];
  return pool[Math.floor(Math.random() * pool.length)];
};

const rollOne = (rates: GachaRates, ownedIds: Set<string>): Card => {
  const rand = Math.random();
  let cumulative = 0;
  
  if (rand < (cumulative += (rates[Rarity.CROWN] || 0))) {
    return getRandomCardByRarity(Rarity.CROWN, ownedIds);
  } 
  if (rand < (cumulative += (rates[Rarity.GOLD] || 0))) {
    return getRandomCardByRarity(Rarity.GOLD, ownedIds);
  } 
  if (rand < (cumulative += (rates[Rarity.PURPLE] || 0))) {
    return getRandomCardByRarity(Rarity.PURPLE, ownedIds);
  } 
  if (rand < (cumulative += (rates[Rarity.SILVER] || 0))) {
    return getRandomCardByRarity(Rarity.SILVER, ownedIds);
  } 
  
  return getRandomCardByRarity(Rarity.BLUE, ownedIds);
};

export const performGacha = (count: number, rates: GachaRates, currentPity: number, ownedIds: Set<string>): GachaResult => {
  const cards: Card[] = [];
  let highestRarity = Rarity.BLUE;
  let tempPity = currentPity;
  const tempOwned = new Set(ownedIds);

  const rarityWeight = {
    [Rarity.BLUE]: 0,
    [Rarity.SILVER]: 1,
    [Rarity.PURPLE]: 2,
    [Rarity.GOLD]: 3,
    [Rarity.CROWN]: 4
  };

  for (let i = 0; i < count; i++) {
    let card: Card;
    tempPity++;

    if (tempPity >= 80) {
      card = getRandomCardByRarity(Rarity.GOLD, tempOwned);
      tempPity = 0; 
    } else {
      card = rollOne(rates, tempOwned);
    }

    if (card.rarity === Rarity.GOLD || card.rarity === Rarity.CROWN) {
      tempPity = 0;
    }

    if (card.rarity === Rarity.CROWN) {
      tempOwned.add(card.id);
    }

    if (count === 10 && i === 9) {
      const hasBetterThanBlue = cards.some(c => rarityWeight[c.rarity] >= rarityWeight[Rarity.SILVER]);
      if (!hasBetterThanBlue && rarityWeight[card.rarity] < rarityWeight[Rarity.SILVER]) {
        card = getRandomCardByRarity(Rarity.SILVER, tempOwned);
      }
    }

    cards.push(card);
    if (rarityWeight[card.rarity] > rarityWeight[highestRarity]) {
      highestRarity = card.rarity;
    }
  }

  return { cards, highestRarity, newPityCount: tempPity };
};
