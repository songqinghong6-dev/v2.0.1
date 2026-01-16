
import React from 'react';
import { GACHA_RATES, CARD_POOL } from '../constants';
import { Rarity } from '../types';

interface RatesModalProps {
  onClose: () => void;
}

const RatesModal: React.FC<RatesModalProps> = ({ onClose }) => {
  const getCardsByRarity = (rarity: Rarity) => CARD_POOL.filter(c => c.rarity === rarity);

  const RaritySection = ({ rarity, title, color }: { rarity: Rarity, title: string, color: string }) => {
    const cards = getCardsByRarity(rarity);
    const totalRate = GACHA_RATES[rarity];
    const individualRate = cards.length > 0 ? (totalRate / cards.length) * 100 : 0;

    return (
      <section className="space-y-6">
        <div className={`flex items-center justify-between border-b pb-4 ${
          color === 'crown' ? 'border-rose-100' : color === 'amber' ? 'border-amber-100' : color === 'purple' ? 'border-purple-100' : 'border-slate-100'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              color === 'crown' ? 'bg-rose-500' : color === 'amber' ? 'bg-amber-400' : color === 'purple' ? 'bg-purple-400' : color === 'silver' ? 'bg-slate-300' : 'bg-blue-400'
            }`} />
            <span className="font-black text-slate-800 text-sm uppercase tracking-widest">{title}</span>
          </div>
          <div className="text-right">
             <div className={`font-mono font-black text-xl ${
               color === 'crown' ? 'text-rose-500' : color === 'amber' ? 'text-amber-500' : color === 'purple' ? 'text-purple-500' : 'text-slate-500'
             }`}>{(totalRate * 100).toFixed(2)}%</div>
             <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">个体: {individualRate.toFixed(4)}%</div>
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {cards.map(card => (
            <div key={card.id} className="aspect-[3/4.2] rounded-lg overflow-hidden border border-slate-50 bg-slate-50">
               <img src={card.image} className="w-full h-full object-contain" alt={card.name} />
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10">
      <div className="bg-white rounded-[3rem] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
          <h2 className="text-xl font-black tracking-widest uppercase text-slate-900">概率公示 / Gacha Rates</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 space-y-16 custom-scrollbar bg-white">
          <RaritySection rarity={Rarity.CROWN} title="皇冠级 (CROWN SAR)" color="crown" />
          <RaritySection rarity={Rarity.GOLD} title="金色级 (GOLD SAR)" color="amber" />
          <RaritySection rarity={Rarity.PURPLE} title="紫色级 (AR)" color="purple" />
          <RaritySection rarity={Rarity.SILVER} title="银色级 (ex RR)" color="silver" />
          <RaritySection rarity={Rarity.BLUE} title="基础级 (Standard)" color="blue" />
        </div>
      </div>
    </div>
  );
};

export default RatesModal;
