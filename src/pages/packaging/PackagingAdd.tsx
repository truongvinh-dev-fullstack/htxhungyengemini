import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { CounterInput } from '../../components/CounterInput';

export const PackagingAdd: React.FC = () => {
  const { harvests, addPackage, navigateTo, currentHTX, speakText } = useApp();

  const [selectedHarvestId, setSelectedHarvestId] = useState<string>(
    harvests.length > 0 ? harvests[0].id : ''
  );
  const [productName, setProductName] = useState<string>(
    currentHTX.id === 'dongtao'
      ? 'Gà Đông Tảo thuần chủng (Con hút chân không)'
      : currentHTX.id === 'quyetthang'
      ? 'Nhãn lồng tiến vua Hương Chi (Hộp 2kg)'
      : 'Gạo sạch Bắc Thơm An Ninh (Túi 5kg)'
  );
  const [quantity, setQuantity] = useState<number>(50);
  const [unit, setUnit] = useState<string>('Túi');
  const [standard, setStandard] = useState<string>('VietGAP - OCOP 4 sao');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const createdPkg = addPackage({
      htxId: currentHTX.id,
      harvestLotId: selectedHarvestId,
      productName,
      packQuantity: quantity,
      unit,
      createdDate: new Date().toISOString().split('T')[0],
      expiryDate: '2027-03-24',
      standard,
    });

    speakText('Đã sinh mã QR thành công cho sản phẩm. Bác có thể in tem hoặc chia sẻ qua Zalo.');
    navigateTo('packaging_qr', { pkg: createdPkg });
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Đóng gói & Tạo mã QR"
        voiceText="Bác hãy chọn lô thu hoạch cần đóng gói, dùng nút cộng trừ để chỉnh số lượng gói, sau đó bấm nút xanh để tự động sinh mã QR nhé."
      />

      <div className="p-4 space-y-4">
        <form onSubmit={handleGenerate} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              1. Chọn Lô thu hoạch đầu vào: <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedHarvestId}
              onChange={(e) => setSelectedHarvestId(e.target.value)}
              className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
            >
              {harvests.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.code} - {h.farmZoneName} ({h.yieldQuantity} {h.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              2. Tên sản phẩm thương mại: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <CounterInput
              label="3. Số lượng gói / hộp cần dán tem QR:"
              value={quantity}
              onChange={setQuantity}
              unit={unit}
              step={10}
              min={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Quy cách đóng gói:
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-800 bg-slate-50"
              >
                <option value="Túi">Túi (5kg / 10kg)</option>
                <option value="Hộp">Hộp quà tặng</option>
                <option value="Con">Con hút chân không</option>
                <option value="Thùng">Thùng carton</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Tiêu chuẩn chứng nhận:
              </label>
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-800 bg-slate-50"
              >
                <option value="VietGAP - OCOP 4 sao">VietGAP - OCOP 4 sao</option>
                <option value="Hữu cơ vi sinh">Hữu cơ vi sinh</option>
                <option value="Đặc sản Tiến Vua">Đặc sản Tiến Vua</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900">
            ℹ️ Hệ thống sẽ tự động gán mã truy xuất duy nhất nối liền từ Thửa ruộng → Thu hoạch → Mã gói QR.
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xl font-extrabold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-4"
          >
            <span>✨</span>
            <span>TỰ ĐỘNG SINH MÃ QR SẢN PHẨM</span>
          </button>
        </form>
      </div>
    </div>
  );
};
