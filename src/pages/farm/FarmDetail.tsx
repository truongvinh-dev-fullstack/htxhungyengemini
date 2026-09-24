import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { FarmZone } from '../../types';

export const FarmDetail: React.FC = () => {
  const { screenParams, goBack, navigateTo } = useApp();
  const zone: FarmZone = screenParams?.zone;

  if (!zone) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy vùng sản xuất.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={zone.name}
        voiceText={`Chi tiết vùng sản xuất ${zone.name}, giống ${zone.variety}, mùa vụ ${zone.season}. Dự báo sản lượng: ${zone.forecastYield}.`}
      />

      <div className="p-4 space-y-4">
        {/* Photo Card */}
        <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm space-y-4">
          <div className="relative aspect-video bg-slate-100">
            <img
              src={zone.imageUrl}
              alt={zone.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-bold">
              {zone.season}
            </div>
            <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-bold">
              {zone.status}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Thửa ruộng / Khu nuôi
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">{zone.name}</h2>
            </div>

            {/* CN-3.3.4: Forecast Box */}
            <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-center gap-3">
              <span className="text-4xl">🌾</span>
              <div>
                <span className="text-xs font-bold text-amber-900 uppercase">
                  Dự báo sản lượng thu hoạch:
                </span>
                <p className="text-lg font-extrabold text-amber-950 mt-0.5 leading-snug">
                  {zone.forecastYield}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Giống canh tác</span>
                <span className="font-extrabold text-slate-900">{zone.variety}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Quy mô diện tích</span>
                <span className="font-extrabold text-slate-900">{zone.areaOrQuantity}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block mb-1">Ghi chú kỹ thuật:</span>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{zone.notes}</p>
            </div>
          </div>
        </div>

        {/* Action: Ghi nhật ký cho vùng này */}
        <div className="space-y-2">
          <button
            onClick={() => navigateTo('diary_add')}
            className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-lg font-extrabold shadow flex items-center justify-center gap-2"
          >
            <span>📝</span>
            <span>Ghi nhật ký cho thửa ruộng này</span>
          </button>
        </div>
      </div>
    </div>
  );
};
