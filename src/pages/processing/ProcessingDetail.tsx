import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { ProcessingLot } from '../../types';

export const ProcessingDetail: React.FC = () => {
  const { screenParams, goBack, navigateTo } = useApp();
  const lot: ProcessingLot = screenParams?.lot;

  if (!lot) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy thông tin lô sơ chế.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={`Lô sơ chế ${lot.code}`}
        voiceText={`Chi tiết lô sơ chế ${lot.code}, phương pháp ${lot.method}. Sản lượng đầu ra ${lot.outputQuantity} ${lot.unit}, tỷ lệ hao hụt ${lot.lossRatePercent}%.`}
      />

      <div className="p-4 space-y-4">
        {/* Main Card */}
        <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm space-y-4">
          <div className="relative aspect-video bg-slate-100">
            <img src={lot.photoUrl} alt={lot.code} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">
              {lot.code}
            </div>
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-bold">
              Ngày: {lot.date}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Phương pháp sơ chế
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-0.5 leading-tight">
                {lot.method}
              </h2>
            </div>

            {/* Thống kê Vào / Ra & Hao hụt */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Sản lượng đầu vào</span>
                <span className="text-base font-extrabold text-slate-900">
                  {lot.inputQuantity.toLocaleString()} {lot.unit}
                </span>
                <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                  Lô gốc: {lot.harvestLotCode}
                </span>
              </div>

              <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200">
                <span className="text-xs text-blue-900 font-bold block">Sản lượng thành phẩm</span>
                <span className="text-lg font-black text-blue-700">
                  {lot.outputQuantity.toLocaleString()} {lot.unit}
                </span>
                <span className="text-[11px] text-blue-600 font-medium block mt-0.5">
                  Đã làm sạch / phân loại
                </span>
              </div>
            </div>

            {/* Box tỷ lệ hao hụt */}
            <div className="p-3.5 bg-rose-50 rounded-2xl border-2 border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📉</span>
                <div>
                  <span className="text-xs font-bold text-rose-900 uppercase block">
                    Tỷ lệ hao hụt thực tế:
                  </span>
                  <span className="text-xs text-rose-700 font-medium">
                    (Vào: {lot.inputQuantity} ➔ Ra: {lot.outputQuantity})
                  </span>
                </div>
              </div>
              <span className="text-2xl font-black text-rose-700">{lot.lossRatePercent}%</span>
            </div>

            {/* Thông tin nguồn gốc & Người thực hiện */}
            <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Thửa ruộng / Chuồng nuôi:</span>
                <span className="font-extrabold text-slate-800">{lot.farmZoneName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Lô thu hoạch gốc:</span>
                <span className="font-extrabold text-amber-700">{lot.harvestLotCode}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Người phụ trách:</span>
                <span className="font-bold text-slate-800">{lot.operatorName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Trạng thái:</span>
                <span className="font-extrabold text-emerald-700">{lot.status}</span>
              </div>
            </div>

            {lot.notes && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block mb-1">Ghi chú kiểm tra:</span>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{lot.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Nút hành động liên kết chuỗi: Đóng gói dán tem QR */}
        <div className="space-y-2">
          <button
            onClick={() => navigateTo('packaging_add', { processingLot: lot })}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-lg font-black shadow-lg flex items-center justify-center gap-2"
          >
            <span>🏷️</span>
            <span>ĐÓNG GÓI & TẠO TEM QR TỪ LÔ NÀY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
