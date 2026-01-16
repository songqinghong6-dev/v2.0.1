
import React, { useState, useMemo } from 'react';
import { Card, Rarity } from '../types';
import { audioManager } from '../services/audioManager';
import { getMaxHp } from '../services/battleLogic';

interface InventoryModalProps {
  inventory: Record<string, { card: Card; count: number; currentHp?: number }>;
  isMasterUnlock: boolean;
  onClose: () => void;
  onUpdateInventory: (inventory: Record<string, { card: Card; count: number; currentHp?: number }>) => void;
}

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
      default: return base + 'potion.png';
  }
};

const InventoryModal: React.FC<InventoryModalProps> = ({ inventory, isMasterUnlock, onClose, onUpdateInventory }) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const pokemonItems = useMemo(() => {
    return (Object.values(inventory) as { card: Card; count: number; currentHp?: number }[])
      .filter(item => !item.card.id.startsWith('item-') && item.count > 0)
      .sort((a, b) => {
        const rarityWeight: Record<Rarity, number> = { [Rarity.CROWN]: 0, [Rarity.GOLD]: 1, [Rarity.PURPLE]: 2, [Rarity.SILVER]: 3, [Rarity.BLUE]: 4 };
        return rarityWeight[a.card.rarity] - rarityWeight[b.card.rarity];
      });
  }, [inventory]);

  const potionList = useMemo(() => {
    return (Object.values(inventory) as { card: Card; count: number; currentHp?: number }[])
      .filter(item => item.card.id.includes('potion') && item.count > 0);
  }, [inventory]);

  const handleHeal = (potionId: string) => {
    if (!selectedCard) return;
    const pokeItem = inventory[selectedCard.id];
    const potionItem = inventory[potionId];
    if (!pokeItem || !potionItem || potionItem.count <= 0) return;

    const maxHp = getMaxHp(selectedCard.rarity);
    const currentHp = pokeItem.currentHp !== undefined ? pokeItem.currentHp : maxHp;
    if (currentHp >= maxHp) return alert("体力已满！");

    let healAmount = potionId.includes('max') ? 999 : potionId.includes('super') ? 120 : 50;
    const newHp = Math.min(maxHp, currentHp + healAmount);

    const newInv = { ...inventory };
    newInv[selectedCard.id] = { ...pokeItem, currentHp: newHp };
    newInv[potionId] = { ...potionItem, count: potionItem.count - 1 };
    
    onUpdateInventory(newInv);
    audioManager.play('gold_sparkle');
  };

  return (
    <div className="fixed inset-0 z-[150] bg-white/95 backdrop-blur-2xl flex items-center justify-center animate-[fadeIn_0.3s_ease-out]">
      <div className="w-full max-w-6xl h-full flex flex-col relative">
        
        <header className="px-8 pt-12 pb-8 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter text-slate-800 flex items-center gap-4 uppercase">
              POKEMON BOX <span className="text-slate-300 font-normal">/</span> 宝可梦盒子
            </h2>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">
              STORAGE CONTENT: {pokemonItems.length} POKÉMON
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center active:scale-90 transition-all shadow-sm hover:bg-slate-100"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-32 custom-scrollbar">
          {pokemonItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <span className="text-6xl grayscale opacity-20">📦</span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] italic opacity-40">BOX EMPTY / 盒子空空如也</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-10">
              {pokemonItems.map(item => {
                const max = getMaxHp(item.card.rarity);
                const current = item.currentHp !== undefined ? item.currentHp : max;
                const isDead = current <= 0;
                
                let borderColor = '#f1f5f9';
                let shadowColor = 'rgba(0,0,0,0.05)';
                if (item.card.rarity === Rarity.CROWN) { borderColor = '#fb7185'; shadowColor = 'rgba(251,113,133,0.15)'; }
                else if (item.card.rarity === Rarity.GOLD) { borderColor = '#fbbf24'; shadowColor = 'rgba(251,191,36,0.15)'; }
                else if (item.card.rarity === Rarity.PURPLE) { borderColor = '#c084fc'; shadowColor = 'rgba(192,132,252,0.15)'; }
                else if (item.card.rarity === Rarity.SILVER) { borderColor = '#94a3b8'; shadowColor = 'rgba(148,163,184,0.1)'; }

                return (
                  <div 
                    key={item.card.id} 
                    onClick={() => { setSelectedCard(item.card); audioManager.play('tap'); }} 
                    className={`group relative aspect-[630/880] rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden border-[3px] cursor-pointer transition-all duration-500 hover:-translate-y-3 active:scale-95 ${isDead ? 'grayscale opacity-60' : 'bg-white'}`} 
                    style={{ borderColor, boxShadow: `0 15px 35px ${shadowColor}` }}
                  >
                    <img src={item.card.image} className="w-full h-full object-fill" alt={item.card.name} />
                    
                    <div className="absolute top-2.5 right-2.5 w-8 h-8 md:w-9 md:h-9 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100 z-10 transition-transform group-hover:scale-110">
                        <span className="text-[10px] md:text-[11px] font-black text-slate-800">x{item.count}</span>
                    </div>
                    
                    {isDead && (
                        <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center">
                            <span className="bg-red-600 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg">无法战斗</span>
                        </div>
                    )}

                    {!isDead && current < max && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10 backdrop-blur-sm">
                            <div className={`h-full transition-all duration-500 ${current < max * 0.3 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${(current/max)*100}%` }} />
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedCard && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-[fadeIn_0.2s]" onClick={() => setSelectedCard(null)}>
          <div className="w-full max-w-[280px] md:max-w-[340px] aspect-[630/880] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl mb-8 bg-white" onClick={e => e.stopPropagation()}>
             <img src={selectedCard.image} className="w-full h-full object-fill" />
          </div>
          <div className="text-center space-y-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
             <h3 className="text-white font-black text-2xl italic tracking-widest uppercase leading-none">{selectedCard.name}</h3>
             
             {(() => {
                 const item = inventory[selectedCard.id];
                 const max = getMaxHp(selectedCard.rarity);
                 const current = item.currentHp !== undefined ? item.currentHp : max;
                 return (
                     <div className="flex justify-center items-center gap-5 py-3 bg-white/5 rounded-2xl border border-white/10 px-6">
                        <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                            <div className={`h-full transition-all duration-1000 ${current <= 0 ? 'bg-red-500' : current < max * 0.3 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${(current/max)*100}%` }} />
                        </div>
                        <span className="text-white text-xs font-mono font-bold tracking-widest">{current} / {max}</span>
                     </div>
                 );
             })()}

             <div className="flex gap-4 justify-center flex-wrap pt-2">
                {potionList.length === 0 ? <p className="text-slate-500 italic text-[10px] py-4 uppercase font-black tracking-widest">无可用恢复道具</p> : potionList.map(p => (
                    <button key={p.card.id} onClick={() => handleHeal(p.card.id)} className="w-16 h-22 md:w-20 md:h-26 bg-white/10 border border-white/20 rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-1 active:bg-white/20 transition-all hover:border-white/40 group/pot">
                        <img src={getItemImage(p.card.id)} className="w-8 h-8 md:w-10 md:h-10 object-contain group-hover/pot:scale-110 transition-transform" />
                        <span className="text-[8px] md:text-[9px] text-white/60 font-black uppercase mt-1">{p.card.name}</span>
                        <span className="text-[9px] md:text-[10px] text-blue-400 font-black">x{p.count}</span>
                    </button>
                ))}
             </div>
             <button onClick={() => setSelectedCard(null)} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl italic">CLOSE BOX / 返回盒子</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryModal;
