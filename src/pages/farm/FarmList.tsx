import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { SEASONS_BY_HTX } from '../../mock/data';
import {
  getUnitStatusInfo,
  getActiveCycle,
  getCycleTerm,
  getFacilityTypeLabel,
  getCycles,
} from '../../utils/productionUtils';

export const FarmList: React.FC = () => {
  const { farmZones, currentHTX, navigateTo, currentRole, currentUser } = useApp();

  const seasons = SEASONS_BY_HTX[currentHTX.id] || [
    { id: 'all', name: 'Tất cả vụ/lứa' },
    { id: 'xuan_2026', name: '🌾 Vụ Xuân 2026' },
  ];

  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [onlyMyZones, setOnlyMyZones] = useState<boolean>(currentRole === 'R06');

  // Lọc theo vụ/lứa và quyền hạn vai trò
  const filteredZones = farmZones.filter((zone) => {
    // 0. Bắt buộc thuộc HTX hiện tại
    if (zone.htxId !== currentHTX.id) {
      return false;
    }

    // 1. R06 bắt buộc chỉ xem nơi sản xuất của hộ mình
    if (currentRole === 'R06') {
      if (zone.ownerId !== currentUser.id) {
        return false;
      }
    } else if (onlyMyZones) {
      if (zone.ownerId !== currentUser.id) {
        return false;
      }
    }

    // 2. Lọc theo vụ/lứa: kiểm tra cả chu kỳ hiện hành lẫn lịch sử chu kỳ
    if (selectedSeason !== 'all') {
      const seasonObj = seasons.find((s) => s.id === selectedSeason);
      if (seasonObj) {
        const cleanFilterName = seasonObj.name.replace(/[^a-zA-Z0-9\sÀ-ỹ]/g, '').trim().toLowerCase();
        const activeCycle = getActiveCycle(zone);
        const activeCycleName = (activeCycle?.seasonName || '').replace(/[^a-zA-Z0-9\sÀ-ỹ]/g, '').trim().toLowerCase();
        const matchesActive = !!activeCycleName && (activeCycleName.includes(cleanFilterName) || cleanFilterName.includes(activeCycleName));
        const matchesHistory = (zone.cycles?.length ? zone.cycles : zone.seasonHistory || []).some((cycle) => {
          const cName = cycle.seasonName.replace(/[^a-zA-Z0-9\sÀ-ỹ]/g, '').trim().toLowerCase();
          return cName.includes(cleanFilterName) || cleanFilterName.includes(cName);
        });

        if (!matchesActive && !matchesHistory) {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={currentRole === 'R06' ? 'Nơi sản xuất của tôi' : 'Đơn vị sản xuất HTX'}
        voiceText="Đây là các thửa ruộng, vườn cây, chuồng trại hoặc ao lồng nuôi của hộ gia đình bác. Bác có thể xem trạng thái nơi sản xuất và tình trạng vụ lứa hiện tại."
      />

      <div className="p-4 space-y-4">
        {/* Banner Tổng quan */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div>
            <h3 className="text-lg font-black text-amber-950">
              {currentRole === 'R03' ? 'Quản lý Đơn vị sản xuất' : 'Nơi sản xuất của tôi'}
            </h3>
            <p className="text-xs text-amber-800 font-medium mt-0.5">
              {currentRole === 'R03'
                ? 'Khảo sát thực địa & cấp mã nơi sản xuất cho hộ thành viên'
                : 'Thửa ruộng, vườn cây, chuồng trại, ao lồng do HTX cấp'}
            </p>
          </div>
          {currentRole === 'R03' && (
            <button
              onClick={() => navigateTo('farm_add')}
              className="bg-cyan-700 hover:bg-cyan-800 active:scale-95 text-white px-4 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-1.5 shadow-md whitespace-nowrap"
            >
              <span className="text-lg">➕</span>
              <span>Cấp nơi mới</span>
            </button>
          )}
        </div>

        {currentRole === 'R03' && <button type="button" onClick={() => navigateTo('farm_cycle_add')} className="w-full rounded-2xl bg-blue-700 p-4 text-white font-bold text-left">🌱 Lập vụ/lứa mới → Chọn nơi sản xuất</button>}

        {/* Thanh lọc vụ/lứa */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span>📅</span>
              <span>Lọc theo vụ/lứa sản xuất:</span>
            </span>
            <span className="text-xs font-extrabold text-amber-800">
              {filteredZones.length} nơi sản xuất
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {seasons.map((s) => {
              const isActive = selectedSeason === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSeason(s.id)}
                  className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs whitespace-nowrap transition-all border-2 active:scale-95 flex items-center gap-1 ${
                    isActive
                      ? 'bg-amber-700 border-amber-700 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>

          {/* Phạm vi hiển thị theo vai trò */}
          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border-2 border-slate-200 text-xs">
            <span className="font-bold text-slate-700">
              {currentRole === 'R06'
                ? 'Nơi sản xuất của hộ tôi'
                : 'Chỉ xem nơi sản xuất phụ trách'}
            </span>
            {currentRole === 'R06' ? (
              <span className="text-[11px] font-extrabold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300">
                🔒 Cố định hộ {currentUser.name}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setOnlyMyZones(!onlyMyZones)}
                className={`w-12 h-7 rounded-full transition-colors relative p-0.5 ${
                  onlyMyZones ? 'bg-amber-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                    onlyMyZones ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Danh sách nơi sản xuất */}
        <div className="space-y-4">
          {filteredZones.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-300 space-y-3">
              <span className="text-5xl block">🏡</span>
              <h4 className="text-base font-extrabold text-slate-800">Không có nơi sản xuất nào</h4>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                {currentRole === 'R06'
                  ? 'Hộ gia đình bác chưa được HTX gán đơn vị sản xuất nào. Bác vui lòng liên hệ Cán bộ Kỹ thuật (R03) để được khảo sát và cấp mã nơi sản xuất nhé.'
                  : 'Trong bộ lọc đã chọn chưa có thửa ruộng hoặc khu nuôi nào. Đồng chí có thể bấm "Cấp nơi mới" ở trên để tạo mới.'}
              </p>
            </div>
          ) : (
            filteredZones.map((zone) => {
              const unitStatus = getUnitStatusInfo(zone.unitStatus || zone.status);
              const activeCycle = getActiveCycle(zone);
              const cycleTerm = getCycleTerm(zone);
              const facilityLabel = getFacilityTypeLabel(zone.facilityType);
              const isSuspended = zone.unitStatus === 'tam_ngung' || zone.unitStatus === 'ngung_su_dung';

              return (
                <div
                  key={zone.id}
                  onClick={() => navigateTo('farm_detail', { zoneId: zone.id, zone })}
                  className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 hover:border-amber-500 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                >
                  {/* Ảnh nơi sản xuất */}
                  <div className="relative aspect-[16/9] bg-slate-100">
                    <img
                      src={zone.imageUrl}
                      alt={zone.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-bold">
                      {facilityLabel}
                    </div>
                    <div className={`absolute bottom-3 right-3 text-xs px-3 py-1 rounded-full font-extrabold shadow border ${unitStatus.badgeClass}`}>
                      {unitStatus.label}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Header thẻ: Mã số & Phân loại hình */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-black tracking-wide">
                        {zone.zoneCode || 'MSVT-HTX'}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                        {facilityLabel} • {zone.productionType || 'Trồng trọt'}
                      </span>
                    </div>

                    {/* Tên nơi sản xuất & Quy mô */}
                    <div>
                      <h4 className="text-xl font-extrabold text-slate-900 leading-tight">
                        {zone.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 font-semibold">
                        <span>📐 {zone.areaOrQuantity}</span>
                        {activeCycle?.variety && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700">🌱 {activeCycle.variety}</span>
                          </>
                        )}
                      </div>
                      {zone.ownerName && (
                        <div className="text-xs text-slate-500 font-medium mt-1">
                          Chủ hộ: <strong className="text-slate-800">{zone.ownerName}</strong>
                        </div>
                      )}
                    </div>

                    {/* HAI DÒNG TRẠNG THÁI RÕ RÀNG CHO NGƯỜI LỚN TUỔI */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-2">
                      {/* Dòng 1: Trạng thái nơi sản xuất */}
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <span className="text-slate-500 font-bold whitespace-nowrap">
                          Trạng thái nơi sản xuất:
                        </span>
                        <span className={`font-extrabold px-2 py-0.5 rounded-lg border text-right ${unitStatus.badgeClass}`}>
                          {unitStatus.label}
                        </span>
                      </div>

                      {/* Dòng 2: Vụ/lứa hiện tại */}
                      <div className="flex items-start justify-between gap-2 text-xs pt-1.5 border-t border-slate-200">
                        <span className="text-slate-500 font-bold whitespace-nowrap">
                          {cycleTerm} hiện tại:
                        </span>
                        {activeCycle ? (
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-900 block">
                              {activeCycle.seasonName}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-300">
                              Đang thực hiện
                            </span>
                          </div>
                        ) : (
                          <span className="font-extrabold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-lg border border-slate-300">
                            Chưa có
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cảnh báo nếu tạm ngừng sử dụng */}
                    {isSuspended && (
                      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 text-xs text-amber-900 font-semibold space-y-0.5">
                        <div className="flex items-center gap-1 font-bold text-amber-950">
                          <span>⚠️</span>
                          <span>Đang tạm ngừng sản xuất:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-800">
                          {zone.statusNote || 'Đang sửa chữa, cải tạo đất hoặc hạ tầng cơ sở.'}
                        </p>
                      </div>
                    )}

                    {/* Thông tin mùa vụ / sản lượng hoặc chỉ dẫn */}
                    {activeCycle ? (
                      <div className="p-3 bg-emerald-50 rounded-2xl border-2 border-emerald-200 flex items-center gap-3">
                        <span className="text-3xl flex-shrink-0">📈</span>
                        <div>
                          <div className="text-xs font-bold text-emerald-900 uppercase">
                            Dự kiến {cycleTerm.toLowerCase()}:
                          </div>
                          <div className="text-sm font-extrabold text-emerald-950 mt-0.5 leading-snug">
                            {activeCycle.forecastYield || (activeCycle.expectedYieldValue ? `${activeCycle.expectedYieldValue} ${activeCycle.expectedYieldUnit || 'kg'}` : 'Chưa cập nhật kế hoạch sản lượng')}
                          </div>
                          {activeCycle.processVersion && (
                            <div className="text-[10px] font-semibold text-emerald-800 mt-0.5">
                              📋 {activeCycle.processVersion}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900">
                        <span className="text-2xl flex-shrink-0">ℹ️</span>
                        <div className="leading-snug">
                          <strong className="block text-amber-950">{getCycles(zone).some((cycle) => cycle.status === 'du_kien') ? 'Có vụ/lứa dự kiến, chưa bắt đầu' : 'Chưa có vụ/lứa'}</strong>
                          <span className="text-amber-800 text-[11px]">
                            {getCycles(zone).some((cycle) => cycle.status === 'du_kien') ? 'Xem kế hoạch trong chi tiết nơi sản xuất.' : 'Liên hệ cán bộ HTX để lập vụ/lứa mới.'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Footer thẻ */}
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1 border-t border-slate-100">
                      <span>
                        {activeCycle
                          ? `Bắt đầu: ${activeCycle.seasonStartDate || 'Chưa cập nhật'}`
                          : `Số vụ/lứa: ${getCycles(zone).length}`}
                      </span>
                      <span className="text-amber-700 font-extrabold flex items-center gap-0.5">
                        <span>Xem chi tiết</span>
                        <span>➜</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
