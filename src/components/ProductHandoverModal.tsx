import React, { useEffect, useState, useMemo } from 'react';
import { useApp, getCanonicalMemberName } from '../context/AppContext';
import { HarvestLot, ProductHandover, ProductStockItem } from '../types';
import { canConfirmHandover } from '../utils/permissions';
import { getHarvestBalance, getStockItemAvailableQuantity } from '../utils/harvestBalance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  harvestLot?: HarvestLot | null;
  lot?: HarvestLot | null; // Tương thích với các nơi truyền lot={...}
  stockItem?: ProductStockItem | null;
  handoverToConfirm?: ProductHandover | null;
  onSuccess?: () => void;
}

export const ProductHandoverModal: React.FC<Props> = ({
  isOpen,
  onClose,
  harvestLot,
  lot,
  stockItem,
  handoverToConfirm,
  onSuccess,
}) => {
  const {
    currentUser,
    currentRole,
    currentHTX,
    harvests,
    productStocks,
    packages,
    members,
    handovers,
    orders,
    addProductHandover,
    confirmProductHandover,
    rejectProductHandover,
    addPackage,
    navigateTo,
  } = useApp();

  const isConfirming = !!handoverToConfirm;
  const isInspector = canConfirmHandover(currentRole);

  const targetLot = harvestLot || lot || harvests.find((h) => h.id === stockItem?.harvestLotId || h.id === handoverToConfirm?.harvestLotId);

  // Dòng tồn nguồn đang giao (nếu giao từ tồn)
  const [activeStockItem, setActiveStockItem] = useState<ProductStockItem | null>(stockItem || null);

  // Form ghi nhận nhanh hàng đã đóng gói (Req 3)
  const [showQuickPackaging, setShowQuickPackaging] = useState<boolean>(false);
  const [quickSourceStockId, setQuickSourceStockId] = useState<string>('');
  const [quickPackQty, setQuickPackQty] = useState<number>(10);
  const [quickNetWeight, setQuickNetWeight] = useState<number>(5);
  const [quickPackUnit, setQuickPackUnit] = useState<string>('túi');
  const [quickSpec, setQuickSpec] = useState<string>('Túi 5kg hút chân không');
  const [quickDate, setQuickDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [justPackagedNotice, setJustPackagedNotice] = useState<string | null>(null);

  // State lập phiếu giao
  const [handoverType, setHandoverType] = useState<'mua_dut' | 'ky_gui'>('mua_dut');
  const [declaredQuantity, setDeclaredQuantity] = useState<number>(0);
  const [transportPackaging, setTransportPackaging] = useState<string>('');
  const [agreedUnitPrice, setAgreedUnitPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State kiểm nhận
  const [receivedQuantity, setReceivedQuantity] = useState<number>(
    handoverToConfirm ? handoverToConfirm.declaredQuantity : 0
  );
  const [qualityAssessment, setQualityAssessment] = useState<string>(
    'Đạt tiêu chuẩn chất lượng VietGAP, nông sản đồng đều'
  );
  const [confirmNotes, setConfirmNotes] = useState<string>('');

  // R03 thao tác thay hộ
  const isActingR03 = currentRole === 'R03' && !!targetLot && targetLot.ownerId !== currentUser.id;
  const farmerOwnerId = targetLot?.ownerId || currentUser.id;
  const farmerOwnerName = targetLot
    ? getCanonicalMemberName(targetLot.ownerId, targetLot.ownerName, members)
    : getCanonicalMemberName(currentUser.id, currentUser.name, members);

  // Trạng thái xác nhận của hộ khi R03 thao tác thay
  const [confirmationMethod, setConfirmationMethod] = useState<'truc_tiep' | 'dien_thoai' | 'giay_uy_quyen'>('dien_thoai');
  const [confirmationNote, setConfirmationNote] = useState<string>('');
  const [saveAsDraft, setSaveAsDraft] = useState<boolean>(false);

  // Danh sách dòng tồn tại hộ của lô này (để chọn khi ghi nhận đóng gói)
  const availableSourcesAtFarm = useMemo(() => {
    if (!targetLot) return [];
    return productStocks.filter(
      (s) =>
        s.harvestLotId === targetLot.id &&
        s.htxId === currentHTX.id &&
        s.ownerId === farmerOwnerId &&
        s.holderId !== currentHTX.id &&
        (s.state === 'hang_tho' || s.state === 'da_xu_ly')
    );
  }, [productStocks, targetLot?.id, currentHTX.id, farmerOwnerId]);

  // Cập nhật khi stockItem thay đổi từ props
  useEffect(() => {
    if (stockItem) {
      setActiveStockItem(stockItem);
      setShowQuickPackaging(false);
    }
  }, [stockItem?.id]);

  // Tồn khả dụng tính theo dòng đang chọn hoặc theo hàng thô của lô
  const rawStockAtFarm = useMemo(() => {
    if (!targetLot) return undefined;
    return productStocks.find(
      (s) =>
        s.harvestLotId === targetLot.id &&
        s.htxId === currentHTX.id &&
        s.ownerId === farmerOwnerId &&
        s.holderId !== currentHTX.id &&
        s.state === 'hang_tho'
    );
  }, [productStocks, targetLot?.id, currentHTX.id, farmerOwnerId]);

  const availableQuantity = useMemo(() => {
    if (activeStockItem) {
      return getStockItemAvailableQuantity(activeStockItem, orders, handovers).availableQuantity;
    }
    if (rawStockAtFarm) {
      return getStockItemAvailableQuantity(rawStockAtFarm, orders, handovers).availableQuantity;
    }
    if (targetLot) {
      return getHarvestBalance(targetLot, handovers, orders).availableQuantity;
    }
    return 0;
  }, [activeStockItem, rawStockAtFarm, targetLot, orders, handovers]);

  const currentUnit = activeStockItem ? activeStockItem.unit : (targetLot?.unit || 'kg');

  useEffect(() => {
    if (availableQuantity > 0) {
      setDeclaredQuantity(availableQuantity);
    } else {
      setDeclaredQuantity(0);
    }
  }, [availableQuantity, activeStockItem?.id]);

  useEffect(() => {
    if (availableSourcesAtFarm.length > 0 && !quickSourceStockId) {
      setQuickSourceStockId(availableSourcesAtFarm[0].id);
    }
  }, [availableSourcesAtFarm, quickSourceStockId]);

  useEffect(() => {
    if (handoverToConfirm) {
      setReceivedQuantity(handoverToConfirm.declaredQuantity);
    }
  }, [handoverToConfirm?.id]);

  if (!isOpen || !targetLot) return null;

  // Lấy thông tin bao gói và QR nếu đang giao dòng đóng gói
  const matchingPkg = activeStockItem?.state === 'da_dong_goi'
    ? packages.find(
        (p) =>
          p.id === activeStockItem.packageId ||
          p.code === activeStockItem.packageCode ||
          p.harvestLotId === targetLot.id
      )
    : undefined;

  const netWeightPerPack = activeStockItem?.netWeightPerPack || matchingPkg?.netWeightPerPack || 1;
  const convertedTotalWeight = activeStockItem?.state === 'da_dong_goi'
    ? declaredQuantity * netWeightPerPack
    : declaredQuantity;

  // Xử lý tạo phiếu giao
  const handleCreateHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (declaredQuantity <= 0) {
      alert('Vui lòng nhập số lượng nông sản giao lớn hơn 0.');
      return;
    }

    if (declaredQuantity > availableQuantity + 0.001) {
      alert(`Số lượng giao (${declaredQuantity} ${currentUnit}) vượt quá tồn khả dụng (${availableQuantity} ${currentUnit}).`);
      return;
    }

    if (isActingR03 && !saveAsDraft && !confirmationMethod) {
      alert('Vui lòng chọn phương thức xác nhận của hộ nông dân (trực tiếp, điện thoại hoặc giấy ủy quyền), hoặc chọn Lưu nháp.');
      return;
    }

    setIsSubmitting(true);
    const priceNum = agreedUnitPrice ? Number(agreedUnitPrice.replace(/[^0-9]/g, '')) : undefined;

    // Yêu cầu 1: Khi mở từ chi tiết lô mà không có stockItem, trạng thái bắt buộc là hang_tho
    // Yêu cầu 4: Khi giao hàng sơ chế, giữ da_xu_ly
    const resolvedProductState: 'hang_tho' | 'da_xu_ly' | 'da_dong_goi' = activeStockItem
      ? activeStockItem.state
      : 'hang_tho';

    const res = addProductHandover({
      htxId: targetLot.htxId,
      harvestLotId: targetLot.id,
      harvestLotCode: targetLot.code,
      stockItemId: activeStockItem?.id,
      packageId: activeStockItem?.packageId || matchingPkg?.id,
      packageCode: activeStockItem?.packageCode || matchingPkg?.code,
      processingLotId: activeStockItem?.processingLotId || matchingPkg?.processingLotId,
      netWeightPerPack: activeStockItem?.netWeightPerPack || matchingPkg?.netWeightPerPack,
      totalNetWeight: resolvedProductState === 'da_dong_goi' ? convertedTotalWeight : undefined,
      senderId: farmerOwnerId,
      senderName: farmerOwnerName,
      handoverType,
      productState: resolvedProductState,
      packageSpec: resolvedProductState === 'da_dong_goi' ? (activeStockItem?.spec || matchingPkg?.packagingSpec) : undefined,
      transportPackaging: resolvedProductState === 'hang_tho' ? (transportPackaging.trim() || undefined) : undefined,
      declaredQuantity,
      unit: currentUnit,
      agreedUnitPrice: priceNum,
      variety: activeStockItem ? activeStockItem.variety : (targetLot.variety || targetLot.farmZoneName),
      date: new Date().toISOString().slice(0, 10),
      notes: notes.trim(),
      onBehalfOfFarmer: isActingR03,
      confirmationMethod: isActingR03 && !saveAsDraft ? confirmationMethod : undefined,
      confirmationTime: isActingR03 && !saveAsDraft ? new Date().toISOString() : undefined,
      confirmationNote: isActingR03 ? confirmationNote.trim() : undefined,
      isDraft: isActingR03 && saveAsDraft,
    });

    setIsSubmitting(false);

    if (res.success) {
      if (isActingR03 && saveAsDraft) {
        alert(`Đã lưu bản nháp phiếu giao HTX ${res.handover?.code} thành công! Phiếu đang chờ hộ nông dân xác nhận.`);
      } else {
        alert(`Đã lập phiếu giao hàng ${res.handover?.code} thành công! Thủ kho HTX sẽ kiểm nhận và đối soát sản lượng.`);
      }
      onSuccess?.();
      onClose();
    } else {
      alert(res.message || 'Lỗi khi tạo phiếu giao nông sản.');
    }
  };

  // Xử lý ghi nhận nhanh hàng đã đóng gói (Req 3)
  const handleRecordQuickPackaging = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSourceStockId) {
      alert('Vui lòng chọn dòng nông sản nguồn để đóng gói.');
      return;
    }

    const sourceStock = productStocks.find((s) => s.id === quickSourceStockId);
    if (!sourceStock) {
      alert('Không tìm thấy dòng nông sản nguồn.');
      return;
    }

    const sourceAvail = getStockItemAvailableQuantity(sourceStock, orders, handovers).availableQuantity;
    const neededWeight = quickPackQty * quickNetWeight;

    if (quickPackQty <= 0) {
      alert('Số gói phải lớn hơn 0.');
      return;
    }
    if (quickNetWeight <= 0) {
      alert('Khối lượng tịnh mỗi gói phải lớn hơn 0.');
      return;
    }
    if (neededWeight > sourceAvail + 0.001) {
      alert(`Khối lượng cần dùng (${neededWeight} ${sourceStock.unit}) vượt quá lượng khả dụng của dòng nguồn (${sourceAvail} ${sourceStock.unit})!`);
      return;
    }

    try {
      // Ghi sự kiện đóng gói, trừ tồn dòng nguồn, tạo dòng tồn đóng gói (Req 3: Không tạo QR giả)
      const newPkg = addPackage({
        htxId: targetLot.htxId,
        harvestLotId: targetLot.id,
        harvestLotCode: targetLot.code,
        sourceStockItemId: sourceStock.id,
        sourceProductState: sourceStock.state === 'da_xu_ly' ? 'da_xu_ly' : 'hang_tho',
        productName: sourceStock.variety || targetLot.variety || 'Nông sản đóng gói',
        packagingSpec: quickSpec,
        netWeightPerPack: quickNetWeight,
        netWeightUnit: sourceStock.unit || 'kg',
        packQuantity: quickPackQty,
        unit: quickPackUnit,
        createdDate: quickDate,
        qrStatus: 'chua_phat_hanh', // "QR chưa phát hành / chờ duyệt"
        standard: 'Tiêu chuẩn cơ sở HTX',
        ownerType: sourceStock.ownerType,
        ownerId: sourceStock.ownerId,
        ownerName: sourceStock.ownerName,
        holderId: sourceStock.holderId,
        holderName: sourceStock.holderName,
      });

      // Lấy dòng tồn đóng gói vừa tạo trong productStocks
      // addPackage trả về newPkg, packageId của stock tương ứng là newPkg.id
      // Tạo tham chiếu tạm cho UI
      const mockCreatedStock: ProductStockItem = {
        id: `stock-pkg-${Date.now()}`,
        htxId: targetLot.htxId,
        harvestLotId: targetLot.id,
        harvestLotCode: targetLot.code,
        variety: sourceStock.variety || targetLot.variety || 'Nông sản đóng gói',
        ownerType: sourceStock.ownerType,
        ownerId: sourceStock.ownerId,
        ownerName: sourceStock.ownerName,
        locationName: sourceStock.locationName || `Kho hộ ${currentUser.name}`,
        state: 'da_dong_goi',
        quantity: quickPackQty,
        unit: quickPackUnit,
        spec: quickSpec,
        sourceStockItemId: sourceStock.id,
        sourceProductState: sourceStock.state === 'da_xu_ly' ? 'da_xu_ly' : 'hang_tho',
        packageId: newPkg.id,
        packageCode: newPkg.code,
        netWeightPerPack: quickNetWeight,
        totalNetWeight: neededWeight,
        updatedAt: new Date().toISOString(),
      };

      setActiveStockItem(mockCreatedStock);
      setShowQuickPackaging(false);
      setDeclaredQuantity(quickPackQty);
      setJustPackagedNotice(
        `✅ Đã ghi nhận đóng gói ${quickPackQty} ${quickPackUnit} (tổng ${neededWeight} kg) từ dòng nguồn ${sourceStock.state === 'da_xu_ly' ? 'Đã sơ chế' : 'Hàng thô'}! Dòng tồn này đã được chọn để lập phiếu giao HTX.`
      );
    } catch (err: any) {
      alert(err.message || 'Lỗi khi ghi nhận đóng gói.');
    }
  };

  // Xác nhận kiểm nhận
  const handleConfirmHandover = () => {
    if (!handoverToConfirm) return;
    if (receivedQuantity <= 0) {
      alert('Vui lòng nhập sản lượng thực nhận hợp lệ.');
      return;
    }

    const res = confirmProductHandover(
      handoverToConfirm.id,
      receivedQuantity,
      qualityAssessment,
      confirmNotes
    );

    if (res.success) {
      alert('Đã kiểm nhận và nhập kho nông sản cho HTX thành công! Tồn kho HTX đã được cập nhật.');
      onSuccess?.();
      onClose();
    } else {
      alert(res.message || 'Lỗi khi kiểm nhận phiếu.');
    }
  };

  // Từ chối kiểm nhận
  const handleRejectHandover = () => {
    if (!handoverToConfirm) return;
    const reason = prompt('Nhập lý do từ chối nhận hàng (để hoàn trả lại hộ):', 'Nông sản không đạt tiêu chuẩn kỹ thuật');
    if (!reason) return;

    const res = rejectProductHandover(handoverToConfirm.id, reason);
    if (res.success) {
      alert('Đã từ chối phiếu giao. Sản lượng đã được hoàn lại cho hộ.');
      onSuccess?.();
      onClose();
    } else {
      alert(res.message || 'Lỗi khi từ chối phiếu.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black tracking-tight">
              {isConfirming
                ? 'Kiểm nhận & Đối soát hàng giao HTX'
                : showQuickPackaging
                ? '📦 Ghi nhận hàng đã đóng gói tại hộ'
                : 'Giao nông sản cho Hợp tác xã'}
            </h3>
            <p className="text-xs text-blue-100 font-medium">
              Lô thu hoạch: {targetLot.code} • {targetLot.farmZoneName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isConfirming && handoverToConfirm ? (
            /* Luồng kiểm nhận của Thủ kho / Quản lý */
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-600">Mã phiếu:</span>
                  <span className="text-blue-900 font-mono">{handoverToConfirm.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Hộ giao hàng:</span>
                  <span className="font-extrabold text-slate-800">{handoverToConfirm.senderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Hình thức:</span>
                  <span className="font-bold text-slate-900">
                    {handoverToConfirm.handoverType === 'mua_dut' ? 'Bán đứt cho HTX' : 'Ký gửi HTX bán hộ'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tình trạng hàng:</span>
                  <span className="font-bold text-slate-900">
                    {handoverToConfirm.productState === 'da_dong_goi'
                      ? `📦 Đã đóng bao gói (${handoverToConfirm.packageSpec || 'Thùng/gói'})`
                      : handoverToConfirm.productState === 'da_xu_ly'
                      ? '⚙️ Hàng đã sơ chế (chưa đóng gói)'
                      : '🌾 Hàng thô sau thu hoạch'}
                  </span>
                </div>
                {handoverToConfirm.stockItemId && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mã dòng tồn xuất:</span>
                    <span className="font-mono font-bold text-blue-900">{handoverToConfirm.stockItemId}</span>
                  </div>
                )}
                {handoverToConfirm.packageCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mã lô đóng gói:</span>
                    <span className="font-mono font-bold text-emerald-900">{handoverToConfirm.packageCode}</span>
                  </div>
                )}
                {handoverToConfirm.transportPackaging && (
                  <div className="flex justify-between text-amber-900">
                    <span>Bao bì vận chuyển:</span>
                    <strong className="font-bold">{handoverToConfirm.transportPackaging}</strong>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1 border-t border-blue-200">
                  <span className="font-bold text-blue-950">Sản lượng hộ khai báo:</span>
                  <span className="font-black text-blue-700">
                    {handoverToConfirm.declaredQuantity.toLocaleString()} {handoverToConfirm.unit}
                    {handoverToConfirm.totalNetWeight ? ` (~ ${handoverToConfirm.totalNetWeight} kg)` : ''}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Số lượng thực nhận sau khi cân đo ({handoverToConfirm.unit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={receivedQuantity}
                  onChange={(e) => setReceivedQuantity(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-blue-600 text-lg font-black text-slate-900 focus:outline-none"
                />
                {receivedQuantity !== handoverToConfirm.declaredQuantity && (
                  <p className="text-xs text-amber-700 font-bold mt-1.5 bg-amber-50 p-2 rounded-xl border border-amber-200">
                    ⚠️ Chênh lệch: {handoverToConfirm.declaredQuantity - receivedQuantity > 0
                      ? `Thiếu ${handoverToConfirm.declaredQuantity - receivedQuantity} ${handoverToConfirm.unit} so với hộ khai báo (sẽ tự động hoàn tồn lại cho hộ).`
                      : `Thừa ${receivedQuantity - handoverToConfirm.declaredQuantity} ${handoverToConfirm.unit}.`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Đánh giá chất lượng thực tế *
                </label>
                <select
                  value={qualityAssessment}
                  onChange={(e) => setQualityAssessment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border-2 border-slate-200 text-sm font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Đạt tiêu chuẩn loại 1 (VietGAP, đồng đều, mẫu mã đẹp)">
                    Đạt tiêu chuẩn loại 1 (VietGAP, đồng đều, mẫu mã đẹp)
                  </option>
                  <option value="Đạt tiêu chuẩn loại 2 (Thương phẩm tiêu thụ bình thường)">
                    Đạt tiêu chuẩn loại 2 (Thương phẩm tiêu thụ bình thường)
                  </option>
                  <option value="Đạt chuẩn hàng tươi sống, cá khỏe/gà hoạt bát">
                    Đạt chuẩn hàng tươi sống, cá khỏe / gà hoạt bát
                  </option>
                  <option value="Đã kiểm tra bao bì quy cách, tem nhãn nguyên vẹn">
                    Đã kiểm tra bao bì quy cách, tem nhãn nguyên vẹn
                  </option>
                  <option value="Chất lượng trung bình, có tỷ lệ hao hụt tự nhiên">
                    Chất lượng trung bình, có tỷ lệ hao hụt tự nhiên
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Ghi chú kiểm nhận / Biên bản bàn giao
                </label>
                <textarea
                  rows={2}
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  placeholder="Ghi chú thêm về điều kiện vận chuyển, độ ẩm, tạp chất..."
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleRejectHandover}
                  className="w-1/3 py-3 rounded-2xl border-2 border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs"
                >
                  Từ chối nhận
                </button>
                <button
                  type="button"
                  onClick={handleConfirmHandover}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-600/30"
                >
                  Xác nhận thực nhận
                </button>
              </div>
            </div>
          ) : showQuickPackaging ? (
            /* Luồng Ghi nhận nhanh hàng đã đóng gói (Yêu cầu 3) */
            <form onSubmit={handleRecordQuickPackaging} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>ℹ️</span>
                  <span>Bác đã đóng bao bì/gói thành phẩm ngoài đời thực?</span>
                </div>
                <p className="text-emerald-900 leading-relaxed text-[11px]">
                  Hãy ghi nhận số lượng đã đóng gói vào hệ thống trước. Ứng dụng sẽ trừ đúng dòng nguồn và tạo dòng thành phẩm để bác lập phiếu giao HTX ngay sau đây.
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  1. Chọn nguồn nông sản dùng để đóng gói *
                </label>
                <div className="space-y-2">
                  {availableSourcesAtFarm.length === 0 ? (
                    <div className="p-3 bg-slate-100 rounded-2xl text-xs text-slate-500 text-center">
                      Không tìm thấy dòng tồn thô hoặc sơ chế khả dụng của lô này.
                    </div>
                  ) : (
                    availableSourcesAtFarm.map((src) => {
                      const avail = getStockItemAvailableQuantity(src, orders, handovers).availableQuantity;
                      const isSelected = quickSourceStockId === src.id;
                      return (
                        <div
                          key={src.id}
                          onClick={() => setQuickSourceStockId(src.id)}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{src.state === 'da_xu_ly' ? '⚙️ Hàng đã sơ chế' : '🌾 Hàng thô'}</span>
                              <span className="text-[11px] font-mono text-slate-500">{src.id}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-normal">
                              {src.spec || src.variety}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-sm text-emerald-800">
                              {avail.toLocaleString()} {src.unit}
                            </span>
                            <span className="block text-[10px] text-slate-400">khả dụng</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    2. Số gói / hộp đã đóng *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quickPackQty}
                    onChange={(e) => setQuickPackQty(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 text-base font-black text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    3. Đơn vị đóng gói *
                  </label>
                  <select
                    value={quickPackUnit}
                    onChange={(e) => setQuickPackUnit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="túi">Túi</option>
                    <option value="hộp">Hộp</option>
                    <option value="gói">Gói</option>
                    <option value="thùng">Thùng</option>
                    <option value="bao">Bao</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    4. Khối lượng tịnh / gói (kg) *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={quickNetWeight}
                    onChange={(e) => setQuickNetWeight(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 text-base font-black text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    5. Ngày đóng gói *
                  </label>
                  <input
                    type="date"
                    required
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  6. Quy cách đóng gói *
                </label>
                <input
                  type="text"
                  required
                  value={quickSpec}
                  onChange={(e) => setQuickSpec(e.target.value)}
                  placeholder="VD: Túi 5kg hút chân không, Thùng 10kg..."
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Tổng khối lượng tịnh nguồn sẽ trừ:</span>
                  <span className="text-amber-950 font-black text-sm">
                    {(quickPackQty * quickNetWeight).toLocaleString()} kg
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  ⚠️ Tem QR truy xuất: Lô đóng gói tại hộ sẽ ở trạng thái <strong>“QR chưa phát hành / chờ duyệt”</strong> (không tạo mã QR giả) và hộ vẫn giao cho HTX bình thường.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickPackaging(false)}
                  className="w-1/3 py-3 rounded-2xl border-2 border-slate-300 text-slate-700 font-bold text-xs"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md shadow-emerald-700/30"
                >
                  XÁC NHẬN ĐÓNG GÓI & LẬP PHIẾU GIAO
                </button>
              </div>
            </form>
          ) : (
            /* Luồng lập phiếu giao của Hộ */
            <form onSubmit={handleCreateHandover} className="space-y-4">
              {/* Banner khi cán bộ R03 thao tác thay hộ */}
              {isActingR03 && (
                <div className="p-3.5 bg-blue-50 border-2 border-blue-200 rounded-2xl text-xs space-y-2">
                  <div className="font-extrabold text-blue-950 flex items-center gap-1.5 text-sm">
                    <span>✍️</span>
                    <span>Cán bộ kỹ thuật R03 lập phiếu giao HTX thay hộ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">Chủ hàng (Bên giao):</span>
                    <span className="font-black text-blue-900">{farmerOwnerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">Người nhập thay:</span>
                    <span className="font-black text-slate-800">{currentUser.name} (Cán bộ Kỹ thuật)</span>
                  </div>

                  <div className="pt-2 border-t border-blue-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Phương thức hộ xác nhận / yêu cầu: <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'dien_thoai', label: '📞 Điện thoại' },
                        { id: 'truc_tiep', label: '🤝 Trực tiếp' },
                        { id: 'giay_uy_quyen', label: '📄 Giấy ủy quyền' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setConfirmationMethod(m.id as any);
                            setSaveAsDraft(false);
                          }}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                            confirmationMethod === m.id && !saveAsDraft
                              ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        Ghi chú xác nhận / bằng chứng:
                      </label>
                      <input
                        type="text"
                        value={confirmationNote}
                        onChange={(e) => setConfirmationNote(e.target.value)}
                        placeholder="VD: Hộ gọi lúc 9h sáng nhờ gửi 250kg..."
                        className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none"
                      />
                    </div>

                    <label className="flex items-center gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAsDraft}
                        onChange={(e) => setSaveAsDraft(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="text-xs font-bold text-amber-900">
                        Chưa có xác nhận của hộ (Lưu nháp chờ xác nhận, không gửi kiểm nhận ngay)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {justPackagedNotice && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-950 flex items-center justify-between">
                  <span>{justPackagedNotice}</span>
                  <button
                    type="button"
                    onClick={() => setJustPackagedNotice(null)}
                    className="text-emerald-800 font-bold ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Tóm tắt tình trạng nguồn đang xuất giao */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                  <span className="text-blue-900 font-extrabold">Trạng thái nông sản giao:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-700 text-white">
                    {activeStockItem?.state === 'da_dong_goi'
                      ? '📦 Đã đóng gói'
                      : activeStockItem?.state === 'da_xu_ly'
                      ? '⚙️ Đã sơ chế'
                      : '🌾 Hàng thô sau thu hoạch'}
                  </span>
                </div>

                {activeStockItem ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Mã dòng tồn tại hộ:</span>
                      <span className="font-mono font-bold text-blue-900">{activeStockItem.id}</span>
                    </div>
                    {activeStockItem.state === 'da_dong_goi' && (
                      <>
                        {activeStockItem.packageCode && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Mã bao gói:</span>
                            <span className="font-mono font-bold text-slate-900">{activeStockItem.packageCode}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-600">Quy cách bao gói:</span>
                          <span className="font-bold text-slate-800">{activeStockItem.spec || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Trạng thái tem QR:</span>
                          <span className="font-bold text-emerald-700">
                            {matchingPkg?.qrCodeUrl ? '✅ Đã phát hành tem QR' : '⚠️ QR chưa phát hành / chờ duyệt'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Định lượng net/gói:</span>
                          <span className="font-bold text-slate-800">{netWeightPerPack} kg / {activeStockItem.unit}</span>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-[11px] text-blue-900 leading-relaxed">
                    Đang lập phiếu từ <strong>Lô thu hoạch {targetLot.code}</strong>.
                    Phiếu này dành cho <strong>hàng thô chưa qua sơ chế/đóng gói</strong>.
                  </div>
                )}

                <div className="flex justify-between pt-1 border-t border-blue-200">
                  <span className="text-blue-950 font-bold">Tồn khả dụng dòng này:</span>
                  <span className="font-black text-blue-900 text-sm">
                    {availableQuantity.toLocaleString()} {currentUnit}
                  </span>
                </div>
              </div>

              {/* Nút điều hướng / Ghi nhận đóng gói nếu mở trực tiếp từ lô mà không có stockItem */}
              {!activeStockItem && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 text-xs">
                  <div className="font-bold text-amber-900">
                    Bác muốn giao hàng đã qua sơ chế hoặc đóng bao bì?
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowQuickPackaging(true)}
                      className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-center shadow-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <span>📦</span>
                      <span>Ghi nhận đã đóng gói</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigateTo('product_stock_list', { filterLotId: targetLot.id });
                      }}
                      className="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-center shadow-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <span>🚚</span>
                      <span>Chọn tồn sơ chế/gói</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hình thức bàn giao */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Hình thức bàn giao *
                  </label>
                  <select
                    value={handoverType}
                    onChange={(e) => setHandoverType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="mua_dut">Bán đứt cho HTX</option>
                    <option value="ky_gui">Ký gửi HTX bán giúp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Tình trạng hàng hóa
                  </label>
                  <div className="px-3 py-2.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-extrabold text-slate-800 flex items-center">
                    {activeStockItem?.state === 'da_dong_goi'
                      ? '📦 Đã đóng bao bì'
                      : activeStockItem?.state === 'da_xu_ly'
                      ? '⚙️ Đã sơ chế'
                      : '🌾 Hàng thô'}
                  </div>
                </div>
              </div>

              {/* Yêu cầu 1: Bao bì vận chuyển cho hàng thô */}
              {(!activeStockItem || activeStockItem.state === 'hang_tho') && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Bao bì vận chuyển (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={transportPackaging}
                    onChange={(e) => setTransportPackaging(e.target.value)}
                    placeholder="VD: 15 bao tải × 10 kg, sọt tre chở xe máy..."
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    ℹ️ Chỉ mô tả phương tiện / vỏ chứa chở hàng đến HTX; trạng thái nông sản vẫn là hàng thô.
                  </p>
                </div>
              )}

              {/* Số lượng bàn giao */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-extrabold text-slate-700">
                    Số lượng bàn giao ({currentUnit}) *
                  </label>
                  <span className="text-[11px] font-bold text-slate-500">
                    Tối đa: {availableQuantity.toLocaleString()} {currentUnit}
                  </span>
                </div>
                <input
                  type="number"
                  min="0.1"
                  max={availableQuantity}
                  step="any"
                  required
                  value={declaredQuantity}
                  onChange={(e) => setDeclaredQuantity(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-blue-600 text-lg font-black text-slate-900 focus:outline-none"
                />

                {/* Yêu cầu 2: Quy đổi khối lượng tịnh để cân đối soát khi giao hàng đóng gói */}
                {activeStockItem?.state === 'da_dong_goi' && (
                  <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-bold flex items-center justify-between">
                    <span>Khối lượng quy đổi để cân / đối soát:</span>
                    <span className="text-sm font-black text-emerald-800">
                      {convertedTotalWeight.toLocaleString()} kg ({declaredQuantity} {currentUnit} × {netWeightPerPack} kg)
                    </span>
                  </div>
                )}
              </div>

              {handoverType === 'mua_dut' && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Đơn giá thỏa thuận mua đứt (VNĐ/{currentUnit})
                  </label>
                  <input
                    type="text"
                    value={agreedUnitPrice}
                    onChange={(e) => setAgreedUnitPrice(e.target.value)}
                    placeholder="VD: 35,000 hoặc để trống theo biểu giá HTX"
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Ghi chú giao hàng
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú về địa điểm hẹn cân, giờ xe chở đến..."
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || availableQuantity <= 0}
                  className={`w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-lg active:scale-95 transition-all ${
                    isActingR03 && saveAsDraft
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                  } disabled:bg-slate-200 disabled:text-slate-400`}
                >
                  {isSubmitting
                    ? 'ĐANG XỬ LÝ...'
                    : isActingR03 && saveAsDraft
                    ? 'LƯU BẢN NHÁP CHỜ HỘ XÁC NHẬN'
                    : 'GỬI PHIẾU GIAO CHO HTX'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
