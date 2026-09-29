import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HarvestLot } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  harvestLot: HarvestLot;
  onSaved?: () => void;
}

export const HarvestProcessingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  harvestLot,
  onSaved,
}) => {
  const { saveHarvestProcessing, currentUser } = useApp();

  const [date, setDate] = useState<string>(
    harvestLot.processingInfo?.date || new Date().toISOString().split('T')[0]
  );
  const [method, setMethod] = useState<string>(
    harvestLot.processingInfo?.method ||
      (harvestLot.unit === 'con'
        ? 'Kiểm dịch thú y & Làm sạch hút chân không'
        : 'Xay xát tách trấu & sàng lọc phân loại')
  );
  const [inputQuantity, setInputQuantity] = useState<number>(
    harvestLot.processingInfo?.inputQuantity || harvestLot.yieldQuantity
  );
  const [outputQuantity, setOutputQuantity] = useState<number>(
    harvestLot.processingInfo?.outputQuantity ||
      (harvestLot.unit === 'con'
        ? Math.round(harvestLot.yieldQuantity * 0.92)
        : Math.round(harvestLot.yieldQuantity * 0.68))
  );
  const [notes, setNotes] = useState<string>(
    harvestLot.processingInfo?.notes || ''
  );
  const [operatorName, setOperatorName] = useState<string>(
    harvestLot.processingInfo?.operatorName || currentUser.name
  );

  // Reset form when modal opens or harvestLot changes
  const availableInputQuantity = harvestLot.allocation?.remainingAvailable ?? harvestLot.yieldQuantity;

  useEffect(() => {
    if (isOpen) {
      const avail = harvestLot.allocation?.remainingAvailable ?? harvestLot.yieldQuantity;
      setDate(new Date().toISOString().split('T')[0]);
      setMethod(
        harvestLot.unit === 'con'
          ? 'Kiểm dịch thú y & Làm sạch hút chân không'
          : harvestLot.variety?.toLowerCase().includes('lúa') || harvestLot.farmZoneName?.toLowerCase().includes('lúa')
          ? 'Xay xát tách trấu & sàng lọc phân loại gạo'
          : 'Sàng lọc phân loại & sấy nhiệt dẻo'
      );
      setInputQuantity(avail > 0 ? avail : harvestLot.yieldQuantity);
      setOutputQuantity(
        harvestLot.unit === 'con'
          ? Math.round((avail > 0 ? avail : harvestLot.yieldQuantity) * 0.92)
          : Math.round((avail > 0 ? avail : harvestLot.yieldQuantity) * 0.9)
      );
      setNotes('');
      setOperatorName(currentUser.name);
    }
  }, [isOpen, harvestLot, currentUser.name]);

  if (!isOpen) return null;

  // Tính toán hao hụt và tỷ lệ thu hồi theo yêu cầu (Req 4)
  const lossQuantity = Math.max(0, inputQuantity - outputQuantity);
  const lossRatePercent =
    inputQuantity > 0 ? Number(((lossQuantity / inputQuantity) * 100).toFixed(2)) : 0;
  const recoveryRatePercent =
    inputQuantity > 0 ? Number(((outputQuantity / inputQuantity) * 100).toFixed(2)) : 0;

  const isInputExceeded = inputQuantity > availableInputQuantity + 0.001;
  const isOutputExceeded = outputQuantity > inputQuantity;
  const isOutputInvalid = outputQuantity <= 0 || inputQuantity <= 0;

  const hasValidationError = isInputExceeded || isOutputExceeded || isOutputInvalid;

  const handleSave = () => {
    if (hasValidationError) {
      alert('Vui lòng kiểm tra lại số liệu sơ chế.');
      return;
    }

    const res = saveHarvestProcessing(harvestLot.id, {
      date,
      method,
      inputQuantity,
      outputQuantity,
      notes,
      operatorName,
      status: 'da_so_che',
    });

    if (res.success) {
      alert('Đã lưu thông tin sơ chế cho lô thu hoạch thành công!');
      onSaved?.();
      onClose();
    } else {
      alert(res.message || 'Lỗi khi lưu thông tin sơ chế.');
    }
  };

  const handleMarkNoProcessing = () => {
    if (
      window.confirm(
        'Bác có chắc chắn đánh dấu lô này "Không sơ chế" để đóng gói trực tiếp nông sản tươi?'
      )
    ) {
      const res = saveHarvestProcessing(harvestLot.id, {
        date,
        method: 'Không sơ chế (Đóng gói trực tiếp)',
        inputQuantity: 0,
        outputQuantity: harvestLot.yieldQuantity,
        status: 'khong_so_che',
      });
      if (res.success) {
        alert('Đã cập nhật trạng thái Không sơ chế cho lô thu hoạch.');
        onSaved?.();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-2 border-slate-200 shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                Ghi nhận & Sửa thông tin Sơ chế
              </h3>
              <p className="text-xs text-slate-500 font-semibold font-mono">
                Lô thu hoạch: {harvestLot.code} ({harvestLot.farmZoneName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        {/* Reminder Box Req 4 */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium space-y-1">
          <div className="font-bold flex items-center gap-1 text-amber-950">
            <span>ℹ️</span> Lưu ý quy tắc phân loại & sơ chế:
          </div>
          <p className="text-[11px] leading-relaxed">
            Khối lượng Loại 1 / Loại 2 (
            <strong>
              {harvestLot.grade1Quantity?.toLocaleString() || 0} /{' '}
              {harvestLot.grade2Quantity?.toLocaleString() || 0} {harvestLot.unit}
            </strong>
            ) là phân loại lúc thu hoạch, <strong>KHÔNG</strong> phải đầu ra sau sơ chế.
          </p>
          <p className="text-[11px] text-amber-800">
            Tổng sản lượng thu hoạch gốc: <strong>{harvestLot.yieldQuantity.toLocaleString()} {harvestLot.unit}</strong>
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-3.5 text-sm">
          {/* Ngày sơ chế */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              1. Ngày thực hiện sơ chế: <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 font-bold text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Phương pháp sơ chế */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              2. Nội dung / Phương pháp sơ chế: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="VD: Xay xát tách trấu, Làm sạch hút chân không, Sấy lạnh..."
              className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 font-medium text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Khối lượng đưa vào & Khối lượng đầu ra */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                3. Đưa vào sơ chế ({harvestLot.unit}): <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={availableInputQuantity}
                value={inputQuantity}
                onChange={(e) => setInputQuantity(Number(e.target.value) || 0)}
                className={`w-full h-12 px-3 rounded-xl border-2 font-extrabold text-base bg-white focus:outline-none ${
                  isInputExceeded ? 'border-red-500 text-red-700 bg-red-50' : 'border-slate-300 text-slate-900 focus:border-blue-600'
                }`}
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Tồn khả dụng: {availableInputQuantity.toLocaleString()} {harvestLot.unit}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. Sau sơ chế (Đầu ra) ({harvestLot.unit}): <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={inputQuantity}
                value={outputQuantity}
                onChange={(e) => setOutputQuantity(Number(e.target.value) || 0)}
                className={`w-full h-12 px-3 rounded-xl border-2 font-extrabold text-base bg-white focus:outline-none ${
                  isOutputExceeded || outputQuantity <= 0 ? 'border-red-500 text-red-700 bg-red-50' : 'border-slate-300 text-slate-900 focus:border-blue-600'
                }`}
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                (Đầu ra ≤ Đầu vào)
              </span>
            </div>
          </div>

          {/* Tự động tính: Hao hụt, Tỷ lệ hao hụt, Tỷ lệ thu hồi (Req 4) */}
          <div className="p-3.5 bg-blue-50/80 border-2 border-blue-200 rounded-2xl space-y-2">
            <div className="text-xs font-extrabold text-blue-950 flex items-center justify-between">
              <span>📊 Kết quả tự động tính toán:</span>
              <span className="text-[11px] text-blue-700">Công thức chuẩn</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-xl border border-blue-200">
                <span className="text-[11px] text-slate-500 block">Sản lượng đầu ra:</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  {outputQuantity.toLocaleString()} {harvestLot.unit}
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-200">
                <span className="text-[11px] text-slate-500 block">Hao hụt sơ chế:</span>
                <span className="text-sm font-extrabold text-amber-700">
                  {lossQuantity.toLocaleString()} {harvestLot.unit}
                </span>
                <span className="text-[10px] text-amber-600 font-bold block">({lossRatePercent}%)</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-200">
                <span className="text-[11px] text-slate-500 block">Tỷ lệ thu hồi:</span>
                <span className="text-sm font-extrabold text-blue-700">
                  {recoveryRatePercent}%
                </span>
                <span className="text-[10px] text-blue-600 font-medium block">thành phẩm</span>
              </div>
            </div>

            {/* Error notifications */}
            {isInputExceeded && (
              <p className="text-xs text-red-600 font-bold">
                ⚠️ Khối lượng đưa vào ({inputQuantity} {harvestLot.unit}) vượt quá sản lượng thu hoạch ({harvestLot.yieldQuantity} {harvestLot.unit})!
              </p>
            )}
            {isOutputExceeded && (
              <p className="text-xs text-red-600 font-bold">
                ⚠️ Khối lượng đầu ra ({outputQuantity} {harvestLot.unit}) không được lớn hơn đầu vào ({inputQuantity} {harvestLot.unit})!
              </p>
            )}
          </div>

          {/* Người phụ trách & Ghi chú */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Người thực hiện:
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border-2 border-slate-300 font-medium text-slate-800 bg-slate-50 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú sơ chế:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Độ ẩm, tỷ lệ tấm, nhiệt độ..."
                className="w-full h-11 px-3 rounded-xl border-2 border-slate-300 font-medium text-slate-800 bg-slate-50 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSave}
            disabled={hasValidationError}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 active:scale-95 text-white rounded-2xl font-extrabold text-base shadow flex items-center justify-center gap-2"
          >
            <span>💾</span>
            <span>LƯU THÔNG TIN SƠ CHẾ</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleMarkNoProcessing}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200"
            >
              Đóng gói trực tiếp (Không sơ chế)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold border border-slate-200"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
