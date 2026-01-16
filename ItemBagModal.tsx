
import React, { useState, useMemo } from 'react';
import { Card, Rarity } from '../types';
import { CARD_POOL } from '../constants';
import { audioManager } from '../services/audioManager';

interface ItemBagModalProps {
  inventory: Record<string, { card: Card; count: number }>;
  isMasterUnlock: boolean;
  onClose: () => void;
}

const ItemBagModal: React.FC<ItemBagModalProps> = ({ inventory, isMasterUnlock, onClose }) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const items = useMemo(() => {
    let displayList: { card: Card; count: number }[] = [];

    if (isMasterUnlock) {
      displayList = CARD_POOL.map(card => {
        const owned = inventory[card.id];
        return {
          card,
          count: owned ? Math.max(owned.count, 1) : 1
        };
      });
    } else {
      displayList = Object.values(inventory);
    }

    // 只保留道具卡 (ID 以 item- 开头)
    displayList = displayList.filter(item => item.card.id.startsWith('item-'));

    return displayList.sort((a, b) => {
      const rarityWeight = { 
        [Rarity.CROWN]: 0, 
        [Rarity.GOLD]: 1, 
        [Rarity.PURPLE]: 2, 
        [Rarity.SILVER]: 3, 
        [Rarity.BLUE]: 4 
      };
      
      const weightA = rarityWeight[a.card.rarity];
      const weightB = rarityWeight[b.card.rarity];

      if (weightA !== weightB) return weightA - weightB;
      
      return a.card.id.localeCompare(b.card.id);
    });
  }, [inventory, isMasterUnlock]);

  const ItemCard: React.FC<{ card: Card; count: number; onClick: () => void }> = ({ card, count, onClick }) => {
    const [error, setError] = useState(false);
    return (
      <div 
        onClick={onClick}
        className="relative group aspect-[3/4.2] rounded-2xl overflow-hidden border transition-all hover:-translate-y-2 active:scale-95 animate-[cardIn_0.4s_ease-out_forwards] opacity-0 bg-slate-50"
        style={{ 
          animationDelay: `0.05s`,
          borderColor: '#e2e8f0',
        }}
      >
        {!error ? (
          <img 
            src={card.image} 
            className="w-full h-full object-contain opacity-0 transition-opacity duration-700 p-4" 
            alt={card.name} 
            onLoad={(e) => (e.target as HTMLImageElement).classList.replace('opacity-0', 'opacity-100')}
            onError={() => setError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-300">
            <span className="text-xl mb-1">🎒</span>
            <span className="text-[6px] font-black uppercase">{card.name}</span>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none">
          <p className="text-[9px] font-black text-white italic truncate uppercase">{card.name}</p>
          <div className={`h-0.5 w-4 mt-1 rounded-full ${
            card.rarity === Rarity.CROWN ? 'bg-rose-500' : 
            card.rarity === Rarity.GOLD ? 'bg-amber-400' : 
            card.rarity === Rarity.PURPLE ? 'bg-purple-400' : 'bg-blue-400'
          }`} />
        </div>

        <div className="absolute top-2.5 right-2.5 px-2 py-1 bg-white shadow-sm rounded-lg text-[8px] font-black text-slate-800 border border-slate-100">
          x{count}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/80 backdrop-blur-3xl flex items-end md:items-center justify-center p-0 md:p-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-[#f8fafc] w-full max-w-6xl h-[92vh] md:h-auto md:max-h-[85vh] rounded-t-[3rem] md:rounded-[3rem] overflow-hidden flex flex-col border border-slate-700 shadow-2xl relative">
        
        <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-white/90 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 italic tracking-widest uppercase leading-none">Item Bag / 道具背包</h2>
            <div className="flex items-center space-x-3 mt-2">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                Items: {items.length}
              </p>
              {isMasterUnlock && (
                <span className="bg-slate-900 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Master Access
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center active:scale-90 transition-all">
             <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar z-10 bg-slate-50">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <span className="text-4xl">🎒</span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] italic opacity-60">BAG EMPTY / 背包为空</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-10 pb-12">
              {items.map((item, idx) => (
                <ItemCard 
                  key={item.card.id} 
                  card={item.card} 
                  count={item.count} 
                  onClick={() => { setSelectedCard(item.card); audioManager.play('tap'); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCard && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-[fadeIn_0.2s_ease-out]" onClick={() => setSelectedCard(null)}>
          <div className="relative w-full max-w-[340px] aspect-[3/4.2] rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] bg-slate-800 border border-slate-700 p-4">
             <img src={selectedCard.image} className="w-full h-full object-contain" alt="detail" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/630x880?text=Image+Not+Found'} />
          </div>
          <div className="mt-12 text-center">
             <h3 className="text-white font-black italic tracking-[0.2em] text-2xl uppercase mb-2 leading-none">{selectedCard.name}</h3>
             <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto mb-6">{selectedCard.description}</p>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic mb-8">Tap anywhere to close</p>
             <button onClick={() => setSelectedCard(null)} className="px-16 py-4.5 bg-white text-slate-900 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase active:scale-95 shadow-2xl transition-all italic">Close / 返回</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cardIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
};

export default ItemBagModal;
