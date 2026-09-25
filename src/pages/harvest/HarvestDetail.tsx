import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { HarvestLot } from '../../types';

export const HarvestDetail: React.FC = () => {
  const { screenParams, goBack, navigateTo, diaries } = useApp();
  const lot: HarvestLot = screenParams?.lot;

  if (!lot) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy lô thu hoạch.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  // Nhật ký canh tác liên quan của thửa ruộng
  const relatedDiaries = diaries.filter(
    (d) => d.farmZoneId === lot.farmZoneId || d.farmZoneName === lot.farmZoneName
  );

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Chi tiết thu hoạch"
        voiceText={`Chi tiết lô thu hoạch ${lot.code}, sản lượng ${lot.yieldQuantity} ${lot.unit} tại ${lot.farmZoneName}.`}
      />

      <div className="p-4 space-y-4">
        {/* Photo and Info Card */}
        <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm space-y-4">
          <div className="relative aspect-video bg-slate-100">
            <img src={lot.photoUrl} alt={lot.code} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full font-bold">
              {lot.code}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Vùng thu hoạch
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">{lot.farmZoneName}</h2>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border-2 border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-orange-900 block">Sản lượng đạt được:</span>
                <span className="text-3xl font-extrabold text-orange-950">
                  {lot.yieldQuantity.toLocaleString()} {lot.unit}
                </span>
              </div>
              <span className="text-4xl">🌾</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Ngày thu hoạch</span>
                <span className="font-extrabold text-slate-900">{lot.date}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Mã truy vết</span>
                <span className="font-extrabold text-slate-900 font-mono">{lot.code}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block mb-1">Ghi chú:</span>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{lot.notes}</p>
            </div>
          </div>
        </div>

        {/* CN-3.6.3: Khối Nhật ký canh tác liên quan của thửa */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>📖</span>
              <span>Nhật ký canh tác của thửa</span>
            </h3>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {relatedDiaries.length} bản ghi
            </span>
          </div>

          {relatedDiaries.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">Chưa có bản ghi nhật ký canh tác cho thửa này.</p>
          ) : (
            <div className="space-y-2">
              {relatedDiaries.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigateTo('diary_detail', { entry: d })}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">{d.workTypeName}</div>
                    <div className="text-[11px] text-slate-500">{d.date} • {d.createdBy}</div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700">Xem ➜</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons: Sơ chế và Đóng gói */}
        <div className="space-y-2.5">
          <button
            onClick={() => navigateTo('processing_add')}
            className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-base font-extrabold shadow flex items-center justify-center gap-2"
          >
            <span>🏭</span>
            <span>Chuyển tiếp sang Sơ chế nông sản</span>
          </button>

          <button
            onClick={() => navigateTo('packaging_add')}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-base font-extrabold shadow flex items-center justify-center gap-2"
          >
            <span>📦</span>
            <span>Đóng gói & Tạo mã QR từ lô này</span>
          </button>
        </div>
      </div>
    </div>
  );
};
