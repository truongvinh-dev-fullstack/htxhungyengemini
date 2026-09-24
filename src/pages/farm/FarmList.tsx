import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { FarmZone } from '../../types';

export const FarmList: React.FC = () => {
  const { farmZones, navigateTo } = useApp();

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Vùng sản xuất của tôi"
        voiceText="Đây là các thửa ruộng, chuồng trại hoặc ao nuôi của hộ gia đình bác. Bác có thể xem dự báo sản lượng hoặc bấm Thêm vùng mới."
      />

      <div className="p-4 space-y-4">
        {/* Top Summary Banner */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-amber-950">Quản lý thửa ruộng</h3>
            <p className="text-xs text-amber-800 font-medium mt-0.5">
              Chọn giống & mùa vụ từ danh mục mẫu
            </p>
          </div>
          <button
            onClick={() => navigateTo('farm_add')}
            className="bg-amber-700 hover:bg-amber-800 active:scale-95 text-white px-4 py-3 rounded-2xl font-extrabold text-base flex items-center gap-1.5 shadow-md whitespace-nowrap"
          >
            <span className="text-xl">➕</span>
            <span>Thêm vùng</span>
          </button>
        </div>

        {/* List of Farm Zones */}
        <div className="space-y-4">
          {farmZones.map((zone) => (
            <div
              key={zone.id}
              onClick={() => navigateTo('farm_detail', { zone })}
              className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 hover:border-amber-500 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
            >
              <div className="relative aspect-[16/9] bg-slate-100">
                <img
                  src={zone.imageUrl}
                  alt={zone.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-bold">
                  {zone.season}
                </div>
                <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow">
                  {zone.status}
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h4 className="text-xl font-extrabold text-slate-900 leading-tight">
                    {zone.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 font-semibold">
                    <span>🌾 {zone.variety}</span>
                    <span>•</span>
                    <span>📐 {zone.areaOrQuantity}</span>
                  </div>
                </div>

                {/* CN-3.3.4: Dự báo sản lượng số to, ngôn ngữ đơn giản */}
                <div className="p-3 bg-amber-50 rounded-2xl border-2 border-amber-200 flex items-center gap-3">
                  <span className="text-3xl flex-shrink-0">📈</span>
                  <div>
                    <div className="text-xs font-bold text-amber-900 uppercase">
                      Dự báo sản lượng:
                    </div>
                    <div className="text-base font-extrabold text-amber-950 mt-0.5 leading-snug">
                      {zone.forecastYield}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1 border-t border-slate-100">
                  <span>Đã canh tác: <strong>{zone.farmingDays} ngày</strong></span>
                  <span className="text-amber-700 font-extrabold">Xem lịch sử ➜</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
