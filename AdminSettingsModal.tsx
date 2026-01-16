
import React, { useState, useEffect, useRef } from 'react';
import { GachaRates, Rarity, Card } from '../types';
import { DEFAULT_GACHA_RATES } from '../constants';
import { audioManager } from '../services/audioManager';

interface AdminSettingsModalProps {
  currentRates: GachaRates;
  currentGems: number;
  isMasterUnlock: boolean;
  inventoryMap: Record<string, { card: Card; count: number }>;
  onUpdateRates: (rates: GachaRates) => void;
  onUpdateGems: (gems: number) => void;
  onToggleMasterUnlock: (val: boolean) => void;
  onResetInventory: () => void;
  onClose: () => void;
}

const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ 
  currentRates, 
  currentGems, 
  isMasterUnlock,
  onUpdateRates, 
  onUpdateGems, 
  onToggleMasterUnlock,
  onResetInventory,
  onClose 
}) => {
  const [rates, setRates] = useState<GachaRates>({ ...currentRates });
  const [gems, setGems] = useState<number>(currentGems);
  const [isFixedDefault, setIsFixedDefault] = useState(() => {
    // 检查当前概率是否与默认完全一致
    return JSON.stringify(currentRates) === JSON.stringify(DEFAULT_GACHA_RATES);
  });
  const [activeTab, setActiveTab] = useState<'rates' | 'balance' | 'collection'>('rates');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const totalProb = (Object.values(rates) as number[]).reduce((a, b) => a + b, 0);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [syncLogs]);

  const addLog = (msg: string) => {
    setSyncLogs(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg}`]);
  };

  const handleSave = () => {
    onUpdateRates(rates);
    onUpdateGems(gems);
    audioManager.play('tap');
    onClose();
  };

  const updateRate = (rarity: Rarity, val: number) => {
    if (isFixedDefault) return;
    setRates(prev => ({ ...prev, [rarity]: val }));
    addLog(`CONFIG: ${rarity} updated to ${(val * 100).toFixed(2)}%`);
  };

  const toggleFixedDefault = () => {
    const newVal = !isFixedDefault;
    setIsFixedDefault(newVal);
    audioManager.play('tap');
    
    if (newVal) {
      // 深度拷贝默认值以确保 React 检测到状态改变
      const defaults = JSON.parse(JSON.stringify(DEFAULT_GACHA_RATES));
      setRates(defaults);
      addLog("CONFIG: Default Rates LOCKED (ON)");
    } else {
      addLog("CONFIG: Manual override mode ENABLED (OFF)");
    }
  };

  const restoreDefaults = () => {
    // 强制创建一个全新的对象引用
    const freshDefaults = {
      [Rarity.CROWN]: DEFAULT_GACHA_RATES[Rarity.CROWN],
      [Rarity.GOLD]: DEFAULT_GACHA_RATES[Rarity.GOLD],
      [Rarity.PURPLE]: DEFAULT_GACHA_RATES[Rarity.PURPLE],
      [Rarity.SILVER]: DEFAULT_GACHA_RATES[Rarity.SILVER],
      [Rarity.BLUE]: DEFAULT_GACHA_RATES[Rarity.BLUE],
    };
    setRates(freshDefaults);
    setIsFixedDefault(true);
    addLog("CONFIG: Manual reset to system defaults.");
    audioManager.play('tap');
  };

  const navItems = [
    { id: 'rates', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', label: '出率调节' },
    { id: 'balance', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: '资产调度' },
    { id: 'collection', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: '权限控制' },
  ];

  const rateConfigs = [
    { key: Rarity.CROWN, color: 'rose', label: 'CROWN (皇冠)' },
    { key: Rarity.GOLD, color: 'amber', label: 'GOLD (金色)' },
    { key: Rarity.PURPLE, color: 'purple', label: 'PURPLE (紫色)' },
    { key: Rarity.SILVER, color: 'slate', label: 'SILVER (银色)' },
    { key: Rarity.BLUE, color: 'blue', label: 'BLUE (基础)' },
  ];

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-0 sm:p-4 md:p-8 animate-[fadeIn_0.3s]">
      <div className="bg-[#0c0e14] border border-white/10 w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-xs font-black text-white italic tracking-widest uppercase">Admin Terminal / 核心终端</h2>
            <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-colors ${Math.abs(totalProb - 1) < 0.01 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              Prob Sum: {(totalProb * 100).toFixed(1)}%
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center active:scale-90 transition-all"><svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Sidebar Nav */}
          <div className="flex sm:flex-col border-b sm:border-b-0 sm:border-r border-white/5 bg-black/40 overflow-x-auto sm:overflow-y-auto shrink-0 scrollbar-hide">
            {navItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id as any); audioManager.play('tap'); }} 
                className={`flex-1 sm:flex-none p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:space-x-4 transition-all border-b-2 sm:border-b-0 sm:border-l-2 ${activeTab === item.id ? 'bg-blue-600/10 text-blue-400 border-blue-500' : 'text-white/20 border-transparent hover:text-white/40'}`}
              >
                <svg className="w-4 h-4 mb-1 sm:mb-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-black/10 custom-scrollbar">
            <div className="max-w-lg mx-auto">
              {activeTab === 'rates' && (
                <div className="space-y-6 animate-[fadeIn_0.3s]">
                  
                  {/* 系统默认概率开关 (功能新增) */}
                  <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                      <span className="text-white font-black text-[11px] uppercase tracking-widest italic">锁定系统默认概率</span>
                      <span className="text-white/30 text-[8px] mt-1 uppercase italic">开启后将禁用手动调节</span>
                    </div>
                    <button 
                      onClick={toggleFixedDefault}
                      className={`relative w-14 h-7 rounded-full transition-all duration-300 flex items-center p-1 border ${isFixedDefault ? 'bg-blue-600 border-blue-400' : 'bg-slate-900 border-white/10'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-lg transition-all transform ${isFixedDefault ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className={`space-y-4 transition-all duration-500 ${isFixedDefault ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-white/20 text-[9px] font-black uppercase tracking-widest italic">自定义权重调节</span>
                       <button 
                        onClick={restoreDefaults}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-white/40 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest active:scale-95"
                      >
                        一键复位
                      </button>
                    </div>
                    
                    {rateConfigs.map(({ key, color, label }) => (
                      <div key={key} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`text-${color}-400 font-black text-[10px] uppercase tracking-widest italic`}>{label}</span>
                          <span className="text-white font-mono text-xs">{(rates[key] * 100).toFixed(2)}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.0001" 
                          value={rates[key]} 
                          disabled={isFixedDefault}
                          onChange={(e) => updateRate(key, parseFloat(e.target.value))} 
                          className="w-full h-1.5 accent-blue-500 bg-white/10 rounded-full cursor-pointer" 
                        />
                      </div>
                    ))}
                  </div>
                  
                  {isFixedDefault && (
                    <p className="text-blue-500/40 text-[8px] italic text-center uppercase tracking-widest animate-pulse">当前正处于系统预设模式</p>
                  )}
                </div>
              )}
              
              {activeTab === 'balance' && (
                <div className="space-y-8 animate-[fadeIn_0.3s] py-4">
                   <div className="p-8 bg-white/5 rounded-3xl border border-white/5 text-center space-y-6">
                      <label className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] block">Current Balance / 余额</label>
                      <div className="text-5xl font-mono font-black text-white tracking-tighter">{gems.toLocaleString()}</div>
                      <input 
                        type="number" value={gems} 
                        onChange={(e) => setGems(parseInt(e.target.value) || 0)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl p-5 text-white text-3xl font-mono text-center focus:border-blue-500 outline-none transition-all shadow-inner" 
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { setGems(prev => prev + 160000); addLog("FINANCE: Added 160k Gems"); audioManager.play('tap'); }} className="py-4 bg-blue-600/10 text-blue-400 text-[10px] font-black rounded-xl border border-blue-500/20 uppercase transition-all active:scale-95">Add 160k</button>
                        <button onClick={() => { setGems(0); addLog("FINANCE: Cleared all gems"); audioManager.play('click'); }} className="py-4 bg-red-600/10 text-red-400 text-[10px] font-black rounded-xl border border-red-500/20 uppercase transition-all active:scale-95">Clear</button>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'collection' && (
                <div className="space-y-6 animate-[fadeIn_0.3s]">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col space-y-6">
                      <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-white font-black text-[11px] uppercase tracking-widest">Master Unlock</span>
                          <span className="text-white/30 text-[8px] mt-1 uppercase italic">Unlock all 151 cards</span>
                        </div>
                        <button 
                          onClick={() => {
                            const newVal = !isMasterUnlock;
                            onToggleMasterUnlock(newVal);
                            audioManager.play(newVal ? 'crown_reveal' : 'click');
                            addLog(`PERMISSION: Master Unlock -> ${newVal ? 'ON' : 'OFF'}`);
                          }}
                          className={`relative w-16 h-8 rounded-full transition-all duration-300 flex items-center p-1 border ${isMasterUnlock ? 'bg-emerald-600 border-emerald-400' : 'bg-slate-900 border-white/10'}`}
                        >
                          <div className={`w-6 h-6 rounded-full bg-white transition-all transform ${isMasterUnlock ? 'translate-x-8' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="bg-black/80 rounded-xl border border-emerald-500/10 h-48 overflow-hidden relative">
                         <div className="p-4 font-mono text-[9px] text-emerald-500/80 h-full overflow-y-auto custom-scrollbar">
                            {syncLogs.length === 0 ? <span className="opacity-30 italic">Terminal ready...</span> : syncLogs.map((log, i) => <div key={i} className="mb-1 leading-relaxed">{log}</div>)}
                            <div ref={logEndRef} />
                         </div>
                      </div>

                      <button 
                        onClick={() => {
                          if (window.confirm('Delete all gacha history?')) {
                            onResetInventory();
                            addLog("SYSTEM: Database reset successful.");
                            audioManager.play('click');
                          }
                        }}
                        className="w-full py-4 text-red-500/40 hover:text-red-500 text-[9px] font-black uppercase tracking-widest border border-white/5 rounded-xl transition-all active:scale-95"
                      >
                        Delete Inventory Data
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-8 border-t border-white/5 bg-black/40 flex flex-col sm:flex-row gap-3 shrink-0">
           <button onClick={onClose} className="flex-1 py-4 text-white/30 font-black rounded-xl uppercase text-[10px] tracking-widest transition-all hover:bg-white/5">Abort</button>
           <button onClick={handleSave} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-xl uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">部署系统变更</button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsModal;
