import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { CounterInput } from '../../components/CounterInput';

export const StockTransactionAdd: React.FC = () => {
  const { screenParams, inventory, addStockTransaction, goBack, currentHTX } = useApp();
  const txType: 'import' | 'export' = screenParams?.type || 'export';

  const [selectedItemName, setSelectedItemName] = useState<string>(
    inventory.length > 0 ? inventory[0].name : ''
  );
  const selectedItem = inventory.find((i) => i.name === selectedItemName);
  const [quantity, setQuantity] = useState<number>(50);
  const [target, setTarget] = useState<string>(
    txType === 'export' ? 'Cấp cho hộ bác Nguyễn Văn An (Thôn An Xá)' : 'Công ty Cổ phần Tập đoàn Quế Lâm'
  );
  const [notes, setNotes] = useState<string>('Theo kế hoạch sản xuất vụ Xuân 2026');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Strict validation: Do not allow export exceeding current stock!
    if (txType === 'export' && selectedItem && quantity > selectedItem.stock) {
      setErrorMsg(
        `Không thể xuất kho! Số lượng yêu cầu xuất (${quantity} ${selectedItem.unit}) vượt quá số lượng tồn kho hiện có (${selectedItem.stock} ${selectedItem.unit}).`
      );

      return;
    }

    const success = addStockTransaction({
      type: txType,
      htxId: currentHTX.id,
      date: new Date().toISOString().split('T')[0],
      itemName: selectedItemName,
      quantity,
      unit: selectedItem ? selectedItem.unit : 'kg',
      recipientOrSupplier: target,
      notes,
    });

    if (success) {

      goBack();
    }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={txType === 'import' ? 'Lập phiếu Nhập kho' : 'Lập phiếu Xuất kho'}
        voiceText={`Lập phiếu ${txType === 'import' ? 'nhập kho vật tư mới' : 'xuất kho cấp cho thành viên'}. Lưu ý hệ thống không cho phép xuất vượt quá số lượng tồn kho.`}
      />

      <div className="p-4 space-y-4">
        {errorMsg && (
          <div className="p-4 bg-red-100 border-2 border-red-300 rounded-3xl text-red-900 text-sm font-bold flex items-start gap-2 animate-bounce">
            <span className="text-2xl">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              1. Chọn Loại vật tư: <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedItemName}
              onChange={(e) => setSelectedItemName(e.target.value)}
              className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
            >
              {inventory.map((i) => (
                <option key={i.id} value={i.name}>
                  {i.name} (Tồn: {i.stock} {i.unit})
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-600">Tồn kho hiện có:</span>
              <span className="font-extrabold text-base text-emerald-800">
                {selectedItem.stock} {selectedItem.unit}
              </span>
            </div>
          )}

          <div>
            <CounterInput
              label={`2. Số lượng ${txType === 'import' ? 'nhập' : 'xuất'}:`}
              value={quantity}
              onChange={setQuantity}
              unit={selectedItem ? selectedItem.unit : 'kg'}
              step={25}
              min={1}
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              3. {txType === 'import' ? 'Nhà cung cấp / Đối tác' : 'Hộ thành viên / Vùng nhận'}:
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              4. Ghi chú phiếu kho:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-13 px-4 rounded-2xl border-2 border-slate-300 text-base font-medium text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-4 rounded-2xl text-white text-xl font-extrabold shadow-lg active:scale-95 transition-all mt-4 ${
              txType === 'import'
                ? 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/30'
                : 'bg-amber-700 hover:bg-amber-800 shadow-amber-700/30'
            }`}
          >
            <span>💾</span>
            <span>{txType === 'import' ? 'XÁC NHẬN NHẬP KHO' : 'XÁC NHẬN XUẤT KHO'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
