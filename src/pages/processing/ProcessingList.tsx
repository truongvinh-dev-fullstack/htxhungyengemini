import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { PostHarvestWorkflowTabs } from '../../components/PostHarvestWorkflowTabs';

export const ProcessingList: React.FC = () => {
  const { processingLots, navigateTo } = useApp();

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Quản lý lô sơ chế"
        voiceText="Đây là danh sách các lô sơ chế nông sản của hợp tác xã. Bác có thể bấm Thêm lô sơ chế để ghi nhận sản lượng sau chế biến và tỷ lệ hao hụt."
      />

      <div className="p-4 space-y-4">
        {/* Chuỗi 3 công đoạn */}
        <PostHarvestWorkflowTabs activeTab="processing" />

        {/* Action Banner */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-3xl p-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-blue-950">Ghi nhận sơ chế</h3>
            <p className="text-xs text-blue-800 font-medium mt-0.5">
              Chọn lô thu hoạch ➔ Phương pháp ➔ Tự động tính hao hụt
            </p>
          </div>
          <button
            onClick={() => navigateTo('processing_add')}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-3 rounded-2xl font-extrabold text-base flex items-center gap-1.5 shadow-md whitespace-nowrap"
          >
            <span className="text-xl">➕</span>
            <span>Thêm lô</span>
          </button>
        </div>

        {/* List of Processing Lots */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-slate-800">Lô đã sơ chế</h3>
            <span className="text-xs text-slate-500 font-semibold">{processingLots.length} lô</span>
          </div>

          {processingLots.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-300 space-y-2">
              <span className="text-5xl block">⚙️</span>
              <h4 className="text-lg font-extrabold text-slate-700">Chưa có lô sơ chế nào</h4>
              <p className="text-xs text-slate-500 font-medium">
                Bác hãy bấm nút &quot;Thêm lô&quot; ở trên để bắt đầu sơ chế từ lô thu hoạch nhé.
              </p>
            </div>
          ) : (
            processingLots.map((lot) => (
              <div
                key={lot.id}
                onClick={() => navigateTo('processing_detail', { lot })}
                className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-blue-500 active:scale-[0.98] transition-all shadow-sm cursor-pointer space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={lot.photoUrl}
                    alt={lot.code}
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="inline-block bg-blue-100 text-blue-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        {lot.code}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        lot.status === 'Đã đóng gói'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {lot.status}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                      {lot.method}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Nguồn: <strong>{lot.harvestLotCode}</strong> ({lot.farmZoneName})
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-xs font-extrabold">
                      <span className="text-slate-600">Vào: {lot.inputQuantity.toLocaleString()} {lot.unit}</span>
                      <span>➔</span>
                      <span className="text-blue-700 font-black">Ra: {lot.outputQuantity.toLocaleString()} {lot.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Badge hao hụt */}
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <span>📉 Tỷ lệ hao hụt:</span>
                    <span className="text-rose-700 font-extrabold text-sm">{lot.lossRatePercent}%</span>
                  </div>
                  <span className="text-slate-500 font-medium">Ngày: <strong>{lot.date}</strong></span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Phụ trách: <strong>{lot.operatorName}</strong></span>
                  <span className="font-extrabold text-blue-700">Xem chi tiết ➜</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
