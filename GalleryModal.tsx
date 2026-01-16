
import React from 'react';
import { CARD_POOL } from '../constants';
import { Rarity, Card } from '../types';

interface GalleryModalProps {
  ownedIds: Set<string>;
  onClose: () => void;
}

const GalleryModal: React.FC<GalleryModalProps> = ({ ownedIds, onClose }) => {
  // 对图鉴进行排序，基础卡按编号排，道具卡在中间，特殊卡（SAR/AR）在最后
  const sortedPool = [...CARD_POOL].sort((a, b) => {
    const getSortKey = (id: string) => {
      // 1. 基础卡 (b-001 ~ b-151) -> 权重 1 ~ 151
      if (id.startsWith('b-')) return parseInt(id.replace('b-', ''));
      
      // 2. 道具卡 (item-) -> 权重 800+
      if (id.startsWith('item-')) {
        // 让道具卡内部按稀有度排序 (蓝 -> 银 -> 紫 -> 金)
        const rarityScore = {
          [Rarity.BLUE]: 1,
          [Rarity.SILVER]: 2,
          [Rarity.PURPLE]: 3,
          [Rarity.GOLD]: 4,
          [Rarity.CROWN]: 5,
        }[a.rarity] || 0;
        // 简单hash id来保持固定顺序
        const subId = id.includes('ball') ? 10 : 20; 
        return 800 + rarityScore * 10 + (id.length % 5);
      }

      // 3. AR 特殊卡 -> 权重 1200+
      if (id.startsWith('ar-') || id.startsWith('purple-')) return 1200 + parseInt(id.replace(/[^0-9]/g, '') || '0');
      
      // 4. SAR/Crown 特殊卡 -> 权重 1300+
      if (id.startsWith('sar-') || id.startsWith('gold-') || id.startsWith('crown-')) return 1300 + parseInt(id.replace(/[^0-9]/g, '') || '0');
      
      return 9999;
    };
    return getSortKey(a.id) - getSortKey(b.id);
  });

  return (
    <div className="fixed inset-0 z-[150] bg-white/95 backdrop-blur-2xl flex flex-col items-center animate-[fadeIn_0.3s_ease-out]">
      <header className="w-full max-w-6xl p-8 flex justify-between items-center bg-white/50 sticky top-0 z-10 backdrop-blur-md border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black italic tracking-[0.2em] uppercase">National Pokédex / 全国图鉴</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Collection Progress: {ownedIds.size} / {CARD_POOL.length}
          </p>
        </div>
        <button onClick={onClose} className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <div className="flex-1 w-full max-w-6xl overflow-y-auto p-6 md:p-12 custom-scrollbar">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-8 pb-32">
          {sortedPool.map((card) => {
            // 直接检查原始 ID 是否存在于已拥有集合中
            const isOwned = ownedIds.has(card.id);
            const isItem = card.id.startsWith('item-');
            
            return (
              <div key={card.id} className="group flex flex-col items-center">
                <div className={`relative aspect-[3/4.2] w-full rounded-2xl overflow-hidden border-2 transition-all duration-700 ${
                  isOwned 
                    ? 'border-white shadow-lg scale-100' 
                    : 'border-slate-100 grayscale opacity-30 scale-95'
                }`}>
                  <img src={card.image} className="w-full h-full object-contain" alt={card.name} />
                  {!isOwned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <svg className="w-6 h-6 text-slate-400 opacity-50" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                  {/* 角标编号 - 道具卡显示 "ITEM" */}
                  <div className={`absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-[7px] font-black ${isItem ? 'bg-blue-500/20 text-blue-800' : 'bg-black/10 text-white/80'}`}>
                    {isItem ? 'ITEM' : card.id.split('-').pop()}
                  </div>
                </div>
                <span className={`mt-2 text-[8px] font-black uppercase text-center transition-colors truncate w-full px-1 ${isOwned ? 'text-slate-800' : 'text-slate-200'}`}>
                  {isOwned ? card.name : '???'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="fixed bottom-12 z-20 pointer-events-none">
         <div className="bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl text-[10px] font-black tracking-widest uppercase italic animate-bounce opacity-80">
            滚动浏览图鉴
         </div>
      </div>
    </div>
  );
};

export default GalleryModal;
