import React, { useState } from 'react';
import { useApp, getCanonicalMemberName } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { ProductHandover } from '../../types';
import { canManageProcessing, canConfirmHandover, canManagePackaging, canViewHarvestLot } from '../../utils/permissions';
import { HarvestProcessingModal } from '../../components/HarvestProcessingModal';
import { ProductHandoverModal } from '../../components/ProductHandoverModal';
import { getHarvestBalance } from '../../utils/harvestBalance';

export const HarvestDetail: React.FC = () => {
  const {
    screenParams,
    goBack,
    navigateTo,
    diaries,
    farmZones,
    harvests,
    handovers,
    orders,
    members,
    currentHTX,
    currentRole,
    currentUser,
    qualityConfigs,
    generateLotQRCode,
    disputeProductHandover,
    confirmDoiSoatHandover,
  } = useApp();

  const lotFromParams =
    screenParams?.lot ||
    screenParams?.harvest ||
    (screenParams?.id && (screenParams?.yieldQuantity !== undefined || screenParams?.code) ? screenParams : undefined);

  const targetId =
    lotFromParams?.id ||
    screenParams?.lotId ||
    screenParams?.harvestLotId ||
    screenParams?.id ||
    screenParams?.code ||
    screenParams?.harvestLotCode ||
    (typeof screenParams === 'string' ? screenParams : undefined);

  // 1. Tìm trong danh sách harvests của HTX theo id hoặc code
  let lot = harvests.find(
    (h) =>
      (h.id === targetId || h.code === targetId) &&
      canViewHarvestLot(currentRole, h, currentHTX.id, currentUser.id, handovers)
  );

  // 2. Nếu tìm theo targetId mà chưa khớp htxId nghiêm ngặt, thử với candidate.htxId
  if (!lot && targetId) {
    const candidate = harvests.find((h) => h.id === targetId || h.code === targetId);
    if (
      candidate &&
      canViewHarvestLot(currentRole, candidate, candidate.htxId || currentHTX.id, currentUser.id, handovers)
    ) {
      lot = candidate;
    }
  }

  // 3. Fallback dùng lotFromParams nếu được truyền trực tiếp từ màn trước
  if (!lot && lotFromParams) {
    if (
      canViewHarvestLot(currentRole, lotFromParams, lotFromParams.htxId || currentHTX.id, currentUser.id, handovers) ||
      currentRole === 'R03' ||
      currentRole === 'R02'
    ) {
      lot = lotFromParams;
    }
  }

  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverToConfirm, setHandoverToConfirm] = useState<ProductHandover | null>(null);

  // Modal QR độc lập cho lô bán sống / hàng xá
  const [showLotQRModal, setShowLotQRModal] = useState<boolean>(false);
  const [lotQRUrl, setLotQRUrl] = useState<string>(lot?.qrCodeUrl || '');

  React.useEffect(() => {
    if (lot?.qrCodeUrl) {
      setLotQRUrl(lot.qrCodeUrl);
    }
  }, [lot?.qrCodeUrl]);

  // Modal khiếu nại đối soát
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [disputeHandoverId, setDisputeHandoverId] = useState<string>('');
  const [disputeText, setDisputeText] = useState<string>('');

  if (!lot) {
    return (
      <div className="pb-24 bg-slate-50 min-h-screen">
        <Header title="Chi tiết lô thu hoạch" showBack={true} />
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto">
            🚫
          </div>
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy hoặc không có quyền xem lô này</h3>
          <p className="text-sm text-slate-500">
            Theo quy định phân quyền, bạn chỉ có thể xem lô thu hoạch của chính mình, các lô thuộc HTX (đối với Cán bộ Kỹ thuật R03 / Ban Quản trị R02), hoặc lô đã gửi phiếu sang HTX.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigateTo('harvest_list')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-md active:scale-95"
            >
              Danh sách thu hoạch
            </button>
            <button
              onClick={goBack}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl font-bold active:scale-95"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nhật ký canh tác liên quan của thửa ruộng
  const relatedDiaries = diaries.filter((d) => d.htxId === lot.htxId && d.farmZoneId === lot.farmZoneId);

  // Danh sách phiếu giao nhận của lô này
  const lotHandovers = handovers.filter((h) => h.harvestLotId === lot.id);
  const balance = getHarvestBalance(lot, handovers, orders);

  const isOwner = currentUser.id === lot.ownerId || currentUser.phone === lot.ownerPhone;
  const hasProcessingPerm = canManageProcessing(currentRole, lot.ownerId, currentUser.id);
  const hasPackagingPerm = canManagePackaging(currentRole, lot.ownerId, currentUser.id);
  const canInspector = canConfirmHandover(currentRole);

  // Tính toán phân bổ
  const allocation = lot.allocation || {
    directSaleQuantity: 0,
    deliveredToHTXQuantity: 0,
    packagedAtFarmQuantity: 0,
    processedAtFarmQuantity: 0,
    remainingAvailable: balance.availableQuantity,
  };

  // Cấu hình chất lượng động
  const facilityType = farmZones.find((zone) => zone.id === lot.farmZoneId && zone.htxId === lot.htxId)?.facilityType;
  const qualityCategory = lot.qualityCategory || (
    facilityType === 'thua_ruong' ? 'lua_gao'
      : facilityType === 'chuong_nuoi' || facilityType === 'chuong_trai' ? 'ga_dongtao'
      : facilityType === 'long_ca' || facilityType === 'ao_nuoi' || facilityType === 'long_be' ? 'thuy_san'
      : 'nhan_long'
  );
  const qualityCriteria = qualityConfigs[qualityCategory]?.criteria || [];

  return (
    <div className="pb-28 bg-slate-50 min-h-screen">
      <Header
        title="Chi tiết lô thu hoạch"
        voiceText={`Chi tiết lô thu hoạch ${lot.code}, sản lượng ${lot.yieldQuantity} ${lot.unit} tại ${lot.farmZoneName}. Còn khả dụng ${balance.availableQuantity} ${lot.unit}.`}
      />

      <div className="p-4 space-y-4">
        {/* Photo and Info Card */}
        <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm space-y-4">
          <div className="relative aspect-video bg-slate-100">
            <img src={lot.photoUrl} alt={lot.code} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full font-bold font-mono">
              {lot.code}
            </div>
            {lot.zoneCode && (
              <div className="absolute top-3 right-3 bg-orange-600/90 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                {lot.zoneCode}
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Vùng / Cơ sở sản xuất
                </span>
                {lot.seasonName && (
                  <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                    🌱 {lot.seasonName}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5 leading-tight">
                {lot.farmZoneName}
              </h2>
              <div className="text-sm font-semibold text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                <span>Giống: <strong>{lot.variety || 'Nông sản địa phương'}</strong></span>
                {lot.ownerId && (
                  <>
                    <span>•</span>
                    <span>Chủ hộ: <strong>{getCanonicalMemberName(lot.ownerId, lot.ownerName, members)}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* DANH SÁCH THỬA RUỘNG NGUỒN CỦA LÔ */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🌾</span>
                  <span>Các vùng / thửa ruộng nguồn ({lot.sources?.length || 1} thửa):</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  Tổng: {lot.yieldQuantity.toLocaleString()} {lot.unit}
                </span>
              </div>
              <div className="space-y-2">
                {(lot.sources && lot.sources.length > 0 ? lot.sources : [{
                  farmZoneId: lot.farmZoneId,
                  farmZoneName: lot.farmZoneName,
                  zoneCode: lot.zoneCode,
                  cycleId: lot.cycleId || lot.seasonId || '',
                  cycleName: lot.seasonName || 'Vụ thu hoạch',
                  quantity: lot.yieldQuantity,
                  unit: lot.unit,
                  harvestDate: lot.date,
                }]).map((src, sIdx) => (
                  <div key={sIdx} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900">
                        {src.farmZoneName} {src.zoneCode ? `(${src.zoneCode})` : ''}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        🌱 Vụ: <strong>{src.cycleName}</strong> • Ngày thu: {src.harvestDate || lot.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-orange-950 block">
                        {src.quantity.toLocaleString()} {src.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {((src.quantity / lot.yieldQuantity) * 100).toFixed(0)}% lô
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BẢNG PHÂN BỔ SẢN LƯỢNG (4 Nhánh A-B-C-D) */}
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-orange-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                    Tổng sản lượng thu hoạch:
                  </span>
                  <div className="text-2xl font-black text-orange-950">
                    {lot.yieldQuantity.toLocaleString()} {lot.unit}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-800 block">Còn khả dụng tại hộ:</span>
                  <span className="text-xl font-black text-emerald-700">
                    {balance.availableQuantity.toLocaleString()} {lot.unit}
                  </span>
                </div>
              </div>

              {/* Chi tiết từng nhánh xuất hàng */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-orange-200/80 text-xs">
                <div className="p-2.5 bg-white/80 rounded-xl border border-orange-100">
                  <span className="text-slate-500 font-bold block">A. Bán trực tiếp:</span>
                  <span className="text-sm font-black text-slate-900">
                    {(allocation.directSaleQuantity || 0).toLocaleString()} {lot.unit}
                  </span>
                </div>
                <div className="p-2.5 bg-white/80 rounded-xl border border-orange-100">
                  <span className="text-slate-500 font-bold block">B. HTX thực nhận:</span>
                  <span className="text-sm font-black text-blue-700">
                    {balance.receivedQuantity.toLocaleString()} {lot.unit}
                  </span>
                </div>
                <div className="p-2.5 bg-white/80 rounded-xl border border-orange-100">
                  <span className="text-slate-500 font-bold block">C. Đã đóng bao gói:</span>
                  <span className="text-sm font-black text-emerald-800">
                    {(allocation.packagedAtFarmQuantity || 0).toLocaleString()} {lot.unit}
                  </span>
                </div>
                <div className="p-2.5 bg-white/80 rounded-xl border border-orange-100">
                  <span className="text-slate-500 font-bold block">D. Đưa vào sơ chế:</span>
                  <span className="text-sm font-black text-purple-700">
                    {(allocation.processedAtFarmQuantity || 0).toLocaleString()} {lot.unit}
                  </span>
                </div>
              </div>
              {balance.pendingQuantity > 0 && <p className="text-sm font-bold text-amber-900">⏳ Chờ kiểm nhận: {balance.pendingQuantity.toLocaleString()} {lot.unit}. Lượng này chưa tính là HTX đã nhận.</p>}
            </div>

            {/* BỐN NÚT HÀNH ĐỘNG HIỆN TRƯỜNG */}
            <div className="space-y-2 pt-1">
              {(currentRole !== 'R04' || lot.qrCodeUrl) && <>
              <span className="text-xs font-extrabold text-slate-600 block uppercase tracking-wide">
                {currentRole === 'R04' ? 'Mã QR lô nguồn:' : 'Thao tác phân bổ sản lượng:'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Bán trực tiếp (R06 bán chính chủ) */}
                {currentRole === 'R06' && <>
                <button
                  onClick={() =>
                    navigateTo('sales_add', {
                      harvestLotId: lot.id,
                      harvestLotCode: lot.code,
                      productName: lot.variety || lot.farmZoneName,
                      unit: lot.unit,
                      maxQuantity: balance.availableQuantity,
                      sellerType: 'ho_dan',
                    })
                  }
                  disabled={balance.availableQuantity <= 0}
                  className={`py-3 px-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    balance.availableQuantity > 0
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-base">🛒</span>
                  <span>Bán trực tiếp</span>
                </button>

                {/* 2. Giao hàng cho HTX (R06) */}
                <button
                  onClick={() => {
                    setHandoverToConfirm(null);
                    setIsHandoverModalOpen(true);
                  }}
                  disabled={balance.availableQuantity <= 0}
                  className={`py-3 px-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    balance.availableQuantity > 0
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-base">🚚</span>
                  <span>Giao cho HTX</span>
                </button>
                </>}

                {/* R03 thao tác thay hộ */}
                {currentRole === 'R03' && lot.ownerId && lot.ownerId !== 'htx' && <>
                <button
                  onClick={() =>
                    navigateTo('sales_add', {
                      harvestLotId: lot.id,
                      harvestLotCode: lot.code,
                      productName: lot.variety || lot.farmZoneName,
                      unit: lot.unit,
                      maxQuantity: balance.availableQuantity,
                      sellerType: 'ho_dan',
                      onBehalfOfFarmer: true,
                    })
                  }
                  disabled={balance.availableQuantity <= 0}
                  className={`py-3 px-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    balance.availableQuantity > 0
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-base">🛒</span>
                  <span>Bán trực tiếp thay hộ</span>
                </button>

                <button
                  onClick={() => {
                    setHandoverToConfirm(null);
                    setIsHandoverModalOpen(true);
                  }}
                  disabled={balance.availableQuantity <= 0}
                  className={`py-3 px-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    balance.availableQuantity > 0
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-base">🚚</span>
                  <span>Giao HTX thay hộ</span>
                </button>
                </>}

                {/* 3. Sơ chế mẻ mới */}
                {hasProcessingPerm && (
                  <button
                    onClick={() => setIsProcessingModalOpen(true)}
                    className="py-3 px-2 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span className="text-base">⚙️</span>
                    <span>Sơ chế mẻ mới</span>
                  </button>
                )}

                {/* 4. Đóng gói & QR */}
                {hasPackagingPerm && (
                  <button
                    onClick={() => navigateTo('packaging_add', { harvestLot: lot, harvestLotId: lot.id })}
                    className="py-3 px-2 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span className="text-base">📦</span>
                    <span>Đóng gói & QR</span>
                  </button>
                )}

                {/* 5. QR độc lập cho lô bán sống / hàng xá */}
                <button
                  onClick={() => {
                    if (currentRole !== 'R04') {
                      const res = generateLotQRCode(lot.id);
                      setLotQRUrl(res.qrCodeUrl);
                    } else {
                      setLotQRUrl(lot.qrCodeUrl || '');
                    }
                    setShowLotQRModal(true);
                  }}
                  className="col-span-2 py-3 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border-2 border-indigo-200 font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 shadow-xs"
                >
                  <span className="text-base">📱</span>
                  <span>Xem / In Mã QR Lô Nông sản (Bán sống / Hàng xá)</span>
                </button>
              </div>
              </>}
            </div>

            {/* Tiêu chí chất lượng & Phân loại */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold text-slate-600 block uppercase tracking-wide">
                Đánh giá chất lượng ({qualityConfigs[qualityCategory]?.categoryName || qualityConfigs[qualityCategory]?.productType || 'Nông sản'})
              </span>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Khối lượng Loại 1:</span>
                  <span className="text-base font-extrabold text-emerald-800">
                    {lot.grade1Quantity !== undefined ? lot.grade1Quantity.toLocaleString() : '—'} {lot.unit}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Khối lượng Loại 2:</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {lot.grade2Quantity !== undefined ? lot.grade2Quantity.toLocaleString() : '—'} {lot.unit}
                  </span>
                </div>
              </div>

              {qualityCriteria.length > 0 && (
                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-500 block mb-0.5">Tiêu chuẩn kiểm định:</span>
                  {qualityCriteria.map((c) => (
                    <div key={c.id} className="flex justify-between text-[11px]">
                      <span className="text-slate-600 font-medium">• {c.name}:</span>
                      <span className="font-bold text-slate-900">{c.standardValue || c.standardTarget}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Ngày thu hoạch</span>
                <span className="font-extrabold text-slate-900">{lot.date}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Mã số lô</span>
                <span className="font-extrabold text-slate-900 font-mono">{lot.code}</span>
              </div>
            </div>

            {lot.notes && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block mb-1">Ghi chú:</span>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{lot.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* PHIẾU GIAO NHẬN & ĐỐI SOÁT KIỂM NHẬN HTX */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>🚚</span>
              <span>Giao nhận & Đối soát với HTX</span>
            </h3>
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
              {lotHandovers.length} phiếu
            </span>
          </div>

          {lotHandovers.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              Chưa có phiếu giao nông sản cho HTX từ lô này.
            </p>
          ) : (
            <div className="space-y-2.5">
              {lotHandovers.map((h) => {
                const isPending = h.status === 'cho_kiem_nhan';
                const isConfirmed = h.status === 'da_kiem_nhan';
                return (
                  <div
                    key={h.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-900">{h.code}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isConfirmed ? '✓ Đã kiểm nhận' : isPending ? '⏳ Chờ kiểm nhận' : '✕ Từ chối'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span>Hình thức: </span>
                        <strong className="text-slate-900">
                          {h.handoverType === 'mua_dut' ? 'Mua đứt' : 'Ký gửi'}
                        </strong>
                      </div>
                      <div>
                        <span>Hàng: </span>
                        <strong className="text-slate-900">
                          {h.productState === 'da_dong_goi' ? 'Đã đóng bao bì' : 'Hàng thô'}
                        </strong>
                      </div>
                      <div>
                        <span>Hộ khai: </span>
                        <strong className="text-blue-900">{h.declaredQuantity} {h.unit}</strong>
                      </div>
                      <div>
                        <span>Thực nhận: </span>
                        <strong className="text-emerald-800">
                          {h.receivedQuantity !== undefined ? `${h.receivedQuantity} ${h.unit}` : 'Chưa cân'}
                        </strong>
                      </div>
                    </div>

                    {/* Đối soát & Chênh lệch */}
                    {isConfirmed && h.differenceQuantity !== undefined && (
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                        <span>
                          Chênh lệch cân đo: <strong>{h.differenceQuantity === 0 ? 'Khớp 100%' : `${h.differenceQuantity > 0 ? `Thừa ${h.differenceQuantity}` : `Thiếu ${-h.differenceQuantity}`} ${h.unit}`}</strong>
                        </span>
                        <span className={`px-2 py-0.5 rounded font-extrabold ${
                          h.doiSoatStatus === 'da_khop'
                            ? 'bg-emerald-100 text-emerald-800'
                            : h.doiSoatStatus === 'khieu_nai'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {h.doiSoatStatus === 'da_khop'
                            ? '✓ Đã khớp'
                            : h.doiSoatStatus === 'khieu_nai'
                            ? '⚠️ Khiếu nại'
                            : 'Chờ đối soát'}
                        </span>
                      </div>
                    )}

                    {/* Thanh toán & Công nợ */}
                    {(h.totalAmount || h.estimatedTotalAmount) && (
                      <div className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between text-[11px] text-emerald-950">
                        <span>Giá chốt: <strong>{(h.agreedUnitPrice || h.unitPrice || 0).toLocaleString()} đ/{h.unit}</strong></span>
                        <span>Đã thanh toán: <strong>{(h.paidAmount || 0).toLocaleString()} / {(h.totalAmount || h.estimatedTotalAmount || 0).toLocaleString()} đ</strong></span>
                      </div>
                    )}

                    {h.disputeNote && (
                      <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 text-red-900 text-xs">
                        <strong>Ý kiến hộ xã viên:</strong> "{h.disputeNote}"
                      </div>
                    )}

                    {h.qualityAssessment && (
                      <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-700">
                        <span className="font-bold text-slate-500">Đánh giá: </span>
                        {h.qualityAssessment}
                      </div>
                    )}

                    {canInspector && isPending && (
                      <button
                        onClick={() => {
                          setHandoverToConfirm(h);
                          setIsHandoverModalOpen(true);
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm"
                      >
                        <span>⚖️</span>
                        <span>Cân đối soát & Kiểm nhận ngay</span>
                      </button>
                    )}

                    {/* Nút gửi ý kiến & Chốt đối soát */}
                    {isConfirmed && (
                      <div className="flex gap-2 pt-1">
                        {currentRole === 'R06' && <button
                          onClick={() => {
                            setDisputeHandoverId(h.id);
                            setDisputeText(h.disputeNote || '');
                            setShowDisputeModal(true);
                          }}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                        >
                          💬 Gửi ý kiến cân
                        </button>}
                        {canInspector && h.doiSoatStatus !== 'da_khop' && (
                          <button
                            onClick={() => confirmDoiSoatHandover(h.id, 'Đã thống nhất số lượng tại kho')}
                            className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
                          >
                            ✓ Chốt đối soát
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LỊCH SỬ CÁC ĐỢT SƠ CHẾ NÔNG SẢN */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>⚙️</span>
              <span>Lịch sử các đợt sơ chế ({lot.processingHistory?.length || (lot.processingInfo ? 1 : 0)})</span>
            </h3>
            {lot.processingStatus === 'da_so_che' && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                ✓ Có sơ chế {lot.processingInfo?.inputQuantity?.toLocaleString()} {lot.unit} đầu vào
              </span>
            )}
          </div>

          {(!lot.processingHistory || lot.processingHistory.length === 0) && !lot.processingInfo ? (
            <p className="text-xs text-slate-500 italic py-2">
              Lô này chưa thực hiện sơ chế (hoặc giữ nguyên trạng nông sản tươi/sống).
            </p>
          ) : (
            <div className="space-y-3">
              {(lot.processingHistory || (lot.processingInfo ? [lot.processingInfo] : [])).map((proc, idx) => (
                <div key={proc.id || idx} className="p-3 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-950">Đợt sơ chế #{idx + 1}: {proc.method}</span>
                    <span className="text-[11px] text-slate-500">{proc.date}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-slate-500 block">Đầu vào:</span>
                      <strong className="text-slate-900">{proc.inputQuantity} {lot.unit}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-emerald-600 block">Đầu ra:</span>
                      <strong className="text-emerald-700">{proc.outputQuantity} {lot.unit}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-amber-600 block">Hao hụt:</span>
                      <strong className="text-amber-700">{proc.lossQuantity || 0} {lot.unit} ({proc.lossRatePercent || 0}%)</strong>
                    </div>
                  </div>
                  {proc.operatorName && (
                    <div className="text-[11px] text-slate-500">
                      Người thực hiện: <strong className="text-slate-700">{proc.operatorName}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NHẬT KÝ CANH TÁC LIÊN QUAN */}
        {currentRole !== 'R04' && <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <span>📖</span>
              <span>Nhật ký canh tác của thửa</span>
            </h3>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {relatedDiaries.length} bản ghi
            </span>
          </div>

          {relatedDiaries.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">Chưa có bản ghi nhật ký canh tác cho thửa này.</p>
          ) : (
            <div className="space-y-2">
              {relatedDiaries.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigateTo('diary_detail', { entry: d })}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">{d.workTypeName}</div>
                    <div className="text-[11px] text-slate-500">{d.date} • {d.createdBy}</div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700">Xem ➜</span>
                </div>
              ))}
            </div>
          )}
        </div>}

        <button
          onClick={goBack}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-2xl font-bold text-sm"
        >
          Quay lại danh sách
        </button>
      </div>

      {/* Modal Sơ chế mẻ mới */}
      <HarvestProcessingModal
        isOpen={isProcessingModalOpen}
        onClose={() => setIsProcessingModalOpen(false)}
        harvestLot={lot}
      />

      {/* Modal Giao nhận nông sản cho HTX & Đối soát */}
      <ProductHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        harvestLot={lot}
        handoverToConfirm={handoverToConfirm}
      />

      {/* MODAL MÃ QR ĐỘC LẬP CHO LÔ THU HOẠCH (BÁN SỐNG / HÀNG XÁ) */}
      {showLotQRModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider">
                Mã QR Truy xuất nguồn gốc Lô
              </span>
              <button
                onClick={() => setShowLotQRModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">{lot.variety || lot.farmZoneName}</h3>
              <p className="text-xs text-slate-500 font-bold">Mã lô: {lot.code} • {lot.yieldQuantity} {lot.unit}</p>
              <div className="inline-block px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-[11px] font-extrabold mt-1">
                🐟 Nông sản tươi sống / Hàng xá (Không qua đóng gói)
              </div>
            </div>

            {/* Khung QR Code */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 inline-block mx-auto shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  lotQRUrl || `https://hungyen-htx.vn/trace/lot/${lot.code}`
                )}`}
                alt={`QR ${lot.code}`}
                className="w-44 h-44 mx-auto rounded-xl object-contain bg-white p-2 border border-slate-200"
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Mã QR liên kết trực tiếp với dữ liệu nhật ký, cơ sở nuôi trồng và chứng nhận VietGAP. Không lộ SĐT cá nhân của hộ.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => alert('Đã gửi lệnh in tem nhãn lô đến máy in Bluetooth hiện trường!')}
                className="py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow active:scale-95"
              >
                🖨️ In tem nhãn
              </button>
              <button
                onClick={() => {
                  setShowLotQRModal(false);
                  navigateTo('trace_result', {
                    code: lot.code,
                    lot,
                  });
                }}
                className="py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow active:scale-95"
              >
                🔍 Xem trang QR ➜
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GỬI Ý KIẾN / KHIẾU NẠI ĐỐI SOÁT CÂN */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-base font-black text-slate-900">Ý kiến đối soát cân nhận</h3>
                <p className="text-xs text-slate-500">Phản hồi chênh lệch số lượng cho HTX</p>
              </div>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nội dung ý kiến của hộ xã viên:
              </label>
              <textarea
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                rows={4}
                placeholder="Ghi rõ lý do chênh lệch: Thao tác cân, trừ bì, hao hụt phơi ráo hoặc đề nghị cân lại..."
                className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-2xl"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (disputeHandoverId && disputeText.trim()) {
                    disputeProductHandover(disputeHandoverId, disputeText.trim());
                    setShowDisputeModal(false);
                  }
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-md"
              >
                Gửi ý kiến ➜
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
