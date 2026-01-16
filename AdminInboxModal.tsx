
import React, { useState, useEffect } from 'react';
import { RechargeRequest } from '../types';

interface AdminInboxModalProps {
  onClose: () => void;
  onApprove: (gems: number, requestId: string) => void;
}

const AdminInboxModal: React.FC<AdminInboxModalProps> = ({ onClose, onApprove }) => {
  const [requests, setRequests] = useState<RechargeRequest[]>([]);

  useEffect(() => {
    const loadRequests = () => {
      const saved = JSON.parse(localStorage.getItem('recharge_requests') || '[]');
      setRequests(saved);
    };
    loadRequests();
    window.addEventListener('new-recharge-request', loadRequests);
    return () => window.removeEventListener('new-recharge-request', loadRequests);
  }, []);

  const handleAction = (id: string, action: 'approved' | 'rejected', gems: number) => {
    const updated = requests.map(req => {
      if (req.id === id) return { ...req, status: action };
      return req;
    });
    setRequests(updated);
    localStorage.setItem('recharge_requests', JSON.stringify(updated));
    
    if (action === 'approved') {
      onApprove(gems, id);
    }
  };

  const clearHistory = () => {
    if (window.confirm('确定清除所有请求历史吗？')) {
      localStorage.removeItem('recharge_requests');
      setRequests([]);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-[#1e293b] border border-white/10 w-full max-w-2xl h-[80vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900">
          <div>
            <h2 className="text-xl font-black tracking-widest text-white uppercase italic">Admin Virtual Inbox / 管理端虚拟邮箱</h2>
            <p className="text-blue-400 text-[10px] font-bold mt-1 uppercase">Logged to: songqinghong6@gmail.com</p>
          </div>
          <div className="flex space-x-2">
            <button onClick={clearHistory} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-black rounded-lg transition-all uppercase">Clear</button>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {requests.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <p className="text-xs font-bold uppercase tracking-widest italic">No requests found / 暂无充值申请</p>
            </div>
          ) : (
            requests.sort((a,b) => b.timestamp - a.timestamp).map(req => (
              <div key={req.id} className={`p-6 rounded-2xl border transition-all ${req.status === 'approved' ? 'bg-green-500/5 border-green-500/20' : req.status === 'rejected' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/5'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-white font-black text-sm uppercase">Recharge Request: ￥{req.amount}</div>
                    <div className="text-slate-400 text-[10px] mt-1">{new Date(req.timestamp).toLocaleString()}</div>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${req.status === 'approved' ? 'bg-green-500 text-white' : req.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {req.status}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-blue-400 font-mono text-xs">+{req.gems} Gems</div>
                  {req.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleAction(req.id, 'rejected', 0)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-xl transition-all"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, 'approved', req.gems)}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black rounded-xl transition-all shadow-lg"
                      >
                        Confirm Transfer & Add Balance
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-black/20 text-center">
           <p className="text-[9px] text-slate-600 font-bold tracking-[0.4em] uppercase">Manual Balance Adjustment System - songqinghong6@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default AdminInboxModal;
