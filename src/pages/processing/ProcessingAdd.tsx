import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { HarvestLot } from '../../types';

export const ProcessingAdd: React.FC = () => {
  const { harvests, addProcessingLot, currentUser, currentHTX, goBack } = useApp();

  const [selectedHarvestId, setSelectedHarvestId] = useState<string>(
    harvests.length > 0 ? harvests[0].id : ''
  );

  const METHODS_BY_HTX = currentHTX.id === 'dongtao'
    ? [
        { id: 'm1', name: 'Giết mổ kiểm dịch & làm sạch', icon: '🍗' },
        { id: 'm2', name: 'Đóng gói hút chân không cấp đông', icon: '❄️' },
        { id: 'm3', name: 'Phân loại trọng lượng & kiểm tra thú y', icon: '⚖️' },
      ]
    : currentHTX.id === 'quyetthang'
    ? [
        { id: 'm1', name: 'Sấy dẻo nhiệt độ thấp (Long nhãn)', icon: '🔥' },
        { id: 'm2', name: 'Làm sạch, phân loại nhãn tươi xuất khẩu', icon: '✨' },
        { id: 'm3', name: 'Sơ chế phi lê cá đóng khay', icon: '🐟' },
      ]
    : [
        { id: 'm1', name: 'Xay xát tách trấu & đánh bóng hạt', icon: '🌾' },
        { id: 'm2', name: 'Xay xát gạo lứt hữu cơ (giữ cám)', icon: '🍚' },
        { id: 'm3', name: 'Sấy thóc tươi đạt độ ẩm 14%', icon: '💨' },
      ];

  const [selectedMethod, setSelectedMethod] = useState<string>(METHODS_BY_HTX[0].name);

  // Input & Output quantities
  const selectedHarvest = harvests.find((h) => h.id === selectedHarvestId) || harvests[0];
  const defaultInput = selectedHarvest ? selectedHarvest.yieldQuantity : 1000;
  const [inputYield, setInputYield] = useState<number>(defaultInput);
  const [outputYield, setOutputYield] = useState<number>(Math.round(defaultInput * 0.7)); // Mặc định hao hụt 30%
  const [notes, setNotes] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>(
    selectedHarvest?.photoUrl ||
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'
  );
  const [success, setSuccess] = useState<boolean>(false);

  // Tính tỷ lệ hao hụt (%)
  const lossRate = inputYield > 0
    ? Number((((inputYield - outputYield) / inputYield) * 100).toFixed(1))
    : 0;

  const handleHarvestChange = (lot: HarvestLot) => {
    setSelectedHarvestId(lot.id);
    setInputYield(lot.yieldQuantity);
    setOutputYield(Math.round(lot.yieldQuantity * 0.7));
    if (lot.photoUrl) setPhotoUrl(lot.photoUrl);
  };

  const adjustOutput = (delta: number) => {
    setOutputYield((prev) => Math.max(1, Math.min(inputYield, prev + delta)));
  };

  const handleSave = () => {
    if (!selectedHarvest) {
      alert('Vui lòng chọn một lô thu hoạch đầu vào.');
      return;
    }

    if (outputYield > inputYield) {
      alert('Sản lượng đầu ra không thể lớn hơn sản lượng thu hoạch đầu vào!');
      return;
    }

    addProcessingLot({
      htxId: currentHTX.id,
      harvestLotId: selectedHarvest.id,
      harvestLotCode: selectedHarvest.code,
      farmZoneName: selectedHarvest.farmZoneName,
      productName: currentHTX.productType,
      date: new Date().toISOString().split('T')[0],
      method: selectedMethod,
      inputQuantity: inputYield,
      outputQuantity: outputYield,
      unit: selectedHarvest.unit || 'kg',
      lossRatePercent: lossRate,
      operatorName: currentUser.name,
      photoUrl,
      notes: notes || 'Hoàn thành sơ chế đạt tiêu chuẩn chất lượng HTX.',
      status: 'Đã sơ chế',
    });

    setSuccess(true);
    setTimeout(() => {
      goBack();
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-8 border-2 border-emerald-500 shadow-xl space-y-4 max-w-sm w-full">
          <span className="text-6xl animate-bounce block">✅</span>
          <h2 className="text-2xl font-black text-slate-900">Lưu lô sơ chế thành công!</h2>
          <p className="text-sm font-semibold text-slate-600">
            Hệ thống đã ghi nhận sản lượng đầu ra và tỷ lệ hao hụt: <strong>{lossRate}%</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 bg-slate-50 min-h-screen">
      <Header
        title="Thêm mới lô sơ chế"
        voiceText="Bác chọn lô thu hoạch đầu vào, chọn phương pháp sơ chế, rồi nhập sản lượng đầu ra để hệ thống tính hao hụt nhé."
      />

      <div className="p-4 space-y-6">
        {/* Bước 1: Chọn lô thu hoạch đầu vào */}
        <div className="space-y-2">
          <label className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-black">
              1
            </span>
            <span>Chọn lô thu hoạch đầu vào:</span>
          </label>

          <div className="space-y-2">
            {harvests.map((lot) => {
              const isSelected = lot.id === selectedHarvestId;
              return (
                <div
                  key={lot.id}
                  onClick={() => handleHarvestChange(lot)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">🌾</span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 text-base leading-tight">
                        {lot.code}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold mt-0.5">
                        {lot.farmZoneName} • Thu ngày {lot.date}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="font-black text-blue-700 text-base">
                      {lot.yieldQuantity.toLocaleString()} {lot.unit}
                    </span>
                    <span className="block text-[11px] font-bold text-slate-400">
                      {isSelected ? '✓ Đang chọn' : 'Bấm chọn'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bước 2: Phương pháp sơ chế */}
        <div className="space-y-2">
          <label className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-black">
              2
            </span>
            <span>Phương pháp sơ chế:</span>
          </label>

          <div className="grid grid-cols-1 gap-2">
            {METHODS_BY_HTX.map((m) => {
              const isSelected = selectedMethod === m.name;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.name)}
                  className={`p-3.5 rounded-2xl border-2 text-left flex items-center gap-3 transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="font-extrabold text-base leading-snug">{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bước 3: Sản lượng đầu vào & đầu ra (Bộ đếm +/- lớn) */}
        <div className="space-y-3">
          <label className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-black">
              3
            </span>
            <span>Sản lượng sau sơ chế:</span>
          </label>

          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-sm font-bold text-slate-500 pb-3 border-b border-slate-100">
              <span>Đầu vào (Lô thu hoạch):</span>
              <span className="text-base font-black text-slate-800">
                {inputYield.toLocaleString()} {selectedHarvest?.unit || 'kg'}
              </span>
            </div>

            {/* Bộ đếm đầu ra */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase block text-center">
                Sản lượng thành phẩm thu được ({selectedHarvest?.unit || 'kg'}):
              </span>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustOutput(-50)}
                  className="w-14 h-14 bg-slate-100 active:bg-slate-200 text-slate-800 rounded-2xl text-2xl font-black flex items-center justify-center shadow-inner active:scale-95 border border-slate-300"
                >
                  -50
                </button>
                <button
                  type="button"
                  onClick={() => adjustOutput(-10)}
                  className="w-12 h-12 bg-slate-100 active:bg-slate-200 text-slate-800 rounded-2xl text-xl font-black flex items-center justify-center shadow-inner active:scale-95 border border-slate-300"
                >
                  -10
                </button>

                <div className="flex-1 max-w-[140px] text-center">
                  <input
                    type="number"
                    value={outputYield}
                    onChange={(e) => setOutputYield(Number(e.target.value))}
                    className="w-full text-center text-3xl font-black text-blue-700 bg-blue-50 border-2 border-blue-400 rounded-2xl py-2 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400 block mt-0.5">
                    {selectedHarvest?.unit || 'kg'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => adjustOutput(10)}
                  className="w-12 h-12 bg-slate-100 active:bg-slate-200 text-slate-800 rounded-2xl text-xl font-black flex items-center justify-center shadow-inner active:scale-95 border border-slate-300"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => adjustOutput(50)}
                  className="w-14 h-14 bg-slate-100 active:bg-slate-200 text-slate-800 rounded-2xl text-2xl font-black flex items-center justify-center shadow-inner active:scale-95 border border-slate-300"
                >
                  +50
                </button>
              </div>
            </div>

            {/* Tính tỷ lệ hao hụt tự động */}
            <div className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
              lossRate > 0 && lossRate <= 35
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className="text-2xl">📉</span>
                <div>
                  <div>Tỷ lệ hao hụt sơ chế:</div>
                  <div className="text-xs opacity-75 font-normal">Tự động tính từ chênh lệch vào / ra</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">{lossRate}%</span>
                <span className="block text-[11px] font-bold">
                  Hao hụt: {(inputYield - outputYield).toLocaleString()} {selectedHarvest?.unit || 'kg'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bước 4: Ảnh hiện trường và ghi chú */}
        <div className="space-y-3">
          <label className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-black">
              4
            </span>
            <span>Hình ảnh sơ chế & Ghi chú:</span>
          </label>

          <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img src={photoUrl} alt="Sơ chế" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => alert('Mô phỏng máy ảnh: Đã chụp ảnh công đoạn sơ chế thành công!')}
                className="absolute bottom-3 right-3 bg-black/70 active:scale-95 backdrop-blur text-white text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1.5"
              >
                <span>📷</span>
                <span>Chụp ảnh lại</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm về chất lượng, máy móc hoặc độ ẩm (tùy chọn)..."
              className="w-full p-3 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Nút lưu to bản */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-lg font-black shadow-lg flex items-center justify-center gap-2"
        >
          <span>💾</span>
          <span>LƯU LÔ SƠ CHẾ NÀY</span>
        </button>
      </div>
    </div>
  );
};
