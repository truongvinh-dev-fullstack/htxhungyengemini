import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const DiaryAddWizard: React.FC = () => {
  const { farmZones, addDiary, navigateTo, speakText, currentHTX } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Chọn ngày & Vùng sản xuất
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    farmZones.length > 0 ? farmZones[0].id : ''
  );

  // Step 2: Chọn nhiều loại công việc bằng icon lớn & vật tư
  const workTypes = [
    { id: 'tuoi_nuoc', name: 'Tưới nước điều tiết', icon: '💧', color: 'bg-blue-50 text-blue-700 border-blue-300' },
    { id: 'bon_phan', name: 'Bón phân hữu cơ', icon: '🌱', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    { id: 'phun_thuoc', name: 'Phun chế phẩm sinh học', icon: '🛡️', color: 'bg-amber-50 text-amber-700 border-amber-300' },
    { id: 'cho_an', name: 'Cho ăn / Chăm sóc đàn', icon: '🌾', color: 'bg-purple-50 text-purple-700 border-purple-300' },
    { id: 've_sinh', name: 'Làm cỏ bờ / Vệ sinh', icon: '🌿', color: 'bg-lime-50 text-lime-700 border-lime-300' },
    { id: 'khac', name: 'Kiểm tra sâu bệnh / Khác', icon: '📋', color: 'bg-slate-50 text-slate-700 border-slate-300' },
  ];
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>(['tuoi_nuoc']);
  const [suppliesUsed, setSuppliesUsed] = useState<string>('');

  const toggleWorkType = (id: string) => {
    if (selectedWorkTypes.includes(id)) {
      if (selectedWorkTypes.length > 1) {
        setSelectedWorkTypes(selectedWorkTypes.filter((t) => t !== id));
      } else {
        alert('Bác cần chọn ít nhất 1 công việc nhé!');
      }
    } else {
      setSelectedWorkTypes([...selectedWorkTypes, id]);
    }
  };

  // Step 3: Chụp ảnh trực tiếp bằng camera
  const samplePhotos = [
    {
      name: 'Đồng ruộng lúa trổ bông',
      url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Bón phân hữu cơ vi sinh',
      url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Vườn gà Đông Tảo thả vườn',
      url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Nhãn lồng sai trĩu cành',
      url: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=600&auto=format&fit=crop&q=80',
    },
  ];
  const [capturedPhoto, setCapturedPhoto] = useState<string>(samplePhotos[0].url);

  // Step 4: Ghi chú ngắn & xác nhận
  const [notes, setNotes] = useState<string>('Thời tiết râm mát, cây phát triển tốt.');

  const handleNext = () => {
    if (step === 1) {
      speakText('Bước 2: Bác có thể chạm chọn một hoặc nhiều công việc bác đã làm trong buổi ra đồng hôm nay nhé.');
      setStep(2);
    } else if (step === 2) {
      if (selectedWorkTypes.length === 0) {
        alert('Bác hãy chọn ít nhất 1 công việc đã làm!');
        return;
      }
      const chosenNames = workTypes
        .filter((w) => selectedWorkTypes.includes(w.id))
        .map((w) => w.name)
        .join(', ');
      speakText(`Bác đã chọn ${selectedWorkTypes.length} công việc: ${chosenNames}. Bước 3 là chụp ảnh thực tế tại ruộng.`);
      setStep(3);
    } else if (step === 3) {
      speakText('Bước 4: Bác kiểm tra lại các công việc đã chọn và bấm nút Lưu nhật ký để hoàn thành.');
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as any);
    }
  };

  const handleSave = () => {
    const zone = farmZones.find((z) => z.id === selectedZoneId) || farmZones[0];
    const chosen = workTypes.filter((w) => selectedWorkTypes.includes(w.id));
    const combinedName = chosen.map((w) => w.name).join(' • ');
    const combinedIcon = chosen.map((w) => w.icon).join(' ');

    addDiary({
      htxId: currentHTX.id,
      farmZoneId: zone ? zone.id : 'fz-01',
      farmZoneName: zone ? zone.name : 'Thửa ruộng chính',
      date: selectedDate,
      workType: selectedWorkTypes[0],
      workTypes: selectedWorkTypes,
      workTypeName: combinedName || 'Công việc đồng ruộng',
      workTypeIcon: combinedIcon || '🌾',
      suppliesUsed: suppliesUsed.trim() || undefined,
      photoUrl: capturedPhoto,
      notes: notes.trim(),
    });

    speakText('Nhật ký đã được lưu thành công! Cảm ơn bác đã hoàn thành ghi chép hôm nay.');
    navigateTo('diary_list');
  };

  const chosenWorks = workTypes.filter((w) => selectedWorkTypes.includes(w.id));

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Ghi nhật ký mới"
        voiceText={`Bác đang ở bước ${step} trên 4 bước ghi nhật ký.`}
      />

      <div className="p-4 space-y-4">
        {/* Progress Bar & Step Indicator */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-emerald-800">
              BƯỚC {step} / 4:{' '}
              {step === 1 && 'Chọn ngày & Vùng trồng'}
              {step === 2 && 'Chọn các công việc đã làm'}
              {step === 3 && 'Chụp ảnh thực tế'}
              {step === 4 && 'Ghi chú & Xác nhận'}
            </span>
            <span className="text-slate-400 text-xs">{(step / 4) * 100}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: CHỌN NGÀY & VÙNG SẢN XUẤT */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-5">
            <div>
              <label className="block text-lg font-bold text-slate-900 mb-2">
                1. Ngày làm việc <span className="text-red-500">*</span>
              </label>

              {/* Quick Preset Buttons for Elderly */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`py-3 rounded-2xl font-bold text-base border-2 transition-all ${
                    selectedDate === todayStr
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  📅 Hôm nay ({todayStr})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setSelectedDate(yesterday.toISOString().split('T')[0]);
                  }}
                  className={`py-3 rounded-2xl font-bold text-base border-2 transition-all ${
                    selectedDate !== todayStr
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  📅 Hôm qua
                </button>
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-800 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-slate-900 mb-2">
                2. Vùng sản xuất / Thửa ruộng <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-800 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              >
                {farmZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.variety})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xl font-bold shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 mt-4"
            >
              <span>Tiếp tục: Bước 2</span>
              <span>➜</span>
            </button>
          </div>
        )}

        {/* STEP 2: CHỌN NHIỀU LOẠI CÔNG VIỆC CÙNG LÚC */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-lg font-extrabold text-slate-900">
                  Chọn các việc bác đã làm:
                </label>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                  Đã chọn {selectedWorkTypes.length} việc
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                💡 Bác có thể chạm chọn cùng lúc nhiều việc trong buổi ra đồng (ví dụ vừa tưới nước vừa bón phân).
              </p>
            </div>

            {/* Selected preview chips */}
            {chosenWorks.length > 0 && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs font-bold text-emerald-900">Các việc đã chọn:</span>
                {chosenWorks.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 bg-white text-emerald-900 font-bold text-xs px-2.5 py-1 rounded-xl border border-emerald-300 shadow-xs"
                  >
                    <span>{c.icon}</span>
                    <span>{c.name}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Big 2-Column Selectable Cards */}
            <div className="grid grid-cols-2 gap-3">
              {workTypes.map((w) => {
                const isSelected = selectedWorkTypes.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleWorkType(w.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left flex flex-col items-center justify-between text-center transition-all relative min-h-[110px] ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 ring-4 ring-emerald-500/20 shadow-md'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Checkbox indicator */}
                    <div className="w-full flex justify-end">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow'
                            : 'border-2 border-slate-300 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                    </div>

                    <span className="text-4xl my-1">{w.icon}</span>
                    <span className="text-sm font-extrabold text-slate-900 leading-tight">
                      {w.name}
                    </span>

                    <span
                      className={`mt-1 text-[11px] font-bold ${
                        isSelected ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {isSelected ? '✓ Đã chọn' : 'Chạm để chọn'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Vật tư sử dụng */}
            <div className="pt-2">
              <label className="block text-base font-bold text-slate-800 mb-1">
                Vật tư đã dùng chung (tùy chọn):
              </label>
              <input
                type="text"
                value={suppliesUsed}
                onChange={(e) => setSuppliesUsed(e.target.value)}
                placeholder="Ví dụ: 25kg phân Quế Lâm, Nước mương số 2..."
                className="w-full h-13 px-4 rounded-2xl border-2 border-slate-300 text-base font-medium text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleBack}
                className="w-1/3 py-4 rounded-2xl bg-slate-200 text-slate-700 text-base font-bold"
              >
                ← Quay lại
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-lg font-bold shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2"
              >
                <span>Sang Bước 3 (Chụp ảnh)</span>
                <span>➜</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CHỤP ẢNH TRỰC TIẾP BẰNG CAMERA */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Chụp ảnh đồng ruộng thực tế</h3>
              <p className="text-xs text-slate-500">
                Hình ảnh minh chứng quá trình canh tác theo chuẩn VietGAP
              </p>
            </div>

            {/* Camera Viewfinder Simulation */}
            <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-slate-800 bg-slate-900 shadow-inner flex items-center justify-center">
              <img
                src={capturedPhoto}
                alt="Ảnh chụp nhật ký"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>CAMERA ĐỒNG RUỘNG</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-center bg-black/50 text-white text-xs py-1 rounded-xl backdrop-blur">
                {selectedDate} • Vị trí: Xã An Ninh, Tiền Lữ, Hưng Yên
              </div>
            </div>

            {/* Quick photo chooser */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Chụp ảnh mẫu hoặc chọn ảnh từ đồng ruộng:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {samplePhotos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCapturedPhoto(p.url)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      capturedPhoto === p.url
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleBack}
                className="w-1/3 py-4 rounded-2xl bg-slate-200 text-slate-700 text-base font-bold"
              >
                ← Quay lại
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-lg font-bold shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2"
              >
                <span>Sang Bước 4 (Xác nhận)</span>
                <span>➜</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: GHI CHÚ NGẮN & XÁC NHẬN LƯU */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Kiểm tra & Lưu nhật ký</h3>
              <p className="text-xs text-slate-500">
                Lưu ý: Bác có thể sửa/xóa nhật ký này trong vòng 24 giờ sau khi tạo.
              </p>
            </div>

            {/* Summary Card with all selected work types */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2.5 text-sm text-slate-800">
              <div className="flex justify-between border-b border-emerald-200 pb-1.5">
                <span className="font-semibold text-slate-600">Ngày ghi:</span>
                <span className="font-extrabold text-slate-900">{selectedDate}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-200 pb-1.5">
                <span className="font-semibold text-slate-600">Vùng sản xuất:</span>
                <span className="font-extrabold text-slate-900">
                  {farmZones.find((z) => z.id === selectedZoneId)?.name}
                </span>
              </div>

              {/* Multi-work items list */}
              <div className="border-b border-emerald-200 pb-2">
                <span className="font-semibold text-slate-600 block mb-1.5">
                  Các công việc đã làm ({chosenWorks.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {chosenWorks.map((w) => (
                    <span
                      key={w.id}
                      className="inline-flex items-center gap-1.5 bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs"
                    >
                      <span>{w.icon}</span>
                      <span>{w.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              {suppliesUsed && (
                <div className="flex justify-between border-b border-emerald-200 pb-1.5">
                  <span className="font-semibold text-slate-600">Vật tư:</span>
                  <span className="font-bold text-slate-900">{suppliesUsed}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1">
                Ghi chú ngắn của bác (tùy chọn):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Nhập tình hình ruộng lúa, thời tiết, sức khỏe cây..."
                className="w-full p-3 rounded-2xl border-2 border-slate-300 text-base font-medium text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleBack}
                className="w-1/3 py-4 rounded-2xl bg-slate-200 text-slate-700 text-base font-bold"
              >
                ← Quay lại
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xl font-extrabold shadow-xl shadow-emerald-700/40 flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>LƯU NHẬT KÝ ({chosenWorks.length} VIỆC)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
