import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { CounterInput } from '../../components/CounterInput';

export const HarvestAdd: React.FC = () => {
  const { farmZones, addHarvest, navigateTo, currentHTX, currentRole, currentUser } = useApp();

  const availableZones = React.useMemo(() => {
    return farmZones.filter((z) => {
      if (z.htxId !== currentHTX.id) return false;
      if (currentRole === 'R06') {
        return z.ownerId === currentUser.id;
      }
      return true;
    });
  }, [farmZones, currentHTX.id, currentRole, currentUser.id]);

  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    availableZones.length > 0 ? availableZones[0].id : ''
  );

  React.useEffect(() => {
    if (availableZones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(availableZones[0].id);
    }
  }, [availableZones, selectedZoneId]);

  const [harvestDate, setHarvestDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [quantity, setQuantity] = useState<number>(1500);
  const [unit, setUnit] = useState<string>(
    currentHTX.id === 'dongtao' ? 'con' : 'kg'
  );
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80'
  );
  const [notes, setNotes] = useState<string>('Thu hoạch máy đạt độ chín đều 95%.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (availableZones.length === 0 || !selectedZoneId) {
      alert('Hộ gia đình bác chưa được HTX gán vùng sản xuất nào. Không thể khai báo thu hoạch.');
      return;
    }

    const zone = availableZones.find((z) => z.id === selectedZoneId);
    if (!zone) {
      alert('Không tìm thấy vùng sản xuất hợp lệ.');
      return;
    }

    addHarvest({
      htxId: currentHTX.id,
      farmZoneId: zone.id,
      farmZoneName: zone.name,
      date: harvestDate,
      yieldQuantity: quantity,
      unit,
      photoUrl,
      notes,
    });


    navigateTo('harvest_list');
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Ghi nhận thu hoạch"
        voiceText="Bác chọn thửa ruộng, dùng nút cộng trừ để nhập sản lượng thu được, và chụp ảnh sản phẩm trước khi lưu nhé."
      />

      <div className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              1. Chọn Vùng thu hoạch: <span className="text-red-500">*</span>
            </label>
            {availableZones.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-sm text-amber-950 space-y-2">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                  <span>⚠️</span> Hộ chưa được gán vùng sản xuất
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Hộ gia đình <strong>{currentUser.name}</strong> hiện chưa có thửa ruộng/khu chuồng nào được Ban Kỹ thuật HTX cấp mã. Bác vui lòng liên hệ <strong>Cán bộ Kỹ thuật HTX (R03)</strong> để được cấp mã trước khi khai báo thu hoạch.
                </p>
              </div>
            ) : (
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-orange-600 focus:outline-none"
              >
                {availableZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    [{z.zoneCode || 'MSVT'}] {z.name} ({z.variety})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              2. Ngày thu hoạch: <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-slate-50 focus:border-orange-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <CounterInput
              label="3. Sản lượng thực tế thu được:"
              value={quantity}
              onChange={setQuantity}
              unit={unit}
              step={50}
              min={1}
            />
          </div>

          {/* Photo capture section */}
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              4. Chụp ảnh nông sản thu hoạch:
            </label>
            <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-900">
              <img src={photoUrl} alt="Ảnh nông sản" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-xl">
                📷 Đã chụp trực tiếp
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() =>
                  setPhotoUrl(
                    'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80'
                  )
                }
                className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 border"
              >
                Chụp ảnh khác
              </button>
            </div>
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              5. Ghi chú chất lượng:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-13 px-4 rounded-2xl border-2 border-slate-300 text-base font-medium text-slate-900 bg-slate-50 focus:border-orange-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xl font-extrabold shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 mt-4"
          >
            <span>💾</span>
            <span>LƯU LÔ THU HOẠCH</span>
          </button>
        </form>
      </div>
    </div>
  );
};
