import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { HarvestLot } from '../../types';
import { PostHarvestWorkflowTabs } from '../../components/PostHarvestWorkflowTabs';

export const HarvestList: React.FC = () => {
  const { harvests, navigateTo } = useApp();

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Quản lý thu hoạch"
        voiceText="Đây là danh sách các đợt thu hoạch nông sản của hộ gia đình bác. Bác bấm Thêm lô thu hoạch để ghi sản lượng mới nhé."
      />

      <div className="p-4 space-y-4">
        {/* Chuỗi 2 công đoạn */}
        <PostHarvestWorkflowTabs activeTab="harvest" />

        {/* Action Banner */}
        <div className="bg-orange-50 border-2 border-orange-300 rounded-3xl p-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-orange-950">Ghi nhận thu hoạch</h3>
            <p className="text-xs text-orange-800 font-medium mt-0.5">
              Chọn vùng MSVT → Phân loại Loại 1, 2 → Lưu lô
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

          {harvests.map((lot) => {
            const isProcessed = lot.processingStatus === 'da_so_che';
            const isNoProcessing = lot.processingStatus === 'khong_so_che';
            return (
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
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="inline-block bg-orange-100 text-orange-900 text-xs font-bold px-2 py-0.5 rounded-full font-mono">
                        {lot.code}
                      </span>
                      {lot.zoneCode && (
                        <span className="inline-block bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                          {lot.zoneCode}
                        </span>
                      )}
                      {lot.seasonName && (
                        <span className="inline-block bg-emerald-50 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                          🌾 {lot.seasonName}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                      {lot.farmZoneName} {lot.variety ? `• ${lot.variety}` : ''}
                    </h4>

                    <div className="text-base font-extrabold text-orange-800 mt-1">
                      Sản lượng: {lot.yieldQuantity.toLocaleString()} {lot.unit}
                    </div>

                    {/* Phân loại Loại 1, 2 nếu có */}
                    {(lot.grade1Quantity !== undefined || lot.grade2Quantity !== undefined) && (
                      <div className="text-xs text-slate-500 font-semibold mt-0.5">
                        Loại 1: <strong className="text-slate-800">{lot.grade1Quantity?.toLocaleString() || 0} {lot.unit}</strong> • Loại 2: <strong className="text-slate-800">{lot.grade2Quantity?.toLocaleString() || 0} {lot.unit}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Processing Status Badge & Date */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Ngày thu: <strong>{lot.date}</strong></span>
                    <span>•</span>
                    {isProcessed ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        ✓ Đã sơ chế ({lot.processingInfo?.outputQuantity?.toLocaleString()} {lot.unit})
                      </span>
                    ) : isNoProcessing ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                        Không sơ chế
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                        Chưa sơ chế
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-orange-700">Chi tiết ➜</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
