import React, { useState, useMemo, useEffect } from 'react';
import { useApp, getCanonicalMemberName } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { CounterInput } from '../../components/CounterInput';
import { StockOwnerType } from '../../types';
import { getHarvestBalance, getStockAvailableQuantity, getProductStateBadge } from '../../utils/harvestBalance';

export const SalesAdd: React.FC = () => {
  const { addOrder, navigateTo, currentHTX, currentRole, currentUser, harvests, productStocks, handovers, orders, members, screenParams } = useApp();

  const isActingR03 = currentRole === 'R03';
  const isFarmer = currentRole === 'R06';

  // Danh sách các hộ trong HTX (cho R03 chọn khi bán thay hộ)
  const htxFarmers = useMemo(() => {
    const farmerIdSet = new Set<string>();
    harvests.filter((h) => h.htxId === currentHTX.id && h.ownerId && h.ownerId !== 'htx').forEach((h) => farmerIdSet.add(h.ownerId!));
    return members.filter((m) => m.htxId === currentHTX.id && (m.role === 'R06' || farmerIdSet.has(m.id)));
  }, [members, harvests, currentHTX.id]);

  // Xác định chủ hộ khi R03 bán thay
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(() => {
    if (screenParams?.harvestLotId) {
      const paramLot = harvests.find((h) => h.id === screenParams.harvestLotId);
      if (paramLot?.ownerId && paramLot.ownerId !== 'htx') return paramLot.ownerId;
    }
    if (isActingR03) {
      return htxFarmers[0]?.id || '';
    }
    return currentUser.id;
  });

  const selectedFarmer = useMemo(() => {
    return members.find((m) => m.id === selectedFarmerId) || htxFarmers.find((f) => f.id === selectedFarmerId);
  }, [members, htxFarmers, selectedFarmerId]);

  // Quyết định sellerType & sellerId: Không suy ra HTX nếu R03 bán thay hộ
  const sellerType: StockOwnerType = isActingR03 || isFarmer ? 'ho_dan' : 'htx';
  const sellerId = isActingR03 ? selectedFarmerId : isFarmer ? currentUser.id : currentHTX.id;
  const sellerName = isActingR03
    ? (selectedFarmer?.name || getCanonicalMemberName(selectedFarmerId, 'Hộ nông dân', members))
    : isFarmer
    ? getCanonicalMemberName(currentUser.id, currentUser.name, members)
    : currentHTX.name;

  // Lọc các lô thu hoạch thuộc quyền của bên bán
  const availableLots = useMemo(() => {
    return harvests.filter((h) => {
      if (h.htxId !== currentHTX.id) return false;
      if (sellerType === 'ho_dan') {
        return h.ownerId === sellerId || (isFarmer && h.ownerPhone === currentUser.phone);
      }
      return !h.ownerId || h.ownerId === 'htx' || h.ownerId === currentHTX.id;
    });
  }, [harvests, currentHTX.id, sellerType, sellerId, isFarmer, currentUser.phone]);

  const [selectedLotId, setSelectedLotId] = useState<string>(() => {
    if (screenParams?.harvestLotId) return screenParams.harvestLotId;
    return availableLots.length > 0 ? availableLots[0].id : '';
  });

  useEffect(() => {
    if (availableLots.length > 0 && (!selectedLotId || !availableLots.some((l) => l.id === selectedLotId))) {
      setSelectedLotId(availableLots[0].id);
    }
  }, [availableLots, selectedLotId]);

  const selectedLot = useMemo(() => {
    return availableLots.find((l) => l.id === selectedLotId);
  }, [availableLots, selectedLotId]);

  const [selectedStockId, setSelectedStockId] = useState<string>(screenParams?.stockItemId || '');

  const eligibleStocks = useMemo(() => {
    return productStocks.filter((stock) => {
      if (stock.htxId !== currentHTX.id) return false;
      if (stock.harvestLotId !== selectedLotId) return false;
      if (stock.quantity <= 0) return false;
      if (sellerType === 'ho_dan') {
        return stock.ownerId === sellerId && stock.holderId !== currentHTX.id;
      }
      return stock.holderId === currentHTX.id || (!stock.holderId && stock.ownerType === 'htx');
    });
  }, [productStocks, currentHTX.id, selectedLotId, sellerType, sellerId]);

  const selectedStock = eligibleStocks.find((stock) => stock.id === selectedStockId) || eligibleStocks[0];

  // Tồn khả dụng của dòng hoặc lô
  const maxAvailable = useMemo(() => {
    if (selectedStock) {
      return getStockAvailableQuantity(selectedStock, orders, handovers);
    }
    if (selectedLot) {
      if (sellerType === 'ho_dan') {
        return getHarvestBalance(selectedLot, handovers, orders).availableQuantity;
      }
    }
    return 0;
  }, [selectedLot, sellerType, selectedStock, handovers, orders]);

  const [customerName, setCustomerName] = useState('Bác Lê Văn Hùng (Thương lái Hưng Yên)');
  const [customerPhone, setCustomerPhone] = useState('0988 222 333');
  const [salesChannel, setSalesChannel] = useState<'thuong_lai' | 'hoi_cho' | 'ban_le' | 'sieu_thi' | 'truc_tiep'>('thuong_lai');
  const [productName, setProductName] = useState(
    screenParams?.productName || selectedStock?.variety || selectedLot?.variety || 'Nông sản VietGAP'
  );
  const [unit, setUnit] = useState(screenParams?.unit || selectedStock?.unit || selectedLot?.unit || 'kg');

  useEffect(() => {
    if (selectedStock) {
      setProductName(selectedStock.variety);
      setUnit(selectedStock.unit);
    } else if (selectedLot) {
      setProductName(selectedLot.variety || selectedLot.farmZoneName);
      setUnit(selectedLot.unit);
    }
  }, [selectedLot, selectedStock]);

  const [pricePerUnit, setPricePerUnit] = useState<number>(() => {
    if (currentHTX.id === 'dongtao') return 350000;
    if (currentHTX.id === 'quyetthang') return 35000;
    return 18000;
  });

  const [quantity, setQuantity] = useState<number>(() => {
    return maxAvailable > 0 ? Math.min(200, maxAvailable) : 50;
  });

  const totalAmount = pricePerUnit * quantity;
  const isExceeded = quantity > maxAvailable + 0.001;
  const [isDeliveredImmediately, setIsDeliveredImmediately] = useState<boolean>(true);

  // State xác nhận hộ nông dân đối với R03 thao tác thay
  const [confirmationMethod, setConfirmationMethod] = useState<'truc_tiep' | 'dien_thoai' | 'giay_uy_quyen'>('dien_thoai');
  const [confirmationNote, setConfirmationNote] = useState<string>('');
  const [saveAsDraft, setSaveAsDraft] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      alert('Số lượng bán phải lớn hơn 0.');
      return;
    }

    if (isExceeded) {
      alert(`Số lượng bán (${quantity} ${unit}) vượt quá lượng hàng còn tồn khả dụng (${maxAvailable} ${unit})!`);
      return;
    }

    if (isActingR03 && !saveAsDraft && !confirmationMethod) {
      alert('Vui lòng chọn phương thức xác nhận của hộ nông dân hoặc lưu nháp.');
      return;
    }

    const res = addOrder({
      htxId: currentHTX.id,
      sellerType,
      sellerId,
      sellerName,
      customerName,
      customerPhone,
      productName,
      harvestLotId: selectedLot?.id,
      stockItemId: selectedStock?.id,
      quantity,
      deliveredQuantity: saveAsDraft ? 0 : (isDeliveredImmediately ? quantity : 0),
      deliveryStatus: saveAsDraft ? 'chua_giao' : (isDeliveredImmediately ? 'da_giao' : 'chua_giao'),
      unit,
      pricePerUnit,
      totalAmount,
      salesChannel,
      status: saveAsDraft ? 'Mới' : (isDeliveredImmediately ? 'Hoàn thành' : 'Mới'),
      date: new Date().toISOString().split('T')[0],
      onBehalfOfFarmer: isActingR03,
      confirmationMethod: isActingR03 && !saveAsDraft ? confirmationMethod : undefined,
      confirmationTime: isActingR03 && !saveAsDraft ? new Date().toISOString() : undefined,
      confirmationNote: isActingR03 ? confirmationNote.trim() : undefined,
      isDraft: isActingR03 && saveAsDraft,
    });

    if (res.success) {
      if (isActingR03 && saveAsDraft) {
        alert(`Đã lưu bản nháp đơn bán hàng ${res.order?.code} thay cho hộ ${sellerName}! Đơn chờ hộ xác nhận.`);
      } else {
        alert(
          isDeliveredImmediately
            ? `Đã tạo đơn bán hàng ${res.order?.code} thành công và trừ tồn kho của hộ!`
            : `Đã tạo đơn bán hàng ${res.order?.code} thành công! Lượng hàng đã được giữ chỗ khả dụng.`
        );
      }
      navigateTo('sales_list');
    } else {
      alert(res.message || 'Lỗi khi tạo đơn hàng.');
    }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={isActingR03 ? 'Bán trực tiếp thay hộ' : 'Tạo đơn bán nông sản'}
        voiceText={
          isActingR03
            ? `Cán bộ ${currentUser.name} ghi nhận đơn bán trực tiếp thay cho hộ ${sellerName}. Doanh thu và tồn thuộc về hộ nông dân.`
            : 'Bác chọn khách hàng hoặc thương lái, kênh tiêu thụ và kiểm tra lượng tồn kho khả dụng trước khi xuất bán nhé.'
        }
      />

      <div className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          {/* Thông tin chủ thể bán & Người nhập thay */}
          {isActingR03 ? (
            <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 text-xs space-y-2">
              <div className="font-extrabold text-purple-950 flex items-center gap-1.5 text-sm">
                <span>✍️</span>
                <span>Cán bộ kỹ thuật R03 bán trực tiếp thay hộ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">Chủ hàng (Bên bán):</span>
                <span className="font-black text-purple-950 bg-white px-2.5 py-1 rounded-xl border border-purple-300">
                  {sellerName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600">Người nhập thay:</span>
                <span className="font-black text-slate-800">
                  {currentUser.name} (Cán bộ Giám sát Thu hoạch)
                </span>
              </div>

              {/* Lựa chọn hộ nếu chưa gán từ lô */}
              {!screenParams?.harvestLotId && htxFarmers.length > 0 && (
                <div className="pt-2 border-t border-purple-200">
                  <label className="block text-xs font-bold text-purple-900 mb-1">
                    Chọn hộ nông dân cần bán thay:
                  </label>
                  <select
                    value={selectedFarmerId}
                    onChange={(e) => setSelectedFarmerId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-purple-300 font-extrabold text-slate-900 bg-white focus:outline-none"
                  >
                    {htxFarmers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Xác nhận của hộ nông dân */}
              <div className="pt-2 border-t border-purple-200 space-y-2">
                <label className="block text-xs font-bold text-purple-950">
                  Phương thức hộ yêu cầu / xác nhận: <span className="text-red-500">*</span>
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
                          ? 'bg-purple-700 text-white border-purple-800 shadow-sm'
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
                    placeholder="VD: Bác An gọi nhờ ghi đơn bán 150kg cho lái Hùng..."
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsDraft}
                    onChange={(e) => setSaveAsDraft(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600"
                  />
                  <span className="text-xs font-bold text-amber-900">
                    Chưa có xác nhận của hộ (Lưu nháp chờ xác nhận, không trừ kho ngay)
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs flex justify-between items-center">
              <span className="font-bold text-purple-900">Bên bán hàng:</span>
              <span className="font-black text-purple-950 bg-white px-2.5 py-1 rounded-xl border border-purple-200">
                {sellerName} ({sellerType === 'ho_dan' ? 'Hộ nông dân bán trực tiếp' : 'HTX bán'})
              </span>
            </div>
          )}

          {/* 1. Khách hàng / Thương lái */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              1. Khách hàng / Thương lái thu mua: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Họ tên thương lái hoặc tên cửa hàng..."
              className="w-full h-12 px-3 rounded-2xl border-2 border-slate-300 font-bold text-sm text-slate-900 bg-slate-50 focus:border-purple-600 focus:outline-none mb-2"
            />
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Số điện thoại liên hệ..."
              className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50"
            />
          </div>

          {/* Kênh bán hàng */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Kênh bán hàng:
            </label>
            <select
              value={salesChannel}
              onChange={(e) => setSalesChannel(e.target.value as any)}
              className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:border-purple-600 focus:outline-none"
            >
              <option value="thuong_lai">Thương lái thu mua tại ruộng/chuồng</option>
              <option value="truc_tiep">Bán trực tiếp cho người tiêu dùng</option>
              <option value="hoi_cho">Hội chợ / Gian hàng xúc tiến OCOP</option>
              <option value="ban_le">Đại lý / Cửa hàng nông sản sạch</option>
              <option value="sieu_thi">Hệ thống Siêu thị liên kết</option>
            </select>
          </div>

          {/* 2. Chọn lô hàng xuất bán & Kiểm tra tồn */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-bold text-slate-800">
                2. Nguồn lô hàng xuất bán:
              </label>
              <span className="text-xs font-black text-emerald-800">
                Tồn khả dụng: {maxAvailable.toLocaleString()} {unit}
              </span>
            </div>

            {availableLots.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-900">
                Hộ này chưa có lô thu hoạch nào khả dụng để bán.
              </div>
            ) : (
              <select
                value={selectedLotId}
                onChange={(e) => { setSelectedLotId(e.target.value); setSelectedStockId(''); }}
                className="w-full h-12 px-3 rounded-2xl border-2 border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:border-purple-600 focus:outline-none"
              >
                {availableLots.map((l) => (
                  <option key={l.id} value={l.id}>
                    [{l.code}] - {l.variety || l.farmZoneName} ({l.yieldQuantity} {l.unit})
                  </option>
                ))}
              </select>
            )}

            {eligibleStocks.length > 0 && (
              <div className="mt-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {sellerType === 'ho_dan' ? 'Dòng tồn xuất bán tại hộ:' : 'Hàng HTX đang giữ:'}
                </label>
                <select
                  value={selectedStock?.id || ''}
                  onChange={(event) => setSelectedStockId(event.target.value)}
                  className="w-full h-12 px-3 rounded-2xl border-2 border-slate-300 text-xs font-bold text-slate-900 bg-white focus:border-purple-600 focus:outline-none"
                >
                  {eligibleStocks.map((stock) => {
                    const badge = getProductStateBadge(stock.state);
                    const avail = getStockAvailableQuantity(stock, orders, handovers);
                    return (
                      <option key={stock.id} value={stock.id}>
                        [{badge.shortLabel}] {stock.variety} • Khả dụng: {avail.toLocaleString()} {stock.unit}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* 3. Tên sản phẩm & Đơn vị */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên nông sản:
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:border-purple-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đơn vị:
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 text-center"
              />
            </div>
          </div>

          {/* 4. Số lượng và Đơn giá */}
          <div>
            <CounterInput
              label="3. Số lượng bán thực tế:"
              value={quantity}
              onChange={setQuantity}
              unit={unit}
              step={unit === 'con' ? 2 : unit === 'hộp' || unit === 'gói' ? 1 : 50}
              min={1}
            />
            {isExceeded && (
              <p className="text-xs text-rose-600 font-bold mt-1">
                ⚠️ Số lượng vượt quá tồn khả dụng ({maxAvailable.toLocaleString()} {unit})!
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Đơn giá bán (VNĐ/{unit}):
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(Number(e.target.value) || 0)}
              className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm font-black text-slate-900 bg-slate-50 focus:border-purple-600 focus:outline-none"
            />
          </div>

          {/* Amount Calculation Box */}
          <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-purple-900 block">Tổng giá trị đơn hàng:</span>
              <span className="text-2xl font-black text-purple-950">
                {totalAmount.toLocaleString()} đ
              </span>
            </div>
            <div className="text-right text-xs text-purple-700 font-semibold">
              {quantity.toLocaleString()} {unit} × {pricePerUnit.toLocaleString()} đ
            </div>
          </div>

          {/* Tùy chọn giao hàng ngay hay đặt trước */}
          <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isDeliveredImmediately}
                disabled={saveAsDraft}
                onChange={(e) => setIsDeliveredImmediately(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded accent-purple-600 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-purple-950 block">
                  Đã giao hàng và xuất kho ngay lúc tạo đơn
                </span>
                <span className="text-[11px] text-purple-800 font-medium">
                  {saveAsDraft
                    ? 'Bản nháp sẽ không xuất kho cho đến khi có xác nhận của hộ.'
                    : isDeliveredImmediately
                    ? '✓ Trừ ngay tồn kho vật lý của hộ và ghi nhận đơn Hoàn thành.'
                    : 'Đơn mới tạo sẽ chỉ giữ chỗ tồn khả dụng; tồn kho vật lý chỉ trừ khi thực hiện giao hàng.'}
                </span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isExceeded || quantity <= 0}
            className={`w-full py-4 rounded-2xl text-white text-lg font-black shadow-lg active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 ${
              isActingR03 && saveAsDraft
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                : 'bg-purple-700 hover:bg-purple-800 shadow-purple-700/30'
            }`}
          >
            <span>💾</span>
            <span>
              {isActingR03 && saveAsDraft
                ? 'LƯU ĐƠN NHÁP CHỜ HỘ XÁC NHẬN'
                : isActingR03
                ? 'XÁC NHẬN TẠO ĐƠN BÁN THAY HỘ'
                : 'XÁC NHẬN TẠO ĐƠN HÀNG'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
