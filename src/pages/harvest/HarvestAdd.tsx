import React, { useState, useMemo, useEffect } from 'react';
import { useApp, getCanonicalMemberName } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { matchSeasonForZone } from '../../utils/seasonMatcher';
import {
  getCycleTerm,
  getFacilityTypeLabel,
  getCycles,
  getCycleStatusInfo,
} from '../../utils/productionUtils';
import { HarvestLotSource } from '../../types';
import { sameUnit } from '../../utils/harvestBalance';

interface SourceRowState {
  farmZoneId: string;
  quantity: number;
  cycleId: string;
  cycleName: string;
  unit: string;
  harvestDate: string;
}

export const HarvestAdd: React.FC = () => {
  const { farmZones, members, addHarvest, navigateTo, currentHTX, currentRole, currentUser, qualityConfigs } = useApp();

  const isR03 = currentRole === 'R03';

  // Danh sách các hộ nông dân trong HTX hiện tại (đối với R03)
  const htxFarmers = useMemo(() => {
    const farmerIdSet = new Set<string>();
    farmZones
      .filter((z) => z.htxId === currentHTX.id && z.ownerId)
      .forEach((z) => farmerIdSet.add(z.ownerId));
    return members.filter((m) => m.htxId === currentHTX.id && (m.role === 'R06' || farmerIdSet.has(m.id)));
  }, [members, farmZones, currentHTX.id]);

  // Hộ sở hữu đang được chọn
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(() => {
    if (isR03) {
      return htxFarmers.length > 0 ? htxFarmers[0].id : '';
    }
    return currentUser.id;
  });

  useEffect(() => {
    if (isR03 && htxFarmers.length > 0 && !selectedFarmerId) {
      setSelectedFarmerId(htxFarmers[0].id);
    } else if (!isR03) {
      setSelectedFarmerId(currentUser.id);
    }
  }, [isR03, htxFarmers, selectedFarmerId, currentUser.id]);

  // Các vùng/thửa hợp lệ của hộ đã chọn trong HTX hiện tại
  const availableZonesForFarmer = useMemo(() => {
    return farmZones.filter((z) => {
      if (z.htxId !== currentHTX.id) return false;
      const ownerMatch = isR03 ? z.ownerId === selectedFarmerId : z.ownerId === currentUser.id;
      if (!ownerMatch) return false;
      // Chỉ lấy các vùng đang hoạt động
      return z.unitStatus !== 'tam_ngung' && z.unitStatus !== 'ngung_su_dung' && z.status !== 'tam_ngung';
    });
  }, [farmZones, currentHTX.id, isR03, selectedFarmerId, currentUser.id]);

  // Mã lô thu hoạch do hệ thống sinh, duy nhất, chỉ đọc
  const [harvestCode] = useState<string>(() => {
    return `TH-${currentHTX.id.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`;
  });

  const [harvestDate, setHarvestDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Đơn vị tính chung cho lô
  const [lotUnit, setLotUnit] = useState<string>(currentHTX.id === 'dongtao' ? 'con' : 'kg');

  // Danh sách dòng nguồn thu hoạch từ các vùng/thửa
  const [sourceRows, setSourceRows] = useState<SourceRowState[]>([]);

  // Khởi tạo dòng nguồn đầu tiên khi danh sách thửa của hộ thay đổi
  useEffect(() => {
    if (availableZonesForFarmer.length > 0) {
      const firstZone = availableZonesForFarmer[0];
      const zUnit = firstZone.facilityType === 'chuong_nuoi' || firstZone.facilityType === 'chuong_trai' ? 'con' : 'kg';
      setLotUnit(zUnit);

      const zoneCycles = getCycles(firstZone);
      const matched = matchSeasonForZone(firstZone, harvestDate);
      const defCycle = (matched.status === 'matched' && matched.season)
        ? matched.season
        : zoneCycles.find((c) => getCycleStatusInfo(c.status).isActive) || zoneCycles[0];

      setSourceRows([
        {
          farmZoneId: firstZone.id,
          quantity: currentHTX.id === 'dongtao' ? 50 : 500,
          cycleId: defCycle?.cycleId || defCycle?.seasonId || '',
          cycleName: defCycle?.seasonName || 'Vụ thu hoạch',
          unit: zUnit,
          harvestDate,
        },
      ]);
    } else {
      setSourceRows([]);
    }
  }, [selectedFarmerId, availableZonesForFarmer.length]);

  // Cập nhật thông tin một dòng nguồn
  const handleUpdateSourceRow = (index: number, updates: Partial<SourceRowState>) => {
    setSourceRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };

      // Nếu đổi thửa ruộng thì tự động cập nhật cycle và đơn vị tính
      if (updates.farmZoneId && updates.farmZoneId !== prev[index].farmZoneId) {
        const zone = availableZonesForFarmer.find((z) => z.id === updates.farmZoneId);
        if (zone) {
          const zUnit = zone.facilityType === 'chuong_nuoi' || zone.facilityType === 'chuong_trai' ? 'con' : 'kg';
          const zoneCycles = getCycles(zone);
          const matched = matchSeasonForZone(zone, copy[index].harvestDate || harvestDate);
          const defCycle = (matched.status === 'matched' && matched.season)
            ? matched.season
            : zoneCycles.find((c) => getCycleStatusInfo(c.status).isActive) || zoneCycles[0];

          copy[index].unit = zUnit;
          copy[index].cycleId = defCycle?.cycleId || defCycle?.seasonId || '';
          copy[index].cycleName = defCycle?.seasonName || 'Vụ thu hoạch';
        }
      }

      return copy;
    });
  };

  // Thêm một thửa ruộng nguồn
  const handleAddSourceRow = () => {
    // Tìm thửa ruộng chưa được chọn
    const chosenIds = new Set(sourceRows.map((r) => r.farmZoneId));
    const nextZone = availableZonesForFarmer.find((z) => !chosenIds.has(z.id)) || availableZonesForFarmer[0];

    if (!nextZone) {
      alert('Hộ này không còn thửa ruộng nào khác để thêm.');
      return;
    }

    const zUnit = nextZone.facilityType === 'chuong_nuoi' || nextZone.facilityType === 'chuong_trai' ? 'con' : 'kg';
    if (!sameUnit(zUnit, lotUnit)) {
      alert(`Thửa "${nextZone.name}" có đơn vị tính (${zUnit}) không tương thích với đơn vị của lô (${lotUnit}). Vui lòng tạo lô riêng cho từng loại đơn vị.`);
      return;
    }

    const zoneCycles = getCycles(nextZone);
    const matched = matchSeasonForZone(nextZone, harvestDate);
    const defCycle = (matched.status === 'matched' && matched.season)
      ? matched.season
      : zoneCycles.find((c) => getCycleStatusInfo(c.status).isActive) || zoneCycles[0];

    setSourceRows((prev) => [
      ...prev,
      {
        farmZoneId: nextZone.id,
        quantity: currentHTX.id === 'dongtao' ? 20 : 200,
        cycleId: defCycle?.cycleId || defCycle?.seasonId || '',
        cycleName: defCycle?.seasonName || 'Vụ thu hoạch',
        unit: zUnit,
        harvestDate,
      },
    ]);
  };

  // Xóa một thửa ruộng nguồn
  const handleRemoveSourceRow = (index: number) => {
    if (sourceRows.length <= 1) {
      alert('Một lô thu hoạch phải có ít nhất một thửa ruộng nguồn.');
      return;
    }
    setSourceRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Tổng sản lượng lô = tổng sản lượng đóng góp của các vùng
  const totalYieldQuantity = useMemo(() => {
    return sourceRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  }, [sourceRows]);

  const [grade1Quantity, setGrade1Quantity] = useState<number>(() => {
    return currentHTX.id === 'dongtao' ? 45 : 850;
  });
  const [grade2Quantity, setGrade2Quantity] = useState<number>(() => {
    return currentHTX.id === 'dongtao' ? 5 : 150;
  });

  // Tự động điều chỉnh phân loại khi tổng sản lượng thay đổi
  useEffect(() => {
    if (totalYieldQuantity > 0) {
      const g1 = Math.round(totalYieldQuantity * 0.85);
      const g2 = totalYieldQuantity - g1;
      setGrade1Quantity(g1);
      setGrade2Quantity(g2);
    }
  }, [totalYieldQuantity]);

  // Cấu hình chất lượng động
  const firstZone = farmZones.find((z) => z.id === sourceRows[0]?.farmZoneId);
  const qualityCategory = useMemo(() => {
    if (!firstZone) return 'nhan_long';
    if (firstZone.facilityType === 'chuong_nuoi' || firstZone.facilityType === 'chuong_trai') return 'ga_dongtao';
    if (firstZone.facilityType === 'long_ca' || firstZone.facilityType === 'ao_nuoi' || firstZone.facilityType === 'long_be') return 'thuy_san';
    if (firstZone.facilityType === 'thua_ruong') return 'lua_gao';
    return 'nhan_long';
  }, [firstZone]);

  const currentQualityConfig = qualityConfigs[qualityCategory];

  const [qualityMetric, setQualityMetric] = useState<string>(() => {
    return currentQualityConfig?.criteria.map((c) => `${c.name}: ${c.standardValue || c.standardTarget}`).join(', ') || 'Đạt tiêu chuẩn chất lượng VietGAP';
  });

  useEffect(() => {
    if (currentQualityConfig) {
      setQualityMetric(
        currentQualityConfig.criteria.map((c) => `${c.name}: ${c.standardValue || c.standardTarget}`).join(', ')
      );
    }
  }, [currentQualityConfig]);

  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80'
  );
  const [notes, setNotes] = useState<string>('Thu hoạch tuyển chọn, đạt chuẩn VietGAP.');

  // Kiểm tra phân loại
  const totalGrades = (grade1Quantity || 0) + (grade2Quantity || 0);
  const isGradeExceeded = totalGrades > totalYieldQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceRows.length === 0) {
      alert('Vui lòng chọn ít nhất một thửa ruộng nguồn để khai báo thu hoạch.');
      return;
    }

    if (totalYieldQuantity <= 0) {
      alert('Tổng sản lượng thu hoạch phải lớn hơn 0.');
      return;
    }

    // Kiểm tra trùng lặp thửa ruộng
    const zoneIds = sourceRows.map((r) => r.farmZoneId);
    if (new Set(zoneIds).size !== zoneIds.length) {
      alert('Danh sách thửa ruộng nguồn không được trùng lặp.');
      return;
    }

    // Kiểm tra từng dòng nguồn
    for (let i = 0; i < sourceRows.length; i++) {
      const row = sourceRows[i];
      const zone = availableZonesForFarmer.find((z) => z.id === row.farmZoneId);
      if (!zone) {
        alert(`Thửa ruộng dòng ${i + 1} không tồn tại hoặc không hợp lệ.`);
        return;
      }

      if (row.quantity <= 0) {
        alert(`Sản lượng đóng góp của thửa "${zone.name}" phải lớn hơn 0.`);
        return;
      }

      if (!row.cycleId) {
        alert(`Vui lòng chọn vụ/lứa hợp lệ cho thửa "${zone.name}".`);
        return;
      }

      const match = matchSeasonForZone(zone, row.harvestDate || harvestDate, false, row.cycleId);
      if (match.status === 'no_season') {
        alert(`Ngày thu hoạch của thửa "${zone.name}" không thuộc thời gian vụ/lứa đã chọn.`);
        return;
      }
      if (match.status === 'overlap') {
        alert(`Dữ liệu vụ/lứa của thửa "${zone.name}" bị chồng thời gian tại ngày thu hoạch.`);
        return;
      }

      if (!sameUnit(row.unit, lotUnit)) {
        alert(`Đơn vị của thửa "${zone.name}" (${row.unit}) không khớp với đơn vị của lô (${lotUnit}).`);
        return;
      }
    }

    if (grade1Quantity < 0 || grade2Quantity < 0) {
      alert('Khối lượng Loại 1 và Loại 2 không được là số âm.');
      return;
    }

    if (isGradeExceeded) {
      alert('Tổng khối lượng Loại 1 và Loại 2 không được vượt quá tổng sản lượng thu hoạch.');
      return;
    }

    // Xây dựng danh sách HarvestLotSource
    const sources: HarvestLotSource[] = sourceRows.map((r) => {
      const zone = availableZonesForFarmer.find((z) => z.id === r.farmZoneId)!;
      return {
        farmZoneId: zone.id,
        farmZoneName: zone.name,
        zoneCode: zone.zoneCode,
        cycleId: r.cycleId,
        cycleName: r.cycleName,
        quantity: r.quantity,
        unit: r.unit || lotUnit,
        harvestDate: r.harvestDate || harvestDate,
      };
    });

    const primaryZone = availableZonesForFarmer.find((z) => z.id === sources[0].farmZoneId)!;
    const farmerName = getCanonicalMemberName(selectedFarmerId, primaryZone.ownerName, members);

    const res = await addHarvest({
      code: harvestCode,
      htxId: currentHTX.id,
      farmZoneId: primaryZone.id,
      farmZoneName: sources.length > 1 ? `${primaryZone.name} (+${sources.length - 1} thửa)` : primaryZone.name,
      zoneCode: primaryZone.zoneCode,
      variety: primaryZone.variety || 'Nông sản VietGAP',
      ownerId: selectedFarmerId,
      ownerName: farmerName,
      seasonId: sources[0].cycleId,
      cycleId: sources[0].cycleId,
      seasonName: sources[0].cycleName,
      date: harvestDate,
      yieldQuantity: totalYieldQuantity,
      grade1Quantity,
      grade2Quantity,
      qualityCategory,
      qualityMetric,
      unit: lotUnit,
      photoUrl,
      notes,
      sources,
      processingStatus: 'chua_so_che',
    });

    if (res && !res.success) {
      alert(res.message || 'Lỗi khi lưu lô thu hoạch.');
      return;
    }

    alert(`Đã ghi nhận lô thu hoạch ${harvestCode} với ${sources.length} thửa ruộng nguồn thành công!`);
    navigateTo('harvest_list');
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Ghi nhận thu hoạch"
        voiceText="Bác chọn cơ sở sản xuất, kiểm tra chu kỳ vụ, nhập sản lượng đóng góp từ các thửa ruộng và phân loại nhé."
      />

      <div className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-5">
          {/* A. Đối với vai trò R03: Chọn hộ nông dân trước */}
          {isR03 && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl space-y-2">
              <label className="block text-sm font-black text-blue-950 uppercase tracking-wide">
                👤 Giám sát thu hoạch: Chọn hộ nông dân tạo lô
              </label>
              <select
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                className="w-full h-13 px-3 rounded-xl border-2 border-blue-300 text-base font-extrabold text-blue-900 bg-white focus:outline-none"
              >
                {htxFarmers.map((farmer) => (
                  <option key={farmer.id} value={farmer.id}>
                    Hộ: {farmer.name} ({farmer.phone})
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-700 font-medium">
                * Cán bộ R03 tạo lô cho hộ nào thì chỉ thấy các thửa ruộng thuộc hộ đó trong HTX {currentHTX.name}.
              </p>
            </div>
          )}

          {/* 1. Danh sách các thửa ruộng / vùng nguồn thu hoạch */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-base font-bold text-slate-900">
                1. Các vùng/thửa nguồn đóng góp vào lô: <span className="text-red-500">*</span>
              </label>
              <span className="text-xs font-bold bg-orange-100 text-orange-900 px-2 py-0.5 rounded-full">
                {sourceRows.length} thửa nguồn
              </span>
            </div>

            {availableZonesForFarmer.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-sm text-amber-950 space-y-2">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                  <span>⚠️</span> Không có thửa ruộng đang hoạt động
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  {isR03
                    ? 'Hộ nông dân này hiện chưa có thửa ruộng hoặc cơ sở nào đang hoạt động trong HTX.'
                    : 'Bác chưa có thửa ruộng nào được phân công. Vui lòng liên hệ cán bộ kỹ thuật HTX.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sourceRows.map((row, idx) => {
                  const zone = availableZonesForFarmer.find((z) => z.id === row.farmZoneId);
                  const zoneCycles = zone ? getCycles(zone) : [];
                  const typeLabel = zone ? getFacilityTypeLabel(zone.facilityType) : 'Cơ sở';

                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-orange-900 bg-orange-100 px-2 py-0.5 rounded-lg">
                          Thửa nguồn #{idx + 1}
                        </span>
                        {sourceRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSourceRow(idx)}
                            className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg active:scale-95"
                          >
                            🗑️ Xóa thửa này
                          </button>
                        )}
                      </div>

                      {/* Chọn thửa */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Thửa ruộng / Nơi sản xuất:
                        </label>
                        <select
                          value={row.farmZoneId}
                          onChange={(e) => handleUpdateSourceRow(idx, { farmZoneId: e.target.value })}
                          className="w-full h-11 px-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 bg-white focus:outline-none"
                        >
                          {availableZonesForFarmer.map((z) => (
                            <option key={z.id} value={z.id}>
                              [{getFacilityTypeLabel(z.facilityType)}] {z.name} {z.zoneCode ? `(${z.zoneCode})` : ''} - {z.variety}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Chọn vụ/lứa của thửa */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Vụ/Lứa áp dụng:
                        </label>
                        {zoneCycles.length > 0 ? (
                          <select
                            value={row.cycleId}
                            onChange={(e) => {
                              const chosen = zoneCycles.find((c) => (c.cycleId || c.seasonId) === e.target.value);
                              handleUpdateSourceRow(idx, {
                                cycleId: e.target.value,
                                cycleName: chosen?.seasonName || 'Vụ thu hoạch',
                              });
                            }}
                            className="w-full h-11 px-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 bg-white focus:outline-none"
                          >
                            <option value="">-- Chọn vụ/lứa --</option>
                            {zoneCycles.map((c) => (
                              <option key={c.cycleId || c.seasonId} value={c.cycleId || c.seasonId}>
                                {c.seasonName} ({c.seasonStartDate} → {c.seasonEndDate}) [{c.status === 'dang_thuc_hien' || c.status === 'Đang canh tác' ? 'Đang thực hiện' : 'Đã kết thúc'}]
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
                            Thửa này chưa có vụ/lứa nào được kích hoạt
                          </div>
                        )}
                      </div>

                      {/* Sản lượng đóng góp và ngày thu hoạch */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Sản lượng đóng góp ({row.unit}):
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleUpdateSourceRow(idx, { quantity: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-full h-11 px-3 rounded-xl border-2 border-orange-300 font-extrabold text-base text-slate-900 bg-white focus:outline-none"
                            placeholder="Số lượng..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Ngày thu thửa này:
                          </label>
                          <input
                            type="date"
                            value={row.harvestDate}
                            onChange={(e) => handleUpdateSourceRow(idx, { harvestDate: e.target.value })}
                            className="w-full h-11 px-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Nút thêm thửa ruộng nguồn */}
                <button
                  type="button"
                  onClick={handleAddSourceRow}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-orange-400 bg-orange-50/50 hover:bg-orange-100 text-orange-900 font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>➕</span>
                  <span>Thêm thửa ruộng nguồn khác vào lô này</span>
                </button>
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
                className="w-full h-12 px-4 rounded-2xl border-2 border-slate-200 bg-slate-100 font-mono text-base font-extrabold text-slate-700 cursor-not-allowed select-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl">
                🔒 Duy nhất & Chỉ đọc
              </span>
            </div>
          </div>

          {/* 3. Ngày thu hoạch chung của lô */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              3. Ngày thu hoạch chung của lô: <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={harvestDate}
                onChange={(e) => {
                  setHarvestDate(e.target.value);
                  // Đồng bộ ngày nếu các dòng chưa có ngày riêng
                  setSourceRows((prev) => prev.map((r) => ({ ...r, harvestDate: e.target.value })));
                }}
                className="flex-1 h-12 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-orange-600 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setHarvestDate(today);
                  setSourceRows((prev) => prev.map((r) => ({ ...r, harvestDate: today })));
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-extrabold text-slate-700 border border-slate-300"
              >
                Hôm nay
              </button>
            </div>
          </div>

          {/* 4. Tổng sản lượng lô (Tổng cộng từ các thửa nguồn) */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-300 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold text-orange-950 uppercase tracking-wide">
                4. Tổng sản lượng lô thu hoạch:
              </label>
              <div className="flex items-center gap-1">
                {['kg', 'tấn', 'con'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setLotUnit(u);
                      setSourceRows((prev) => prev.map((r) => ({ ...r, unit: u })));
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                      lotUnit === u ? 'bg-orange-600 text-white shadow-sm' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-orange-200">
              <span className="text-xs text-orange-800 font-bold">
                = Tổng đóng góp của {sourceRows.length} thửa ruộng nguồn:
              </span>
              <span className="text-3xl font-black text-orange-950">
                {totalYieldQuantity.toLocaleString()} <span className="text-lg font-bold">{lotUnit}</span>
              </span>
            </div>
          </div>

          {/* 5. Phân loại Loại 1 & Loại 2 (kiểm tra theo tổng lô) */}
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <span>⚖️</span>
                <span>Phân loại chất lượng lúc thu hoạch:</span>
              </span>
              <span className="text-[11px] text-slate-500 font-bold">
                (Loại 1 + Loại 2 ≤ Tổng lô)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khối lượng Loại 1 ({lotUnit}):
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
                  Khối lượng Loại 2 ({lotUnit}):
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
                  <span>Tổng Loại 1 + Loại 2 ({totalGrades} {lotUnit}) vượt quá tổng sản lượng ({totalYieldQuantity} {lotUnit})!</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-1">
                  <span>Đã phân loại: <strong>{totalGrades.toLocaleString()} {lotUnit}</strong> {totalYieldQuantity > 0 ? `(${((totalGrades / totalYieldQuantity) * 100).toFixed(0)}%)` : ''}</span>
                  <span>Khác: <strong>{Math.max(0, totalYieldQuantity - totalGrades).toLocaleString()} {lotUnit}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* 6. Tiêu chí chất lượng theo ngành hàng */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              6. Tiêu chí chất lượng ({currentQualityConfig?.categoryName || 'Nông sản VietGAP'}):
            </label>
            <input
              type="text"
              value={qualityMetric}
              onChange={(e) => setQualityMetric(e.target.value)}
              placeholder="VD: Độ ngọt 18° Brix, Độ ẩm 14.0%..."
              className="w-full h-12 px-4 rounded-2xl border-2 border-slate-300 text-sm font-medium text-slate-900 bg-slate-50 focus:border-orange-600 focus:outline-none"
            />
          </div>

          {/* 7. Ảnh nông sản thu hoạch */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
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
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              8. Ghi chú thêm:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border-2 border-slate-300 text-sm font-medium text-slate-900 bg-slate-50 focus:border-orange-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isGradeExceeded || totalYieldQuantity <= 0 || availableZonesForFarmer.length === 0}
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
