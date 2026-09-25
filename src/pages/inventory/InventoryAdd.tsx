import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { CounterInput } from '../../components/CounterInput';

export const InventoryAdd: React.FC = () => {
  const { addInventoryItem, currentHTX, goBack } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Giong' | 'PhanBon' | 'ThuocBVTV' | 'ThucAn' | 'BaoBi'>('PhanBon');
  const [stock, setStock] = useState(100);
  const [unit, setUnit] = useState('kg');
  const [unitPrice, setUnitPrice] = useState(15000);
  const [minStockAlert, setMinStockAlert] = useState(50);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên mặt hàng vật tư.');
      return;
    }

    addInventoryItem({
      htxId: currentHTX.id,
      name: name.trim(),
      category,
      stock,
      unit,
      unitPrice,
      minStockAlert,
      description: description.trim() || undefined,
    });


    alert(`Đã thêm mặt hàng "${name}" thành công!`);
    goBack();
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Thêm mặt hàng vật tư"
        voiceText="Bác kế toán hãy nhập tên mặt hàng, đơn vị tính và định mức tồn kho an toàn để bổ sung vào kho nhé."
      />

      <div className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              1. Tên mặt hàng vật tư: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Phân bón vi sinh Quế Lâm NPK..."
              className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              2. Nhóm phân loại vật tư: <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
            >
              <option value="Giong">🌾 Giống cây trồng / Con giống</option>
              <option value="PhanBon">🌱 Phân bón hữu cơ / Vi sinh</option>
              <option value="ThuocBVTV">🛡️ Chế phẩm sinh học / Thuốc BVTV</option>
              <option value="ThucAn">🌽 Thức ăn chăn nuôi</option>
              <option value="BaoBi">📦 Bao bì tem nhãn QR</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Đơn vị tính:
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, bao, gói, lít..."
                className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Đơn giá dự toán (đ):
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50"
                required
              />
            </div>
          </div>

          <div>
            <CounterInput
              label="3. Số lượng ban đầu trong kho:"
              value={stock}
              onChange={setStock}
              unit={unit}
              step={25}
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              4. Mức tồn kho tối thiểu (cảnh báo khi dưới mức này):
            </label>
            <input
              type="number"
              value={minStockAlert}
              onChange={(e) => setMinStockAlert(Number(e.target.value))}
              className="w-full h-12 px-4 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              5. Ghi chú quy cách & đặc tính:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quy cách đóng gói, nhà sản xuất..."
              className="w-full p-3 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:border-amber-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-amber-700 hover:bg-amber-800 active:scale-95 text-white text-xl font-extrabold shadow-lg shadow-amber-700/30 flex items-center justify-center gap-2 mt-4"
          >
            <span>💾</span>
            <span>LƯU MẶT HÀNG VẬT TƯ MỚI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
