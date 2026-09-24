import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { HarvestLot } from '../../types';

export const HarvestList: React.FC = () => {
  const { harvests, navigateTo } = useApp();

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Quản lý thu hoạch"
        voiceText="Đây là danh sách các đợt thu hoạch nông sản của hộ gia đình bác. Bác bấm Thêm lô thu hoạch để ghi sản lượng mới nhé."
      />

      <div className="p-4 space-y-4">
        {/* Action Banner */}
        <div className="bg-orange-50 border-2 border-orange-300 rounded-3xl p-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-orange-950">Ghi nhận thu hoạch</h3>
            <p className="text-xs text-orange-800 font-medium mt-0.5">
              Chọn vùng → Nhập số lượng +/- → Chụp ảnh
            </p>
          </div>
          <button
            onClick={() => navigateTo('harvest_add')}
            className="bg-orange-600 hover:bg-orange-700 active:scale-95 text-white px-4 py-3 rounded-2xl font-extrabold text-base flex items-center gap-1.5 shadow-md whitespace-nowrap"
          >
            <span className="text-xl">➕</span>
            <span>Thêm lô</span>
          </button>
        </div>

        {/* List of Harvests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-slate-800">Lô đã thu hoạch</h3>
            <span className="text-xs text-slate-500 font-semibold">{harvests.length} lô</span>
          </div>

          {harvests.map((lot) => (
            <div
              key={lot.id}
              onClick={() => navigateTo('harvest_detail', { lot })}
              className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-orange-500 active:scale-[0.98] transition-all shadow-sm cursor-pointer space-y-3"
            >
              <div className="flex items-start gap-3">
                <img
                  src={lot.photoUrl}
                  alt={lot.code}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="inline-block bg-orange-100 text-orange-900 text-xs font-bold px-2 py-0.5 rounded-full mb-1">
                    {lot.code}
                  </span>
                  <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                    {lot.farmZoneName}
                  </h4>
                  <div className="text-base font-extrabold text-orange-800 mt-1">
                    Sản lượng: {lot.yieldQuantity.toLocaleString()} {lot.unit}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Ngày thu: <strong>{lot.date}</strong></span>
                <span className="font-bold text-orange-700">Xem chi tiết ➜</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
