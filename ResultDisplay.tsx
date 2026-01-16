
import React, { useState, useEffect, useRef } from 'react';
import { Card, Rarity } from '../types';
import { audioManager } from '../services/audioManager';

interface ResultDisplayProps {
  cards: Card[];
  initialSkip?: boolean;
  onClose: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ cards, initialSkip = false, onClose }) => {
  const [revealIndex, setRevealIndex] = useState(initialSkip ? cards.length : 0);
  const [selectedDetailCard, setSelectedDetailCard] = useState<Card | null>(null);
  
  const showSummary = revealIndex >= cards.length;
  const currentCard = cards[revealIndex];

  useEffect(() => {
    if (revealIndex + 1 < cards.length) {
      const img = new Image();
      img.src = cards[revealIndex + 1].image;
    }
  }, [revealIndex, cards]);

  useEffect(() => {
    if (!showSummary && currentCard) {
      const timer = setTimeout(() => {
        audioManager.play('card_slide');
        
        if (currentCard.rarity === Rarity.CROWN) {
          setTimeout(() => audioManager.play('crown_impact'), 600);
          setTimeout(() => audioManager.play('crown_reveal'), 800);
        } else if (currentCard.rarity === Rarity.GOLD) {
          audioManager.play('gold_reveal');
          setTimeout(() => audioManager.play('gold_sparkle'), 400);
        } else if (currentCard.rarity === Rarity.PURPLE) {
          audioManager.play('purple_reveal');
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [revealIndex, showSummary, currentCard]);

  const handleNext = () => {
    if (showSummary || selectedDetailCard) return;
    setRevealIndex(prev => prev + 1);
  };

  const CardItem = ({ card, isSmall = false, isReveal = false }: { card: Card; isSmall?: boolean; isReveal?: boolean }) => {
    const [tilt, setTilt] = useState({ x: 0, y: 0, sX: 0, sY: 0 });
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
      <div 
        onMouseMove={(e) => {
          if (isSmall) return;
          const rect = e.currentTarget.getBoundingClientRect();
          setTilt({
            x: (rect.height / 2 - (e.clientY - rect.top)) / 25,
            y: ((e.clientX - rect.left) - rect.width / 2) / 25,
            sX: ((e.clientX - rect.left) / rect.width) * 100,
            sY: ((e.clientY - rect.top) / rect.height) * 100
          });
        }}
        onMouseLeave={() => setTilt({ x: 0, y: 0, sX: 0, sY: 0 })}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x === 0 ? 1 : 1.02}) translate3d(0,0,0)`,
          transition: tilt.x === 0 ? 'transform 0.6s cubic-bezier(0.1, 0.9, 0.2, 1)' : 'none',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d'
        }}
        className="relative w-full h-full group/card flex flex-col items-center justify-center transform-gpu"
      >
        <div className="relative w-full h-full flex items-center justify-center transform-gpu">
          
          {isReveal && card.rarity === Rarity.CROWN && (
            <div className="absolute inset-0 z-[-10] flex items-center justify-center pointer-events-none transform-gpu">
               {[...Array(6)].map((_, i) => (
                 <div 
                   key={i} 
                   className="absolute w-[1px] h-[300vh] bg-rose-200/30 opacity-20 animate-[crownBeam_15s_linear_infinite]"
                   style={{ 
                     transform: `rotate(${i * 60}deg) translate3d(0,0,0)`,
                     willChange: 'transform'
                    }}
                 />
               ))}
            </div>
          )}

          {isReveal && (
            <div className="absolute inset-[-120px] z-[-5] rounded-full pointer-events-none transform-gpu opacity-30"
                 style={{
                   background: card.rarity === Rarity.CROWN ? 'radial-gradient(circle, rgba(225,29,72,0.4) 0%, transparent 80%)' :
                               card.rarity === Rarity.GOLD ? 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 80%)' :
                               card.rarity === Rarity.PURPLE ? 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 80%)' : 'none',
                   animation: card.rarity === Rarity.CROWN ? 'crownPulse 5s ease-in-out infinite' : 'pulse 3s infinite',
                   willChange: 'opacity, transform'
                 }} />
          )}
          
          <div className="relative w-full h-full transform-gpu flex items-center justify-center">
            {!error ? (
              <img 
                src={card.image} 
                loading="eager"
                decoding="async"
                onLoad={() => setLoaded(true)}
                onError={() => {
                  console.error(`Failed to load card image: ${card.image}`);
                  setError(true);
                  setLoaded(true);
                }}
                className={`max-w-full max-h-full object-contain transition-all duration-700 will-change-[transform,opacity] ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${
                  card.rarity === Rarity.CROWN ? 'drop-shadow-[0_0_30px_rgba(225,29,72,0.4)]' : 
                  card.rarity === Rarity.GOLD ? 'drop-shadow-[0_0_20px_rgba(251,191,36,0.25)]' : 
                  card.rarity === Rarity.PURPLE ? 'drop-shadow-[0_0_10px_rgba(168,85,247,0.15)]' : ''
                }`} 
                alt={card.name} 
              />
            ) : (
              <div className={`w-full h-full flex flex-col items-center justify-center p-4 rounded-3xl border-4 ${
                card.rarity === Rarity.CROWN ? 'bg-rose-900/10 border-rose-500' :
                card.rarity === Rarity.GOLD ? 'bg-amber-900/10 border-amber-500' : 'bg-slate-100 border-slate-300'
              }`}>
                <div className="text-4xl mb-4">🖼️</div>
                <div className="text-[10px] font-black uppercase text-slate-400">Card Lost</div>
                <div className="text-[8px] font-mono text-slate-300 mt-2 truncate w-full text-center px-2">{card.image}</div>
              </div>
            )}
            
            {isReveal && card.rarity === Rarity.CROWN && loaded && !error && (
              <div className="absolute inset-0 mix-blend-color-dodge opacity-0 animate-[holographicFadeIn_1s_ease-out_1s_forwards] pointer-events-none rounded-[10%] overflow-hidden transform-gpu">
                <div className="absolute inset-[-150%] bg-gradient-to-tr from-transparent via-rose-300/30 via-sky-300/30 via-amber-200/30 to-transparent animate-[holographic_8s_linear_infinite]" 
                     style={{ willChange: 'transform' }} />
              </div>
            )}
          </div>
          
          {!isSmall && loaded && (
            <div 
              style={{ 
                background: `radial-gradient(circle at ${tilt.sX}% ${tilt.sY}%, rgba(255,255,255,${card.rarity === Rarity.CROWN ? 0.4 : 0.2}) 0%, transparent 60%)`,
                mixBlendMode: 'overlay'
              }}
              className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none z-10 rounded-[10%]"
            />
          )}

          {loaded && !isSmall && (
            <div className="absolute inset-0 flex flex-col justify-end p-[10%] pointer-events-none z-20">
               <div className="flex flex-col items-start translate-y-4 group-hover/card:translate-y-0 transition-all duration-1000 opacity-0 group-hover/card:opacity-100">
                  <h3 className={`relative text-2xl font-black italic tracking-tighter uppercase leading-none ${
                    card.rarity === Rarity.CROWN ? 'text-white drop-shadow-lg' :
                    card.rarity === Rarity.GOLD ? 'text-amber-400 drop-shadow-md' : 'text-white'
                  }`}>
                    {card.name}
                  </h3>
                  <div className={`mt-3 text-[7px] font-black tracking-widest uppercase px-3 py-1 rounded-sm ${
                    card.rarity === Rarity.CROWN ? 'bg-rose-600 text-white shadow-xl' : 
                    card.rarity === Rarity.GOLD ? 'bg-amber-500 text-slate-900' : 
                    card.rarity === Rarity.PURPLE ? 'bg-purple-600 text-white' : 
                    card.rarity === Rarity.SILVER ? 'bg-slate-300 text-slate-800' : 'bg-blue-600 text-white'
                  }`}>
                    {card.rarity}
                  </div>
               </div>
            </div>
          )}

          {isSmall && (
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent pt-4 pointer-events-none z-20">
               <p className="text-[7px] font-black text-white italic truncate uppercase text-center drop-shadow-sm">
                 {card.name}
               </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (showSummary) {
    return (
      <div 
        className="fixed inset-0 z-[250] bg-[#F4F4F2] flex flex-col items-center justify-center p-6 animate-[fadeIn_0.5s_ease-out] cursor-pointer"
        onClick={onClose}
      >
        <div className="relative w-full max-w-5xl h-full flex flex-col pt-16 pointer-events-none">
           <h2 className="text-slate-300 text-[10px] font-black tracking-[1.2em] uppercase mb-12 italic text-center">Collection Archives Summary</h2>
           <div className="flex-1 overflow-y-auto px-4 pb-48 custom-scrollbar pointer-events-auto">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 md:gap-10">
                {cards.map((card, idx) => (
                  <div 
                    key={idx} 
                    onClick={(e) => { e.stopPropagation(); setSelectedDetailCard(card); }} 
                    className="relative aspect-[630/880] rounded-2xl cursor-pointer hover:scale-105 transition-transform duration-500 active:scale-95 shadow-sm bg-white/40 border border-slate-100"
                  >
                     <CardItem card={card} isSmall={true} />
                  </div>
                ))}
              </div>
           </div>
           <div className="absolute bottom-12 left-0 right-0 flex justify-center px-10 pointer-events-auto">
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                className="w-full max-w-[480px] py-8 bg-slate-900 text-white font-black rounded-3xl shadow-[0_35px_90px_rgba(0,0,0,0.35)] active:scale-95 transition-all uppercase text-[14px] tracking-[0.5em] italic border border-white/10"
              >
                收藏并返回 / COMPLETE
              </button>
           </div>
        </div>
        {selectedDetailCard && (
          <div 
            className="fixed inset-0 z-[400] bg-[#f4f4f2]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 cursor-pointer" 
            onClick={(e) => { e.stopPropagation(); setSelectedDetailCard(null); }}
          >
            <div className="w-full max-w-[340px] aspect-[630/880] animate-[cardPop_0.4s_cubic-bezier(0.1,0.9,0.2,1)] pointer-events-none">
              <CardItem card={selectedDetailCard} />
            </div>
            <p className="mt-14 text-slate-300 text-[10px] font-black uppercase tracking-[0.4em] italic">Tap anywhere to close</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[250] bg-white flex items-center justify-center cursor-pointer select-none px-6 overflow-hidden" onClick={handleNext}>
      
      {currentCard.rarity === Rarity.CROWN && (
        <div className="absolute inset-0 z-[260] pointer-events-none animate-[crownFlash_1.2s_ease-out_forwards] bg-rose-50/15" />
      )}

      <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-center z-[300]">
         <div className="text-slate-100 text-[10px] font-black italic tracking-widest uppercase bg-slate-900/10 px-5 py-2 rounded-full backdrop-blur-sm">
            {revealIndex + 1} / {cards.length}
         </div>
         <button onClick={(e) => { e.stopPropagation(); setRevealIndex(cards.length); }} className="px-10 py-3 text-slate-300 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-full transition-all border border-transparent hover:border-slate-100">Skip reveal</button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[200] p-8 md:p-12">
        <div 
          key={revealIndex}
          className={`relative w-full h-full max-w-[320px] max-h-[75vh] md:max-w-[400px] md:max-h-[80vh] aspect-[630/880] pointer-events-auto transform-gpu transition-all flex items-center justify-center ${
            currentCard.rarity === Rarity.CROWN ? 'animate-[crownSupremeReveal_1.6s_cubic-bezier(0.1,0.9,0.2,1)]' : 
            currentCard.rarity === Rarity.GOLD ? 'animate-[goldDivineReveal_1.2s_cubic-bezier(0.1,0.9,0.2,1)]' : 'animate-[cardIn_0.7s_cubic-bezier(0.1,0.9,0.2,1)]'
          }`}
        >
          <CardItem card={currentCard} isReveal={true} />
        </div>
      </div>

      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center space-y-4 opacity-15 animate-pulse pointer-events-none">
         <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.8em] italic">Discover New Legacy</div>
         <div className="w-[1px] h-14 bg-gradient-to-b from-slate-300 to-transparent" />
      </div>

      <style>{`
        @keyframes crownSupremeReveal { 
          0% { opacity: 0; transform: scale(0.6) rotateY(360deg) translateY(60px) translate3d(0,0,0); }
          60% { opacity: 1; transform: scale(1.1) rotateY(180deg) translateY(-20px) translate3d(0,0,0); }
          85% { transform: scale(0.98) rotateY(0deg) translateY(5px) translate3d(0,0,0); }
          100% { opacity: 1; transform: scale(1) rotateY(0deg) translateY(0) translate3d(0,0,0); }
        }
        @keyframes goldDivineReveal {
          0% { opacity: 0; transform: scale(0.6) rotateY(0deg) translateY(40px) translate3d(0,0,0); }
          50% { opacity: 1; transform: scale(1.08) rotateY(180deg) translateY(-10px) translate3d(0,0,0); }
          100% { opacity: 1; transform: scale(1) rotateY(360deg) translateY(0) translate3d(0,0,0); }
        }
        @keyframes holographicFadeIn { from { opacity: 0; } to { opacity: 0.35; } }
        @keyframes crownPulse { 0%, 100% { transform: scale(1) translate3d(0,0,0); opacity: 0.2; } 50% { transform: scale(1.15) translate3d(0,0,0); opacity: 0.35; } }
        @keyframes crownBeam { from { transform: rotate(0deg) translateY(-50%) translate3d(0,0,0); } to { transform: rotate(360deg) translateY(-50%) translate3d(0,0,0); } }
        @keyframes holographic { from { transform: translateX(-100%) translateY(-100%) rotate(0deg) translate3d(0,0,0); } to { transform: translateX(100%) translateY(100%) rotate(5deg) translate3d(0,0,0); } }
        @keyframes crownFlash { 0% { opacity: 0; } 20% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes cardIn { 
          from { opacity: 0; transform: translateY(30px) translate3d(0,0,0); } 
          to { opacity: 1; transform: translateY(0) translate3d(0,0,0); } 
        }
        @keyframes cardPop {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ResultDisplay;
