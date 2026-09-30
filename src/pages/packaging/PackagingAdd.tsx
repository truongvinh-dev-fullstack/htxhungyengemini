import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { CounterInput } from '../../components/CounterInput';
import { canManagePackaging } from '../../utils/permissions';
import { getProductStateBadge, getStockItemAvailableQuantity } from '../../utils/harvestBalance';

export const PackagingAdd: React.FC = () => {
  const {
    harvests,
    productStocks,
    orders,
    handovers,
    processingLots,
    addPackage,
    navigateTo,
    currentHTX,
    screenParams,
    currentRole,
    currentUser,
  } = useApp();

  const paramStockItemId = screenParams?.stockItemId;
  const paramHarvestLotId = screenParams?.harvestLotId || screenParams?.harvestLot?.id;

  // Danh sách các dòng tồn có thể đóng gói (hàng thô hoặc đã sơ chế còn tồn khả dụng)
  const eligibleStocks = useMemo(() => {
    return productStocks.filter((s) => {
      if (s.htxId !== currentHTX.id) return false;
      if (s.state !== 'da_xu_ly' && s.state !== 'hang_tho') return false;
      if (!canManagePackaging(currentRole, s.ownerId, currentUser.id)) return false;
      const balance = getStockItemAvailableQuantity(s, orders, handovers);
      return balance.availableQuantity > 0;
    });
  }, [productStocks, currentHTX.id, currentRole, currentUser, orders, handovers]);

  // Danh sách lô thu hoạch dự phòng
  const availableHarvests = useMemo(() => {
    return harvests.filter((h) => {
      if (h.htxId !== currentHTX.id) return false;
      if (currentRole === 'R06') {
        return h.ownerId === currentUser.id || h.ownerPhone === currentUser.phone;
      }
      return true;
    });
  }, [harvests, currentHTX.id, currentRole, currentUser]);

  // State chọn dòng tồn nguồn
  const [selectedStockId, setSelectedStockId] = useState<string>(() => {
    if (paramStockItemId && productStocks.some((s) => s.id === paramStockItemId)) {
      return paramStockItemId;
    }
    if (paramHarvestLotId) {
      const match = eligibleStocks.find((s) => s.harvestLotId === paramHarvestLotId);
      if (match) return match.id;
    }
    return eligibleStocks.length > 0 ? eligibleStocks[0].id : '';
  });

  useEffect(() => {
    if (paramStockItemId && productStocks.some((s) => s.id === paramStockItemId)) {
      setSelectedStockId(paramStockItemId);
    } else if (paramHarvestLotId) {
      const match = eligibleStocks.find((s) => s.harvestLotId === paramHarvestLotId);
      if (match) setSelectedStockId(match.id);
    }
  }, [paramStockItemId, paramHarvestLotId, productStocks, eligibleStocks]);

  // Dòng tồn nguồn đang được chọn
  const activeStock = useMemo(() => {
    return productStocks.find((s) => s.id === selectedStockId);
  }, [productStocks, selectedStockId]);

  // Lô thu hoạch nguồn gốc tương ứng
  const selectedHarvest = useMemo(() => {
    if (activeStock) {
      return harvests.find((h) => h.id === activeStock.harvestLotId);
    }
    if (paramHarvestLotId) {
      return harvests.find((h) => h.id === paramHarvestLotId);
    }
    return availableHarvests.length > 0 ? availableHarvests[0] : undefined;
  }, [activeStock, harvests, paramHarvestLotId, availableHarvests]);

  // Đơn vị và lượng khả dụng của dòng nguồn (KHÔNG dùng allocation của lô nếu là hàng sau sơ chế)
  const sourceUnit = activeStock ? activeStock.unit : (selectedHarvest?.unit || 'kg');

  const stockBalance = useMemo(() => {
    if (activeStock) {
      return getStockItemAvailableQuantity(activeStock, orders, handovers);
    }
    return null;
  }, [activeStock, orders, handovers]);

  const availableQuantity = useMemo(() => {
    if (stockBalance) {
      return stockBalance.availableQuantity;
    }
    if (!selectedHarvest) return 0;
    return selectedHarvest.allocation?.remainingAvailable ?? selectedHarvest.yieldQuantity ?? 0;
  }, [stockBalance, selectedHarvest]);

  // Tùy chọn hàng bán tươi sống
  const [isLiveProduct, setIsLiveProduct] = useState<boolean>(() => {
    return sourceUnit === 'con' || selectedHarvest?.variety?.toLowerCase().includes('cá') || false;
  });

  // Form Fields
  const [productName, setProductName] = useState<string>(() => {
    if (activeStock) {
      if (activeStock.state === 'da_xu_ly') return `Gạo sạch ${activeStock.variety}`;
      return activeStock.variety;
    }
    if (currentHTX.id === 'dongtao') return 'Gà Đông Tảo thuần chủng';
    if (currentHTX.id === 'quyetthang') return 'Nhãn lồng tiến vua Hương Chi';
    return 'Gạo sạch Bắc Thơm An Ninh';
  });

  const [packagingSpec, setPackagingSpec] = useState<string>('Túi chân không 5kg');
  const [netWeightPerPack, setNetWeightPerPack] = useState<number>(5);
  const [quantity, setQuantity] = useState<number>(10);
  const [unit, setUnit] = useState<string>('Túi');
  const [standard, setStandard] = useState<string>('VietGAP - OCOP 4 sao');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [createdDate, setCreatedDate] = useState<string>(todayStr);

  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  });

  // Tự động gợi ý thông số theo loại sản phẩm
  useEffect(() => {
    if (activeStock) {
      const isLive = activeStock.unit === 'con' || activeStock.variety.toLowerCase().includes('cá');
      setIsLiveProduct(isLive);

      if (activeStock.state === 'da_xu_ly') {
        setProductName(`Gạo sạch ${activeStock.variety}`);
        setPackagingSpec('Túi chân không 5kg');
        setNetWeightPerPack(5);
        setUnit('Túi');
      } else if (isLive) {
        setProductName(activeStock.variety);
        setPackagingSpec(activeStock.unit === 'con' ? 'Vòng chân QR đeo gia cầm' : 'Thùng oxy giao tươi sống');
        setNetWeightPerPack(1);
        setUnit(activeStock.unit === 'con' ? 'Con' : 'Kg');
      } else if (currentHTX.id === 'quyetthang') {
        setProductName(`Nhãn lồng tươi ${activeStock.variety} (Thùng 10kg)`);
        setPackagingSpec('Thùng carton đục lỗ 10kg');
        setNetWeightPerPack(10);
        setUnit('Thùng');
      } else {
        setProductName(activeStock.variety);
        setPackagingSpec('Bao bì tiêu chuẩn 10kg');
        setNetWeightPerPack(10);
        setUnit('Bao');
      }
    }
  }, [activeStock, currentHTX.id]);

  // Tính toán tổng khối lượng cần dùng
  const weightPerPack = isLiveProduct && sourceUnit === 'con' ? 1 : (Number(netWeightPerPack) || 1);
  const totalAttemptedQuantity = quantity * weightPerPack;
  const isQuantityExceeded = totalAttemptedQuantity > availableQuantity + 0.001;

  // Lấy ngày sơ chế để kiểm tra logic ngày đóng gói
  const processingDate = useMemo(() => {
    if (!selectedHarvest) return undefined;
    const procLot = processingLots.find(
      (p) => p.id === activeStock?.processingLotId || p.harvestLotId === selectedHarvest.id
    );
    return (
      procLot?.date ||
      selectedHarvest.processingInfo?.date ||
      (activeStock?.state === 'da_xu_ly' ? activeStock.updatedAt.slice(0, 10) : undefined)
    );
  }, [selectedHarvest, processingLots, activeStock]);

  // Kiểm tra tính hợp lệ của ngày
  const dateError = useMemo(() => {
    if (selectedHarvest && createdDate < selectedHarvest.date) {
      return `Ngày đóng gói (${createdDate}) không được trước ngày thu hoạch (${selectedHarvest.date}).`;
    }
    if (activeStock?.state === 'da_xu_ly' && processingDate && createdDate < processingDate) {
      return `Ngày đóng gói (${createdDate}) không được trước ngày sơ chế (${processingDate}).`;
    }
    if (!isLiveProduct && expiryDate && expiryDate <= createdDate) {
      return 'Hạn sử dụng khuyến nghị phải sau ngày đóng gói.';
    }
    return null;
  }, [createdDate, expiryDate, selectedHarvest, activeStock, processingDate, isLiveProduct]);

  const hasPackagingPerm = canManagePackaging(
    currentRole,
    activeStock?.ownerId || selectedHarvest?.ownerId,
    currentUser.id
  );

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!selectedHarvest) {
      alert('Vui lòng chọn lô thu hoạch nguồn.');
      return;
    }

    if (!hasPackagingPerm) {
      alert('Bác không có quyền đóng gói hoặc cấp tem QR cho lô hàng này.');
      return;
    }

    if (quantity <= 0) {
      alert('Số lượng bao gói phải lớn hơn 0.');
      return;
    }

    if (isQuantityExceeded) {
      alert(
        `Khối lượng cần dùng (${totalAttemptedQuantity.toLocaleString()} ${sourceUnit}) vượt quá lượng khả dụng của dòng tồn (${availableQuantity.toLocaleString()} ${sourceUnit})!`
      );
      return;
    }

    if (dateError) {
      alert(dateError);
      return;
    }

    setIsSubmitting(true);
    try {
      const createdPkg = addPackage({
        htxId: currentHTX.id,
        harvestLotId: selectedHarvest.id,
        harvestLotCode: selectedHarvest.code,
        sourceStockItemId: activeStock?.id,
        sourceProductState: activeStock ? (activeStock.state === 'da_xu_ly' ? 'da_xu_ly' : 'hang_tho') : 'hang_tho',
        productName,
        packagingSpec,
        netWeightPerPack: weightPerPack,
        netWeightUnit: sourceUnit,
        packQuantity: quantity,
        unit,
        isLiveProduct,
        createdDate,
        expiryDate: isLiveProduct ? undefined : expiryDate,
        standard,
        ownerType: activeStock?.ownerType,
        ownerId: activeStock?.ownerId,
        ownerName: activeStock?.ownerName,
        holderId: activeStock?.holderId,
        holderName: activeStock?.holderName,
      });

      navigateTo('packaging_qr', { pkg: createdPkg });
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Lỗi khi tạo mã sản phẩm đóng gói.');
    }
  };

  const stateBadge = getProductStateBadge(activeStock?.state);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Đóng gói & Tạo tem QR"
        voiceText="Bác hãy kiểm tra dòng nông sản nguồn, định lượng số gói và phát hành tem QR nhé."
      />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <form onSubmit={handleGenerate} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-5">
          {/* 1. Chọn Dòng tồn nguồn hoặc Lô thu hoạch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-extrabold text-slate-800">
                1. Nguồn nông sản đóng gói: <span className="text-red-500">*</span>
              </label>
              {activeStock && (
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black border ${stateBadge.color}`}>
                  {stateBadge.label}
                </span>
              )}
            </div>

            {eligibleStocks.length > 0 ? (
              <select
                value={selectedStockId}
                onChange={(e) => setSelectedStockId(e.target.value)}
                className="w-full h-13 px-3 rounded-2xl border-2 border-emerald-400 text-sm font-bold text-slate-900 bg-emerald-50/50 focus:border-emerald-600 focus:outline-none"
              >
                {eligibleStocks.map((s) => {
                  const sBalance = getStockItemAvailableQuantity(s, orders, handovers);
                  const badge = getProductStateBadge(s.state);
                  return (
                    <option key={s.id} value={s.id}>
                      [{s.id}] {s.variety} · Chủ: {s.ownerType === 'htx' ? currentHTX.shortName : s.ownerName || 'Hộ chưa rõ'} · {badge.shortLabel} (Khả dụng: {sBalance.availableQuantity.toLocaleString()} {s.unit})
                    </option>
                  );
                })}
              </select>
            ) : availableHarvests.length > 0 ? (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 text-xs text-amber-900 font-semibold">
                Đang đóng gói trực tiếp từ lô thu hoạch: <strong>{selectedHarvest?.code}</strong>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 text-xs text-amber-900 font-semibold">
                Chưa có dòng tồn hoặc lô thu hoạch nào khả dụng để đóng gói.
              </div>
            )}

            {/* Thẻ định danh dòng tồn nguồn (Yêu cầu 2: Hiển thị đầy đủ thông tin dòng nguồn) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Lô thu hoạch gốc:</span>
                <span className="font-mono font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {selectedHarvest?.code || 'Chưa rõ'}
                </span>
              </div>

              {activeStock && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Mã dòng tồn nguồn:</span>
                  <span className="font-mono font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {activeStock.id}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Trạng thái nông sản:</span>
                <span className={`font-black px-2 py-0.5 rounded-full border text-[11px] ${stateBadge.color}`}>
                  {stateBadge.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Chủ sở hữu hợp pháp:</span>
                <strong className="text-slate-900">{activeStock?.ownerName || selectedHarvest?.ownerName || 'Hợp tác xã'}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Bên đang lưu giữ:</span>
                <strong className="text-slate-900">
                  {activeStock?.holderName || (activeStock?.ownerType === 'htx' ? currentHTX.name : activeStock?.ownerName) || currentHTX.name}
                </strong>
              </div>

              {activeStock?.locationName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Địa điểm kho:</span>
                  <span className="font-bold text-slate-700">{activeStock.locationName}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-emerald-800">
                  {activeStock?.state === 'da_xu_ly'
                    ? 'Lượng sau sơ chế còn khả dụng:'
                    : 'Lượng khả dụng để đóng gói:'}
                </span>
                <strong className="text-base font-black text-emerald-900">
                  {availableQuantity.toLocaleString()} {sourceUnit}
                </strong>
              </div>
            </div>
          </div>

          {/* 2. Tùy chọn Hàng tươi sống bán trực tiếp */}
          <div className="p-3.5 bg-sky-50 rounded-2xl border border-sky-200 flex items-center justify-between">
            <div className="pr-3">
              <span className="text-xs font-black text-sky-950 block">
                Nông sản tươi sống bán trực tiếp (Gà sống / Cá sống)
              </span>
              <p className="text-[11px] text-sky-800 mt-0.5 leading-snug">
                Không ép hạn sử dụng kín. Tem QR gắn trực tiếp qua vòng chân hoặc thẻ cá.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isLiveProduct}
              onChange={(e) => setIsLiveProduct(e.target.checked)}
              className="w-6 h-6 accent-sky-600 rounded-lg cursor-pointer"
            />
          </div>

          {/* 3. Tên thương phẩm in trên nhãn */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              2. Tên thương phẩm in trên tem QR: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full h-12 px-3 rounded-2xl border-2 border-slate-300 font-bold text-sm text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* 4. Quy cách & Khối lượng tịnh mỗi gói (Yêu cầu 3) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quy cách bao bì / túi:
              </label>
              <input
                type="text"
                value={packagingSpec}
                onChange={(e) => setPackagingSpec(e.target.value)}
                placeholder="VD: Túi chân không 5kg..."
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khối lượng tịnh ({sourceUnit}/gói): *
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                value={netWeightPerPack}
                onChange={(e) => setNetWeightPerPack(Number(e.target.value) || 0)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* 5. Số lượng bao gói & Tổng khối lượng tiêu hao (Yêu cầu 3) */}
          <div className="space-y-2 p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-emerald-950">
                3. Số lượng bao gói phát hành: <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-600 font-semibold">Đơn vị:</span>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="text-xs font-bold text-emerald-900 bg-white border border-emerald-300 rounded-lg px-2 py-1"
                >
                  <option value="Túi">Túi</option>
                  <option value="Hộp">Hộp</option>
                  <option value="Gói">Gói</option>
                  <option value="Thùng">Thùng</option>
                  <option value="Con">Con</option>
                </select>
              </div>
            </div>

            <CounterInput
              label=""
              value={quantity}
              onChange={setQuantity}
              unit={unit}
              step={1}
              min={1}
            />

            {/* Hiển thị ngay tổng khối lượng cần dùng = số gói × khối lượng tịnh (Yêu cầu 3) */}
            <div className="flex justify-between items-center pt-2 border-t border-emerald-200 text-xs">
              <span className="font-bold text-slate-700">
                Tổng khối lượng cần dùng ({quantity} {unit} × {netWeightPerPack} {sourceUnit}):
              </span>
              <strong className={`text-base font-black ${isQuantityExceeded ? 'text-red-700' : 'text-emerald-900'}`}>
                {totalAttemptedQuantity.toLocaleString()} {sourceUnit}
              </strong>
            </div>

            {isQuantityExceeded && (
              <div className="p-2.5 bg-red-50 border border-red-300 rounded-xl text-xs text-red-700 font-bold">
                ⚠️ Khối lượng cần dùng ({totalAttemptedQuantity.toLocaleString()} {sourceUnit}) vượt quá lượng khả dụng ({availableQuantity.toLocaleString()} {sourceUnit}) của dòng tồn này!
              </div>
            )}
          </div>

          {/* 6. Ngày đóng gói & Hạn sử dụng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày đóng gói: *
              </label>
              <input
                type="date"
                required
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              />
              {processingDate && (
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Ngày sơ chế: {processingDate}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isLiveProduct ? 'Hạn dùng (Tùy chọn):' : 'Hạn sử dụng khuyến nghị: *'}
              </label>
              <input
                type="date"
                required={!isLiveProduct}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {dateError && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold">
              ⚠️ {dateError}
            </div>
          )}

          {/* 7. Tiêu chuẩn chất lượng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu chuẩn chứng nhận in trên tem:
            </label>
            <input
              type="text"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Nút submit với bảo vệ submit 2 lần */}
          <button
            type="submit"
            disabled={isQuantityExceeded || quantity <= 0 || !!dateError || isSubmitting}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-base font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>🏷️</span>
            <span>{isSubmitting ? 'ĐANG TẠO MÃ...' : 'PHÁT HÀNH TEM QR TRUY XUẤT'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
