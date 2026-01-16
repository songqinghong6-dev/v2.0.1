
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, BattleEntity, Rarity, BattleItemType } from '../types';
import { createBattleEntity, generateEnemyTeam, calculateDamage, getCatchRate, shouldFlee, calculateBattleDrops, getMaxHp } from '../services/battleLogic';
import { audioManager } from '../services/audioManager';
import { CARD_POOL } from '../constants';

interface AdventureModeProps {
  inventory: Record<string, { card: Card; count: number; currentHp?: number }>;
  onClose: () => void;
  onUpdateInventory: (inventory: Record<string, { card: Card; count: number; currentHp?: number }>) => void;
}

type GameState = 'LOBBY' | 'TEAM_SELECT' | 'BATTLE' | 'RESULT';
type BattlePhase = 'PLAYER_TURN' | 'ENEMY_TURN' | 'ANIMATING' | 'CAPTURE_CHOICE';
type CapturePhase = 'IDLE' | 'THROW' | 'BOUNCE' | 'ABSORB' | 'SHAKE' | 'CAUGHT' | 'BROKEN';
type ResultStatus = 'VICTORY' | 'DEFEAT' | 'FLEE';

type VfxType = 'scratch' | 'tackle' | 'fire' | 'ice' | 'ground' | 'beam' | 'heal' | 'galaxy' | 'thunder' | 'none';

const REALM_NAMES = {
    [Rarity.BLUE]: '碧波原野',
    [Rarity.PURPLE]: '幽紫幻境',
    [Rarity.GOLD]: '煌金古迹',
    [Rarity.CROWN]: '极耀圣域',
    [Rarity.SILVER]: '银月矿山'
};

const REALM_THEMES = {
  [Rarity.BLUE]: {
    bg: 'bg-gradient-to-b from-sky-300 via-emerald-200 to-emerald-400',
    platform: 'bg-emerald-600/20 border-emerald-500/30',
    particle: '🌿'
  },
  [Rarity.PURPLE]: {
    bg: 'bg-gradient-to-b from-indigo-900 via-purple-800 to-fuchsia-900',
    platform: 'bg-purple-500/20 border-purple-400/30',
    particle: '✨'
  },
  [Rarity.GOLD]: {
    bg: 'bg-gradient-to-b from-orange-200 via-amber-100 to-amber-300',
    platform: 'bg-amber-600/20 border-amber-500/30',
    particle: '🏜️'
  },
  [Rarity.CROWN]: {
    bg: 'bg-gradient-to-b from-rose-100 via-white to-sky-100',
    platform: 'bg-rose-400/10 border-rose-300/20',
    particle: '💎'
  },
  [Rarity.SILVER]: {
    bg: 'bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500',
    platform: 'bg-slate-600/20 border-slate-500/30',
    particle: '❄️'
  }
};

const getItemName = (id: string) => {
  const card = CARD_POOL.find(c => c.id === id);
  return card ? card.name : id;
};

