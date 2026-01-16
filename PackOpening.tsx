
import React, { useState, useEffect } from 'react';
import { Rarity } from '../types';
import { audioManager } from '../services/audioManager';

interface PackOpeningProps {
  highestRarity: Rarity;
  onOpened: (skip?: boolean) => void;
}

const PackOpening: React.FC<PackOpeningProps> = ({ highestRarity, onOpened }) => {
  const [selectedPack, setSelectedPack] = useState<number | null>(null);
  const [isTearing, setIsTearing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showHalo, setShowHalo] = useState(false);

  const isSpecial = highestRarity === Rarity.PURPLE || highestRarity === Rarity.GOLD || highestRarity === Rarity.CROWN;

  const handleSelect = (idx: number) => {
    if (selectedPack !== null) return;
    setSelectedPack(idx);
    audioManager.play('tap');
    setTimeout(() => executeTear(), 400);
  };

  const executeTear = () => {
    if (isTearing) return;
    setIsTearing(true);
    audioManager.play('pack_tear');
    
    if (highestRarity === Rarity.CROWN) {
      setTimeout(() => {
        audioManager.play('crown_impact');
        audioManager.play('crown_reveal');
        setShowFlash(true);
        setShowHalo(true);
      }, 100);
    } else if (highestRarity === Rarity.GOLD) {
      setTimeout(() => {
        audioManager.play('gold_reveal');
        setShowFlash(true);
        setShowHalo(true);
      }, 150);
    } else if (highestRarity === Rarity.PURPLE) {
      setTimeout(() => {
        audioManager.play('purple_reveal');
        setShowFlash(true);
      }, 150);
    }
    
    // 优化：根据稀有度精准控制转场延时
    // 皇冠保持庄重感(1600ms)，金卡缩短(1000ms)，紫卡(800ms)
    const delay = highestRarity === Rarity.CROWN ? 1600 : 
                  highestRarity === Rarity.GOLD ? 1000 : 
                  highestRarity === Rarity.PURPLE ? 800 : 400;

    setTimeout(() => onOpened(), delay);
  };

  const PackVisual = ({ size = 'large' }: { size?: 'small' | 'large' }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white select-none overflow-hidden transition-all duration-700">
      <div className="relative flex flex-col items-center z-10">
         <div className={`w-full ${size === 'large' ? 'max-w-[130px] mb-8' : 'max-w-[80px] mb-4'} aspect-square relative`}>
            <div className="absolute inset-0 bg-white rounded-full border-[4px] border-slate-900 overflow-hidden rotate-[-8deg]">
               <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#E60012]" />
               <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-900 -translate-y-1/2" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border-[4px] border-slate-900 rounded-full z-10" />
            </div>
            <img 
              src="https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full/151.png" 
              className="absolute inset-0 w-full h-full object-contain z-20 scale-110 drop-shadow-xl" 
              alt="Mew" 
            />
         </div>
         <div className="flex flex-col items-center">
            <h2 className={`${size === 'large' ? 'text-6xl md:text-7xl' : 'text-4xl'} font-black italic tracking-tighter text-slate-800 leading-none`}>151</h2>
            <div className={`mt-2 font-black tracking-[0.4em] text-slate-300 uppercase italic ${size === 'large' ? 'text-[8px]' : 'text-[6px]'}`}>Collection Pack</div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      <div className="absolute inset-0 bg-[#fcfcfc]" />
      
      <button onClick={() => onOpened(true)} className="absolute top-10 right-10 px-8 py-3 bg-slate-900/10 text-slate-500 font-black text-[10px] tracking-widest uppercase rounded-full z-[250] hover:bg-slate-900/20 transition-all">跳过动画</button>

      {selectedPack === null ? (
        <div className="relative w-full max-w-5xl flex flex-col items-center px-6 animate-[packFloat_4s_ease-in-out_infinite]">
          <h2 className="font-black tracking-[0.8em] text-[11px] mb-20 uppercase italic text-slate-300">
            选择你的卡包 / SELECT PACK
          </h2>
          
          <div className="flex justify-center space-x-6 md:space-x-12 w-full">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                onClick={() => handleSelect(i)} 
                className="group flex-1 max-w-[180px] aspect-[630/880] cursor-pointer hover:-translate-y-8 transition-all duration-500 relative"
              >
                <div className="absolute -inset-4 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-blue-400" />
                <div className="w-full h-full bg-white rounded-[2rem] border-[4px] border-white shadow-2xl relative overflow-hidden transition-all duration-500">
                   <PackVisual size="small" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`relative flex flex-col items-center scale-125 transition-transform duration-500 ${isTearing && (highestRarity === Rarity.GOLD || highestRarity === Rarity.CROWN) ? 'animate-[heavyShake_0.5s_infinite]' : ''}`}>
           
           {showHalo && highestRarity === Rarity.GOLD && (
             <div className="absolute inset-[-60px] z-[-1] rounded-[4rem] bg-amber-400/30 blur-[40px] animate-pulse" />
           )}

           {showHalo && highestRarity === Rarity.CROWN && (
             <div className="absolute inset-[-100px] z-[-1] rounded-[5rem] bg-rose-600/20 blur-[60px] animate-[crownElegantGlow_2s_ease-in-out_infinite]" />
           )}

           {isTearing && isSpecial && (
             <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-[3rem]">
                {[...Array(highestRarity === Rarity.CROWN ? 60 : (highestRarity === Rarity.GOLD ? 35 : 10))].map((_, i) => (
                  <div 
                    key={i} 
                    className={`absolute w-1.5 h-1.5 rounded-full animate-[meteorLocal_0.4s_ease-in_forwards] ${highestRarity === Rarity.CROWN ? 'bg-rose-400' : (highestRarity === Rarity.GOLD ? 'bg-amber-300' : 'bg-purple-300')}`}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      boxShadow: `0 0 15px ${highestRarity === Rarity.CROWN ? '#f43f5e' : (highestRarity === Rarity.GOLD ? '#fbbf24' : '#a855f7')}`,
                      willChange: 'transform, opacity'
                    }}
                  />
                ))}
             </div>
           )}

           <div className={`relative w-64 md:w-72 aspect-[630/880] transition-all duration-500 ${isTearing ? 'scale-110 rotate-[2deg]' : ''}`}>
              <div className={`absolute inset-0 rounded-[3rem] bg-white shadow-2xl border-[12px] border-white overflow-hidden transition-all duration-500 ${
                isTearing && highestRarity === Rarity.CROWN ? 'shadow-[0_0_180px_rgba(244,63,94,0.6)] border-rose-500/20' : 
                isTearing && highestRarity === Rarity.GOLD ? 'shadow-[0_0_100px_rgba(251,191,36,0.6)] border-amber-500/10' : 
                isTearing && highestRarity === Rarity.PURPLE ? 'shadow-[0_0_60px_rgba(168,85,247,0.4)]' : ''
              }`}>
                 <PackVisual size="large" />
              </div>
              
              <div className={`absolute -top-1 left-0 right-0 h-48 bg-white border-t-[12px] border-x-[12px] border-white rounded-t-[3rem] transition-all duration-500 z-20 origin-bottom ${
                isTearing ? '-translate-y-[120vh] rotate-[60deg] opacity-0 scale-150' : ''
              }`} />
           </div>

           {showFlash && (
             <div className={`fixed inset-0 z-[300] animate-[flashImpact_1s_ease-out_forwards] ${highestRarity === Rarity.CROWN ? 'bg-rose-600/20 backdrop-invert' : (highestRarity === Rarity.GOLD ? 'bg-amber-100/30' : 'bg-white')}`} />
           )}
        </div>
      )}

      <style>{`
        @keyframes packFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes crownElegantGlow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
        @keyframes meteorLocal { 0% { opacity: 0; transform: translateY(-20px) scale(0.5); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(10px) scale(1.2); } }
        @keyframes heavyShake { 0% { transform: translate(3px, 3px) rotate(0deg); } 10% { transform: translate(-5px, -8px) rotate(-3deg); } 20% { transform: translate(-10px, 0px) rotate(3deg); } 30% { transform: translate(10px, 8px) rotate(0deg); } 40% { transform: translate(6px, -6px) rotate(3deg); } 50% { transform: translate(-6px, 8px) rotate(-3deg); } 100% { transform: translate(3px, -3px) rotate(0deg); } }
        @keyframes flashImpact { 0% { opacity: 0; } 15% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default PackOpening;
