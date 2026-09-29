import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { getCurrentWeatherSuggestion } from '../../services/currentWeather';
import { diaryWorkTypes } from './workTypes';
import { matchSeasonForZone } from '../../utils/seasonMatcher';
import { getDiaryTaskHints, inferDiaryWorkType } from '../../utils/productionTaskHints';

const localDateTime = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const DiaryAddWizard: React.FC = () => {
  const { farmZones, inventory, tasks, addDiary, navigateTo, currentHTX, currentRole, currentUser, screenParams } = useApp();

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
  const targetZoneId: string | undefined = screenParams?.zoneId || screenParams?.zone?.id;
  const isTargetZoneInvalid = Boolean(targetZoneId && !availableZones.some((z) => z.id === targetZoneId));

  const [performedAt, setPerformedAt] = useState<string>(() => localDateTime(new Date()));
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    (targetZoneId && availableZones.some((z) => z.id === targetZoneId))
      ? targetZoneId
      : availableZones.length > 0
      ? availableZones[0].id
      : ''
  );

  React.useEffect(() => {
    if (targetZoneId && availableZones.some((z) => z.id === targetZoneId)) {
      setSelectedZoneId(targetZoneId);
    } else if (!availableZones.some((z) => z.id === selectedZoneId)) {
      setSelectedZoneId(availableZones[0]?.id || '');
    }
  }, [availableZones, selectedZoneId, targetZoneId]);

  // Step 2: Chọn nhiều loại công việc bằng icon lớn & vật tư
  const workTypes = diaryWorkTypes;

  // Khởi tạo công việc từ kế hoạch nếu có
  const getInitialWorkTypes = (): string[] => {
    if (screenParams?.workType && diaryWorkTypes.some((w) => w.id === screenParams.workType)) {
      return [screenParams.workType];
    }
    if (!screenParams?.taskTitle) return [];
    return [inferDiaryWorkType({ title: screenParams.taskTitle, taskCategory: 'phat_sinh' })!];
  };

  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>(() => {
    return screenParams?.taskId ? getInitialWorkTypes() : [];
  });
  const [selectedHintTaskId, setSelectedHintTaskId] = useState<string>(screenParams?.taskId || '');
  const [workDescription, setWorkDescription] = useState<string>(() => tasks.find((task) => task.id === screenParams?.taskId)?.description || screenParams?.taskTitle || '');
  const [materialId, setMaterialId] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState('');
  const [phiDays, setPhiDays] = useState('');
  const diaryMaterials = inventory.filter((item) => item.category !== 'BaoBi');
  const selectedMaterial = diaryMaterials.find((item) => item.id === materialId);
  const selectedZone = availableZones.find((zone) => zone.id === selectedZoneId);
  const [selectedCycleId, setSelectedCycleId] = useState<string>(screenParams?.cycleId || screenParams?.seasonId || '');
  const rawSeasonMatch = React.useMemo(() => matchSeasonForZone(selectedZone, performedAt), [selectedZone, performedAt]);
  const effectiveCycleId = selectedCycleId || (rawSeasonMatch.status === 'matched' ? rawSeasonMatch.season?.cycleId || rawSeasonMatch.season?.seasonId : '');
  const seasonMatch = React.useMemo(() => {
    return matchSeasonForZone(selectedZone, performedAt, false, effectiveCycleId || undefined);
  }, [selectedZone, performedAt, effectiveCycleId]);
  const allTaskHints = React.useMemo(() => getDiaryTaskHints(
    tasks, selectedZone, seasonMatch.season?.cycleId || seasonMatch.season?.seasonId, performedAt, currentUser
  ), [tasks, selectedZone, seasonMatch.season, performedAt, currentUser]);
  const selectedHint = allTaskHints.find((task) => task.id === selectedHintTaskId);
  const taskHints = selectedHint
    ? [selectedHint, ...allTaskHints.filter((task) => task.id !== selectedHint.id)].slice(0, 3)
    : allTaskHints.slice(0, 3);

  const useTaskHint = (taskId: string) => {
    if (selectedHintTaskId === taskId) {
      setSelectedHintTaskId('');
      return;
    }
    const task = taskHints.find((item) => item.id === taskId);
    if (!task) return;
    setSelectedHintTaskId(task.id);
    const workType = inferDiaryWorkType(task);
    if (workType) setSelectedWorkTypes([workType]);
    setWorkDescription(task.description || task.title);
  };

  const toggleWorkType = (id: string) => {
    if (selectedWorkTypes.includes(id)) {
      if (selectedWorkTypes.length > 1) {
        setSelectedWorkTypes(selectedWorkTypes.filter((t) => t !== id));
        if (selectedHint && inferDiaryWorkType(selectedHint) === id) setSelectedHintTaskId('');
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
  const [notes, setNotes] = useState<string>(() => {
    if (screenParams?.defaultNotes) return screenParams.defaultNotes;
    if (screenParams?.taskTitle) return `Kết quả thực hiện: ${screenParams.taskTitle}`;
    return '';
  });
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
      if (seasonMatch.status === 'no_season') {
        alert('Thời điểm này chưa thuộc mùa vụ nào của thửa. Bác vui lòng kiểm tra lại ngày giờ hoặc mùa vụ của thửa.');
        return;
      }
      if (seasonMatch.status === 'overlap') {
        alert('Dữ liệu mùa vụ của thửa bị chồng thời gian tại thời điểm này. Hệ thống không thể tự chọn mùa vụ.');
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
    if (seasonMatch.status !== 'matched' || !seasonMatch.season) {
      alert(seasonMatch.message || 'Thời điểm thực hiện không thuộc mùa vụ nào của thửa ruộng.');
      return;
    }
    const chosen = workTypes.filter((w) => selectedWorkTypes.includes(w.id));
    const combinedName = chosen.map((w) => w.name).join(' • ');
    const combinedIcon = chosen.map((w) => w.icon).join(' ');

    const result = addDiary({
      htxId: currentHTX.id,
      farmZoneId: zone.id,
      farmZoneName: zone.name,
      seasonId: seasonMatch.season.seasonId,
      cycleId: seasonMatch.season.cycleId || seasonMatch.season.seasonId,
      seasonName: seasonMatch.season.seasonName,
      date: performedAt.slice(0, 10),
      performedAt,
      workType: selectedWorkTypes[0],
      workTypes: selectedWorkTypes,
      workTypeName: combinedName || screenParams?.taskTitle || 'Công việc sản xuất',
      workTypeIcon: combinedIcon || '🌾',
      workDescription: workDescription.trim() || screenParams?.taskTitle || undefined,
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
      taskId: selectedHint?.id,
      taskTitle: selectedHint?.title,
      isIncident: Boolean(screenParams?.isIncident),
    });

    if (!result.success) {
      alert(result.message || 'Không lưu được nhật ký.');
      return;
    }

    navigateTo('diary_list');
  };

  const chosenWorks = workTypes.filter((w) => selectedWorkTypes.includes(w.id));

  if (isTargetZoneInvalid) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl shadow-inner border-2 border-red-200">
          ⚠️
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-slate-900">Thửa ruộng không hợp lệ</h3>
          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            Thửa ruộng được chọn không thuộc danh sách vùng sản xuất hộ bác được phép ghi nhật ký hoặc không thuộc HTX hiện tại.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('farm_list')}
          className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-md active:scale-95 transition-all"
        >
          Quay lại danh sách thửa ruộng
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Ghi nhật ký sản xuất"
        voiceText={`Bác đang ở bước ${step} trên 4 bước ghi nhật ký.`}
      />

      <div className="p-4 space-y-4">
        {/* Banner thông tin công việc kế hoạch nếu có */}
        {selectedHint && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-3.5 flex items-start gap-3 shadow-xs">
            <span className="text-2xl">📋</span>
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-black text-emerald-950 block truncate">
                Gợi ý từ vụ/lứa: {selectedHint.title}
              </span>
              <p className="text-[11px] text-emerald-800 leading-tight">
                Bác ghi lại việc thực tế đã làm. Có thể bỏ gợi ý ở bước chọn việc.
              </p>
            </div>
          </div>
        )}

        {/* Banner việc phát sinh nếu có */}
        {screenParams?.isIncident && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-3.5 flex items-start gap-3 shadow-xs">
            <span className="text-2xl">⚡</span>
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-black text-amber-950 block">
                Ghi việc phát sinh ngoài kế hoạch
              </span>
              <p className="text-[11px] text-amber-800 leading-tight">
                Ghi chép công việc đột xuất chưa có trong lịch giao của HTX.
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar & Step Indicator */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-emerald-800">
              BƯỚC {step} / 4:{' '}
                {step === 1 && 'Chọn ngày & Nơi sản xuất'}
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
                      [{z.zoneCode || 'MSVT'}] {z.name} — {z.ownerName}
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

              {(rawSeasonMatch.status === 'overlap' || rawSeasonMatch.status === 'matched') && <label className="block text-sm font-bold mt-3">Vụ/lứa áp dụng<select className="w-full p-3 border rounded-xl mt-1" value={effectiveCycleId} onChange={(e) => setSelectedCycleId(e.target.value)}><option value="">Chọn vụ/lứa</option>{(rawSeasonMatch.seasons || (rawSeasonMatch.season ? [rawSeasonMatch.season] : [])).map((cycle) => <option key={cycle.cycleId || cycle.seasonId} value={cycle.cycleId || cycle.seasonId}>{cycle.seasonName} ({cycle.year})</option>)}</select></label>}

              {/* CN-3.1: THẺ THÔNG TIN MÙA VỤ XÁC ĐỊNH THEO THỬA VÀ THỜI ĐIỂM THỰC HIỆN */}
              {selectedZone && (
                <div className="mt-3">
                  {seasonMatch.status === 'matched' && seasonMatch.season && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-2 text-sm shadow-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span>🌾</span>
                          <span>Mùa vụ canh tác xác định:</span>
                        </span>
                        <span
                          className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                            seasonMatch.season.status === 'Đang canh tác'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {seasonMatch.season.status}
                        </span>
                      </div>

                      <div>
                        <div className="text-lg font-black text-slate-900">
                          {seasonMatch.season.seasonName}
                        </div>
                        <div className="text-xs text-slate-600 font-medium mt-1">
                          📅 Thời gian vụ: <strong>{seasonMatch.season.seasonStartDate}</strong> {seasonMatch.season.seasonStartTime ? `(${seasonMatch.season.seasonStartTime})` : ''} ➜ <strong>{seasonMatch.season.seasonEndDate}</strong> {seasonMatch.season.seasonEndTime ? `(${seasonMatch.season.seasonEndTime})` : ''}
                        </div>
                        <div className="text-xs text-slate-600 font-medium mt-0.5">
                          🌱 Giống cây/con vụ đó: <strong className="text-slate-900">{seasonMatch.season.variety || 'Chưa cập nhật'}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {seasonMatch.status === 'no_season' && (
                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-sm text-amber-950 space-y-1.5 shadow-sm">
                      <div className="font-extrabold flex items-center gap-1.5 text-amber-900 text-sm">
                        <span className="text-lg">⚠️</span>
                        <span>Không thể ghi nhật ký</span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                        {seasonMatch.message || `Thời điểm thực hiện (${performedAt.replace('T', ' ')}) không thuộc vụ/lứa nào đang thực hiện của ${selectedZone.name}.`}
                      </p>
                      <p className="text-[11px] text-amber-700 font-medium">
                        Vui lòng kiểm tra lại ngày giờ hoặc liên hệ cán bộ kỹ thuật HTX để lập/bắt đầu vụ/lứa sản xuất.
                      </p>
                    </div>
                  )}

                  {seasonMatch.status === 'overlap' && (
                    <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-400 text-sm text-red-950 space-y-1.5 shadow-sm">
                      <div className="font-extrabold flex items-center gap-1.5 text-red-900 text-sm">
                        <span className="text-lg">🚫</span>
                        <span>Dữ liệu mùa vụ bị chồng thời gian</span>
                      </div>
                      <p className="text-xs text-red-800 leading-relaxed font-medium">
                        {seasonMatch.message || 'Có nhiều mùa vụ cùng chứa thời điểm này. Hệ thống không thể tự chọn một vụ.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={availableZones.length === 0 || seasonMatch.status !== 'matched'}
              className={`w-full py-4 rounded-2xl text-xl font-bold flex items-center justify-center gap-2 mt-4 transition-all ${
                availableZones.length === 0 || seasonMatch.status !== 'matched'
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
            {taskHints.length > 0 && <div className="rounded-2xl bg-amber-50 border border-amber-300 p-3 space-y-2">
              <h3 className="text-base font-extrabold text-amber-950">Gợi ý từ {seasonMatch.season?.seasonName}</h3>
              <p className="text-xs text-amber-900">Nếu bác đã làm việc này, chạm để điền nhanh. Bác vẫn có thể chọn việc khác bên dưới.</p>
              {taskHints.map((task) => <button key={task.id} type="button" onClick={() => useTaskHint(task.id)} className={`w-full text-left rounded-xl border-2 p-3 ${selectedHintTaskId === task.id ? 'bg-emerald-100 border-emerald-600' : 'bg-white border-amber-200'}`}>
                <span className="block text-sm font-bold text-slate-900">{task.title}</span>
                <span className="block text-xs text-slate-600 mt-1">Dự kiến: {task.dueDate} • {task.farmZoneName}</span>
                <span className="block text-xs font-bold text-emerald-700 mt-1">{selectedHintTaskId === task.id ? '✓ Đang dùng gợi ý — chạm lại để bỏ' : 'Chạm để dùng gợi ý'}</span>
              </button>)}
            </div>}
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
                  💡 Bác có thể chọn nhiều việc đã làm trong cùng ngày.
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
              <div className="flex justify-between border-b border-emerald-200 pb-1.5">
                <span className="font-semibold text-slate-600">Mùa vụ áp dụng:</span>
                <span className="font-extrabold text-emerald-950">
                  {seasonMatch.season?.seasonName || 'Chưa xác định'}{' '}
                  {seasonMatch.season?.status && (
                    <span className="text-xs text-slate-500 font-normal">
                      ({seasonMatch.season.status})
                    </span>
                  )}
                </span>
              </div>
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