const SelectableCard: React.FC<{ card: Card; isSelected: boolean; isDead: boolean; currentHp?: number; onClick: () => void }> = ({ card, isSelected, isDead, currentHp, onClick }) => {
  let borderColor = '#e2e8f0';
  if (isSelected) borderColor = '#22c55e';
  else if (card.rarity === Rarity.CROWN) borderColor = '#f43f5e';
  else if (card.rarity === Rarity.GOLD) borderColor = '#fbbf24';
  else if (card.rarity === Rarity.PURPLE) borderColor = '#c084fc';
  else if (card.rarity === Rarity.SILVER) borderColor = '#94a3b8';

  const max = getMaxHp(card.rarity);
  const hp = currentHp !== undefined ? currentHp : max;

  return (
      <div 
        onClick={!isDead ? onClick : undefined}
        className={`relative group aspect-[630/880] rounded-xl overflow-hidden border-2 transition-all ${isDead ? 'cursor-not-allowed grayscale opacity-60' : 'cursor-pointer'} ${
            isSelected ? 'shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-95 bg-green-50' : 'bg-white active:scale-95'
        }`}
        style={{ borderColor }}
      >
          <img src={card.image} className="w-full h-full object-fill" alt={card.name} />
          {isSelected && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md border border-white">✓</div>
          )}
          {!isDead && !isSelected && (
             <div className="absolute bottom-0 left-0 right-0 h-3 bg-black/40 backdrop-blur-sm flex items-center px-1">
                 <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${hp/max < 0.3 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${(hp/max)*100}%` }} />
                 </div>
             </div>
          )}
          {isDead && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-white font-black uppercase tracking-widest text-[8px] bg-red-500/80 px-1 rounded">濒死</span>
              </div>
          )}
      </div>
  );
};

const getBallImage = (type: string) => {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';
  if (type.includes('master')) return base + 'master-ball.png';
  if (type.includes('ultra')) return base + 'ultra-ball.png';
  if (type.includes('great')) return base + 'great-ball.png';
  return base + 'poke-ball.png';
};

const getItemImage = (id: string) => {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';
  switch(id) {
      case 'item-ball-poke': return base + 'poke-ball.png';
      case 'item-ball-great': return base + 'great-ball.png';
      case 'item-ball-ultra': return base + 'ultra-ball.png';
      case 'item-ball-master': return base + 'master-ball.png';
      case 'item-potion-normal': return base + 'potion.png';
      case 'item-potion-good': return base + 'super-potion.png';
      case 'item-potion-super': return base + 'hyper-potion.png'; 
      case 'item-potion-max': return base + 'max-potion.png';
      default: return base + 'poke-ball.png';
  }
};

const RewardCard: React.FC<{ id: string, count: number, delay: number, isPokemon: boolean }> = ({ id, count, delay, isPokemon }) => {
  const card = CARD_POOL.find(c => c.id === id);
  const name = card?.name || (id.includes('poke') ? '精灵球' : id.includes('potion') ? '伤药' : '道具');
  const image = card?.image || getItemImage(id);
  const rarity = card?.rarity || Rarity.BLUE;

  return (
    <div 
      className="flex flex-col items-center animate-[popIn_0.4s_ease-out_forwards]" 
      style={{ animationDelay: `${delay}s` }}
    >
        <div className={`relative aspect-[630/880] w-full rounded-xl overflow-hidden border-2 shadow-lg bg-white ${
            rarity === Rarity.CROWN ? 'border-rose-400' : rarity === Rarity.GOLD ? 'border-amber-400' : rarity === Rarity.PURPLE ? 'border-purple-400' : rarity === Rarity.SILVER ? 'border-slate-400' : 'border-slate-200'
        }`}>
            <img src={image} className={`w-full h-full ${!isPokemon && !card ? 'object-contain p-4' : 'object-fill'}`} alt={name} />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1">
                <div className="text-[7px] md:text-[8px] text-white font-black truncate text-center uppercase tracking-tighter">{name}</div>
            </div>
            {count > 1 && (
                <div className="absolute top-1 right-1 bg-blue-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-md">x{count}</div>
            )}
        </div>
    </div>
  );
};

const AdventureMode: React.FC<AdventureModeProps> = ({ inventory, onClose, onUpdateInventory }) => {
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [selectedRealm, setSelectedRealm] = useState<Rarity>(Rarity.BLUE);
  const [myTeam, setMyTeam] = useState<Card[]>([]);
  const [hideNormal, setHideNormal] = useState(false);
  
  const [playerEntities, setPlayerEntities] = useState<BattleEntity[]>([]);
  const [enemyEntities, setEnemyEntities] = useState<BattleEntity[]>([]);
  const [activePlayerIdx, setActivePlayerIdx] = useState(0);
  const [activeEnemyIdx, setActiveEnemyIdx] = useState(0); 
  const [phase, setPhase] = useState<BattlePhase>('PLAYER_TURN');
  const [logs, setLogs] = useState<string[]>([]);
  const [resultStatus, setResultStatus] = useState<ResultStatus>('VICTORY');
  
  const [battleDrops, setBattleDrops] = useState<string[]>([]);
  const [capturedCards, setCapturedCards] = useState<Card[]>([]);
  
  const [showItemMenu, setShowItemMenu] = useState(false);
  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false); 

  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [vfx, setVfx] = useState<{ type: VfxType; targetId: string | null }>({ type: 'none', targetId: null });
  const [captureState, setCaptureState] = useState<{ phase: CapturePhase; ballType: string; shakeCount: number }>({ phase: 'IDLE', ballType: 'poke', shakeCount: 0 });
  const [battleItems, setBattleItems] = useState<Record<string, number>>({});

  useEffect(() => {
    const items: Record<string, number> = {};
    Object.keys(inventory).forEach(key => { if (key.startsWith('item-')) items[key] = inventory[key].count; });
    setBattleItems(items);
  }, [inventory, gameState]);

  const selectablePokemon = useMemo(() => {
    let list = (Object.values(inventory) as { card: Card; count: number; currentHp?: number }[])
      .filter(item => !item.card.id.startsWith('item-'));
    if (hideNormal) list = list.filter(item => item.card.rarity !== Rarity.BLUE);
    return list.sort((a, b) => {
        const rarityWeight: Record<Rarity, number> = { [Rarity.CROWN]: 0, [Rarity.GOLD]: 1, [Rarity.PURPLE]: 2, [Rarity.SILVER]: 3, [Rarity.BLUE]: 4 };
        return rarityWeight[a.card.rarity] - rarityWeight[b.card.rarity] || a.card.id.localeCompare(b.card.id);
      });
  }, [inventory, hideNormal]);

  const finalizeAdventure = (status: ResultStatus, finalDrops: string[] = [], finalCaptures: Card[] = []) => {
      const newInv = { ...inventory };
      
      playerEntities.forEach(p => { 
          if (newInv[p.card.id]) newInv[p.card.id].currentHp = p.currentHp; 
      });

      const totalCaptures = [...capturedCards, ...finalCaptures];
      const totalDrops = [...battleDrops, ...finalDrops];

      totalCaptures.forEach(card => {
          if (newInv[card.id]) newInv[card.id].count += 1;
          else newInv[card.id] = { card, count: 1 };
      });

      totalDrops.forEach(id => {
          if (newInv[id]) newInv[id].count += 1;
          else {
              const card = CARD_POOL.find(c => c.id === id);
              if (card) newInv[id] = { card, count: 1 };
          }
      });

      onUpdateInventory(newInv);
      setCapturedCards(totalCaptures);
      setBattleDrops(totalDrops);
      setResultStatus(status);
      setGameState('RESULT');
      if (status === 'VICTORY') audioManager.play('gold_reveal');
  };

  const addLog = (msg: string) => setLogs([msg]);

  const playSkillSfx = (skillName: string) => {
      const name = skillName.toLowerCase();
      if (name.includes('死光') || name.includes('冲击')) audioManager.play('attack_beam');
      else if (name.includes('火') || name.includes('喷射')) audioManager.play('attack_fire');
      else if (name.includes('雷') || name.includes('电')) audioManager.play('attack_thunder');
      else if (name.includes('震') || name.includes('地')) audioManager.play('attack_impact');
      else if (name.includes('抓')) audioManager.play('attack_weak');
      else if (name.includes('撞')) audioManager.play('attack_blunt');
      else audioManager.play('attack_slash');
  };

  const toggleTeamMember = (card: Card) => {
    setMyTeam(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) return prev.filter(c => c.id !== card.id);
      if (prev.length >= 3) return prev;
      return [...prev, card];
    });
    audioManager.play('tap');
  };

  const handleSwitchPokemon = (idx: number) => {
    if (playerEntities[idx].isDead || idx === activePlayerIdx) return;
    const prevName = playerEntities[activePlayerIdx].card.name;
    const nextName = playerEntities[idx].card.name;
    setActivePlayerIdx(idx);
    setShowSwitchMenu(false);
    addLog(`回来吧 ${prevName}！去吧 ${nextName}！`);
    if (phase === 'PLAYER_TURN') setPhase('ENEMY_TURN');
    audioManager.play('tap');
  };

  const handleStartBattle = () => {
    if (myTeam.length === 0) return;
    const pEntities = myTeam.map(c => createBattleEntity(c, false, inventory[c.id]?.currentHp));
    setPlayerEntities(pEntities);
    setActivePlayerIdx(0);
    const eEntities = generateEnemyTeam(selectedRealm);
    setEnemyEntities(eEntities);
    setActiveEnemyIdx(0); 
    setCaptureState({ phase: 'IDLE', ballType: 'poke', shakeCount: 0 });
    setBattleDrops([]); setCapturedCards([]); setResultStatus('VICTORY');
    addLog(`野生的 ${eEntities[0]?.card.name} 出现了！`);
    setPhase('PLAYER_TURN');
    setTimeout(() => { setGameState('BATTLE'); audioManager.play('click'); }, 100);
  };

  const activePlayer = playerEntities[activePlayerIdx];
  const activeEnemy = enemyEntities[activeEnemyIdx];

  useEffect(() => {
    if (gameState === 'BATTLE' && phase === 'ENEMY_TURN') handleEnemyTurn();
  }, [phase, gameState]);

  useEffect(() => {
    if (gameState !== 'BATTLE') return;
    if (playerEntities.length > 0 && playerEntities.every(p => p.isDead)) {
        setTimeout(() => finalizeAdventure('DEFEAT'), 1000);
    }
  }, [playerEntities, gameState]);

  const handleExitBattle = () => {
      finalizeAdventure('FLEE');
  };

  const handlePlayerAttack = (skillIdx: number) => {
    if (phase !== 'PLAYER_TURN' || !activePlayer || activePlayer.isDead || !activeEnemy) return;
    const skill = activePlayer.skills[skillIdx];
    if (skill.currentPp <= 0) return addLog(`${skill.name} 的 使用次数已尽！`);
    setPhase('ANIMATING'); setShowSkillMenu(false);
    setPlayerEntities(prev => prev.map((p, i) => i === activePlayerIdx ? { ...p, skills: p.skills.map((s, si) => si === skillIdx ? { ...s, currentPp: s.currentPp - 1 } : s) } : p));
    setAnimatingId(activePlayer.instanceId);
    addLog(`${activePlayer.card.name} 使用了 ${skill.name}！`);
    setTimeout(() => {
      setAnimatingId(null); setVfx({ type: 'scratch', targetId: activeEnemy.instanceId }); playSkillSfx(skill.name);
      setTimeout(() => {
          setVfx({ type: 'none', targetId: null });
          const { damage, isCrit, isDodge } = calculateDamage(activePlayer, activeEnemy, skill);
          const newHp = Math.max(0, activeEnemy.currentHp - damage);
          setEnemyEntities(prev => prev.map((e, idx) => idx === activeEnemyIdx ? { ...e, currentHp: newHp, isDead: newHp === 0 } : e));
          if (!isDodge) { setAnimatingId(activeEnemy.instanceId + '-hit'); setTimeout(() => setAnimatingId(null), 400); }
          addLog(isDodge ? '但是被躲开了！' : isCrit ? `命中要害！造成了 ${damage} 点伤害！` : `造成了 ${damage} 点伤害！`);
          if (newHp === 0) {
              audioManager.play('faint'); addLog(`野生的 ${activeEnemy.card.name} 倒下了！`);
              setPhase('CAPTURE_CHOICE');
          } else {
              setTimeout(() => setPhase('ENEMY_TURN'), 1000);
          }
      }, 600);
    }, 400); 
  };

  const handleNextEnemy = (newlyCapturedCard?: Card) => {
      const finalCaptures = newlyCapturedCard ? [newlyCapturedCard] : [];
      if (activeEnemyIdx < enemyEntities.length - 1) {
          if (newlyCapturedCard) setCapturedCards(prev => [...prev, newlyCapturedCard]);
          setActiveEnemyIdx(prev => prev + 1);
          addLog(`野生的 ${enemyEntities[activeEnemyIdx + 1].card.name} 出现了！`);
          setPhase('PLAYER_TURN'); setCaptureState({ phase: 'IDLE', ballType: 'poke', shakeCount: 0 });
      } else {
          const drops = calculateBattleDrops(selectedRealm);
          finalizeAdventure('VICTORY', drops, finalCaptures);
      }
  };

  const runShakeLogic = (enemy: BattleEntity, ballType: string) => {
      setCaptureState(prev => ({ ...prev, phase: 'SHAKE', shakeCount: 0 }));
      let catchRate = getCatchRate(enemy, ballType);
      const isCaught = Math.random() < catchRate;
      const maxShakes = isCaught ? 3 : Math.floor(Math.random() * 3); 
      let currentShake = 0;
      const shakeInterval = setInterval(() => {
          currentShake++;
          if (currentShake <= maxShakes) { setCaptureState(prev => ({ ...prev, shakeCount: currentShake })); audioManager.play('tap'); }
          else {
             clearInterval(shakeInterval);
             if (isCaught) {
                 setCaptureState(prev => ({ ...prev, phase: 'CAUGHT' })); audioManager.play('gold_reveal');
                 addLog(`太好了！成功捕捉了 ${enemy.card.name}！`);
                 setTimeout(() => handleNextEnemy(enemy.card), 2000);
             } else {
                 setCaptureState(prev => ({ ...prev, phase: 'BROKEN' })); audioManager.play('crown_impact'); addLog(`哎呀！${enemy.card.name} 挣脱了！`);
                 if (enemy.currentHp > 0) setTimeout(() => { setCaptureState({ phase: 'IDLE', ballType: 'poke', shakeCount: 0 }); setPhase('ENEMY_TURN'); }, 1500);
                 else { addLog(`${enemy.card.name} 逃走了...`); setTimeout(() => handleNextEnemy(), 2000); }
             }
          }
      }, 1000);
  };

  const handleEnemyTurn = () => {
    const enemy = enemyEntities[activeEnemyIdx];
    if (!enemy || enemy.isDead) return setPhase(enemy?.isDead ? 'CAPTURE_CHOICE' : 'PLAYER_TURN');
    setTimeout(() => {
        if (shouldFlee(enemy)) {
            setEnemyEntities(prev => prev.map((e, i) => i === activeEnemyIdx ? { ...e, isDead: true, currentHp: 0 } : e));
            addLog(`野生的 ${enemy.card.name} 逃跑了！`); setTimeout(() => handleNextEnemy(), 1500); return;
        }
        if (activePlayer.isDead) return;
        setAnimatingId(enemy.instanceId);
        const skill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
        addLog(`野生的 ${enemy.card.name} 使用了 ${skill.name}！`);
        setTimeout(() => {
             setAnimatingId(null); setVfx({ type: 'tackle', targetId: activePlayer.instanceId }); playSkillSfx(skill.name);
             setTimeout(() => {
                setVfx({ type: 'none', targetId: null });
                const { damage, isDodge } = calculateDamage(enemy, activePlayer, skill);
                if (!isDodge) { setAnimatingId(activePlayer.instanceId + '-hit'); setTimeout(() => setAnimatingId(null), 400); }
                addLog(isDodge ? '但是被躲开了！' : `受到了 ${damage} 点伤害！`);
                setPlayerEntities(prev => prev.map((p, i) => {
                    if (i !== activePlayerIdx) return p;
                    const newHp = Math.max(0, p.currentHp - (isDodge ? 0 : damage));
                    if (newHp === 0) audioManager.play('faint');
                    return { ...p, currentHp: newHp, isDead: newHp === 0 };
                }));
                setTimeout(() => setPhase('PLAYER_TURN'), 1000);
             }, 600);
        }, 400); 
    }, 500);
  };

  const consumeItem = (id: string) => {
      const newInv = { ...inventory };
      if (newInv[id]) { newInv[id].count = Math.max(0, newInv[id].count - 1); onUpdateInventory(newInv); }
  };

  const handleUseItem = (id: string) => {
    if (id.includes('ball')) {
        if (activeEnemy.currentHp / activeEnemy.maxHp >= 0.5 && !activeEnemy.isDead) {
            audioManager.play('faint'); 
            addLog(`捕捉失败！${activeEnemy.card.name} 还很有精神，需要削弱至 50% 以下！`);
            setAnimatingId(activeEnemy.instanceId + '-error');
            setTimeout(() => setAnimatingId(null), 500);
            return;
        }
        consumeItem(id); setShowItemMenu(false); setPhase('ANIMATING');
        setCaptureState({ phase: 'THROW', ballType: id.split('-').pop() || 'poke', shakeCount: 0 });
        setTimeout(() => setCaptureState(p => ({ ...p, phase: 'BOUNCE' })), 600);
        setTimeout(() => setCaptureState(p => ({ ...p, phase: 'ABSORB' })), 900);
        setTimeout(() => runShakeLogic(activeEnemy, id), 1500);
    } else {
        consumeItem(id); setVfx({ type: 'heal', targetId: activePlayer.instanceId }); audioManager.play('gold_sparkle');
        setPlayerEntities(prev => prev.map((p, i) => i === activePlayerIdx ? { ...p, currentHp: Math.min(p.maxHp, p.currentHp + 50) } : p));
        setTimeout(() => { setVfx({ type: 'none', targetId: null }); setShowItemMenu(false); setPhase('ENEMY_TURN'); }, 800);
    }
  };

  const handleLogAreaClick = () => {
    if (phase === 'PLAYER_TURN' && !showSkillMenu && !showItemMenu && phase !== 'CAPTURE_CHOICE') {
      setShowSkillMenu(true);
      audioManager.play('tap');
    }
  };

  const currentTheme = REALM_THEMES[selectedRealm] || REALM_THEMES[Rarity.BLUE];

  if (gameState === 'LOBBY') return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center text-white p-6 sm:p-10 overflow-hidden">
      <div className="mb-4 sm:mb-8 text-center shrink-0">
          <h2 className="text-4xl sm:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 italic tracking-tighter uppercase">Adventure Mode</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">选择要探索的秘境</p>
      </div>
      <div className="flex-1 w-full max-w-sm mb-6 overflow-y-auto custom-scrollbar px-2 space-y-3 min-h-0">
         {[Rarity.BLUE, Rarity.PURPLE, Rarity.GOLD, Rarity.CROWN].map(r => (
             <button key={r} onClick={() => setSelectedRealm(r)} className={`group w-full relative p-5 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-95 shrink-0 ${selectedRealm === r ? 'border-yellow-400 bg-slate-800 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'}`}>
                 <div className="flex flex-col items-start">
                     <span className={`font-black text-lg sm:text-xl italic ${selectedRealm === r ? 'text-white' : 'text-slate-400'}`}>{REALM_NAMES[r]}</span>
                     <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">难度: {r === Rarity.CROWN ? '极高' : r === Rarity.GOLD ? '高' : r === Rarity.PURPLE ? '中' : '低'}</span>
                 </div>
                 <div className={`w-3 h-3 rounded-full ${r === Rarity.CROWN ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : r === Rarity.GOLD ? 'bg-amber-400' : r === Rarity.PURPLE ? 'bg-purple-400' : 'bg-blue-400'}`} />
             </button>
         ))}
      </div>
      <div className="flex gap-4 w-full max-w-sm mt-auto shrink-0">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">返回大厅</button>
          <button onClick={() => setGameState('TEAM_SELECT')} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">确认秘境</button>
      </div>
    </div>
  );

  if (gameState === 'RESULT') {
    const isVictory = resultStatus === 'VICTORY';
    const dropCounts = battleDrops.reduce((acc, id) => { acc[id] = (acc[id] || 0) + 1; return acc; }, {} as Record<string, number>);
    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className={`w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 text-center shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] ${isVictory ? 'bg-white' : 'bg-slate-950 border border-red-500/30'}`}>
                <h2 className={`text-3xl md:text-5xl font-black italic mb-2 ${isVictory ? 'text-slate-900' : 'text-red-500 animate-pulse'}`}>{isVictory ? '冒险成功！' : resultStatus === 'FLEE' ? '撤离成功' : '冒险失败'}</h2>
                <div className="flex-1 overflow-y-auto space-y-8 p-2 custom-scrollbar">
                    {capturedCards.length > 0 && (
                        <div>
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 border-b pb-2">已成功捕捉</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 md:gap-6">
                              {capturedCards.map((c, i) => <RewardCard key={`res-captured-${i}-${c.id}`} id={c.id} count={1} delay={i*0.1} isPokemon={true} />)}
                            </div>
                        </div>
                    )}
                    {battleDrops.length > 0 && (
                        <div>
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 border-b pb-2">获得战利品</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 md:gap-6">
                              {Object.entries(dropCounts).map(([id, c], i) => <RewardCard key={`res-drop-${id}`} id={id} count={c} delay={(capturedCards.length+i)*0.1} isPokemon={false} />)}
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={() => setGameState('LOBBY')} className={`mt-8 w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all ${isVictory ? 'bg-slate-900 text-white shadow-xl hover:bg-black' : 'bg-red-600 text-white shadow-[0_10px_30px_rgba(220,38,38,0.3)]'}`}>收录并返回</button>
            </div>
        </div>
    );
  }

  if (gameState === 'TEAM_SELECT') return (
    <div className="fixed inset-0 z-[150] bg-white flex items-center justify-center p-4 md:p-8">
      <div className="bg-[#fdfdfd] w-full max-w-6xl h-full max-h-[95vh] md:max-h-[85vh] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col border border-slate-100 shadow-2xl">
         <div className="p-6 md:p-8 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white shrink-0 gap-4">
            <div>
                <h2 className="text-lg md:text-xl font-black uppercase italic tracking-widest">选择出战队伍</h2>
                <div className="flex items-center gap-4 mt-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Squad: {myTeam.length}/3</p>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={hideNormal} onChange={() => setHideNormal(!hideNormal)} className="hidden" />
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-all ${hideNormal ? 'bg-blue-600' : 'bg-slate-200'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full transition-all ${hideNormal ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">隐藏普通卡</span>
                    </label>
                </div>
            </div>
            <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                <button onClick={() => setGameState('LOBBY')} className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-slate-100 rounded-xl font-bold text-[10px] uppercase">返回</button>
                <button onClick={handleStartBattle} disabled={myTeam.length === 0} className="flex-1 sm:flex-none px-5 md:px-8 py-2 md:py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase disabled:opacity-50 shadow-lg active:scale-95 transition-all">开始冒险</button>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 md:p-10 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8 custom-scrollbar pb-20 md:pb-10 content-start">
            {selectablePokemon.map(i => (
                <SelectableCard key={i.card.id} card={i.card} currentHp={i.currentHp} isSelected={myTeam.some(t => t.id === i.card.id)} isDead={!!(i.currentHp !== undefined && i.currentHp <= 0)} onClick={() => toggleTeamMember(i.card)} />
            ))}
         </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#1a1a1a] flex flex-col font-sans select-none overflow-hidden">
       <div className="relative w-full h-full md:h-auto md:max-w-4xl md:aspect-[3/2] md:m-auto bg-[#f8f8f8] flex flex-col overflow-hidden shadow-2xl md:border-4 border-slate-800 md:rounded-lg">
          
          {/* 对战背景层 */}
          <div className={`flex-1 md:flex-[2] relative overflow-hidden transition-all duration-700 ${currentTheme.bg}`}>
             
             {/* 环境粒子/特效 */}
             <div className="absolute inset-0 pointer-events-none opacity-40">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute animate-[float_10s_linear_infinite]" style={{ top: `${Math.random()*100}%`, left: `${Math.random()*100}%`, animationDelay: `${i * 2}s`, fontSize: '20px' }}>
                    {currentTheme.particle}
                  </div>
                ))}
             </div>

             {/* 对手平台底座 */}
             <div className={`absolute top-[55%] right-8 md:top-[60%] md:right-24 w-40 h-12 md:w-60 md:h-16 rounded-[100%] border-b-4 skew-x-[-10deg] transition-all ${currentTheme.platform}`} />
             
             {/* 玩家平台底座 */}
             <div className={`absolute bottom-[5%] left-4 md:bottom-[10%] md:left-12 w-48 h-14 md:w-72 md:h-20 rounded-[100%] border-b-4 skew-x-[15deg] transition-all ${currentTheme.platform}`} />

             {/* 对方精灵信息栏 */}
             <div className={`absolute top-4 left-4 z-10 scale-90 md:scale-100 origin-top-left transition-transform ${animatingId === activeEnemy?.instanceId + '-error' ? 'animate-[mildShake_0.2s_infinite]' : ''}`}>
                 <div className="bg-white/95 border-2 border-slate-800 rounded-md p-2 w-[160px] md:w-[180px] shadow-lg">
                    <div className="text-[10px] font-bold text-slate-800 flex justify-between"><span>{activeEnemy?.card.name}</span><span>Lv.50</span></div>
                    <div className="h-1.5 md:h-2 bg-slate-200 rounded-full mt-1 overflow-hidden flex items-center px-[1px]">
                        <div className={`h-[80%] transition-all duration-500 rounded-full ${activeEnemy?.currentHp/activeEnemy?.maxHp > 0.5 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${(activeEnemy?.currentHp/activeEnemy?.maxHp)*100}%` }} />
                    </div>
                 </div>
             </div>

             {/* 对方精灵精灵渲染 */}
             <div className="absolute top-[35%] right-10 md:top-[30%] md:right-32 w-32 h-32 md:w-48 md:h-48 flex items-center justify-center z-10">
                 {vfx.targetId === activeEnemy?.instanceId && <div className={`absolute inset-0 z-20 ${vfx.type === 'scratch' ? 'animate-ping bg-white/40 rounded-full' : ''}`} />}
                 <img src={activeEnemy?.card.image} className={`w-full h-full object-contain transition-all duration-300 ${animatingId === activeEnemy?.instanceId ? 'scale-110' : 'animate-[pokemonBreath_3s_easeInOut_infinite]'} ${captureState.phase !== 'IDLE' && captureState.phase !== 'BROKEN' ? 'scale-0 opacity-0' : ''}`} />
             </div>

             {/* 捕捉动画层 */}
             {captureState.phase !== 'IDLE' && (
                 <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                     <div className={`w-12 h-12 md:w-16 md:h-16 transition-all duration-500 ${captureState.phase === 'THROW' ? 'translate-y-20 scale-50' : captureState.phase === 'SHAKE' ? 'animate-bounce' : ''}`}><img src={getBallImage(captureState.ballType)} className="w-full h-full object-contain" /></div>
                 </div>
             )}

             {/* 玩家精灵精灵渲染 (背面感视角) */}
             <div className="absolute bottom-16 left-8 md:bottom-20 md:left-24 w-36 h-36 md:w-56 md:h-56 flex items-end z-20">
                <img src={activePlayer?.card.image} className={`w-full h-full object-contain transition-all duration-300 ${animatingId === activePlayer?.instanceId ? 'translate-x-6 md:translate-x-10' : 'animate-[pokemonBreath_3s_easeInOut_1.5s_infinite] scale-x-[-1]'}`} />
             </div>

             {/* 玩家精灵信息栏 */}
             <div className="absolute bottom-4 right-4 z-10 scale-90 md:scale-100 origin-bottom-right">
                 <div className="bg-white/95 border-2 border-slate-800 rounded-md p-2 w-[180px] md:w-[200px] shadow-lg">
                    <div className="text-[10px] font-bold text-slate-800 flex justify-between"><span>{activePlayer?.card.name}</span><span>Lv.50</span></div>
                    <div className="h-1.5 md:h-2 bg-slate-200 rounded-full mt-1 overflow-hidden flex items-center px-[1px]">
                        <div className={`h-[80%] transition-all duration-500 rounded-full ${activePlayer?.currentHp/activePlayer?.maxHp > 0.5 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${(activePlayer?.currentHp/activePlayer?.maxHp)*100}%` }} />
                    </div>
                    <div className="text-[8px] font-black text-right mt-1 text-slate-500">体力 {activePlayer?.currentHp} / {activePlayer?.maxHp}</div>
                 </div>
             </div>
          </div>

          {/* 控制面板层 */}
          <div className="shrink-0 h-[35vh] md:h-auto md:flex-1 bg-[#283038] border-t-4 border-[#e0ae24] p-2 flex flex-row gap-2">
              <div 
                onClick={handleLogAreaClick}
                className={`flex-1 bg-slate-800 rounded border-2 border-slate-600 p-3 md:p-4 text-white font-bold relative overflow-hidden transition-colors ${
                  phase === 'PLAYER_TURN' && !showSkillMenu && !showItemMenu && phase !== 'CAPTURE_CHOICE' ? 'cursor-pointer hover:bg-slate-700 active:bg-slate-600' : ''
                }`}
              >
                  {showSkillMenu ? (
                      <div className="grid grid-cols-2 gap-2 h-full content-start overflow-y-auto custom-scrollbar">
                          {activePlayer.skills.map((s, i) => <button key={i} onClick={(e) => { e.stopPropagation(); handlePlayerAttack(i); }} className="bg-slate-700 hover:bg-slate-600 border border-slate-500 p-2 rounded text-[10px] flex flex-col items-center justify-center active:bg-slate-500 h-[60px]"><span className="font-black text-sm">{s.name}</span><span className="text-[8px] opacity-60 mt-0.5 uppercase tracking-widest">PP {s.currentPp}/{s.maxPp}</span></button>)}
                      </div>
                  ) : showItemMenu ? (
                      <div className="grid grid-cols-2 gap-2 h-full content-start overflow-y-auto pr-1 custom-scrollbar">
                          {(Object.entries(battleItems) as [string, number][]).filter(([id, c]) => c > 0).map(([id, c]) => <button key={id} onClick={(e) => { e.stopPropagation(); handleUseItem(id); }} className="bg-slate-700 border border-slate-500 p-2 rounded text-[10px] truncate flex justify-between items-center px-3 h-10 transition-colors hover:bg-slate-600"><span>{getItemName(id)}</span><span className="text-blue-400 font-mono font-black">x{c}</span></button>)}
                          {Object.values(battleItems).every(c => c === 0) && <div className="col-span-2 text-center text-slate-500 text-[10px] py-4 uppercase font-black tracking-widest">道具袋中暂无物品</div>}
                      </div>
                  ) : phase === 'CAPTURE_CHOICE' ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-4">
                          <p className="text-xs md:text-sm font-black italic tracking-[0.2em] text-center uppercase text-blue-400">Target Weakened! / 捕捉时机</p>
                          <div className="flex gap-4 w-full px-6">
                              <button onClick={(e) => { e.stopPropagation(); setShowItemMenu(true); audioManager.play('tap'); }} className="flex-1 py-3 bg-yellow-500 text-slate-900 rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all uppercase tracking-widest">使用球</button>
                              <button onClick={(e) => { e.stopPropagation(); handleNextEnemy(); }} className="flex-1 py-3 bg-slate-600 text-white rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all uppercase tracking-widest">放弃</button>
                          </div>
                      </div>
                  ) : (
                      <div className="h-full flex flex-col justify-center pointer-events-none">
                          <p className="animate-[fadeIn_0.5s_ease-out] text-sm md:text-lg leading-relaxed">{logs[0]}</p>
                          {phase === 'PLAYER_TURN' && <span className="absolute bottom-2 right-2 text-[8px] text-yellow-500 animate-pulse tracking-widest uppercase font-black">Waiting for Command ▼</span>}
                      </div>
                  )}
              </div>
              <div className="w-[100px] md:w-[150px] bg-white rounded border-2 border-slate-400 p-1 grid grid-cols-1 gap-1 font-black text-[10px] md:text-xs">
                  <button onClick={() => { setShowSkillMenu(!showSkillMenu); setShowItemMenu(false); setShowSwitchMenu(false); }} disabled={phase !== 'PLAYER_TURN' || phase === 'CAPTURE_CHOICE'} className={`border transition-all active:scale-95 rounded uppercase tracking-widest ${showSkillMenu ? 'bg-red-500 text-white border-red-600' : 'hover:bg-red-50 disabled:opacity-50'}`}>战斗</button>
                  <button onClick={() => { setShowItemMenu(!showItemMenu); setShowSkillMenu(false); setShowSwitchMenu(false); }} disabled={phase === 'ANIMATING'} className={`border transition-all active:scale-95 rounded uppercase tracking-widest ${showItemMenu ? 'bg-yellow-500 text-white border-yellow-600' : 'hover:bg-yellow-50 disabled:opacity-50'}`}>背包</button>
                  <button onClick={() => setShowSwitchMenu(true)} disabled={playerEntities.length <= 1 || phase === 'ANIMATING' || phase === 'CAPTURE_CHOICE'} className="border hover:bg-green-50 transition-all active:scale-95 rounded disabled:opacity-50 uppercase tracking-widest">宝可梦</button>
                  <button onClick={handleExitBattle} disabled={phase === 'ANIMATING' || phase === 'CAPTURE_CHOICE'} className="border hover:bg-blue-50 transition-all active:scale-95 rounded disabled:opacity-50 uppercase tracking-widest">逃跑</button>
              </div>
          </div>
       </div>
       {showSwitchMenu && (
           <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-6" onClick={() => setShowSwitchMenu(false)}>
               <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                   <div className="text-center border-b pb-3"><h3 className="font-black uppercase tracking-widest text-sm">选择更换宝可梦</h3></div>
                   <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                       {playerEntities.map((p, i) => (
                           <button key={i} onClick={() => handleSwitchPokemon(i)} disabled={p.isDead || i === activePlayerIdx} className={`w-full p-3 rounded-xl border-2 flex justify-between items-center transition-all ${i === activePlayerIdx ? 'border-blue-500 bg-blue-50' : p.isDead ? 'opacity-40 grayscale cursor-not-allowed bg-slate-50' : 'border-slate-100 active:bg-slate-50'}`}>
                               <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border shadow-sm"><img src={p.card.image} className="w-full h-full object-fill" /></div><div className="text-left"><span className="font-black text-xs block">{p.card.name}</span>{p.isDead && <span className="text-[8px] text-red-500 font-bold uppercase">无法出战</span>}</div></div>
                               <span className={`text-[10px] font-mono font-black ${p.currentHp < p.maxHp * 0.3 ? 'text-red-500' : 'text-green-600'}`}>HP {p.currentHp}</span>
                           </button>
                       ))}
                   </div>
                   <button onClick={() => setShowSwitchMenu(false)} className="w-full py-3 bg-slate-100 text-slate-500 font-black rounded-xl text-[10px] uppercase tracking-widest">取消</button>
               </div>
           </div>
       )}

       <style>{`
          @keyframes popIn {
            from { opacity: 0; transform: scale(0.6) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes mildShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
          }
          @keyframes pokemonBreath {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05) translateY(-2px); }
          }
          @keyframes float {
            from { transform: translateY(0) rotate(0deg); opacity: 0; }
            50% { opacity: 0.6; }
            to { transform: translateY(-100px) rotate(360deg); opacity: 0; }
          }
       `}</style>
    </div>
  );
};

export default AdventureMode;
