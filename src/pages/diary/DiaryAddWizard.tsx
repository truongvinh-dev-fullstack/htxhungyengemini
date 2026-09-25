import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { getCurrentWeatherSuggestion } from '../../services/currentWeather';
import { diaryWorkTypes } from './workTypes';

const localDateTime = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const DiaryAddWizard: React.FC = () => {
  const { farmZones, inventory, addDiary, navigateTo, currentHTX, currentRole, currentUser } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Danh sách vùng hợp lệ cho người dùng hiện tại (R06 chỉ thấy vùng của hộ mình)
  const availableZones = React.useMemo(() => {
    return farmZones.filter((z) => {
      if (z.htxId !== currentHTX.id) return false;
      if (currentRole === 'R06') {
        return z.ownerId === currentUser.id;
      }
      return currentRole === 'R03';
    });
  }, [farmZones, currentHTX.id, currentRole, currentUser.id]);

  // Step 1: Chọn ngày & Vùng sản xuất
  const todayStr = localDateTime(new Date()).slice(0, 10);
  const [performedAt, setPerformedAt] = useState<string>(() => localDateTime(new Date()));
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    availableZones.length > 0 ? availableZones[0].id : ''
  );

  React.useEffect(() => {
    if (!availableZones.some((z) => z.id === selectedZoneId)) {
      setSelectedZoneId(availableZones[0]?.id || '');
    }
  }, [availableZones, selectedZoneId]);

  // Step 2: Chọn nhiều loại công việc bằng icon lớn & vật tư
  const workTypes = diaryWorkTypes;
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [workDescription, setWorkDescription] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState('');
  const [phiDays, setPhiDays] = useState('');
  const diaryMaterials = inventory.filter((item) => item.category !== 'BaoBi');
  const selectedMaterial = diaryMaterials.find((item) => item.id === materialId);
  const selectedZone = availableZones.find((zone) => zone.id === selectedZoneId);

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

  // Step 3: Ảnh do người dùng chụp hoặc chọn từ điện thoại.
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');

  // Step 4: Ghi chú ngắn & xác nhận
  const [notes, setNotes] = useState<string>('');
  const [weatherCondition, setWeatherCondition] = useState('');
  const [weatherSuggestedAt, setWeatherSuggestedAt] = useState<string | undefined>();
  const [weatherStatus, setWeatherStatus] = useState('');
  const weatherEdited = useRef(false);
  const weatherAttempted = useRef(false);

  const updatePerformedAt = (value: string) => {
    if (value.slice(0, 10) !== performedAt.slice(0, 10) && !weatherEdited.current) {
      setWeatherCondition('');
      setWeatherSuggestedAt(undefined);
      weatherAttempted.current = false;
    }
    setPerformedAt(value);
  };

  const loadWeather = async () => {
    setWeatherStatus('Đang lấy thời tiết tại vị trí hiện tại...');
    try {
      const suggestion = await getCurrentWeatherSuggestion();
      if (!weatherEdited.current) {
        setWeatherCondition(suggestion.text);
        setWeatherSuggestedAt(suggestion.observedAt);
      }
      setWeatherStatus('Gợi ý thời tiết hôm nay tại vị trí hiện tại. Có thể sửa lại theo thực tế.');
    } catch {
      setWeatherStatus('Không lấy được thời tiết hoặc vị trí. Vui lòng nhập điều kiện thực tế.');
    }
  };

  useEffect(() => {
    if (step === 4 && !weatherAttempted.current) {
      weatherAttempted.current = true;
      if (performedAt.slice(0, 10) === todayStr) {
        void loadWeather();
      } else {
        setWeatherStatus('Nhật ký ngày khác hôm nay: vui lòng nhập thời tiết thực tế của ngày thực hiện.');
      }
    }
  }, [step]);

  const handlePhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp ảnh.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCapturedPhoto(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (step === 1) {
      if (availableZones.length === 0 || !selectedZoneId) {
        alert(currentRole === 'R06' ? 'Hộ chưa được HTX giao vùng sản xuất nào.' : 'HTX chưa có vùng sản xuất để ghi nhật ký.');
        return;
      }
      if (!performedAt || Number.isNaN(new Date(performedAt).getTime())) {
        alert('Vui lòng chọn ngày và giờ thực hiện hợp lệ.');
        return;
      }

      setStep(2);
    } else if (step === 2) {
      if (selectedWorkTypes.length === 0) {
        alert('Bác hãy chọn ít nhất 1 công việc đã làm!');
        return;
      }
      if (materialId && (!Number.isFinite(Number(materialQuantity)) || Number(materialQuantity) <= 0)) {
        alert('Vui lòng nhập số lượng vật tư lớn hơn 0.');
        return;
      }
      if (phiDays && (!Number.isInteger(Number(phiDays)) || Number(phiDays) < 0)) {
        alert('Thời gian cách ly PHI phải là số ngày không âm.');
        return;
      }
      const chosenNames = workTypes
        .filter((w) => selectedWorkTypes.includes(w.id))
        .map((w) => w.name)
        .join(', ');

      setStep(3);
    } else if (step === 3) {

      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as any);
    }
  };

  const handleSave = () => {
    const zone = availableZones.find((z) => z.id === selectedZoneId);
    if (!zone) {
      alert('Không tìm thấy vùng sản xuất hợp lệ. Không thể lưu nhật ký với mã vùng không xác định.');
      return;
    }
    const chosen = workTypes.filter((w) => selectedWorkTypes.includes(w.id));
    const combinedName = chosen.map((w) => w.name).join(' • ');
    const combinedIcon = chosen.map((w) => w.icon).join(' ');

    const result = addDiary({
      htxId: currentHTX.id,
      farmZoneId: zone.id,
      farmZoneName: zone.name,
      date: performedAt.slice(0, 10),
      performedAt,
      workType: selectedWorkTypes[0],
      workTypes: selectedWorkTypes,
      workTypeName: combinedName || 'Công việc đồng ruộng',
      workTypeIcon: combinedIcon || '🌾',
      workDescription: workDescription.trim() || undefined,
      materialId: selectedMaterial?.id,
      materialQuantity: selectedMaterial ? Number(materialQuantity) : undefined,
      materialUnit: selectedMaterial?.unit,
      suppliesUsed: selectedMaterial ? `${materialQuantity} ${selectedMaterial.unit} ${selectedMaterial.name}` : undefined,
      phiDays: phiDays ? Number(phiDays) : undefined,
      weatherCondition: weatherCondition.trim() || undefined,
      weatherSuggestedAt,
      subjectOwnerId: zone.ownerId,
      subjectOwnerName: zone.ownerName,
      photoUrl: capturedPhoto,
      notes: notes.trim(),
    });

    if (!result.success) {
      alert(result.message || 'Không lưu được nhật ký.');
      return;
    }


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
                1. Ngày và giờ thực hiện <span className="text-red-500">*</span>
              </label>

              {/* Quick Preset Buttons for Elderly */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => updatePerformedAt(localDateTime(new Date()))}
                  className={`py-3 rounded-2xl font-bold text-base border-2 transition-all ${
                    performedAt.slice(0, 10) === todayStr
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
                    updatePerformedAt(localDateTime(yesterday));
                  }}
                  className={`py-3 rounded-2xl font-bold text-base border-2 transition-all ${
                    performedAt.slice(0, 10) !== todayStr
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  📅 Hôm qua
                </button>
              </div>

              <input
                type="datetime-local"
                value={performedAt}
                onChange={(e) => updatePerformedAt(e.target.value)}
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-800 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-slate-900 mb-2">
                2. Vùng sản xuất / Thửa ruộng <span className="text-red-500">*</span>
              </label>
              {availableZones.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-sm text-amber-950 space-y-2">
                  <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                    <span>⚠️</span> Chưa có vùng sản xuất phù hợp
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    {currentRole === 'R06' ? `Hộ ${currentUser.name} chưa được giao vùng sản xuất. Vui lòng liên hệ cán bộ kỹ thuật HTX.` : 'HTX chưa có vùng sản xuất. Hãy tạo vùng và gán hộ phụ trách trước khi ghi nhật ký.'}
                  </p>
                </div>
              ) : (
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-800 bg-slate-50 focus:border-emerald-600 focus:outline-none"
                >
                  {availableZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      [{z.zoneCode || 'MSVT'}] {z.name} ({z.variety}) — {z.ownerName}
                    </option>
                  ))}
                </select>
              )}
              {selectedZone && (
                <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-950">
                  <strong>Hộ phụ trách vùng:</strong> {selectedZone.ownerName}
                  {currentRole === 'R03' && <span className="block text-xs mt-1">Bạn đang ghi hộ cho thành viên này. Nhật ký sẽ ghi rõ người ghi là cán bộ kỹ thuật.</span>}
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={availableZones.length === 0}
              className={`w-full py-4 rounded-2xl text-xl font-bold flex items-center justify-center gap-2 mt-4 transition-all ${
                availableZones.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white shadow-lg shadow-emerald-700/30'
              }`}
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

            <div className="pt-2">
              <label className="block text-base font-bold text-slate-800 mb-1">Mô tả nội dung công việc:</label>
              <textarea
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Đã hoàn thành bón phân theo đúng liều lượng chỉ dẫn."
                className="w-full p-3 rounded-2xl border-2 border-slate-300 text-base text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <label className="block text-base font-bold text-slate-800 mb-1">
                Vật tư sử dụng (từ danh mục chuẩn):
              </label>
              <select
                value={materialId}
                onChange={(e) => { setMaterialId(e.target.value); setMaterialQuantity(''); }}
                className="w-full h-13 px-4 rounded-2xl border-2 border-slate-300 text-base font-medium text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              >
                <option value="">Không dùng vật tư</option>
                {diaryMaterials.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
              </select>
            </div>
            {selectedMaterial && (
              <div>
                <label className="block text-base font-bold text-slate-800 mb-1">Số lượng & đơn vị <span className="text-red-500">*</span></label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={materialQuantity}
                    onChange={(e) => setMaterialQuantity(e.target.value)}
                    className="w-full h-13 px-4 rounded-2xl border-2 border-slate-300 bg-slate-50"
                    placeholder="Số lượng"
                  />
                  <span className="font-semibold text-slate-700 min-w-20">{selectedMaterial.unit}</span>
                </div>
              </div>
            )}
            <div>
              <label className="block text-base font-bold text-slate-800 mb-1">Thời gian cách ly PHI (ngày, nếu có):</label>
              <input
                type="number"
                min="0"
                step="1"
                value={phiDays}
                onChange={(e) => setPhiDays(e.target.value)}
                className="w-full h-13 px-4 rounded-2xl border-2 border-slate-300 bg-slate-50"
                placeholder="Ví dụ: 14"
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
              <h3 className="text-lg font-bold text-slate-900">Hình ảnh hiện trường thực tế</h3>
              <p className="text-xs text-slate-500">
                Hình ảnh minh chứng quá trình canh tác theo chuẩn VietGAP
              </p>
            </div>

            <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
              {capturedPhoto ? <img src={capturedPhoto} alt="Ảnh hiện trường" className="w-full h-full object-cover" /> : <span className="text-slate-500 text-sm">Chưa chọn ảnh hiện trường</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="px-3 py-3 text-center rounded-2xl bg-emerald-700 text-white font-bold cursor-pointer">
                📷 Chụp ảnh
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
              </label>
              <label className="px-3 py-3 text-center rounded-2xl bg-slate-200 text-slate-800 font-bold cursor-pointer">
                🖼️ Chọn từ máy
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
              </label>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ở bước xác nhận, ứng dụng sẽ xin vị trí của điện thoại để gợi ý thời tiết hôm nay. Bạn có thể sửa hoặc tự nhập thời tiết thực tế.
            </p>

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
                <span className="font-extrabold text-slate-900">{performedAt.replace('T', ' ')}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-200 pb-1.5">
                <span className="font-semibold text-slate-600">Hộ phụ trách:</span>
                <span className="font-extrabold text-slate-900">{selectedZone?.ownerName}</span>
              </div>
              {currentRole === 'R03' && <div className="text-xs font-semibold text-emerald-900">Ghi hộ bởi: {currentUser.name}</div>}
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

              {workDescription.trim() && <div className="border-b border-emerald-200 pb-1.5"><span className="font-semibold text-slate-600">Mô tả: </span>{workDescription.trim()}</div>}
              {selectedMaterial && (
                <div className="flex justify-between border-b border-emerald-200 pb-1.5">
                  <span className="font-semibold text-slate-600">Vật tư:</span>
                  <span className="font-bold text-slate-900">{materialQuantity} {selectedMaterial.unit} {selectedMaterial.name}</span>
                </div>
              )}
              {phiDays && <div><span className="font-semibold text-slate-600">PHI: </span>{phiDays} ngày</div>}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-base font-bold text-slate-800">Điều kiện thời tiết:</label>
                <button type="button" onClick={() => { weatherEdited.current = false; void loadWeather(); }} className="text-xs font-bold text-emerald-700 underline">Lấy thời tiết hiện tại</button>
              </div>
              <p className="text-xs text-slate-500 mb-2">{weatherStatus || 'Có thể nhập thời tiết thực tế bằng tay.'}</p>
              <input
                type="text"
                value={weatherCondition}
                onChange={(e) => { weatherEdited.current = true; setWeatherCondition(e.target.value); setWeatherSuggestedAt(undefined); }}
                placeholder="Ví dụ: Nắng ráo 29°C, gió nhẹ"
                className="w-full p-3 rounded-2xl border-2 border-slate-300 text-base text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              />
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
