import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, HTXId } from '../types';

export const RoleHTXSwitcher: React.FC = () => {
  const { currentRole, setRole, currentHTX, setHTX, isLoggedIn } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  if (!isLoggedIn) return null;

  const roles: { id: UserRole; name: string; tag: string }[] = [
    { id: 'R06', name: 'R06: Hộ nông dân', tag: 'Chính - Ghi nhật ký, thu hoạch' },
    { id: 'R05', name: 'R05: Tổ trưởng', tag: 'Quản lý & duyệt thành viên tổ' },
    { id: 'R04', name: 'R04: Kế toán / Kho', tag: 'Quản lý kho & Bán hàng' },
    { id: 'R02', name: 'R02: Ban Quản trị', tag: 'Xem báo cáo tổng hợp HTX' },
  ];

  const htxList: { id: HTXId; name: string; icon: string }[] = [
    { id: 'anninh', name: 'HTX An Ninh (Lúa sạch)', icon: '🌾' },
    { id: 'dongtao', name: 'HTX Đông Tảo (Gà tiến vua)', icon: '🐓' },
    { id: 'quyetthang', name: 'HTX Quyết Thắng (Nhãn & Cá)', icon: '🍈' },
  ];

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-amber-900 font-bold">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>DEMO SỞ NN&PTNT:</span>
          <span className="bg-amber-200/80 px-2 py-0.5 rounded text-amber-950">
            {currentRole} • {currentHTX.shortName}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-amber-800 font-extrabold underline hover:text-amber-950 flex items-center gap-0.5"
        >
          {isOpen ? 'Thu gọn ▲' : 'Đổi vai trò / HTX ▼'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-2.5 pt-2 border-t border-amber-200 space-y-2.5">
          <div>
            <div className="text-amber-900 font-semibold mb-1">1. Chọn vai trò trải nghiệm:</div>
            <div className="grid grid-cols-2 gap-1.5">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setRole(r.id);
                  }}
                  className={`text-left p-1.5 rounded-lg border text-xs transition-all ${
                    currentRole === r.id
                      ? 'bg-emerald-700 text-white border-emerald-800 font-bold shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">{r.name}</div>
                  <div className={`text-[10px] leading-tight ${currentRole === r.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {r.tag}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-amber-900 font-semibold mb-1">2. Chọn Hợp tác xã Hưng Yên:</div>
            <div className="grid grid-cols-3 gap-1.5">
              {htxList.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setHTX(h.id);
                  }}
                  className={`p-1.5 rounded-lg border text-center text-xs transition-all ${
                    currentHTX.id === h.id
                      ? 'bg-agri-700 text-white border-agri-800 font-bold shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-base">{h.icon}</div>
                  <div className="font-bold truncate">{h.name.split(' (')[0]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
