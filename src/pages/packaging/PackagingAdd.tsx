import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { CounterInput } from '../../components/CounterInput';
import { canManageProcessing, canManagePackaging } from '../../utils/permissions';
import { HarvestProcessingModal } from '../../components/HarvestProcessingModal';

export const PackagingAdd: React.FC = () => {
  const { harvests, packages, addPackage, saveHarvestProcessing, navigateTo, currentHTX, screenParams, currentRole } = useApp();

  const prefilledHarvestId = screenParams?.harvestLotId || screenParams?.harvestLot?.id;

  const [selectedHarvestId, setSelectedHarvestId] = useState<string>(() => {
    if (prefilledHarvestId && harvests.some((h) => h.id === prefilledHarvestId)) {
      return prefilledHarvestId;
    }
    return harvests.length > 0 ? harvests[0].id : '';
  });

  useEffect(() => {
    if (prefilledHarvestId && harvests.some((h) => h.id === prefilledHarvestId)) {
      setSelectedHarvestId(prefilledHarvestId);
    } else if (harvests.length > 0 && !selectedHarvestId) {
      setSelectedHarvestId(harvests[0].id);
    }
  }, [harvests, prefilledHarvestId, selectedHarvestId]);

  const selectedHarvest = useMemo(() => {
    return harvests.find((h) => h.id === selectedHarvestId);
  }, [harvests, selectedHarvestId]);

  const isProcessed = selectedHarvest?.processingStatus === 'da_so_che' && !!selectedHarvest?.processingInfo?.outputQuantity;
  const isNoProcessing = selectedHarvest?.processingStatus === 'khong_so_che';

  // Khối lượng nguồn và đơn vị
  const totalSourceQuantity = isProcessed
    ? (selectedHarvest?.processingInfo?.outputQuantity || 0)
    : (selectedHarvest?.yieldQuantity || 0);

  const sourceUnit = isProcessed
    ? (selectedHarvest?.processingInfo?.unit || selectedHarvest?.unit || 'kg')
    : (selectedHarvest?.unit || 'kg');

  // Đã đóng gói các đợt trước từ lô này
  const packagesForLot = useMemo(() => {
    if (!selectedHarvest) return [];
    return packages.filter((p) => p.harvestLotId === selectedHarvest.id);
  }, [packages, selectedHarvest]);

  const alreadyPackaged = useMemo(() => {
    return packagesForLot.reduce((sum, p) => {
      const weight = p.netWeightPerPack || (sourceUnit === 'con' ? 1 : 1);
      return sum + p.packQuantity * weight;
    }, 0);
  }, [packagesForLot, sourceUnit]);

  const remainingAvailable = Math.max(0, totalSourceQuantity - alreadyPackaged);

  // Form Fields
  const [productName, setProductName] = useState<string>(() => {
    if (currentHTX.id === 'dongtao') return 'Gà Đông Tảo thuần chủng (Con hút chân không)';
    if (currentHTX.id === 'quyetthang') return 'Nhãn lồng tiến vua Hương Chi (Hộp 1kg)';
    return 'Gạo sạch Bắc Thơm An Ninh (Túi 5kg)';
  });

  // Tự động gợi ý tên sản phẩm khi đổi lô
  useEffect(() => {
    if (selectedHarvest) {
      if (selectedHarvest.unit === 'con') {
        setProductName(`${selectedHarvest.variety || 'Gà Đông Tảo'} (Con hút chân không)`);
        setUnit('Con');
        setNetWeightPerPack(1);
        setPackagingSpec('Con hút chân không');
      } else if (currentHTX.id === 'quyetthang') {
        setProductName(`${selectedHarvest.variety || 'Nhãn lồng Hương Chi'} (Hộp 1kg)`);
        setUnit('Hộp');
        setNetWeightPerPack(1);
        setPackagingSpec('Hộp quà 1kg');
      } else {
        setProductName(`Gạo sạch ${selectedHarvest.variety || 'Bắc Thơm'} An Ninh (Túi 5kg)`);
        setUnit('Túi');
        setNetWeightPerPack(5);
        setPackagingSpec('Túi chân không 5kg');
      }
    }
  }, [selectedHarvest, currentHTX.id]);

  const [quantity, setQuantity] = useState<number>(20);
  const [unit, setUnit] = useState<string>('Túi');
  const [packagingSpec, setPackagingSpec] = useState<string>('Túi chân không 5kg');
  const [netWeightPerPack, setNetWeightPerPack] = useState<number>(5);
  const [standard, setStandard] = useState<string>('VietGAP - OCOP 4 sao');

  const todayStr = new Date().toISOString().split('T')[0];
  const [createdDate, setCreatedDate] = useState<string>(todayStr);

  // Hạn sử dụng khuyến nghị không cố định (mặc định +6 tháng cho gạo/nhãn, +1 tháng cho gà)
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + (currentHTX.id === 'dongtao' ? 1 : 6));
    return d.toISOString().split('T')[0];
  });

  // Modal sơ chế
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);

  // Tính toán lượng đóng gói dự kiến
  const weightPerUnit = sourceUnit === 'con' ? 1 : (netWeightPerPack || 1);
  const totalAttemptedQuantity = quantity * weightPerUnit;
  const isQuantityExceeded = totalAttemptedQuantity > remainingAvailable + 0.001;

  // Validation ngày
  const dateError = useMemo(() => {
    if (!selectedHarvest) return null;
    if (createdDate < selectedHarvest.date) {
      return `Ngày đóng gói (${createdDate}) không được trước ngày thu hoạch (${selectedHarvest.date}).`;
    }
    if (isProcessed && selectedHarvest.processingInfo?.date && createdDate < selectedHarvest.processingInfo.date) {
      return `Ngày đóng gói (${createdDate}) không được trước ngày sơ chế (${selectedHarvest.processingInfo.date}).`;
    }
    if (expiryDate <= createdDate) {
      return 'Hạn sử dụng khuyến nghị phải sau ngày đóng gói.';
    }
    return null;
  }, [createdDate, expiryDate, selectedHarvest, isProcessed]);

  const hasPackagingPerm = canManagePackaging(currentRole);
  const hasProcessingPerm = canManageProcessing(currentRole);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHarvest) {
      alert('Vui lòng chọn lô thu hoạch.');
      return;
    }

    if (!hasPackagingPerm) {
      alert('Chỉ Cán bộ Kỹ thuật (R03) hoặc Ban Quản trị (R02) mới có quyền đóng gói và tạo mã QR.');
      return;
    }

    if (quantity <= 0) {
      alert('Số lượng thành phẩm phải lớn hơn 0.');
      return;
    }

    if (isQuantityExceeded) {
      alert(`Số lượng đóng gói (${totalAttemptedQuantity.toLocaleString()} ${sourceUnit}) vượt quá sản lượng khả dụng còn lại (${remainingAvailable.toLocaleString()} ${sourceUnit})!`);
      return;
    }

    if (dateError) {
      alert(dateError);
      return;
    }

    try {
      const createdPkg = addPackage({
        htxId: currentHTX.id,
        harvestLotId: selectedHarvest.id,
        harvestLotCode: selectedHarvest.code,
        processingLotId: selectedHarvest.processingInfo ? `sc-${selectedHarvest.id}` : undefined,
        processingLotCode: selectedHarvest.processingInfo ? `SC-${selectedHarvest.code}` : undefined,
        productName,
        packagingSpec,
        netWeightPerPack: weightPerUnit,
        netWeightUnit: sourceUnit,
        packQuantity: quantity,
        unit,
        createdDate,
        expiryDate,
        standard,
      });

      navigateTo('packaging_qr', { pkg: createdPkg });
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo mã sản phẩm đóng gói.');
    }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Đóng gói & Tạo mã QR"
        voiceText="Bác hãy chọn lô thu hoạch cần đóng gói, kiểm tra thông tin sơ chế và khối lượng khả dụng, sau đó bấm tạo tem mã QR nhé."
      />

      <div className="p-4 space-y-4">
        <form onSubmit={handleGenerate} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          {/* 1. Chọn Lô thu hoạch duy nhất */}
          <div className="space-y-2">
            <label className="block text-base font-bold text-slate-800">
              1. Chọn Lô thu hoạch nguồn: <span className="text-red-500">*</span>
            </label>

            {harvests.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 text-xs text-amber-900">
                Chưa có lô thu hoạch nào trong HTX. Vui lòng ghi nhận lô thu hoạch trước khi đóng gói.
              </div>
            ) : (
              <select
                value={selectedHarvestId}
                onChange={(e) => setSelectedHarvestId(e.target.value)}
                className="w-full h-14 px-3 rounded-2xl border-2 border-emerald-300 text-sm font-bold text-slate-900 bg-emerald-50/40 focus:border-emerald-600 focus:outline-none"
              >
                {harvests.map((h) => (
                  <option key={h.id} value={h.id}>
                    [{h.code}] - {h.farmZoneName} ({h.yieldQuantity} {h.unit}) {h.processingStatus === 'da_so_che' ? '• Đã sơ chế' : h.processingStatus === 'khong_so_che' ? '• Không sơ chế' : '• Chưa sơ chế'}
                  </option>
                ))}
              </select>
            )}

            {/* Thẻ thông tin định danh Lô thu hoạch (Req 5) */}
            {selectedHarvest && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Mã lô gắn tem:</span>
                  <span className="font-mono font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {selectedHarvest.code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Vùng canh tác & MSVT:</span>
                  <span className="font-extrabold text-slate-900">
                    {selectedHarvest.farmZoneName} {selectedHarvest.zoneCode ? `(${selectedHarvest.zoneCode})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Giống cây / sản phẩm:</span>
                  <span className="font-bold text-slate-900">{selectedHarvest.variety || 'Nông sản HTX'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Chủ hộ phụ trách:</span>
                  <span className="font-bold text-slate-900">{selectedHarvest.ownerName || 'Hộ thành viên'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Ngày thu hoạch:</span>
                  <span className="font-bold text-slate-900">{selectedHarvest.date}</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Trạng thái & Toàn bộ thông tin sơ chế đã lưu của lô (Req 5) */}
          {selectedHarvest && (
            <div className="p-4 bg-blue-50/60 rounded-2xl border-2 border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-extrabold text-blue-950 text-sm">
                  <span>⚙️</span>
                  <span>Thông tin Sơ chế của lô:</span>
                </div>
                {isProcessed ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                    ✓ Đã sơ chế
                  </span>
                ) : isNoProcessing ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                    Không sơ chế
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                    Chưa sơ chế
                  </span>
                )}
              </div>

              {isProcessed && selectedHarvest.processingInfo ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-blue-200">
                    <div>
                      <span className="text-slate-500 block">Ngày sơ chế:</span>
                      <strong className="text-slate-800">{selectedHarvest.processingInfo.date}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Phương pháp:</span>
                      <strong className="text-slate-800">{selectedHarvest.processingInfo.method}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-blue-200">
                      <span className="text-[10px] text-slate-500 block">Đầu vào:</span>
                      <span className="font-extrabold text-slate-900">
                        {selectedHarvest.processingInfo.inputQuantity.toLocaleString()} {sourceUnit}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-blue-200">
                      <span className="text-[10px] text-emerald-700 font-bold block">Đầu ra:</span>
                      <span className="font-extrabold text-emerald-700">
                        {selectedHarvest.processingInfo.outputQuantity.toLocaleString()} {sourceUnit}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-blue-200">
                      <span className="text-[10px] text-amber-700 font-bold block">Hao hụt:</span>
                      <span className="font-extrabold text-amber-700">
                        {selectedHarvest.processingInfo.lossRatePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : isNoProcessing ? (
                <p className="text-xs text-slate-600 font-medium">
                  Lô này được đánh dấu <strong>Không sơ chế</strong> (đóng gói trực tiếp từ lượng thu hoạch).
                </p>
              ) : (
                <p className="text-xs text-amber-900 font-medium">
                  Lô này <strong>Chưa sơ chế</strong>. Bác có thể bấm nút bên dưới để ghi nhận sơ chế, hoặc đóng gói trực tiếp.
                </p>
              )}

              {/* Nút mở cùng form sơ chế cho người có quyền (Req 5) */}
              {hasProcessingPerm && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsProcessingModalOpen(true)}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>✏️</span>
                    <span>{isProcessed ? 'Chỉnh sửa thông tin sơ chế' : 'Ghi nhận sơ chế ngay tại đây'}</span>
                  </button>
                  {!isNoProcessing && !isProcessed && (
                    <button
                      type="button"
                      onClick={() => {
                        saveHarvestProcessing(selectedHarvest.id, {
                          date: todayStr,
                          method: 'Không sơ chế',
                          inputQuantity: 0,
                          outputQuantity: selectedHarvest.yieldQuantity,
                          status: 'khong_so_che',
                        });
                      }}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs"
                    >
                      Bỏ qua sơ chế
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Khối lượng khả dụng để đóng gói (Req 7) */}
          {selectedHarvest && (
            <div className={`p-4 rounded-2xl border-2 space-y-1.5 ${
              remainingAvailable > 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-red-50 border-red-300 text-red-950'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>📦 Khối lượng khả dụng để đóng gói:</span>
                <span className="text-[11px] font-semibold text-slate-600">
                  {isProcessed ? 'Tính từ sản lượng sau sơ chế' : 'Tính từ sản lượng thu hoạch gốc'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-800">
                  {remainingAvailable.toLocaleString()} {sourceUnit}
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  (Tổng nguồn: {totalSourceQuantity.toLocaleString()} {sourceUnit} • Đã đóng: {alreadyPackaged.toLocaleString()} {sourceUnit})
                </span>
              </div>
            </div>
          )}

          {/* 4. Tên sản phẩm thương mại in trên nhãn (Req 6) */}
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              2. Tên sản phẩm in trên nhãn tem: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          {/* 5. Tiêu chuẩn & Quy cách bao bì */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu chuẩn dán nhãn:
              </label>
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-800 bg-slate-50"
              >
                <option value="VietGAP - OCOP 4 sao">VietGAP - OCOP 4 sao</option>
                <option value="Hữu cơ vi sinh">Hữu cơ vi sinh</option>
                <option value="Đặc sản Tiến Vua OCOP 4 sao">Đặc sản Tiến Vua OCOP 4 sao</option>
                <option value="VietGAP chuẩn Hưng Yên">VietGAP chuẩn Hưng Yên</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quy cách bao bì:
              </label>
              <input
                type="text"
                value={packagingSpec}
                onChange={(e) => setPackagingSpec(e.target.value)}
                placeholder="VD: Túi chân không 5kg, Hộp quà 1kg"
                className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-800 bg-slate-50"
              />
            </div>
          </div>

          {/* 6. Khối lượng thực của mỗi gói (Req 6 & 7) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khối lượng thực mỗi gói: <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={netWeightPerPack}
                  onChange={(e) => setNetWeightPerPack(Number(e.target.value) || 1)}
                  className="flex-1 h-12 px-3 rounded-xl border-2 border-slate-300 text-base font-extrabold text-slate-900 bg-slate-50"
                />
                <span className="font-bold text-sm text-slate-600 px-1">{sourceUnit}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đơn vị thành phẩm:
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-800 bg-slate-50"
              >
                <option value="Túi">Túi</option>
                <option value="Hộp">Hộp</option>
                <option value="Gói">Gói</option>
                <option value="Con">Con</option>
                <option value="Khay">Khay</option>
                <option value="Thùng">Thùng</option>
              </select>
            </div>
          </div>

          {/* 7. Số lượng thành phẩm */}
          <div>
            <CounterInput
              label="3. Số lượng gói / hộp cần dán tem QR:"
              value={quantity}
              onChange={setQuantity}
              unit={unit}
              step={10}
              min={1}
            />

            {/* Báo lượng đóng gói và so sánh với khả dụng */}
            <div className="mt-2 p-2.5 rounded-xl border text-xs flex items-center justify-between font-semibold bg-slate-50 border-slate-200">
              <span>Tổng lượng cần dùng: <strong>{totalAttemptedQuantity.toLocaleString()} {sourceUnit}</strong></span>
              <span>Còn lại sau đóng: <strong className={remainingAvailable - totalAttemptedQuantity < 0 ? 'text-red-600' : 'text-emerald-700'}>
                {Math.max(0, remainingAvailable - totalAttemptedQuantity).toLocaleString()} {sourceUnit}
              </strong></span>
            </div>
            {isQuantityExceeded && (
              <p className="mt-1.5 text-xs text-red-600 font-bold">
                ⚠️ Tổng lượng đóng gói ({totalAttemptedQuantity.toLocaleString()} {sourceUnit}) vượt quá lượng khả dụng ({remainingAvailable.toLocaleString()} {sourceUnit})!
              </p>
            )}
          </div>

          {/* 8. Ngày đóng gói & Hạn sử dụng khuyến nghị (Req 6 & 7) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày đóng gói: <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={createdDate}
                onChange={(e) => setCreatedDate(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-800 bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hạn sử dụng khuyến nghị: <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-800 bg-slate-50"
                required
              />
            </div>
          </div>

          {dateError && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 font-bold">
              ⚠️ {dateError}
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900">
            ℹ️ Hệ thống sẽ tự động gán mã truy xuất duy nhất nối liền từ Vùng trồng → Mùa vụ → Thu hoạch → Sơ chế → Tem gói QR.
          </div>

          <button
            type="submit"
            disabled={isQuantityExceeded || !!dateError || remainingAvailable <= 0}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xl font-extrabold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 mt-4"
          >
            <span>✨</span>
            <span>TỰ ĐỘNG SINH MÃ QR SẢN PHẨM</span>
          </button>
        </form>
      </div>

      {/* Modal Sơ chế chung */}
      {selectedHarvest && (
        <HarvestProcessingModal
          isOpen={isProcessingModalOpen}
          onClose={() => setIsProcessingModalOpen(false)}
          harvestLot={selectedHarvest}
        />
      )}
    </div>
  );
};
