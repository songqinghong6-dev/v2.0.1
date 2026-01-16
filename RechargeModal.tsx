
import React, { useState } from 'react';

interface RechargeModalProps {
  onClose: () => void;
  onSuccess: (gems: number) => void;
}

const RechargeModal: React.FC<RechargeModalProps> = ({ onClose, onSuccess }) => {
  const [selectedTier, setSelectedTier] = useState<{ amount: number; gems: number; label: string; bonus?: string } | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');

  const tiers = [
    { amount: 1, gems: 160, label: 'Starter / 起步包' },
    { amount: 8, gems: 1600, label: 'Value / 优惠包', bonus: '节省 ￥2' },
    { amount: 30, gems: 6000, label: 'Advanced / 进阶包', bonus: '额外 +200' },
    { amount: 98, gems: 20000, label: 'Master / 大师包', bonus: '额外 +800' },
    { amount: 198, gems: 42000, label: 'Ultimate / 终极包', bonus: '最高性价比' },
    { amount: 328, gems: 72000, label: 'Epic / 史诗包', bonus: '超量赠送' },
    { amount: 648, gems: 150000, label: 'Legendary / 传说包', bonus: '顶级尊享' },
  ];

  const handleVerify = () => {
    if (!selectedTier) return;
    if (confirmCode === '0121') {
      onSuccess(selectedTier.gems);
      alert(`充值成功！已获得 ${selectedTier.gems} 点数`);
      onClose();
    } else {
      setError('代码无效，请重试');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] md:rounded-[3rem] shadow-[0_25px_100px_rgba(0,0,0,0.3)] flex flex-col max-h-[85vh] md:max-h-[80vh] overflow-hidden relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center z-[210] transition-all active:scale-90"
          aria-label="关闭"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Section */}
        <div className="relative p-6 md:p-8 text-center border-b border-slate-50 overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-white to-blue-50/30" />
          <div className="relative z-10 pr-10 md:pr-0">
            <h2 className="text-lg md:text-xl font-black text-slate-900 italic tracking-[0.1em] uppercase leading-tight">Gems Exchange / 宝石补给</h2>
            <p className="text-slate-400 text-[8px] md:text-[9px] mt-1 font-black tracking-widest uppercase italic opacity-60">羊羊抽卡 - 内部数字资产服务</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-3 custom-scrollbar bg-[#FCFCFC]">
          {!selectedTier ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
              {tiers.map((tier) => (
                <button 
                  key={tier.amount}
                  onClick={() => setSelectedTier(tier)}
                  className={`relative group p-4 rounded-2xl transition-all border-2 flex flex-col items-start ${tier.amount >= 328 ? 'border-amber-200 bg-amber-50/10 shadow-sm' : tier.amount === 98 ? 'border-blue-200 bg-blue-50/30 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                >
                  <div className="flex justify-between w-full mb-3">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-50 flex items-center justify-center">
                       <div className={`w-3 h-3 rounded-full animate-pulse ${tier.amount >= 328 ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    </div>
                    {tier.bonus && <span className={`${tier.amount >= 328 ? 'bg-amber-500' : 'bg-blue-600'} text-white text-[7px] font-black px-2 py-1 rounded-full uppercase tracking-widest`}>{tier.bonus}</span>}
                  </div>
                  <div className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-0.5 opacity-50 truncate w-full">{tier.label}</div>
                  <div className="flex items-end space-x-1">
                    <div className="text-slate-900 font-black text-xl tracking-tighter">{tier.gems.toLocaleString()}</div>
                    <div className="text-slate-400 text-[8px] font-black mb-1 uppercase italic">Gems</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100/50 w-full flex justify-between items-center">
                    <span className="text-slate-300 text-[9px] font-black uppercase tracking-widest">Price</span>
                    <span className="text-slate-900 font-black text-base">￥{tier.amount}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="max-w-sm mx-auto py-2 space-y-6 animate-[fadeIn_0.4s_ease-out]">
              <div className="p-6 md:p-8 bg-slate-900 rounded-[2rem] text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 blur-[50px] rounded-full" />
                <div className="relative z-10">
                  <p className="text-blue-400 font-black text-[9px] tracking-[0.2em] uppercase mb-3 italic">Transfer / 转账确认</p>
                  <p className="text-white font-bold text-xs leading-relaxed mb-5">
                    请联系 <span className="text-blue-400 font-black underline underline-offset-4">宋箐泓</span> 完成转账后<br/>
                    输入您获取的 4 位授权码
                  </p>
                  <div className="flex flex-col space-y-4">
                    <input 
                      type="text" 
                      maxLength={4}
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      placeholder="验证码"
                      className="w-full py-4 bg-white/10 border border-white/20 rounded-xl text-center font-mono font-black text-3xl tracking-[0.3em] text-white focus:outline-none focus:border-blue-400 transition-all shadow-inner placeholder:text-white/10"
                    />
                    {error && <p className="text-red-400 text-[9px] font-black uppercase tracking-widest animate-bounce">{error}</p>}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setSelectedTier(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-black rounded-xl active:scale-95 transition-all text-[10px] uppercase tracking-widest">返回</button>
                <button onClick={handleVerify} className="flex-[2] py-3.5 bg-blue-600 text-white font-black rounded-xl active:scale-95 transition-all shadow-lg text-[10px] uppercase tracking-widest hover:bg-blue-500">验证并兑换</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div className="p-4 md:p-6 text-center bg-slate-50 border-t border-slate-100 shrink-0">
          <button 
            onClick={onClose} 
            className="w-full py-3 text-slate-400 hover:text-slate-600 text-[10px] font-black tracking-[0.4em] uppercase italic bg-white border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95"
          >
            退出充值界面
          </button>
        </div>
      </div>
    </div>
  );
};

export default RechargeModal;
