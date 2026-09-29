import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { FarmZone } from '../../types';
import { DEMO_USERS } from '../../mock/data';
import {
  getUnitStatusInfo,
  getCycleStatusInfo,
  getActiveCycle,
  getUpcomingCycles,
  getPastCycles,
  getCycleTerm,
  getFacilityTypeLabel,
  getCycles,
} from '../../utils/productionUtils';

export const FarmDetail: React.FC = () => {
  const {
    screenParams,
    goBack,
    navigateTo,
    currentHTX,
    currentRole,
    currentUser,
    members,
    startProductionCycle,
    finishProductionCycle,
    updateFarmZone,
    deleteFarmZone,
    farmZones,
  } = useApp();

  const targetZoneId = screenParams?.zoneId || screenParams?.zone?.id;

  // Luôn lấy dữ liệu mới nhất từ AppContext state theo ID
  const liveZone = farmZones.find((z) => z.id === targetZoneId);
  const currentZone: FarmZone | null = liveZone || null;

  // Modal đổi mùa vụ và chỉnh sửa (chỉ dành cho cán bộ kỹ thuật R03)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // State cho edit thông tin thửa
  const [editName, setEditName] = useState(currentZone?.name || '');
  const [editArea, setEditArea] = useState(currentZone?.areaOrQuantity || '');
  const [editUnitStatus, setEditUnitStatus] = useState<string>(currentZone?.unitStatus || 'dang_su_dung');
  const [editNotes, setEditNotes] = useState(currentZone?.notes || '');
  const [editStatusNote, setEditStatusNote] = useState(currentZone?.statusNote || '');


  // Lấy thông tin chủ hộ
  const ownerProfile = useMemo(() => {
    if (!currentZone) return null;
    let found = members.find((m) => m.id === currentZone.ownerId);
    if (found) return found;
    if (currentUser.id === currentZone.ownerId) return currentUser;
    found = Object.values(DEMO_USERS).find((u) => u.id === currentZone.ownerId);
    if (found) return found;
    if (currentZone.ownerName) {
      const cleanOwner = currentZone.ownerName.replace(/^Bác\s+/i, '').trim().toLowerCase();
      found = members.find((m) => {
        const cleanMember = m.name.replace(/^Bác\s+/i, '').trim().toLowerCase();
        return (
          cleanMember === cleanOwner ||
          cleanMember.includes(cleanOwner) ||
          cleanOwner.includes(cleanMember)
        );
      });
      if (found) return found;
    }
    return null;
  }, [members, currentUser, currentZone?.ownerId, currentZone?.ownerName]);

  const ownerPhone = ownerProfile?.phone || 'Chưa cập nhật';
  const ownerAddress = ownerProfile?.address || 'Chưa cập nhật';

  // Kiểm tra quyền hạn
  const isUnauthorized =
    !currentZone ||
    currentZone.htxId !== currentHTX.id ||
    (currentRole === 'R06' && currentZone.ownerId !== currentUser.id);

  if (isUnauthorized) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl shadow-inner border-2 border-red-200">
          🚫
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-slate-900">Không có quyền truy cập nơi sản xuất</h3>
          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            Đơn vị sản xuất này không thuộc quyền phụ trách của hộ bác hoặc không thuộc HTX hiện tại.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('farm_list')}
          className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-md active:scale-95 transition-all"
        >
          Quay lại danh sách nơi sản xuất
        </button>
      </div>
    );
  }

  const canManage = currentRole === 'R03';
  const unitStatusInfo = getUnitStatusInfo(currentZone.unitStatus || currentZone.status);
  const activeCycle = getActiveCycle(currentZone);
  const activeCycleCount = getCycles(currentZone).filter((cycle) => getCycleStatusInfo(cycle.status).isActive).length;
  const upcomingCycles = getUpcomingCycles(currentZone);
  const pastCycles = getPastCycles(currentZone);
  const cycleTerm = getCycleTerm(currentZone);
  const facilityLabel = getFacilityTypeLabel(currentZone.facilityType);
  const isSuspended = currentZone.unitStatus === 'tam_ngung' || currentZone.unitStatus === 'ngung_su_dung';

  const handleSaveEditZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('Chỉ Cán bộ Kỹ thuật (R03) mới có quyền chỉnh sửa thông tin nơi sản xuất.');
      return;
    }
    if (!editName.trim()) {
      alert('Vui lòng nhập tên nơi sản xuất');
      return;
    }
    const res = updateFarmZone(currentZone.id, {
      name: editName.trim(),
      areaOrQuantity: editArea.trim() || currentZone.areaOrQuantity,
      unitStatus: editUnitStatus as any,
      status: editUnitStatus as any,
      statusNote: editStatusNote.trim(),
      notes: editNotes.trim(),
    });
    if (res && !res.success) {
      alert(res.message);
      return;
    }
    setShowEditModal(false);
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={currentZone.name}
        voiceText={`Chi tiết ${facilityLabel.toLowerCase()} ${currentZone.name}. Trạng thái nơi sản xuất: ${unitStatusInfo.label}. ${activeCycle ? `${cycleTerm} hiện tại: ${activeCycle.seasonName}` : 'Chưa có vụ lứa đang thực hiện.'}`}
      />

      <div className="p-4 space-y-4">
        {/* Card 1: Tổng quan nơi sản xuất & Ảnh */}
        <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm space-y-4">
          <div className="relative aspect-video bg-slate-100">
            <img
              src={currentZone.imageUrl}
              alt={currentZone.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-bold">
              {facilityLabel}
            </div>
            <div className={`absolute bottom-3 right-3 text-xs px-3 py-1 rounded-full font-extrabold shadow border ${unitStatusInfo.badgeClass}`}>
              {unitStatusInfo.label}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Mã số & Loại hình */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Mã đơn vị:</span>
                <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono text-sm font-black tracking-wide">
                  {currentZone.zoneCode || currentZone.id.toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300">
                {facilityLabel} • {currentZone.productionType || 'Trồng trọt'}
              </span>
            </div>

            {/* Tên nơi sản xuất và Quy mô */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">{currentZone.name}</h2>
              </div>
              <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 whitespace-nowrap">
                {currentZone.areaOrQuantity || (currentZone.areaValue ? `${currentZone.areaValue} ${currentZone.areaUnit}` : 'Chưa cập nhật')}
              </span>
            </div>

            {/* HAI DÒNG TRẠNG THÁI RÕ RÀNG CHO NGƯỜI LỚN TUỔI */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-2.5">
              {/* Dòng 1: Trạng thái nơi sản xuất */}
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-600 font-bold">
                  Trạng thái nơi sản xuất:
                </span>
                <span className={`font-black px-3 py-1 rounded-xl border text-sm ${unitStatusInfo.badgeClass}`}>
                  {unitStatusInfo.label}
                </span>
              </div>

              {/* Dòng 2: Vụ/lứa hiện tại */}
              <div className="flex items-center justify-between gap-2 text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-bold">
                  {cycleTerm} hiện tại:
                </span>
                {activeCycle ? (
                  <div className="text-right">
                    <span className="font-black text-emerald-950 text-sm block">
                      {activeCycle.seasonName}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-300">
                      Đang thực hiện
                    </span>
                  </div>
                ) : (
                  <span className="font-extrabold text-slate-600 bg-slate-200 px-3 py-1 rounded-xl border border-slate-300 text-xs">
                    Chưa có
                  </span>
                )}
              </div>
            </div>

            {/* Cảnh báo tạm ngừng sử dụng nếu có */}
            {isSuspended && (
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-amber-950 text-sm">
                  <span className="text-lg">⚠️</span>
                  <span>Đơn vị sản xuất đang tạm ngừng sử dụng:</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed font-semibold pl-6">
                  {currentZone.statusNote || 'Đang trong quá trình cải tạo, sửa chữa bờ vùng hoặc thau chua rửa mặn. Tạm thời không gieo nuôi vụ mới.'}
                </p>
              </div>
            )}

            {/* Thông tin chủ hộ */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <span>👤</span>
                  <span>Chủ hộ phụ trách</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">ID: {currentZone.ownerId}</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {currentZone.ownerName || 'Chưa cập nhật'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/70 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="text-slate-400">📞 SĐT:</span>
                  <span className="font-bold text-slate-900">{ownerPhone}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-700">
                  <span className="text-slate-400 flex-shrink-0">📍 Địa chỉ:</span>
                  <span className="font-medium text-slate-800">{ownerAddress}</span>
                </div>
              </div>
            </div>

            {/* KHỐI 1: VỤ/LỨA ĐANG THỰC HIỆN HOẶC THÔNG BÁO CHƯA CÓ */}
            {activeCycle ? (
              <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    <div>
                      <span className="text-xs font-bold text-blue-900 uppercase block">
                        {cycleTerm} đang thực hiện:
                      </span>
                      <span className="text-lg font-black text-blue-950">
                        {activeCycle.seasonName}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigateTo('farm_season_detail', {
                        zoneId: currentZone.id,
                        seasonId: activeCycle.seasonId,
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-sm flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <span>Xem chi tiết</span>
                    <span className="text-sm">›</span>
                  </button>
                </div>

                {activeCycle.processVersion && (
                  <div className="p-2.5 bg-white/90 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                    <span className="text-blue-900 font-bold">Phiên bản quy trình:</span>
                    <span className="font-extrabold text-blue-950 bg-blue-100 px-2 py-0.5 rounded-lg">
                      {activeCycle.processVersion}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-blue-200/70">
                  <div>
                    <span className="text-blue-800/80 font-medium block">Ngày bắt đầu:</span>
                    <span className="font-extrabold text-blue-950 text-sm">
                      {activeCycle.seasonStartDate || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-800/80 font-medium block">Dự kiến kết thúc:</span>
                    <span className="font-extrabold text-blue-950 text-sm">
                      {activeCycle.seasonEndDate || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>

                {activeCycle.seasonStage && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200 text-xs">
                    <span className="text-slate-500 font-medium">Giai đoạn: </span>
                    <strong className="text-blue-900 font-extrabold">{activeCycle.seasonStage}</strong>
                  </div>
                )}
                {canManage && <button type="button" className="w-full p-2 rounded-xl bg-slate-800 text-white font-bold text-sm" onClick={() => {
                  const result = finishProductionCycle(currentZone.id, activeCycle.cycleId || activeCycle.seasonId);
                  if (!result.success) alert(result.message);
                }}>Kết thúc {cycleTerm.toLowerCase()}</button>}
              </div>
            ) : (
              <div className="p-5 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-300 space-y-2 text-center">
                <span className="text-4xl block">⏳</span>
                <h4 className="text-base font-black text-amber-950">{activeCycleCount > 1 ? 'Có nhiều vụ/lứa đang thực hiện' : upcomingCycles.length ? `Chưa có ${cycleTerm.toLowerCase()} đang thực hiện` : 'Chưa có vụ/lứa'}</h4>
                <p className="text-xs text-amber-800 font-medium leading-relaxed max-w-sm mx-auto">
                  {activeCycleCount > 1 ? 'Cần kiểm tra các chu kỳ đang chạy và chọn đúng vụ/lứa khi ghi nhật ký hoặc thu hoạch.' : `Đơn vị sản xuất này hiện chưa có ${cycleTerm.toLowerCase()} đang chạy. Quý bác có thể xem thông tin đơn vị và lịch sử các vụ trước ở bên dưới.`}
                </p>
                {currentRole === 'R06' && (
                  <div className="pt-1">
                    <span className="inline-block bg-amber-200/80 text-amber-950 text-xs font-black px-4 py-2 rounded-xl border border-amber-300">
                      ℹ️ Liên hệ cán bộ HTX để lập {cycleTerm.toLowerCase()} mới
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* KHỐI KẾ HOẠCH THU HOẠCH DỰ KIẾN (NẾU ĐANG CÓ CHU KỲ) */}
            {activeCycle && (
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    Kế hoạch thu hoạch dự kiến
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white/90 rounded-xl border border-amber-200">
                    <span className="text-xs text-amber-900/80 font-bold block mb-0.5">
                      Sản lượng dự kiến:
                    </span>
                    <span className="text-lg font-black text-amber-950 block">
                      {activeCycle.expectedYieldValue
                        ? `${activeCycle.expectedYieldValue} ${activeCycle.expectedYieldUnit || 'tấn'}`
                        : 'Chưa cập nhật'}
                    </span>
                    {(activeCycle.forecastYield) && (
                      <span className="text-[11px] text-amber-800 font-medium block mt-1">
                        {activeCycle.forecastYield}
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-white/90 rounded-xl border border-amber-200">
                    <span className="text-xs text-amber-900/80 font-bold block mb-0.5">
                      Ngày thu hoạch dự kiến:
                    </span>
                    <span className="text-lg font-black text-amber-950 block">
                      {activeCycle.expectedHarvestDate || 'Chưa cập nhật'}
                    </span>
                    <span className="text-[11px] text-amber-800 font-medium block mt-1">
                      Giống: {activeCycle.variety || 'Chưa có'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* KHỐI 2: CÁC CHU KỲ DỰ KIẾN (NẾU CÓ) */}
            {upcomingCycles.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <span className="text-xs font-black text-purple-950 uppercase">
                      {cycleTerm} dự kiến (Kế hoạch):
                    </span>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
                    Chưa bắt đầu
                  </span>
                </div>

                <div className="space-y-2">
                  {upcomingCycles.map((up) => (
                    <div
                      key={up.seasonId}
                      className="p-3 bg-white rounded-xl border border-purple-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-extrabold text-purple-950">
                        <span>{up.seasonName}</span>
                        <span className="text-slate-400 font-medium">{up.seasonStartDate}</span>
                      </div>
                      <div className="text-slate-600">
                        Giống: <strong>{up.variety || 'Chưa chỉ định'}</strong> • Quy trình: <em>{up.processVersion || 'Mặc định HTX'}</em>
                      </div>
                      <button type="button" className="text-blue-700 font-bold underline" onClick={() => navigateTo('farm_season_detail', { zoneId: currentZone.id, seasonId: up.cycleId || up.seasonId })}>Xem kế hoạch</button>
                      {canManage && <button type="button" className="ml-3 text-emerald-700 font-bold underline" onClick={() => {
                        const result = startProductionCycle(currentZone.id, up.cycleId || up.seasonId);
                        if (!result.success) alert(result.message);
                      }}>Bắt đầu {cycleTerm.toLowerCase()}</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Giống & Thổ nhưỡng */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Giống đang áp dụng:</span>
                <span className="font-extrabold text-slate-900">
                  {activeCycle?.variety || 'Chưa vào vụ'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Thời gian canh tác:</span>
                <span className="font-extrabold text-slate-900">
                  {activeCycle ? `${currentZone.farmingDays || 0} ngày` : 'Chưa có vụ'}
                </span>
              </div>
            </div>

            {/* Thổ nhưỡng & Nguồn nước */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block mb-1">
                💧 Thổ nhưỡng / Nguồn nước:
              </span>
              <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                {currentZone.soilOrWaterCondition || 'Chưa cập nhật thông tin thổ nhưỡng, nguồn nước'}
              </p>
            </div>

            {/* Ghi chú kỹ thuật */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-bold block mb-1">Ghi chú kỹ thuật nơi sản xuất:</span>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {currentZone.notes || 'Không có ghi chú kỹ thuật'}
              </p>
            </div>
          </div>
        </div>

        {/* KHỐI 3: LỊCH SỬ CÁC CHU KỲ ĐÃ QUA */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>📜</span>
                <span>Lịch sử {cycleTerm.toLowerCase()} đã qua</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Các vụ/lứa gắn liền với nơi sản xuất mã <strong>{currentZone.id.toUpperCase()}</strong>
              </p>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              {pastCycles.length} {cycleTerm.toLowerCase()}
            </span>
          </div>

          {pastCycles.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium">
              Chưa có dữ liệu lịch sử {cycleTerm.toLowerCase()} nào trước đó.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pastCycles.map((item, index) => {
                const cycleStatus = getCycleStatusInfo(item.status);
                return (
                  <button
                    key={item.seasonId || index}
                    type="button"
                    onClick={() => {
                      navigateTo('farm_season_detail', {
                        zoneId: currentZone.id,
                        seasonId: item.seasonId,
                      });
                    }}
                    className="w-full text-left p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 active:scale-[0.99] transition-all flex items-center justify-between gap-3 shadow-xs group cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                        <span className="group-hover:text-emerald-700 transition-colors">
                          {item.seasonName}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">({item.year})</span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                        {item.yieldResult ||
                          item.forecastYield ||
                          (item.expectedYieldValue
                            ? `Dự kiến: ${item.expectedYieldValue} ${item.expectedYieldUnit}`
                            : 'Đã hoàn thành')}
                        {item.quality ? ` • ${item.quality}` : ''}
                      </div>
                      {item.processVersion && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.processVersion}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <div>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${cycleStatus.badgeClass}`}
                        >
                          {cycleStatus.label}
                        </span>
                        {item.harvestDate && (
                          <span className="block text-[10px] text-slate-400 font-medium mt-1">
                            Thu: {item.harvestDate}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 group-hover:text-emerald-600 text-lg font-bold transition-transform group-hover:translate-x-0.5">
                        ›
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* CÁC NÚT HÀNH ĐỘNG THEO PHÂN QUYỀN VÀ TRẠNG THÁI */}
        <div className="space-y-2.5 pt-1">
          {/* Cảnh báo không cho ghi nhật ký nếu nơi sản xuất tạm ngừng */}
          {isSuspended ? (
            <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-300 text-center space-y-1">
              <span className="text-2xl block">🚫</span>
              <h4 className="text-sm font-black text-red-900">
                Nơi sản xuất đang {unitStatusInfo.label}
              </h4>
              <p className="text-xs text-red-700 leading-relaxed font-medium">
                Không thể ghi nhật ký hoặc tạo lô thu hoạch mới trong thời gian nơi sản xuất tạm ngừng/ngừng hoạt động.
              </p>
            </div>
          ) : !activeCycle ? (
            <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-center space-y-1">
              <span className="text-2xl block">ℹ️</span>
              <h4 className="text-sm font-black text-amber-950">
                Chưa có {cycleTerm.toLowerCase()} đang thực hiện
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Vui lòng liên hệ cán bộ kỹ thuật HTX để lập và bắt đầu {cycleTerm.toLowerCase()} trước khi ghi nhật ký canh tác.
              </p>
            </div>
          ) : (
            /* Có vụ/lứa đang thực hiện -> cho phép ghi nhật ký */
            <button
              type="button"
              onClick={() => navigateTo('diary_add', { zoneId: currentZone.id, zone: currentZone, seasonId: activeCycle.seasonId })}
              className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-base font-extrabold shadow-md flex items-center justify-center gap-2"
            >
              <span>📝</span>
              <span>Ghi nhật ký cho {activeCycle.seasonName}</span>
            </button>
          )}

          {/* Dành cho Cán bộ Kỹ thuật (R03) */}
          {canManage && (
            <>
              {/* Nút: Sửa thông tin nơi sản xuất */}
              <button
                type="button"
                onClick={() => {
                  setEditName(currentZone.name);
                  setEditArea(currentZone.areaOrQuantity);
                  setEditUnitStatus(currentZone.unitStatus || 'dang_su_dung');
                  setEditStatusNote(currentZone.statusNote || '');
                  setEditNotes(currentZone.notes || '');
                  setShowEditModal(true);
                }}
                className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-800 text-base font-extrabold shadow-xs flex items-center justify-center gap-2"
              >
                <span>✏️</span>
                <span>CHỈNH SỬA THÔNG TIN NƠI SẢN XUẤT</span>
              </button>

              {/* Lối tắt mở cùng biểu mẫu lập vụ/lứa từ danh sách */}
              <button
                type="button"
                onClick={() => navigateTo('farm_cycle_add', { unitId: currentZone.id })}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-extrabold shadow-md flex items-center justify-center gap-2"
              >
                <span>🌱</span>
                <span>LẬP {cycleTerm.toUpperCase()} MỚI</span>
              </button>

              {/* Nút Xóa */}
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 text-xs font-extrabold flex items-center justify-center gap-2 border border-red-200 transition-all"
              >
                <span>🗑️</span>
                <span>XÓA NƠI SẢN XUẤT NÀY</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* MODAL SỬA THÔNG TIN ĐƠN VỊ SẢN XUẤT (CHỈ R03) */}
      {canManage && showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Sửa thông tin nơi sản xuất</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Mã đơn vị: <strong>{currentZone.id.toUpperCase()}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 active:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditZone} className="space-y-4">
              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-1">
                  Tên nơi sản xuất:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full h-12 px-3 rounded-2xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-1">
                  Quy mô diện tích / số con / thể tích:
                </label>
                <input
                  type="text"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  placeholder="VD: 1.5 ha, 500 con..."
                  className="w-full h-12 px-3 rounded-2xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-1">
                  Trạng thái sử dụng nơi sản xuất:
                </label>
                <select
                  value={editUnitStatus}
                  onChange={(e) => setEditUnitStatus(e.target.value)}
                  className="w-full h-12 px-3 rounded-2xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
                >
                  <option value="dang_su_dung">Đang sử dụng</option>
                  <option value="tam_ngung">Tạm ngừng sử dụng</option>
                  <option value="ngung_su_dung">Ngừng sử dụng</option>
                </select>
              </div>

              {editUnitStatus === 'tam_ngung' && (
                <div>
                  <label className="block text-sm font-extrabold text-amber-900 mb-1">
                    Lý do tạm ngừng sử dụng:
                  </label>
                  <input
                    type="text"
                    value={editStatusNote}
                    onChange={(e) => setEditStatusNote(e.target.value)}
                    placeholder="VD: Cải tạo đất, đắp bờ bao chống lũ..."
                    className="w-full h-12 px-3 rounded-2xl border-2 border-amber-300 text-sm font-bold text-slate-900 bg-amber-50 focus:border-amber-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-1">
                  Ghi chú kỹ thuật:
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-2xl border-2 border-slate-300 text-sm font-semibold text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-sm shadow-md"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÓA ĐƠN VỊ SẢN XUẤT (CHỈ R03) */}
      {canManage && showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="text-center space-y-2">
              <span className="text-4xl block">⚠️</span>
              <h3 className="text-lg font-black text-slate-900">Xác nhận xóa nơi sản xuất?</h3>
              <p className="text-xs text-slate-600">
                Đồng chí có chắc chắn muốn xóa <strong>{currentZone.name}</strong> không?
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-bold leading-relaxed">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = deleteFarmZone(currentZone.id);
                  if (!res.success) {
                    setDeleteError(res.message);
                  } else {
                    setShowDeleteModal(false);
                    goBack();
                  }
                }}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
