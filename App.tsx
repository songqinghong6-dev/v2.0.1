
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { performGacha } from './services/gachaLogic';
import { Card, Rarity, GachaResult, GachaRates } from './types';
import { CARD_POOL, DEFAULT_GACHA_RATES } from './constants';
import PackOpening from './components/PackOpening';
import ResultDisplay from './components/ResultDisplay';
import InventoryModal from './components/InventoryModal';
import ItemBagModal from './components/ItemBagModal';
import GalleryModal from './components/GalleryModal';
import RatesModal from './components/RatesModal';
import RechargeModal from './components/RechargeModal';
import AdminSettingsModal from './components/AdminSettingsModal';
import AdventureMode from './components/AdventureMode';
import { audioManager } from './services/audioManager';

const App: React.FC = () => {
  const [gems, setGems] = useState(() => {
    const saved = localStorage.getItem('user_gems');
    return saved ? parseInt(saved, 10) : 16000;
  });
  
  const [inventoryMap, setInventoryMap] = useState<Record<string, { card: Card; count: number; currentHp?: number }>>(() => {
    const saved = localStorage.getItem('user_inventory');
    return saved ? JSON.parse(saved) : {};
  });

  const [rates, setRates] = useState<GachaRates>(() => {
    const saved = localStorage.getItem('gacha_rates');
    const defaultRates = { ...DEFAULT_GACHA_RATES };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultRates, ...parsed };
      } catch (e) {
        return defaultRates;
      }
    }
    return defaultRates;
  });

  const [pityCount, setPityCount] = useState(() => {
    const saved = localStorage.getItem('pity_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isMasterUnlock, setIsMasterUnlock] = useState(() => {
    return localStorage.getItem('master_unlock') === 'true';
  });

  const [isPulling, setIsPulling] = useState(false);
  const [currentResult, setCurrentResult] = useState<GachaResult | null>(null);
  const [showPack, setShowPack] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const [showInventory, setShowInventory] = useState(false); // 宝可梦盒子
  const [showItemBag, setShowItemBag] = useState(false);     // 道具背包
  const [showGallery, setShowGallery] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdventure, setShowAdventure] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [isSheepJumping, setIsSheepJumping] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const [hoverState, setHoverState] = useState({ rotateX: 0, rotateY: 0, shineX: 0, shineY: 0 });

  const effectiveInventory = useMemo(() => {
      if (!isMasterUnlock) return inventoryMap;
      const combined = { ...inventoryMap };
      CARD_POOL.forEach(card => {
          if (card.id.startsWith('item-')) {
              combined[card.id] = { card, count: 99 };
          } else {
              if (!combined[card.id]) {
                  combined[card.id] = { card, count: 1 };
              }
          }
      });
      return combined;
  }, [inventoryMap, isMasterUnlock]);

  const ownedIds = new Set(Object.keys(effectiveInventory));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoverState({
      rotateX: (rect.height / 2 - y) / 12,
      rotateY: (x - rect.width / 2) / 12,
      shineX: (x / rect.width) * 100,
      shineY: (y / rect.height) * 100
    });
  };

  useEffect(() => {
    localStorage.setItem('user_gems', gems.toString());
    localStorage.setItem('user_inventory', JSON.stringify(inventoryMap));
    localStorage.setItem('gacha_rates', JSON.stringify(rates));
    localStorage.setItem('master_unlock', isMasterUnlock.toString());
    localStorage.setItem('pity_count', pityCount.toString());
  }, [gems, inventoryMap, rates, isMasterUnlock, pityCount]);

  const handlePull = (count: number) => {
    if (!hasInteracted) { setHasInteracted(true); }
    audioManager.startBGM(); 
    audioManager.play('click');
    const cost = count * 160;
    if (gems < cost) { setShowRecharge(true); return; }
    
    const result = performGacha(count, rates, pityCount, new Set(Object.keys(inventoryMap)));
    
    result.cards.forEach(card => {
      const img = new Image();
      img.src = card.image;
    });

    setGems(prev => prev - cost);
    setPityCount(result.newPityCount);
    
    setInventoryMap(prev => {
      const next = { ...prev };
      result.cards.forEach(card => {
        if (next[card.id]) next[card.id].count += 1;
        else next[card.id] = { card, count: 1 };
      });
      return next;
    });

    setCurrentResult(result);
    setIsPulling(true);
    setShowPack(true);
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setIsPulling(false);
    audioManager.stopBGM(); 
  };

  const handleSheepClick = () => {
    if (isSheepJumping) return;
    setIsSheepJumping(true);
    audioManager.play('tap');
    setTimeout(() => setIsSheepJumping(false), 600);
    setIsAdminAuthOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-[#FCFCFC] text-slate-900 overflow-hidden select-none flex flex-col font-sans">
      <header className="shrink-0 px-3 py-3 md:p-6 flex justify-between items-center z-50">
        <div className="flex items-center space-x-1.5 md:space-x-2">
           {/* Gems */}
           <button onClick={() => setShowRecharge(true)} className="bg-white px-2 py-1.5 md:px-3 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-1.5 active:scale-95 transition-all">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-[7px] text-white font-black">G</div>
              <span className="font-mono font-black text-slate-800 text-[10px]">{gems.toLocaleString()}</span>
           </button>
           
           {/* Pokemon Box */}
           <button onClick={() => setShowInventory(true)} className="w-8 h-8 md:w-9 md:h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 active:scale-90 transition-all text-slate-400 hover:text-slate-600 relative group/btn">
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
           </button>

           {/* Item Bag */}
           <button onClick={() => setShowItemBag(true)} className="w-8 h-8 md:w-9 md:h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 active:scale-90 transition-all text-slate-400 hover:text-slate-600 relative group/btn">
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
           </button>

           {/* Gallery */}
           <button onClick={() => setShowGallery(true)} className="w-8 h-8 md:w-9 md:h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 active:scale-90 transition-all text-slate-400 hover:text-slate-600 relative group/btn">
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
           </button>
        </div>
        
        <div onClick={handleSheepClick} className="cursor-pointer group relative p-1">
          <div className={`text-2xl transition-transform duration-300 ${isSheepJumping ? 'animate-[sheepJump_0.6s_ease]' : ''}`}>🐑</div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden perspective-[1500px]">
        <div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverState({ rotateX: 0, rotateY: 0, shineX: 0, shineY: 0 })}
          onClick={() => setShowRates(true)}
          style={{
            transform: `translate(-50%, -50%) rotateX(${hoverState.rotateX}deg) rotateY(${hoverState.rotateY}deg) scale(${hoverState.rotateX === 0 ? 1 : 1.05})`,
            transition: hoverState.rotateX === 0 ? 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
            top: '42%',
            left: '50%',
            willChange: 'transform'
          }}
          className="absolute group w-full max-w-[150px] md:max-w-[210px] aspect-[630/880] cursor-pointer"
        >
           <div className="relative w-full h-full bg-white rounded-[1.5rem] overflow-hidden shadow-[0_15px_45px_-10px_rgba(0,0,0,0.12)] border-[3.5px] border-slate-50 transition-shadow group-hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-b from-white to-[#fafbfc]" />
              <div className="relative h-full flex flex-col items-center justify-center p-6 z-10">
                 <div className="w-full max-w-[100px] md:max-w-[140px] mb-4 md:mb-8 aspect-square relative">
                    <div className="absolute inset-0 bg-white rounded-full border-[3.5px] border-slate-900 overflow-hidden rotate-[-8deg]">
                       <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#E60012]" />
                       <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-900 -translate-y-1/2" />
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white border-[3.5px] border-slate-900 rounded-full z-10" />
                    </div>
                    <img 
                      src="https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/151.png" 
                      className="absolute inset-0 w-full h-full object-contain z-20 scale-110 drop-shadow-xl animate-[float_4s_easeInOut_infinite]" 
                      alt="Mew" 
                    />
                 </div>
                 <div className="flex flex-col items-center">
                    <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-800 leading-none">151</h2>
                    <div className="mt-2 font-black tracking-[0.4em] text-slate-300 uppercase italic text-[7px] md:text-[8px]">Collection</div>
                 </div>
              </div>
              <div 
                style={{ background: `radial-gradient(circle at ${hoverState.shineX}% ${hoverState.shineY}%, rgba(255,255,255,0.8) 0%, transparent 60%)` }}
                className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-30 mix-blend-overlay"
              />
           </div>

           {/* 保底进度 */}
           <div className={`absolute top-2 -right-2 md:top-4 md:-right-6 translate-x-full bg-white/40 backdrop-blur-md border border-white/50 px-2 py-1.5 md:px-3 md:py-2 rounded-xl shadow-lg flex flex-col items-center transition-all duration-500 ${pityCount > 60 ? 'shadow-[0_0_15px_rgba(251,191,36,0.4)] border-amber-200' : ''}`}>
             <span className="text-[5px] md:text-[6px] font-black uppercase tracking-widest text-slate-400 mb-1">Pity</span>
             <div className="relative w-6 h-0.5 md:w-8 md:h-1 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${pityCount > 60 ? 'bg-amber-400' : 'bg-slate-800'}`} 
                  style={{ width: `${Math.min(100, (pityCount / 80) * 100)}%` }} 
                />
             </div>
             <div className={`mt-0.5 md:mt-1 font-mono text-[8px] md:text-[9px] font-black ${pityCount > 60 ? 'text-amber-500' : 'text-slate-800'}`}>
                {pityCount}<span className="text-slate-400">/80</span>
             </div>
           </div>
        </div>

        {/* 冒险模式入口 */}
        <button 
          onClick={() => setShowAdventure(true)}
          className="absolute top-1/2 -translate-y-1/2 left-2 md:left-10 px-4 py-3 md:px-6 md:py-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all border-2 border-white/20 group"
        >
          <div className="flex flex-col items-center gap-1">
             <span className="text-xl md:text-2xl animate-bounce">⚔️</span>
             <span className="text-[9px] md:text-xs">冒险</span>
          </div>
          <div className="absolute inset-0 bg-white/20 blur-lg opacity-0 group-hover:opacity-50 transition-opacity rounded-2xl"></div>
        </button>
      </main>

      <footer className="shrink-0 p-6 md:p-8 pb-10 md:pb-12 flex flex-col items-center space-y-4">
        <div className="flex justify-center items-center space-x-3 w-full max-w-sm">
          <button onClick={() => handlePull(1)} disabled={isPulling} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl active:scale-95 transition-all text-[11px] uppercase tracking-widest hover:bg-slate-200">1抽 160</button>
          <button onClick={() => handlePull(10)} disabled={isPulling} className="flex-[1.4] py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-[11px] uppercase tracking-widest hover:bg-slate-800">10抽 1600</button>
        </div>
      </footer>

      {showPack && currentResult && <PackOpening highestRarity={currentResult.highestRarity} onOpened={() => { setShowPack(false); setShowResults(true); }} />}
      {showResults && currentResult && <ResultDisplay cards={currentResult.cards} onClose={handleCloseResults} />}
      {showInventory && (
          <InventoryModal 
            inventory={effectiveInventory} 
            isMasterUnlock={isMasterUnlock} 
            onClose={() => setShowInventory(false)} 
            onUpdateInventory={(newInv) => setInventoryMap(prev => ({...prev, ...newInv}))} 
          />
      )}
      {showItemBag && <ItemBagModal inventory={effectiveInventory} isMasterUnlock={isMasterUnlock} onClose={() => setShowItemBag(false)} />}
      {showGallery && <GalleryModal ownedIds={ownedIds} onClose={() => setShowGallery(false)} />}
      {showRates && <RatesModal onClose={() => setShowRates(false)} />}
      {showRecharge && <RechargeModal onSuccess={(g) => setGems(prev => prev + g)} onClose={() => setShowRecharge(false)} />}
      
      {showAdventure && (
        <AdventureMode 
          inventory={effectiveInventory} 
          onClose={() => setShowAdventure(false)} 
          onUpdateInventory={(newInv) => setInventoryMap(prev => ({...prev, ...newInv}))}
        />
      )}

      {showAdmin && (
        <AdminSettingsModal 
          currentRates={rates} 
          currentGems={gems} 
          isMasterUnlock={isMasterUnlock}
          inventoryMap={inventoryMap}
          onUpdateRates={setRates} 
          onUpdateGems={setGems} 
          onToggleMasterUnlock={setIsMasterUnlock}
          onResetInventory={() => { setInventoryMap({}); setIsMasterUnlock(false); }}
          onClose={() => setShowAdmin(false)} 
        />
      )}
      
      {isAdminAuthOpen && (
        <div className="fixed inset-0 z-[600] bg-white/60 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setIsAdminAuthOpen(false)}>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-sm w-full animate-[cardPop_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-center font-black italic tracking-widest uppercase text-slate-400 text-[10px] mb-6">Admin Authentication</h3>
            <input 
              type="password" 
              value={adminPass} 
              onChange={(e) => setAdminPass(e.target.value)} 
              placeholder="ENTER PIN" 
              className="w-full text-center p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl tracking-[0.5em] font-mono focus:border-blue-500 outline-none transition-all" 
            />
            <div className="flex gap-3 mt-6">
               <button onClick={() => setIsAdminAuthOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</button>
               <button onClick={() => adminPass === '0766' ? (setShowAdmin(true), setIsAdminAuthOpen(false), setAdminPass('')) : alert('ACCESS DENIED')} className="flex-[2] py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Verify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
