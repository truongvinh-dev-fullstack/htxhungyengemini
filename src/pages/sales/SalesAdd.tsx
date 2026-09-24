import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { CounterInput } from '../../components/CounterInput';

export const SalesAdd: React.FC = () => {
  const { addOrder, navigateTo, speakText, currentHTX } = useApp();

  const sampleCustomers = [
    { name: 'Cửa hàng Nông sản Sạch Hà Nội', phone: '0912 345 999' },
    { name: 'Bác Lê Văn Hùng (Thương lái Hưng Yên)', phone: '0988 222 333' },
    { name: 'Chị Mai Lan (Hà Đông)', phone: '0903 456 789' },
  ];

  const sampleProducts = [
    { name: 'Gạo sạch Bắc Thơm An Ninh (Túi 5kg)', unit: 'Túi', price: 125000 },
    { name: 'Gạo thượng hạng ST25 Hưng Yên (Túi 5kg)', unit: 'Túi', price: 175000 },
    { name: 'Thóc tươi Bắc Thơm số 7', unit: 'kg', price: 11000 },
    { name: 'Gà Đông Tảo thuần chủng biếu Tết', unit: 'Con', price: 1500000 },
    { name: 'Nhãn lồng tiến vua Hương Chi (Hộp 2kg)', unit: 'Hộp', price: 180000 },
  ];

  const [customerName, setCustomerName] = useState(sampleCustomers[0].name);
  const [customerPhone, setCustomerPhone] = useState(sampleCustomers[0].phone);
  const [selectedProduct, setSelectedProduct] = useState(sampleProducts[0]);
  const [quantity, setQuantity] = useState(20);

  const totalAmount = selectedProduct.price * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addOrder({
      htxId: currentHTX.id,
      customerName,
      customerPhone,
      productName: selectedProduct.name,
      quantity,
      unit: selectedProduct.unit,
      pricePerUnit: selectedProduct.price,
      totalAmount,
      status: 'Mới',
      date: new Date().toISOString().split('T')[0],
    });

    speakText('Đơn hàng đã được tạo thành công! Bác có thể xem trước hóa đơn điện tử.');
    navigateTo('sales_list');
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Tạo đơn hàng mới"
        voiceText="Bác chọn khách hàng hoặc gõ tên mới, chọn sản phẩm và bấm nút cộng trừ để chỉnh số lượng đơn hàng nhé."
      />

      <div className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              1. Khách hàng / Thương lái thu mua: <span className="text-red-500">*</span>
            </label>
            <select
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                const found = sampleCustomers.find((c) => c.name === e.target.value);
                if (found) setCustomerPhone(found.phone);
              }}
              className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-purple-600 focus:outline-none mb-2"
            >
              {sampleCustomers.map((c, idx) => (
                <option key={idx} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Số điện thoại khách hàng..."
              className="w-full h-12 px-4 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-800 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              2. Chọn Sản phẩm nông sản: <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProduct.name}
              onChange={(e) => {
                const p = sampleProducts.find((item) => item.name === e.target.value);
                if (p) setSelectedProduct(p);
              }}
              className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-purple-600 focus:outline-none"
            >
              {sampleProducts.map((p, idx) => (
                <option key={idx} value={p.name}>
                  {p.name} — {p.price.toLocaleString()} đ/{p.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <CounterInput
              label="3. Số lượng bán:"
              value={quantity}
              onChange={setQuantity}
              unit={selectedProduct.unit}
              step={5}
              min={1}
            />
          </div>

          {/* Amount Calculation Box */}
          <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-purple-900 block">Tổng tiền đơn hàng:</span>
              <span className="text-2xl font-extrabold text-purple-950">
                {totalAmount.toLocaleString()} đ
              </span>
            </div>
            <div className="text-right text-xs text-purple-700">
              Đơn giá: {selectedProduct.price.toLocaleString()} đ/{selectedProduct.unit}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-purple-700 hover:bg-purple-800 active:scale-95 text-white text-xl font-extrabold shadow-lg shadow-purple-700/30 flex items-center justify-center gap-2 mt-4"
          >
            <span>💾</span>
            <span>XÁC NHẬN TẠO ĐƠN HÀNG</span>
          </button>
        </form>
      </div>
    </div>
  );
};
