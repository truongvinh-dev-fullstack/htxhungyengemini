import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { FarmZone } from '../../types';
import { SEASONS_BY_HTX, DEMO_USERS } from '../../mock/data';

export const FarmDetail: React.FC = () => {
  const {
    screenParams,
    goBack,
    navigateTo,
    currentHTX,
    currentRole,
    currentUser,
    members,
    updateFarmZoneSeason,
    updateFarmZone,
    deleteFarmZone,
    farmZones,
  } = useApp();

  const targetZoneId = screenParams?.zoneId || screenParams?.zone?.id;

  // Luôn lấy dữ liệu mới nhất từ AppContext state theo ID, tránh dùng dữ liệu screenParams cũ
  const liveZone = farmZones.find((z) => z.id === targetZoneId);
  const currentZone: FarmZone | null = liveZone || (screenParams?.zone?.id === targetZoneId ? screenParams.zone : null);

  // Modal đổi mùa vụ và chỉnh sửa (chỉ dành cho cán bộ kỹ thuật R03)
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // State cho edit thông tin thửa
  const [editName, setEditName] = useState(currentZone?.name || '');
  const [editArea, setEditArea] = useState(currentZone?.areaOrQuantity || '');
  const [editStatus, setEditStatus] = useState(currentZone?.status || 'Đang canh tác');
  const [editNotes, setEditNotes] = useState(currentZone?.notes || '');

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

  // Lấy số điện thoại và địa chỉ chủ hộ từ hồ sơ thành viên theo ownerId
  // Xử lý dự phòng trường hợp thiếu hồ sơ hoặc ID mẫu của bác An ('u_r06_an' vs 'm-01')
  const ownerProfile = useMemo(() => {
    if (!currentZone) return null;

    // 1. Tìm theo ownerId trong danh sách members
    let found = members.find((m) => m.id === currentZone.ownerId);
    if (found) return found;

    // 2. Nếu chủ hộ chính là currentUser
    if (currentUser.id === currentZone.ownerId) return currentUser;

    // 3. Tìm trong DEMO_USERS
    found = Object.values(DEMO_USERS).find((u) => u.id === currentZone.ownerId);
    if (found) return found;

    // 4. Tìm trong members theo tên chủ hộ (loại bỏ tiền tố xưng hô 'Bác')
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

  // Kiểm tra quyền hạn và tính hợp lệ:
  // - Vùng phải tồn tại và thuộc HTX hiện tại
  // - Nếu là R06 (nông dân), chỉ cho phép xem vùng có ownerId === currentUser.id
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
          <h3 className="text-xl font-black text-slate-900">Không có quyền truy cập thửa ruộng</h3>
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

  // Phân quyền thao tác:
  // - R03: Quản lý vùng (sửa thông tin, bắt đầu mùa vụ, xóa thửa, ghi nhật ký)
  // - R06: Chỉ xem và ghi nhật ký cho thửa mình phụ trách
  // - R02: Chỉ xem thông tin
  const canManage = currentRole === 'R03';
  const canAddDiary = currentRole === 'R06' || currentRole === 'R03';

  const handleConfirmNewSeason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('Chỉ Cán bộ Kỹ thuật (R03) mới có quyền bắt đầu mùa vụ mới.');
      return;
    }
    const res = updateFarmZoneSeason(currentZone.id, {
      season: newSeasonName,
      variety: newVariety,
      seasonStartDate: newStartDate,
      seasonEndDate: newEndDate,
      forecastYield: newForecast,
      notes: `Chuyển vụ canh tác mới: ${newSeasonName} cho giống ${newVariety}.`,
    });
    if (res && !res.success) {
      alert(res.message);
      return;
    }
    setShowSeasonModal(false);
  };

  const handleSaveEditZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('Chỉ Cán bộ Kỹ thuật (R03) mới có quyền chỉnh sửa thông tin thửa ruộng.');
      return;
    }
    if (!editName.trim()) {
      alert('Vui lòng nhập tên thửa ruộng');
      return;
    }
    const res = updateFarmZone(currentZone.id, {
      name: editName.trim(),
      areaOrQuantity: editArea.trim() || currentZone.areaOrQuantity,
      status: editStatus,
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
        voiceText={
          currentRole === 'R06'
            ? `Chi tiết vùng sản xuất ${currentZone.name}, giống ${currentZone.variety}, mùa vụ ${currentZone.season}. Bác có thể xem thông tin canh tác và bấm Ghi nhật ký cho thửa ruộng này.`
            : `Chi tiết vùng sản xuất ${currentZone.name}, giống ${currentZone.variety}, mùa vụ ${currentZone.season}. Bác có thể xem thông tin kỹ thuật, hồ sơ thành viên hoặc ghi nhật ký canh tác.`
        }
      />

      <div className="p-4 space-y-4">
        {/* Card 1: Tổng quan vùng sản xuất & Ảnh */}
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
            <div className="absolute bottom-3 right-3 bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow">
              {currentZone.status}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Dòng nhận diện: MSVT và Loại hình */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Mã số vùng trồng:</span>
                <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono text-sm font-black tracking-wide">
                  {currentZone.zoneCode || currentZone.id.toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300">
                {currentZone.productionType || 'Trồng trọt'}
              </span>
            </div>

            {/* Tên vùng và Quy mô */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">{currentZone.name}</h2>
              </div>
              <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 whitespace-nowrap">
                {currentZone.areaOrQuantity || (currentZone.areaValue ? `${currentZone.areaValue} ${currentZone.areaUnit}` : 'Chưa cập nhật')}
              </span>
            </div>

            {/* Thông tin chủ hộ phụ trách (kèm SĐT và địa chỉ từ hồ sơ thành viên) */}
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

            {/* CN-2.4: KHỐI THÔNG TIN MÙA VỤ CHI TIẾT (GIỮ NGUYÊN) */}
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
                <button
                  type="button"
                  onClick={() => {
                    const activeSeasonId =
                      currentZone.currentSeasonId ||
                      currentZone.seasonHistory?.find((s) => s.seasonName === currentZone.season)?.seasonId;
                    navigateTo('farm_season_detail', {
                      zoneId: currentZone.id,
                      seasonId: activeSeasonId,
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                  title="Xem chi tiết mùa vụ hiện hành"
                >
                  <span>Xem vụ</span>
                  <span className="text-sm">›</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-blue-200/70">
                <div>
                  <span className="text-blue-800/80 font-medium block">Ngày bắt đầu vụ:</span>
                  <span className="font-extrabold text-blue-950 text-sm">
                    {currentZone.seasonStartDate || 'Chưa cập nhật'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-800/80 font-medium block">Dự kiến kết thúc vụ:</span>
                  <span className="font-extrabold text-blue-950 text-sm">
                    {currentZone.seasonEndDate || 'Chưa cập nhật'}
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

            {/* KHỐI KẾ HOẠCH THU HOẠCH: HIỂN THỊ RÕ RÀNG SẢN LƯỢNG VÀ NGÀY THU HOẠCH DỰ KIẾN */}
            <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  Kế hoạch thu hoạch dự kiến
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Mục 1: Sản lượng dự kiến */}
                <div className="p-3 bg-white/90 rounded-xl border border-amber-200">
                  <span className="text-xs text-amber-900/80 font-bold block mb-0.5">
                    Sản lượng dự kiến:
                  </span>
                  <span className="text-lg font-black text-amber-950 block">
                    {currentZone.expectedYieldValue
                      ? `${currentZone.expectedYieldValue} ${currentZone.expectedYieldUnit}`
                      : 'Chưa cập nhật'}
                  </span>
                  {currentZone.forecastYield && (
                    <span className="text-[11px] text-amber-800 font-medium block mt-1">
                      {currentZone.forecastYield}
                    </span>
                  )}
                </div>

                {/* Mục 2: Ngày thu hoạch dự kiến (Không thay bằng seasonEndDate) */}
                <div className="p-3 bg-white/90 rounded-xl border border-amber-200">
                  <span className="text-xs text-amber-900/80 font-bold block mb-0.5">
                    Ngày thu hoạch dự kiến:
                  </span>
                  <span className="text-lg font-black text-amber-950 block">
                    {currentZone.expectedHarvestDate || 'Chưa cập nhật'}
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium block mt-1">
                    Theo chu kỳ sinh trưởng giống {currentZone.variety}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin canh tác, giống & thổ nhưỡng */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Giống canh tác:</span>
                <span className="font-extrabold text-slate-900">{currentZone.variety || 'Chưa cập nhật'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Đã canh tác:</span>
                <span className="font-extrabold text-slate-900">
                  {currentZone.farmingDays ? `${currentZone.farmingDays} ngày` : 'Chưa cập nhật'}
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
              <span className="text-xs text-slate-500 font-bold block mb-1">Ghi chú kỹ thuật:</span>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {currentZone.notes || 'Không có ghi chú kỹ thuật'}
              </p>
            </div>
          </div>
        </div>

        {/* CN-2.4.3: LỊCH SỬ CANH TÁC QUA CÁC MÙA VỤ (GIỮ NGUYÊN) */}
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
              {currentZone.seasonHistory?.length || 0} mùa vụ
            </span>
          </div>

          <div className="space-y-2.5">
            {(currentZone.seasonHistory || []).map((item, index) => {
              const targetSeasonId =
                item.seasonId ||
                (item.seasonName === currentZone.season ? currentZone.currentSeasonId : undefined);
              const isCurrent =
                item.seasonId === currentZone.currentSeasonId ||
                item.seasonName === currentZone.season;

              return (
                <button
                  key={item.seasonId || index}
                  type="button"
                  onClick={() => {
                    navigateTo('farm_season_detail', {
                      zoneId: currentZone.id,
                      seasonId: targetSeasonId || item.seasonId,
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
                      {isCurrent && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full">
                          Hiện hành
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                      {item.yieldResult ||
                        item.forecastYield ||
                        (item.expectedYieldValue
                          ? `Dự kiến: ${item.expectedYieldValue} ${item.expectedYieldUnit}`
                          : 'Chưa có số liệu')}
                      {item.quality ? ` • ${item.quality}` : ''}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          item.status === 'Đang canh tác'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.status}
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
        </div>

        {/* CÁC NÚT HÀNH ĐỘNG THEO PHÂN QUYỀN:
            - R06: Chỉ thấy nút Ghi nhật ký cho thửa ruộng này
            - R03: Quản lý đầy đủ (Sửa thông tin, Bắt đầu vụ mới, Ghi nhật ký, Xóa thửa)
            - R02: Chỉ xem (không có nút thao tác)
        */}
        <div className="space-y-2.5 pt-1">
          {canManage && (
            <>
              {/* Nút: Sửa thông tin thửa ruộng (chỉ R03) */}
              <button
                type="button"
                onClick={() => {
                  setEditName(currentZone.name);
                  setEditArea(currentZone.areaOrQuantity);
                  setEditStatus(currentZone.status);
                  setEditNotes(currentZone.notes);
                  setShowEditModal(true);
                }}
                className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-800 text-base font-extrabold shadow-xs flex items-center justify-center gap-2"
              >
                <span>✏️</span>
                <span>CHỈNH SỬA THÔNG TIN THỬA RUỘNG</span>
              </button>

              {/* Nút: Đổi / Bắt đầu mùa vụ mới cho thửa ruộng này (chỉ R03) */}
              <button
                type="button"
                onClick={() => setShowSeasonModal(true)}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-base font-extrabold shadow-md flex items-center justify-center gap-2"
              >
                <span>🌱</span>
                <span>BẮT ĐẦU MÙA VỤ MỚI CHO THỬA NÀY</span>
              </button>
            </>
          )}

          {canAddDiary && (
            /* Nút Ghi nhật ký (R06 và R03): Truyền zone.id để biểu mẫu tự động chọn đúng thửa */
            <button
              type="button"
              onClick={() => navigateTo('diary_add', { zoneId: currentZone.id, zone: currentZone })}
              className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-base font-extrabold shadow flex items-center justify-center gap-2"
            >
              <span>📝</span>
              <span>Ghi nhật ký cho thửa ruộng này</span>
            </button>
          )}

          {canManage && (
            /* Nút Xóa thửa (chỉ R03) */
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              className="w-full py-3.5 rounded-2xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 text-sm font-extrabold flex items-center justify-center gap-2 border border-red-200 transition-all"
            >
              <span>🗑️</span>
              <span>XÓA THỬA RUỘNG NÀY</span>
            </button>
          )}
        </div>
      </div>

      {/* MODAL BẮT ĐẦU MÙA VỤ MỚI (CHỈ R03) */}
      {canManage && showSeasonModal && (
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

      {/* MODAL CHỈNH SỬA THÔNG TIN THỬA RUỘNG (CHỈ R03) */}
      {canManage && showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Sửa thông tin thửa ruộng</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Mã thửa: <strong>{currentZone.id.toUpperCase()}</strong>
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
                  Tên thửa ruộng / vùng nuôi:
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
                  Diện tích / Quy mô đàn:
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
                  Trạng thái thửa ruộng:
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full h-12 px-3 rounded-2xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Đang canh tác">Đang canh tác</option>
                  <option value="Sắp thu hoạch">Sắp thu hoạch</option>
                  <option value="Đã thu hoạch">Đã thu hoạch</option>
                  <option value="Nghỉ vụ">Nghỉ vụ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-1">
                  Ghi chú kỹ thuật thửa:
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

      {/* MODAL XÁC NHẬN XÓA THỬA RUỘNG (CHỈ R03) */}
      {canManage && showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="text-center space-y-2">
              <span className="text-4xl block">⚠️</span>
              <h3 className="text-lg font-black text-slate-900">Xác nhận xóa vùng sản xuất?</h3>
              <p className="text-xs text-slate-600">
                Đồng chí có chắc chắn muốn xóa thửa <strong>{currentZone.name}</strong> không?
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
