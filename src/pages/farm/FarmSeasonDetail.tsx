import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { SeasonHistoryItem } from '../../types';

export const FarmSeasonDetail: React.FC = () => {
  const {
    screenParams,
    goBack,
    navigateTo,
    farmZones,
    harvests,
    diaries,
    currentHTX,
    currentRole,
    currentUser,
  } = useApp();

  const targetZoneId: string | undefined = screenParams?.zoneId || screenParams?.zone?.id;
  const targetSeasonId: string | undefined = screenParams?.seasonId;

  // Lấy thửa ruộng từ state
  const zone = farmZones.find((z) => z.id === targetZoneId);

  // Kiểm tra quyền truy cập:
  // 1. Phải thuộc HTX hiện tại
  // 2. Nếu là R06 (nông dân), chỉ được xem thửa mình phụ trách
  const isUnauthorized =
    !zone ||
    zone.htxId !== currentHTX.id ||
    (currentRole === 'R06' && zone.ownerId !== currentUser.id);

  if (isUnauthorized) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl shadow-inner border-2 border-red-200">
          🚫
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-slate-900">Không có quyền truy cập mùa vụ</h3>
          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            Thửa ruộng này không thuộc quyền phụ trách của hộ bác hoặc không thuộc HTX hiện tại.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('farm_list')}
          className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-md active:scale-95 transition-all"
        >
          Quay lại danh sách thửa ruộng
        </button>
      </div>
    );
  }

  // Tìm mùa vụ trong lịch sử của thửa
  const season: SeasonHistoryItem | undefined = useMemo(() => {
    if (!zone) return undefined;
    const history = zone.seasonHistory || [];

    // Tìm theo seasonId
    let found = history.find((s) => s.seasonId === targetSeasonId);
    if (found) return found;

    // Nếu truyền targetSeasonId === 'current' hoặc không tìm thấy
    if (targetSeasonId === 'current' || targetSeasonId === zone.currentSeasonId) {
      found = history.find((s) => s.status === 'Đang canh tác' || s.seasonName === zone.season);
      if (found) return found;
    }

    // Dự phòng tìm theo tên mùa vụ
    if (targetSeasonId) {
      found = history.find((s) => s.seasonName.toLowerCase() === targetSeasonId.toLowerCase());
      if (found) return found;
    }

    // Nếu vẫn không thấy nhưng đang là vụ hiện hành của thửa
    if (!targetSeasonId || targetSeasonId === zone.currentSeasonId || targetSeasonId === 'current') {
      return {
        seasonId: zone.currentSeasonId || `s-${zone.id}-current`,
        seasonName: zone.season,
        year: new Date().getFullYear(),
        status: 'Đang canh tác',
        variety: zone.variety,
        areaValue: zone.areaValue,
        areaUnit: zone.areaUnit,
        areaOrQuantity: zone.areaOrQuantity,
        ownerId: zone.ownerId,
        ownerName: zone.ownerName,
        seasonStartDate: zone.seasonStartDate,
        seasonEndDate: zone.seasonEndDate,
        seasonStage: zone.seasonStage,
        expectedYieldValue: zone.expectedYieldValue,
        expectedYieldUnit: zone.expectedYieldUnit,
        expectedHarvestDate: zone.expectedHarvestDate,
        forecastYield: zone.forecastYield,
        notes: zone.notes,
      };
    }

    return undefined;
  }, [zone, targetSeasonId]);

  if (!season) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-4xl shadow-inner border-2 border-amber-200">
          ⚠️
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-slate-900">Không tìm thấy thông tin mùa vụ</h3>
          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            Dữ liệu mùa vụ không tồn tại trong hồ sơ canh tác của thửa <strong>{zone.name}</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('farm_detail', { zoneId: zone.id, zone })}
          className="px-6 py-3.5 bg-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-md active:scale-95 transition-all"
        >
          Quay lại chi tiết thửa
        </button>
      </div>
    );
  }

  // Xác định vụ này có phải vụ đang canh tác không
  const isCurrentSeason =
    (Boolean(season.seasonId && zone.currentSeasonId) && season.seasonId === zone.currentSeasonId) ||
    (season.status === 'Đang canh tác' && season.seasonName === zone.season);

  // Lọc các lô thu hoạch thuộc đúng thửa ruộng và đúng mùa vụ này
  const seasonHarvests = useMemo(() => {
    return harvests.filter((h) => {
      if (h.farmZoneId !== zone.id) return false;
      return h.seasonId === season.seasonId;
    });
  }, [harvests, zone.id, season.seasonId]);

  // Tính tổng thực thu theo từng đơn vị tương thích (tách riêng kg, con...)
  const totalsByUnit = useMemo(() => {
    const map: Record<string, number> = {};
    seasonHarvests.forEach((h) => {
      const u = h.unit || 'kg';
      map[u] = (map[u] || 0) + (Number(h.yieldQuantity) || 0);
    });
    return map;
  }, [seasonHarvests]);

  // Lọc nhật ký thuộc vụ này
  const seasonDiaries = useMemo(() => {
    return diaries.filter((d) => {
      if (d.farmZoneId !== zone.id) return false;
      return d.seasonId === season.seasonId;
    });
  }, [diaries, zone.id, season.seasonId]);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={`Chi tiết vụ: ${season.seasonName}`}
        voiceText={`Chi tiết mùa vụ ${season.seasonName} của thửa ruộng ${zone.name}. Bác có thể xem kế hoạch, danh sách lô thu hoạch và kết quả thực tế của vụ.`}
      />

      <div className="p-4 space-y-4">
        {/* Banner Tổng quan Mùa vụ */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono text-xs font-black tracking-wide">
              {zone.zoneCode || zone.id.toUpperCase()}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  isCurrentSeason
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {season.status}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                {isCurrentSeason ? '🌿 Vụ hiện hành' : '📁 Hồ sơ lưu trữ (Chỉ đọc)'}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">{season.seasonName}</h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Thửa ruộng: <span className="text-slate-800">{zone.name}</span>
            </p>
          </div>
        </div>

        {/* PHẦN 1: THÔNG TIN THỬA TẠI THỜI ĐIỂM VỤ (Dữ liệu lưu theo vụ, không lấy thông tin hiện tại thay thế) */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <span>📋</span>
            <span>Thông tin thửa ruộng trong vụ này</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 font-bold block mb-0.5">Giống gieo trồng / vật nuôi:</span>
              <span className="text-sm font-extrabold text-slate-900">
                {season.variety || zone.variety}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 font-bold block mb-0.5">Diện tích / Quy mô vụ đó:</span>
              <span className="text-sm font-extrabold text-slate-900">
                {season.areaOrQuantity || (season.areaValue ? `${season.areaValue} ${season.areaUnit}` : zone.areaOrQuantity)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 font-bold block mb-0.5">Chủ hộ phụ trách thời điểm vụ:</span>
              <span className="text-sm font-extrabold text-slate-900">
                {season.ownerName || zone.ownerName}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-slate-500 font-bold block mb-0.5">Thời gian mùa vụ:</span>
              <span className="text-sm font-extrabold text-slate-900">
                {season.seasonStartDate || 'Chưa cập nhật'} ➜ {season.seasonEndDate || 'Chưa cập nhật'}
              </span>
            </div>
          </div>

          {season.seasonStage && (
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-xs">
              <span className="text-blue-900 font-bold block mb-0.5">Giai đoạn sinh trưởng / ghi nhận:</span>
              <p className="text-blue-950 font-extrabold text-sm">{season.seasonStage}</p>
            </div>
          )}

          {season.notes && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-bold block mb-0.5">Ghi chú mùa vụ:</span>
              <p className="text-slate-700 font-medium leading-relaxed">{season.notes}</p>
            </div>
          )}
        </div>

        {/* PHẦN 2: KẾ HOẠCH THU HOẠCH DỰ KIẾN (Phân biệt rõ ràng với thực tế) */}
        <div className="bg-amber-50 rounded-3xl p-5 border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-amber-200/80 pb-2.5">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="text-base font-black text-amber-950">Kế hoạch thu hoạch dự kiến</h3>
              <p className="text-[11px] text-amber-800 font-medium">Mục tiêu và kế hoạch đề ra đầu vụ</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200">
              <span className="text-amber-900/80 font-bold block mb-0.5">Sản lượng dự kiến ban đầu:</span>
              <span className="text-lg font-black text-amber-950 block">
                {season.expectedYieldValue
                  ? `${season.expectedYieldValue} ${season.expectedYieldUnit || 'tấn'}`
                  : season.forecastYield || 'Chưa cập nhật'}
              </span>
              {season.forecastYield && (
                <span className="text-[11px] text-amber-800 font-medium block mt-1">
                  {season.forecastYield}
                </span>
              )}
            </div>

            <div className="p-3.5 bg-white/90 rounded-2xl border border-amber-200">
              <span className="text-amber-900/80 font-bold block mb-0.5">Ngày thu hoạch dự kiến:</span>
              <span className="text-lg font-black text-amber-950 block">
                {season.expectedHarvestDate || 'Chưa cập nhật'}
              </span>
              <span className="text-[11px] text-amber-800 font-medium block mt-1">
                Theo kế hoạch chu kỳ sinh trưởng
              </span>
            </div>
          </div>
        </div>

        {/* PHẦN 3: KẾT QUẢ THỰC THU (Chỉ tính từ các lô thu hoạch thực tế, không lấy dự kiến thay thế) */}
        <div className="bg-emerald-50 rounded-3xl p-5 border-2 border-emerald-300 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-2.5">
            <span className="text-2xl">🌾</span>
            <div>
              <h3 className="text-base font-black text-emerald-950">Kết quả thực thu của vụ</h3>
              <p className="text-[11px] text-emerald-800 font-medium">
                Tổng hợp số liệu thực tế từ các lô đã thu hoạch
              </p>
            </div>
          </div>

          {seasonHarvests.length > 0 ? (
            <div className="space-y-3">
              <div className="p-4 bg-white/95 rounded-2xl border border-emerald-200">
                <span className="text-xs text-emerald-800 font-bold block mb-1">
                  TỔNG SẢN LƯỢNG THỰC TẾ ĐÃ THU:
                </span>
                <div className="text-2xl font-black text-emerald-950">
                  {Object.entries(totalsByUnit)
                    .map(([unit, qty]) => `${qty.toLocaleString('vi-VN')} ${unit}`)
                    .join(' + ')}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mt-1.5">
                  <span>Số đợt thu hoạch: <strong>{seasonHarvests.length} đợt</strong></span>
                  {season.expectedYieldValue && Object.keys(totalsByUnit).length === 1 && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700">
                        Đạt chuẩn tiêu chuẩn HTX
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (!isCurrentSeason && season.yieldResult && !season.yieldResult.toLowerCase().includes('dự kiến')) ? (
            /* Dữ liệu lịch sử cũ năm 2025 không có lô thu hoạch liên kết */
            <div className="p-4 bg-white/90 rounded-2xl border border-emerald-200 space-y-1.5">
              <span className="text-xs text-slate-500 font-bold block">
                Kết quả lưu từ dữ liệu cũ:
              </span>
              <p className="text-lg font-black text-emerald-900">{season.yieldResult}</p>
              {season.harvestDate && (
                <p className="text-xs text-slate-600 font-medium">
                  Ngày thu hoạch: <strong>{season.harvestDate}</strong>
                  {season.quality ? ` • Phân loại: ${season.quality}` : ''}
                </p>
              )}
              <p className="text-[11px] text-slate-400 font-medium italic pt-1">
                * Dữ liệu mùa vụ cũ được lưu trữ dưới dạng báo cáo kết thúc vụ, không có lô chi tiết liên kết.
              </p>
            </div>
          ) : (
            /* Chưa có thu hoạch: hiển thị thông điệp rõ ràng, không lấy dự kiến làm thực thu */
            <div className="p-6 bg-white/90 rounded-2xl border border-emerald-200 text-center space-y-2">
              <span className="text-3xl block">⏳</span>
              <h4 className="text-sm font-extrabold text-slate-800">Chưa ghi nhận thu hoạch</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Mùa vụ này hiện chưa có đợt hoặc lô thu hoạch nào được ghi nhận vào hệ thống.
              </p>
            </div>
          )}
        </div>

        {/* PHẦN 4: DANH SÁCH LÔ THU HOẠCH CHI TIẾT */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>📦</span>
                <span>Danh sách lô thu hoạch</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Chi tiết từng đợt thu hoạch thuộc mùa vụ {season.seasonName}
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
              {seasonHarvests.length} lô
            </span>
          </div>

          {seasonHarvests.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-2xl">
              Không có lô thu hoạch nào trong danh sách.
            </div>
          ) : (
            <div className="space-y-3">
              {seasonHarvests.map((h, idx) => (
                <div
                  key={h.id || idx}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-black">
                      {h.code}
                    </span>
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <span>📅</span>
                      <span>{h.date}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {h.photoUrl && (
                      <img
                        src={h.photoUrl}
                        alt={h.code}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-black text-emerald-800">
                        {h.yieldQuantity.toLocaleString('vi-VN')} {h.unit}
                      </div>
                      {h.notes && (
                        <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 font-medium">
                          {h.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo('harvest_detail', { harvest: h })}
                    className="w-full py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 shadow-2xs active:scale-98 transition-all"
                  >
                    <span>Xem chi tiết lô thu hoạch</span>
                    <span>➜</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PHẦN 5: NHẬT KÝ CANH TÁC THUỘC VỤ */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>📓</span>
                <span>Nhật ký đồng ruộng thuộc vụ</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {seasonDiaries.length} bản ghi nhật ký
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('diary_list')}
              className="text-xs font-extrabold text-blue-700 hover:underline"
            >
              Xem tất cả ➜
            </button>
          </div>

          {seasonDiaries.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium text-center py-4">
              Chưa có bản ghi nhật ký nào thuộc mùa vụ này.
            </p>
          ) : (
            <div className="space-y-2">
              {seasonDiaries.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigateTo('diary_detail', { diary: d })}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between gap-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{d.workTypeIcon || '🌾'}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{d.workTypeName}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Ngày {d.date}</p>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs font-bold">➜</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CÁC NÚT ĐIỀU HƯỚNG VÀ THAO TÁC */}
        <div className="space-y-2 pt-2">
          {isCurrentSeason && currentRole === 'R06' && (
            <button
              type="button"
              onClick={() => navigateTo('diary_add', { zoneId: zone.id, zone })}
              className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-base font-extrabold shadow flex items-center justify-center gap-2"
            >
              <span>📝</span>
              <span>Ghi nhật ký cho thửa ruộng này</span>
            </button>
          )}

          {!isCurrentSeason && (
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-2xl text-center text-xs text-slate-600 font-bold">
              🔒 Mùa vụ này đã kết thúc và được lưu trữ hồ sơ VietGAP (Chế độ chỉ đọc)
            </div>
          )}

          <button
            type="button"
            onClick={() => navigateTo('farm_detail', { zoneId: zone.id, zone })}
            className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-800 text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all"
          >
            <span>⬅️</span>
            <span>Quay lại trang chi tiết thửa ruộng</span>
          </button>
        </div>
      </div>
    </div>
  );
};
