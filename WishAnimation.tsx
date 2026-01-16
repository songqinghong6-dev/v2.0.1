
import React, { useEffect, useState } from 'react';
import { Rarity } from '../types';
import { audioManager } from '../services/audioManager';

interface WishAnimationProps {
  rarity: Rarity;
  onComplete: () => void;
}

const WishAnimation: React.FC<WishAnimationProps> = ({ rarity, onComplete }) => {
  const [phase, setPhase] = useState<'start' | 'impact' | 'flash'>('start');

  useEffect(() => {
    audioManager.play('meteor');
    audioManager.fadeBGM(true);

    const impactTimer = setTimeout(() => {
      setPhase('impact');
      if (rarity === Rarity.CROWN) {
        audioManager.play('crown_impact');
        audioManager.play('crown_reveal');
      } else if (rarity === Rarity.GOLD) {
        audioManager.play('gold_reveal');
        audioManager.play('gold_sparkle');
      } else if (rarity === Rarity.PURPLE) {
        audioManager.play('purple_reveal');
      }
    }, 2200);

    const flashTimer = setTimeout(() => setPhase('flash'), 2600);
    const completeTimer = setTimeout(() => {
      audioManager.fadeBGM(false);
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(impactTimer);
      clearTimeout(flashTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, rarity]);

  const config = {
    [Rarity.CROWN]: {
      mainColor: 'from-rose-600 via-red-500 via-white to-amber-200',
      glowColor: 'rgba(225, 29, 72, 1)',
      screenColor: 'bg-rose-50',
      isPremium: true
    },
    [Rarity.GOLD]: {
      mainColor: 'from-amber-200 via-yellow-400 to-amber-600',
      glowColor: 'rgba(251, 191, 36, 1)',
      screenColor: 'bg-amber-50',
      isPremium: true
    },
    [Rarity.PURPLE]: {
      mainColor: 'from-purple-300 via-purple-500 to-indigo-900',
      glowColor: 'rgba(168, 85, 247, 0.6)',
      screenColor: 'bg-white',
      isPremium: false
    },
    [Rarity.SILVER]: {
      mainColor: 'from-slate-100 via-slate-300 to-blue-200',
      glowColor: 'rgba(203, 213, 225, 0.5)',
      screenColor: 'bg-white',
      isPremium: false
    },
    [Rarity.BLUE]: {
      mainColor: 'from-blue-200 via-blue-400 to-blue-800',
      glowColor: 'rgba(59, 130, 246, 0.6)',
      screenColor: 'bg-white',
      isPremium: false
    }
  }[rarity];

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex items-center justify-center">
      {/* Background stars optimized for performance */}
      <div className="absolute inset-0 opacity-15">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white/60 h-[1px] will-change-transform animate-[warpSpeed_0.4s_linear_infinite]"
            style={{
              width: Math.random() * 200 + 100 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: `${Math.random() * 0.4}s`
            }}
          />
        ))}
      </div>

      {phase === 'start' && (
        <div className={`relative w-full h-full ${config.isPremium ? 'animate-[heavyShake_0.1s_infinite]' : 'animate-[mildShake_0.2s_infinite]'}`}>
          <div 
            className={`absolute top-[-40%] left-[-40%] w-[12px] h-[1200px] bg-gradient-to-b ${config.mainColor} rotate-[135deg] animate-[meteorFall_2.5s_cubic-bezier(0.15, 0, 0.15, 1)_infinite]`}
            style={{ 
              transformOrigin: 'top left',
              boxShadow: `0 0 140px 50px ${config.glowColor}`,
              willChange: 'transform'
            }}
          >
             <div className="absolute bottom-0 left-[-30px] w-16 h-16 rounded-full bg-white blur-[4px] shadow-[0_0_100px_rgba(255,255,255,1)]" />
             {rarity === Rarity.CROWN && (
               <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-500/30 to-transparent animate-pulse" />
             )}
          </div>
        </div>
      )}

      {phase === 'impact' && (
        <div className="relative flex items-center justify-center scale-[3] md:scale-[6] will-change-transform">
          <div className={`absolute w-96 h-96 rounded-full bg-white blur-[150px] animate-pulse`} style={{ backgroundColor: config.glowColor }}></div>
          <div className={`absolute w-[160px] h-[160px] rounded-full border-[10px] border-white/95 animate-[impactExpand_0.9s_ease-out_forwards]`}></div>
          
          {rarity === Rarity.CROWN && (
            <>
              <div className="absolute w-[250vw] h-[250vw] bg-rose-600 animate-[divineBurst_1.2s_ease-out_forwards] z-[110]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="absolute w-0.5 h-[200vh] bg-white/20" style={{ transform: `rotate(${i * 45}deg)` }} />
                ))}
              </div>
            </>
          )}

          {rarity === Rarity.GOLD && (
            <div className="absolute w-[180vw] h-[180vw] bg-amber-400/20 animate-[divineBurst_0.9s_ease-out_forwards] z-[110]" />
          )}

          <div className="w-8 h-8 bg-white rounded-full shadow-[0_0_300px_150px_white]"></div>
        </div>
      )}

      {phase === 'flash' && (
        <div className={`absolute inset-0 animate-[finalFlash_1.2s_ease-out_forwards] ${config.screenColor}`} />
      )}

      <button onClick={onComplete} className="absolute top-10 right-10 px-8 py-3 bg-white/5 border border-white/10 backdrop-blur-3xl text-white font-black uppercase rounded-full z-[120] text-xs">SKIP</button>

      <style>{`
        @keyframes meteorFall {
          0% { transform: translate(-400px, -400px) rotate(135deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate(250vw, 250vh) rotate(135deg); opacity: 0; }
        }
        @keyframes warpSpeed { from { transform: translateX(150vw); } to { transform: translateX(-150vw); } }
        @keyframes heavyShake { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-14px, 12px) scale(1.05); } 50% { transform: translate(14px, -12px) scale(0.95); } 75% { transform: translate(-10px, -10px) scale(1.02); } }
        @keyframes mildShake { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(6px, -6px); } }
        @keyframes impactExpand { 0% { transform: scale(0.05); opacity: 1; } 100% { transform: scale(15); opacity: 0; } }
        @keyframes divineBurst { 0% { opacity: 0; transform: scale(0.1); } 25% { opacity: 1; } 100% { opacity: 0; transform: scale(3.5); } }
        @keyframes finalFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default WishAnimation;
