import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { FarmZone } from '../../types';
import { SEASONS_BY_HTX } from '../../mock/data';

export const FarmDetail: React.FC = () => {
  const { screenParams, goBack, navigateTo, currentHTX, updateFarmZoneSeason, speakText, farmZones } = useApp();
  const initialZone: FarmZone = screenParams?.zone;

  // Lấy dữ liệu mới nhất của vùng từ AppContext state theo ID
  const currentZone = farmZones.find((z) => z.id === initialZone?.id) || initialZone;

  // Modal đổi mùa vụ mới cho thửa ruộng này
  const [showSeasonModal, setShowSeasonModal] = useState(false);

  const availableSeasons = (SEASONS_BY_HTX[currentHTX.id] || []).filter((s) => s.id !== 'all');
  const [newSeasonName, setNewSeasonName] = useState(
    availableSeasons.length > 1 ? availableSeasons[1].name.replace(/[^a-zA-Z0-9\sÀ-ỹ]/g, '').trim() : 'Vụ Mùa 2026'
  );

  const [newVariety, setNewVariety] = useState(
    currentHTX.id === 'dongtao'
      ? 'Gà Đông Tảo thuần chủng F1'
      : currentHTX.id === 'quyetthang'
      ? 'Nhãn lồng tiến vua Hương Chi'
      : 'Lúa giống ST25 Hưng Yên'
  );

  const [newStartDate, setNewStartDate] = useState('15/06/2026');
  const [newEndDate, setNewEndDate] = useState('25/10/2026');
  const [newForecast, setNewForecast] = useState('Dự kiến thu: 2,3 tấn');

  if (!currentZone) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy vùng sản xuất.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  const handleConfirmNewSeason = (e: React.FormEvent) => {
    e.preventDefault();
    updateFarmZoneSeason(currentZone.id, {
      season: newSeasonName,
      variety: newVariety,
      seasonStartDate: newStartDate,
      seasonEndDate: newEndDate,
      forecastYield: newForecast,
      notes: `Chuyển vụ canh tác mới: ${newSeasonName} cho giống ${newVariety}.`,
    });

    speakText(`Đã kích hoạt ${newSeasonName} cho thửa ruộng ${currentZone.name}. Mùa vụ trước đã được lưu vào lịch sử.`);
    setShowSeasonModal(false);
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={currentZone.name}
        voiceText={`Chi tiết vùng sản xuất ${currentZone.name}, giống ${currentZone.variety}, mùa vụ ${currentZone.season}. Bác có thể xem lịch sử các mùa vụ hoặc bấm Bắt đầu mùa vụ mới.`}
      />

      <div className="p-4 space-y-4">
        {/* Photo Card */}
        <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm space-y-4">
          <div className="relative aspect-video bg-slate-100">
            <img
              src={currentZone.imageUrl}
              alt={currentZone.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-bold">
              {currentZone.season}
            </div>
            <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-bold">
              {currentZone.status}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Mã thửa cố định: {currentZone.id.toUpperCase()}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">{currentZone.name}</h2>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                {currentZone.areaOrQuantity}
              </span>
            </div>

            {/* CN-2.4: KHỐI THÔNG TIN MÙA VỤ CHI TIẾT */}
            <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  <div>
                    <span className="text-xs font-bold text-blue-900 uppercase block">
                      Mùa vụ đang canh tác:
                    </span>
                    <span className="text-lg font-black text-blue-950">
                      {currentZone.season}
                    </span>
                  </div>
                </div>
                <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm">
                  Vụ hiện hành
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-blue-200/70">
                <div>
                  <span className="text-blue-800/80 font-medium block">Ngày bắt đầu:</span>
                  <span className="font-extrabold text-blue-950 text-sm">
                    {currentZone.seasonStartDate || '15/01/2026'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-800/80 font-medium block">Dự kiến kết thúc:</span>
                  <span className="font-extrabold text-blue-950 text-sm">
                    {currentZone.seasonEndDate || '30/05/2026'}
                  </span>
                </div>
              </div>

              {currentZone.seasonStage && (
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200 text-xs">
                  <span className="text-slate-500 font-medium">Giai đoạn sinh trưởng: </span>
                  <strong className="text-blue-900 font-extrabold">{currentZone.seasonStage}</strong>
                </div>
              )}
            </div>

            {/* CN-3.3.4: Forecast Box */}
            <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-center gap-3">
              <span className="text-4xl">🌾</span>
              <div>
                <span className="text-xs font-bold text-amber-900 uppercase">
                  Dự báo sản lượng vụ này:
                </span>
                <p className="text-lg font-extrabold text-amber-950 mt-0.5 leading-snug">
                  {currentZone.forecastYield}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Giống canh tác</span>
                <span className="font-extrabold text-slate-900">{currentZone.variety}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Đã canh tác</span>
                <span className="font-extrabold text-slate-900">{currentZone.farmingDays} ngày</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block mb-1">Ghi chú kỹ thuật:</span>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{currentZone.notes}</p>
            </div>
          </div>
        </div>

        {/* CN-2.4.3: LỊCH SỬ CANH TÁC QUA CÁC MÙA VỤ */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>📜</span>
                <span>Lịch sử canh tác qua các mùa vụ</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Gắn liền với thửa đất cố định mã <strong>{currentZone.id.toUpperCase()}</strong>
              </p>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              {currentZone.seasonHistory?.length || 2} mùa vụ
            </span>
          </div>

          <div className="space-y-2.5">
            {(currentZone.seasonHistory || []).map((item, index) => (
              <div
                key={index}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>{item.seasonName}</span>
                    <span className="text-xs text-slate-400 font-medium">({item.year})</span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    {item.yieldResult} {item.quality ? `• ${item.quality}` : ''}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    item.status === 'Đang canh tác'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.status}
                  </span>
                  {item.harvestDate && (
                    <span className="block text-[10px] text-slate-400 font-medium mt-1">
                      Thu: {item.harvestDate}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Các nút hành động */}
        <div className="space-y-2.5 pt-1">
          {/* Nút 1: Đổi / Bắt đầu mùa vụ mới cho thửa ruộng này */}
          <button
            type="button"
            onClick={() => setShowSeasonModal(true)}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-base font-extrabold shadow-md flex items-center justify-center gap-2"
          >
            <span>🌱</span>
            <span>BẮT ĐẦU MÙA VỤ MỚI CHO THỬA NÀY</span>
          </button>

          {/* Nút 2: Ghi nhật ký */}
          <button
            type="button"
            onClick={() => navigateTo('diary_add')}
            className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-base font-extrabold shadow flex items-center justify-center gap-2"
          >
            <span>📝</span>
            <span>Ghi nhật ký cho thửa ruộng này</span>
          </button>
        </div>
      </div>

      {/* MODAL BẮT ĐẦU MÙA VỤ MỚI */}
      {showSeasonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Bắt đầu mùa vụ mới</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Áp dụng cho: <strong>{currentZone.name}</strong> ({currentZone.areaOrQuantity})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSeasonModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 active:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmNewSeason} className="space-y-4">
              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-1">
                  1. Chọn mùa vụ mới (Do HTX quy định):
                </label>
                <select
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Vụ Mùa 2026">☀️ Vụ Mùa 2026</option>
                  <option value="Vụ Thu Đông 2026">🍂 Vụ Thu Đông 2026</option>
                  <option value="Vụ Xuân 2027">🌱 Vụ Xuân 2027</option>
                  <option value="Lứa nuôi Tết 2027">🐔 Lứa nuôi Tết 2027</option>
                  <option value="Vụ Nhãn 2027">🌳 Vụ Nhãn 2027</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-1">
                  2. Chọn giống cây / con gieo trồng vụ này:
                </label>
                <select
                  value={newVariety}
                  onChange={(e) => setNewVariety(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Lúa giống ST25 Hưng Yên">Lúa giống ST25 Hưng Yên</option>
                  <option value="Lúa giống Bắc Thơm số 7">Lúa giống Bắc Thơm số 7 thuần</option>
                  <option value="Lúa giống Nếp cái hoa vàng">Lúa giống Nếp cái hoa vàng</option>
                  <option value="Gà Đông Tảo thuần chủng F1">Gà Đông Tảo thuần chủng F1</option>
                  <option value="Nhãn lồng tiến vua Hương Chi">Nhãn lồng tiến vua Hương Chi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày bắt đầu xuống giống:
                  </label>
                  <input
                    type="text"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border-2 border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dự kiến thu hoạch:
                  </label>
                  <input
                    type="text"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border-2 border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-1">
                  3. Ước tính sản lượng kỳ vọng:
                </label>
                <input
                  type="text"
                  value={newForecast}
                  onChange={(e) => setNewForecast(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl border-2 border-slate-300 text-sm font-bold text-slate-900"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
                ℹ️ Vụ <strong>{currentZone.season}</strong> hiện tại sẽ được tự động lưu vào mục <em>Lịch sử mùa vụ</em> của thửa ruộng này mà không bị mất.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSeasonModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-sm shadow-md"
                >
                  Xác nhận vào vụ mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
