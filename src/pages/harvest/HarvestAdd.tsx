import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { CounterInput } from '../../components/CounterInput';
import { matchSeasonForZone } from '../../utils/seasonMatcher';

export const HarvestAdd: React.FC = () => {
  const { farmZones, addHarvest, navigateTo, currentHTX, currentRole, currentUser } = useApp();

  const availableZones = useMemo(() => {
    return farmZones.filter((z) => {
      if (z.htxId !== currentHTX.id) return false;
      if (currentRole === 'R06') {
        return z.ownerId === currentUser.id;
      }
      return true;
    });
  }, [farmZones, currentHTX.id, currentRole, currentUser.id]);

  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    availableZones.length > 0 ? availableZones[0].id : ''
  );

  useEffect(() => {
    if (availableZones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(availableZones[0].id);
    }
  }, [availableZones, selectedZoneId]);

  const selectedZone = useMemo(() => {
    return availableZones.find((z) => z.id === selectedZoneId);
  }, [availableZones, selectedZoneId]);

  // Mã lô thu hoạch do hệ thống sinh, duy nhất, chỉ đọc
  const [harvestCode] = useState<string>(() => {
    return `TH-${currentHTX.id.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`;
  });

  const [harvestDate, setHarvestDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const defaultUnit = currentHTX.id === 'dongtao' ? 'con' : 'kg';
  const [unit, setUnit] = useState<string>(defaultUnit);

  const [yieldQuantity, setYieldQuantity] = useState<number>(
    currentHTX.id === 'dongtao' ? 50 : 1500
  );
  const [grade1Quantity, setGrade1Quantity] = useState<number>(
    currentHTX.id === 'dongtao' ? 45 : 1200
  );
  const [grade2Quantity, setGrade2Quantity] = useState<number>(
    currentHTX.id === 'dongtao' ? 5 : 300
  );

  const [qualityMetric, setQualityMetric] = useState<string>(
    currentHTX.id === 'dongtao'
      ? 'Chân vảy rồng to, lông óng mượt, đạt chuẩn kiểm định thú y'
      : currentHTX.id === 'quyetthang'
      ? 'Độ ngọt 19° Brix, cùi dày ráo nước, chín vàng đều'
      : 'Độ ẩm 14.0%, Tỷ lệ hạt chắc 96%, thơm tự nhiên'
  );

  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80'
  );
  const [notes, setNotes] = useState<string>('Thu hoạch máy gặt đạt chuẩn tươi sạch.');

  // Tự động xác định mùa vụ theo ngày thu hoạch
  const seasonMatch = useMemo(() => {
    if (!selectedZone || !harvestDate) return null;
    return matchSeasonForZone(selectedZone, harvestDate);
  }, [selectedZone, harvestDate]);

  // Kiểm tra phân loại
  const totalGrades = (grade1Quantity || 0) + (grade2Quantity || 0);
  const isGradeExceeded = totalGrades > yieldQuantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (availableZones.length === 0 || !selectedZone) {
      alert('Hộ gia đình bác chưa có vùng sản xuất hợp lệ để khai báo thu hoạch.');
      return;
    }

    if (yieldQuantity <= 0) {
      alert('Tổng sản lượng thu hoạch phải lớn hơn 0.');
      return;
    }

    if (grade1Quantity < 0 || grade2Quantity < 0) {
      alert('Khối lượng Loại 1 và Loại 2 không được là số âm.');
      return;
    }

    if (isGradeExceeded) {
      alert('Tổng khối lượng Loại 1 và Loại 2 không được vượt quá tổng sản lượng thu hoạch.');
      return;
    }

    const assignedSeasonId =
      seasonMatch?.season?.seasonId || selectedZone.currentSeasonId || `s-${selectedZone.id}-current`;
    const assignedSeasonName =
      seasonMatch?.season?.seasonName || selectedZone.season;

    const res = addHarvest({
      code: harvestCode,
      htxId: currentHTX.id,
      farmZoneId: selectedZone.id,
      farmZoneName: selectedZone.name,
      zoneCode: selectedZone.zoneCode,
      variety: selectedZone.variety,
      ownerId: selectedZone.ownerId,
      ownerName: selectedZone.ownerName,
      seasonId: assignedSeasonId,
      seasonName: assignedSeasonName,
      date: harvestDate,
      yieldQuantity,
      grade1Quantity,
      grade2Quantity,
      qualityMetric,
      unit,
      photoUrl,
      notes,
      processingStatus: 'chua_so_che',
    });

    if (res && !res.success) {
      alert(res.message || 'Lỗi khi lưu lô thu hoạch.');
      return;
    }

    navigateTo('harvest_list');
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Ghi nhận thu hoạch"
        voiceText="Bác chọn thửa ruộng, kiểm tra mã số vùng trồng, nhập tổng sản lượng cùng phân loại loại 1 loại 2 nhé."
      />

      <div className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          {/* 1. Chọn vùng canh tác */}
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              1. Chọn Vùng thu hoạch: <span className="text-red-500">*</span>
            </label>
            {availableZones.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-sm text-amber-950 space-y-2">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                  <span>⚠️</span> Hộ chưa được gán vùng sản xuất
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Hộ gia đình <strong>{currentUser.name}</strong> hiện chưa có thửa ruộng nào được Ban Kỹ thuật HTX cấp mã. Bác vui lòng liên hệ <strong>Cán bộ Kỹ thuật HTX (R03)</strong> để được cấp mã trước khi khai báo thu hoạch.
                </p>
              </div>
            ) : (
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-orange-600 focus:outline-none"
              >
                {availableZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    [{z.zoneCode || 'MSVT'}] {z.name} ({z.variety})
                  </option>
                ))}
              </select>
            )}

            {/* Thông tin tự động lấy từ vùng */}
            {selectedZone && (
              <div className="mt-2.5 p-3.5 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-1.5 text-xs text-orange-950 font-medium">
                <div className="flex items-center justify-between">
                  <span className="text-orange-800 font-bold">Mã số vùng trồng (MSVT):</span>
                  <span className="font-mono font-extrabold bg-white px-2 py-0.5 rounded-lg border border-orange-300 text-orange-900">
                    {selectedZone.zoneCode || 'Chưa cấp'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-800 font-bold">Giống/Sản phẩm thu hoạch:</span>
                  <span className="font-extrabold text-slate-900">{selectedZone.variety}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-800 font-bold">Chủ hộ phụ trách:</span>
                  <span className="font-extrabold text-slate-900">{selectedZone.ownerName}</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Mã lô thu hoạch (duy nhất, chỉ đọc) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              2. Mã lô thu hoạch (Hệ thống sinh tự động):
            </label>
            <div className="relative">
              <input
                type="text"
                value={harvestCode}
                readOnly
                className="w-full h-13 px-4 rounded-2xl border-2 border-slate-200 bg-slate-100 font-mono text-base font-extrabold text-slate-700 cursor-not-allowed select-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl">
                🔒 Duy nhất & Chỉ đọc
              </span>
            </div>
          </div>

          {/* 3. Ngày thu hoạch & Xác định mùa vụ */}
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              3. Ngày thu hoạch: <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                className="flex-1 h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-slate-50 focus:border-orange-600 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setHarvestDate(new Date().toISOString().split('T')[0])}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-extrabold text-slate-700 border border-slate-300"
              >
                Hôm nay
              </button>
            </div>

            {/* Mùa vụ tự động khớp theo ngày thu hoạch */}
            {seasonMatch && (
              <div
                className={`p-3 rounded-2xl border text-xs font-medium ${
                  seasonMatch.status === 'matched'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : seasonMatch.status === 'no_season'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-red-50 border-red-300 text-red-950'
                }`}
              >
                {seasonMatch.status === 'matched' && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <span>🌾</span>
                      <span>Mùa vụ áp dụng: <strong>{seasonMatch.season?.seasonName}</strong></span>
                      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                        {seasonMatch.season?.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Thời gian vụ: {seasonMatch.season?.seasonStartDate} → {seasonMatch.season?.seasonEndDate}
                    </div>
                  </div>
                )}
                {seasonMatch.status === 'no_season' && (
                  <div className="flex items-start gap-2">
                    <span className="text-base">⚠️</span>
                    <div>
                      <div className="font-bold text-amber-900">Ngày thu hoạch này chưa thuộc mùa vụ nào của thửa.</div>
                      <div className="text-[11px] text-amber-700 mt-0.5">
                        Hệ thống sẽ lưu tạm theo thông tin vụ hiện hành ({selectedZone?.season || 'Chưa gán'}).
                      </div>
                    </div>
                  </div>
                )}
                {seasonMatch.status === 'overlap' && (
                  <div className="flex items-start gap-2 text-red-800">
                    <span className="text-base">❌</span>
                    <div>Dữ liệu mùa vụ của thửa bị chồng chéo thời gian. Vui lòng kiểm tra lại.</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Tổng sản lượng */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-base font-bold text-slate-800">
                4. Tổng sản lượng thu hoạch: <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {['kg', 'tấn', 'con'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      unit === u
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <CounterInput
              label=""
              value={yieldQuantity}
              onChange={setYieldQuantity}
              unit={unit}
              step={unit === 'con' ? 5 : 50}
              min={1}
            />
          </div>

          {/* 5. Phân loại Loại 1 & Loại 2 */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <span>⚖️</span>
                <span>Phân loại chất lượng lúc thu hoạch:</span>
              </span>
              <span className="text-[11px] text-slate-500 font-bold">
                (Loại 1 + Loại 2 ≤ Tổng)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khối lượng Loại 1 ({unit}):
                </label>
                <input
                  type="number"
                  min="0"
                  value={grade1Quantity}
                  onChange={(e) => setGrade1Quantity(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 font-extrabold text-base text-slate-900 bg-white focus:border-orange-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khối lượng Loại 2 ({unit}):
                </label>
                <input
                  type="number"
                  min="0"
                  value={grade2Quantity}
                  onChange={(e) => setGrade2Quantity(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 font-extrabold text-base text-slate-900 bg-white focus:border-orange-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Live calculation banner */}
            <div className="pt-1">
              {isGradeExceeded ? (
                <div className="p-2.5 bg-red-100 border border-red-300 rounded-xl text-xs text-red-800 font-bold flex items-center gap-1.5">
                  <span>❌</span>
                  <span>Tổng Loại 1 ({grade1Quantity} {unit}) + Loại 2 ({grade2Quantity} {unit}) = {totalGrades} {unit}, vượt quá tổng sản lượng ({yieldQuantity} {unit})!</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-1">
                  <span>Đã phân loại: <strong>{totalGrades.toLocaleString()} {unit}</strong> ({((totalGrades / yieldQuantity) * 100).toFixed(0)}%)</span>
                  <span>Chưa phân loại/khác: <strong>{(yieldQuantity - totalGrades).toLocaleString()} {unit}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* 6. Chỉ số chất lượng thực tế */}
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              6. Chỉ số chất lượng thực tế:
            </label>
            <input
              type="text"
              value={qualityMetric}
              onChange={(e) => setQualityMetric(e.target.value)}
              placeholder="VD: Độ ẩm 14.0%, Tỷ lệ hạt chắc 96% hoặc Độ ngọt 18° Brix"
              className="w-full h-13 px-4 rounded-2xl border-2 border-slate-300 text-sm font-medium text-slate-900 bg-slate-50 focus:border-orange-600 focus:outline-none"
            />
          </div>

          {/* 7. Ảnh nông sản thu hoạch */}
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              7. Chụp ảnh nông sản thu hoạch:
            </label>
            <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-900">
              <img src={photoUrl} alt="Ảnh nông sản" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-xl">
                📷 Đã chụp trực tiếp
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() =>
                  setPhotoUrl(
                    'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80'
                  )
                }
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 border"
              >
                Chụp ảnh khác
              </button>
            </div>
          </div>

          {/* 8. Ghi chú */}
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              8. Ghi chú thêm:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-13 px-4 rounded-2xl border-2 border-slate-300 text-base font-medium text-slate-900 bg-slate-50 focus:border-orange-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isGradeExceeded || yieldQuantity <= 0}
            className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xl font-extrabold shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 mt-4"
          >
            <span>💾</span>
            <span>LƯU LÔ THU HOẠCH</span>
          </button>
        </form>
      </div>
    </div>
  );
};
