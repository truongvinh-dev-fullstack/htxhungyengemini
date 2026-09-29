import React from 'react';
import { useApp } from '../context/AppContext';
import { canAccessScreen } from '../utils/permissions';

interface Props {
  activeTab: 'harvest' | 'packaging';
}

export const PostHarvestWorkflowTabs: React.FC<Props> = ({ activeTab }) => {
  const { currentRole, navigateTo } = useApp();

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-1.5 flex gap-1.5 shadow-sm">
      {canAccessScreen(currentRole, 'harvest_list') && <button
        onClick={() => navigateTo('harvest_list')}
        className={`flex-1 py-3 px-2 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
          activeTab === 'harvest'
            ? 'bg-amber-600 text-white shadow-md'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <span className="text-base">🌾</span>
        <span>Thu hoạch</span>
      </button>}

      {canAccessScreen(currentRole, 'packaging_list') && <button
        onClick={() => navigateTo('packaging_list')}
        className={`flex-1 py-3 px-2 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
          activeTab === 'packaging'
            ? 'bg-emerald-600 text-white shadow-md'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <span className="text-base">📦</span>
        <span>Lô đóng gói & QR</span>
      </button>}
    </div>
  );
};
