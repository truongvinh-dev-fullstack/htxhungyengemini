import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { SEASONS_BY_HTX } from '../../mock/data';

export const FarmAdd: React.FC = () => {
  const { currentHTX, currentRole, members, farmZones, addFarmZone, goBack } = useApp();

  // Guard: Chỉ Cán bộ Kỹ thuật (R03) được tạo vùng
  if (currentRole !== 'R03') {
    return (
      <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl shadow-inner border-2 border-red-200">
          🚫
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-slate-900">Không có quyền thao tác</h3>
          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            Chức năng khảo sát và cấp mã số vùng trồng/sản xuất (MSVT) chỉ dành riêng cho Cán bộ Kỹ thuật HTX (R03). Hộ nông dân chỉ xem và sử dụng vùng đã được cấp.
          </p>
        </div>
        <button
          onClick={goBack}
          className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs shadow active:scale-95"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // Danh sách xã viên đang hoạt động của HTX hiện tại (chủ hộ phải được chọn từ danh sách này)
  const activeMembers = useMemo(() => {
    return members.filter((m) => m.htxId === currentHTX.id && m.status === 'active');
  }, [members, currentHTX.id]);

  // Gợi ý mã MSVT tự động không trùng
  const suggestedCode = useMemo(() => {
    const prefix =
      currentHTX.id === 'dongtao'
        ? 'MSVT-DT'
        : currentHTX.id === 'quyetthang'
        ? 'MSVT-QT'
        : 'MSVT-AN';
    const count = farmZones.filter((z) => z.htxId === currentHTX.id).length + 1;
    let code = `${prefix}-0${count}`;
    let suffix = count;
    while (farmZones.some((z) => z.zoneCode?.toLowerCase() === code.toLowerCase())) {
      suffix += 1;
      code = `${prefix}-0${suffix}`;
    }
    return code;
  }, [currentHTX.id, farmZones]);

  // Default production type based on HTX
  const defaultProductionType = useMemo((): 'Trồng trọt' | 'Chăn nuôi' | 'Thủy sản' | 'Cây ăn quả' => {
    if (currentHTX.id === 'dongtao') return 'Chăn nuôi';
    if (currentHTX.id === 'quyetthang') return 'Cây ăn quả';
    return 'Trồng trọt';
  }, [currentHTX.id]);

  // Form states
  const [name, setName] = useState('');
  const [zoneCode, setZoneCode] = useState(suggestedCode);
  const [productionType, setProductionType] = useState<'Trồng trọt' | 'Chăn nuôi' | 'Thủy sản' | 'Cây ăn quả'>(defaultProductionType);
  const [ownerId, setOwnerId] = useState(activeMembers[0]?.id || '');
  
  // Quy mô
  const [areaValue, setAreaValue] = useState<number>(
    defaultProductionType === 'Chăn nuôi' ? 500 : defaultProductionType === 'Cây ăn quả' ? 1.5 : 3500
  );
  const [areaUnit, setAreaUnit] = useState<string>(
    defaultProductionType === 'Chăn nuôi' ? 'con' : defaultProductionType === 'Cây ăn quả' ? 'ha' : 'm²'
  );

  // Giống
  const [variety, setVariety] = useState(
    currentHTX.id === 'dongtao'
      ? 'Gà Đông Tảo thuần chủng F1'
      : currentHTX.id === 'quyetthang'
      ? 'Nhãn lồng tiến vua Hương Chi'
      : 'Lúa giống Bắc Thơm số 7'
  );

  // Mùa vụ
  const seasonOptions = (SEASONS_BY_HTX[currentHTX.id] || []).filter((s) => s.id !== 'all');
  const [season, setSeason] = useState(seasonOptions[0]?.name?.replace(/[^a-zA-Z0-9\sÀ-ỹ]/g, '').trim() || 'Vụ Xuân 2026');

  // Thổ nhưỡng / Nguồn nước
  const [soilOrWaterCondition, setSoilOrWaterCondition] = useState(
    currentHTX.id === 'dongtao'
      ? 'Vườn đồi cát pha thoát nước tốt, nguồn nước giếng khoan qua lọc vi sinh'
      : currentHTX.id === 'quyetthang'
      ? 'Đất phù sa bãi bồi sông Hồng màu mỡ, tưới nhỏ giọt tự động'
      : 'Đất phù sa sông Hồng màu mỡ, mương tưới tiêu tự chảy thuận tiện'
  );

  // Sản lượng dự kiến
  const [expectedYieldValue, setExpectedYieldValue] = useState<number>(2.2);
  const [expectedYieldUnit, setExpectedYieldUnit] = useState<string>('tấn');

  // Ngày thu hoạch dự kiến (mặc định sau 3 tháng)
  const defaultHarvestDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  }, []);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState<string>(defaultHarvestDate);

  const [notes, setNotes] = useState('Đã kiểm tra thổ nhưỡng & đáp ứng quy trình VietGAP của HTX.');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Khi thay đổi loại hình sản xuất, cập nhật đơn vị quy mô và đơn vị sản lượng tương ứng
  const handleProductionTypeChange = (type: 'Trồng trọt' | 'Chăn nuôi' | 'Thủy sản' | 'Cây ăn quả') => {
    setProductionType(type);
    if (type === 'Chăn nuôi') {
      setAreaUnit('con');
      setExpectedYieldUnit('tấn');
      setVariety('Gà Đông Tảo thuần chủng F1');
    } else if (type === 'Thủy sản') {
      setAreaUnit('m²');
      setExpectedYieldUnit('tấn');
      setVariety('Cá chuối hoa & Cá chép giòn');
    } else if (type === 'Cây ăn quả') {
      setAreaUnit('ha');
      setExpectedYieldUnit('tấn');
      setVariety('Nhãn lồng tiến vua Hương Chi');
    } else {
      setAreaUnit('m²');
      setExpectedYieldUnit('tấn');
      setVariety('Lúa giống Bắc Thơm số 7');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Kiểm tra trường bắt buộc
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập Tên vùng sản xuất / thửa ruộng.');
      return;
    }
    if (!zoneCode.trim()) {
      setErrorMsg('Vui lòng nhập Mã số vùng trồng / sản xuất (MSVT).');
      return;
    }

    // 2. Kiểm tra trùng lặp MSVT
    const cleanCode = zoneCode.trim().toLowerCase();
    if (farmZones.some((z) => z.zoneCode?.trim().toLowerCase() === cleanCode)) {
      setErrorMsg(`Mã số vùng trồng "${zoneCode.trim()}" đã tồn tại. Vui lòng chọn mã khác.`);
      return;
    }

    // 3. Kiểm tra chủ hộ
    const selectedOwner = activeMembers.find((m) => m.id === ownerId);
    if (!selectedOwner) {
      setErrorMsg('Vui lòng chọn Hộ nông dân phụ trách từ danh sách thành viên HTX.');
      return;
    }

    // 4. Kiểm tra số dương
    if (isNaN(areaValue) || areaValue <= 0) {
      setErrorMsg('Quy mô canh tác phải là số dương lớn hơn 0.');
      return;
    }
    if (isNaN(expectedYieldValue) || expectedYieldValue <= 0) {
      setErrorMsg('Sản lượng dự kiến phải là số dương lớn hơn 0.');
      return;
    }

    // 5. Kiểm tra ngày thu hoạch
    if (!expectedHarvestDate) {
      setErrorMsg('Vui lòng chọn ngày thu hoạch dự kiến.');
      return;
    }

    const defaultImages = {
      anninh: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
      dongtao: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&auto=format&fit=crop&q=80',
      quyetthang: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=600&auto=format&fit=crop&q=80',
    };

    const formattedHarvestDate = expectedHarvestDate.includes('-')
      ? expectedHarvestDate.split('-').reverse().join('/')
      : expectedHarvestDate;

    const res = addFarmZone({
      zoneCode: zoneCode.trim().toUpperCase(),
      htxId: currentHTX.id,
      ownerId: selectedOwner.id,
      ownerName: selectedOwner.name,
      name: name.trim(),
      productionType,
      variety: variety.trim(),
      season,
      seasonStartDate: new Date().toLocaleDateString('vi-VN'),
      seasonEndDate: formattedHarvestDate,
      seasonStage: 'Mới xuống giống - làm đất (Ngày 1)',
      areaValue: Number(areaValue),
      areaUnit,
      areaOrQuantity: `${areaValue.toLocaleString()} ${areaUnit}`,
      expectedYieldValue: Number(expectedYieldValue),
      expectedYieldUnit,
      expectedHarvestDate: formattedHarvestDate,
      forecastYield: `Dự kiến thu: ${expectedYieldValue} ${expectedYieldUnit} — ngày ${formattedHarvestDate}`,
      soilOrWaterCondition: soilOrWaterCondition.trim(),
      status: 'Đang canh tác',
      imageUrl: defaultImages[currentHTX.id] || defaultImages.anninh,
      notes: notes.trim(),
    });

    if (!res.success) {
      setErrorMsg(res.message || 'Lỗi khi lưu vùng sản xuất.');
      return;
    }

    alert(`Đã cấp mã vùng trồng "${zoneCode}" cho hộ bác ${selectedOwner.name} thành công!`);
    goBack();
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Khảo sát & Cấp mã vùng trồng"
        voiceText="Cán bộ Kỹ thuật khảo sát và cấp mã số vùng trồng MSVT cho hộ thành viên. Vùng sau khi tạo sẽ gắn trực tiếp vào tài khoản của hộ để ghi nhật ký và khai báo thu hoạch."
      />

      <div className="p-4 space-y-4">
        {/* Banner hướng dẫn nghiệp vụ R03 */}
        <div className="p-4 bg-cyan-50 border-2 border-cyan-300 rounded-3xl text-xs space-y-1.5 text-cyan-950 shadow-sm">
          <div className="flex items-center gap-1.5 font-extrabold text-sm text-cyan-900">
            <span>🔬</span>
            <span>Quyền hạn Cán bộ Kỹ thuật (R03):</span>
          </div>
          <p className="leading-relaxed font-medium text-cyan-900">
            Mỗi vùng sản xuất được cấp một mã số định danh <strong>MSVT</strong> duy nhất. Vui lòng chọn đúng <strong>Hộ thành viên</strong> đang hoạt động trong HTX để phân quyền ghi chép nhật ký đồng ruộng.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border-2 border-red-300 rounded-2xl text-xs font-bold text-red-800 flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          {/* 1. Mã số vùng trồng / MSVT */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              1. Mã số vùng trồng / sản xuất (MSVT): <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={zoneCode}
              onChange={(e) => setZoneCode(e.target.value.toUpperCase())}
              placeholder="VD: MSVT-AN-01"
              className="w-full h-12 px-3.5 rounded-xl border-2 border-slate-300 text-base font-extrabold text-slate-900 font-mono bg-slate-50 focus:border-cyan-600 focus:outline-none"
              required
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block font-medium">
              Mã duy nhất theo chuẩn quản lý CSDL Sở NN&PTNT
            </span>
          </div>

          {/* 2. Tên vùng / trại / ao */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              2. Tên vùng sản xuất / Thửa đất / Trại nuôi: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Thửa Đầm Bông, Chuồng A1, Vườn Ba Hàng..."
              className="w-full h-12 px-3.5 rounded-xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-cyan-600 focus:outline-none"
              required
            />
          </div>

          {/* 3. Loại hình sản xuất */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              3. Loại hình sản xuất: <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Trồng trọt', 'Chăn nuôi', 'Cây ăn quả', 'Thủy sản'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => handleProductionTypeChange(type)}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs border-2 text-center transition-all ${
                    productionType === type
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-900 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {type === 'Trồng trọt' ? '🌾 Trồng trọt' : type === 'Chăn nuôi' ? '🐓 Chăn nuôi' : type === 'Cây ăn quả' ? '🍈 Cây ăn quả' : '🐟 Thủy sản'}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Chủ hộ phụ trách */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              4. Hộ nông dân phụ trách (Chủ hộ): <span className="text-red-500">*</span>
            </label>
            {activeMembers.length === 0 ? (
              <p className="text-xs text-red-600 italic">Không có thành viên hoạt động nào trong HTX.</p>
            ) : (
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-cyan-600 focus:outline-none"
                required
              >
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.phone} ({m.address || 'HTX'})
                  </option>
                ))}
              </select>
            )}
            <span className="text-[11px] text-slate-400 mt-0.5 block font-medium">
              Chỉ thành viên được chọn mới có quyền ghi nhật ký & thu hoạch tại vùng này
            </span>
          </div>

          {/* 5. Quy mô sản xuất */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              5. Quy mô diện tích / đàn nuôi: <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min="0.1"
                step="any"
                value={areaValue}
                onChange={(e) => setAreaValue(parseFloat(e.target.value) || 0)}
                className="col-span-2 h-12 px-3.5 rounded-xl border-2 border-slate-300 text-base font-extrabold text-slate-900 bg-slate-50 focus:border-cyan-600 focus:outline-none"
                required
              />
              <select
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value)}
                className="h-12 px-2 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-cyan-600 focus:outline-none"
              >
                <option value="m²">m²</option>
                <option value="sào">sào Bắc Bộ</option>
                <option value="ha">hecta (ha)</option>
                <option value="con">con</option>
                <option value="chuồng">chuồng</option>
                <option value="lồng">lồng</option>
              </select>
            </div>
          </div>

          {/* 6. Giống cây / con */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              6. Giống cây trồng / con nuôi: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              placeholder="VD: Lúa giống Bắc Thơm 7, Gà thuần chủng..."
              className="w-full h-12 px-3.5 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-cyan-600 focus:outline-none"
              required
            />
          </div>

          {/* 7. Mùa vụ */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              7. Mùa vụ canh tác: <span className="text-red-500">*</span>
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full h-12 px-3 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-cyan-600 focus:outline-none"
            >
              {seasonOptions.map((s) => (
                <option key={s.id} value={s.name.replace(/[^a-zA-Z0-9\sÀ-ỹ]/g, '').trim()}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 8. Đặc điểm đất hoặc nguồn nước */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              8. Đặc điểm đất hoặc nguồn nước: <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={soilOrWaterCondition}
              onChange={(e) => setSoilOrWaterCondition(e.target.value)}
              placeholder="Mô tả thổ nhưỡng, độ phì nhiêu, nguồn nước giếng/mương..."
              className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-medium focus:border-cyan-600 focus:outline-none bg-slate-50"
              required
            />
          </div>

          {/* 9. Sản lượng dự kiến */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              9. Sản lượng dự kiến thu hoạch: <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min="0.1"
                step="any"
                value={expectedYieldValue}
                onChange={(e) => setExpectedYieldValue(parseFloat(e.target.value) || 0)}
                className="col-span-2 h-12 px-3.5 rounded-xl border-2 border-slate-300 text-base font-extrabold text-slate-900 bg-slate-50 focus:border-cyan-600 focus:outline-none"
                required
              />
              <select
                value={expectedYieldUnit}
                onChange={(e) => setExpectedYieldUnit(e.target.value)}
                className="h-12 px-2 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-cyan-600 focus:outline-none"
              >
                <option value="tấn">tấn</option>
                <option value="tạ">tạ</option>
                <option value="kg">kg</option>
                <option value="con">con</option>
              </select>
            </div>
          </div>

          {/* 10. Ngày thu hoạch dự kiến */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              10. Ngày thu hoạch dự kiến: <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={expectedHarvestDate}
              onChange={(e) => setExpectedHarvestDate(e.target.value)}
              className="w-full h-12 px-3.5 rounded-xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50 focus:border-cyan-600 focus:outline-none"
              required
            />
          </div>

          {/* 11. Ghi chú */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              11. Ghi chú kỹ thuật & kiểm tra VietGAP:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Quy trình bón lót, phòng trừ sâu bệnh, lịch cách ly..."
              className="w-full p-3 border-2 border-slate-200 rounded-xl text-xs font-medium focus:border-cyan-600 focus:outline-none bg-slate-50"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-cyan-700 hover:bg-cyan-800 active:scale-95 text-white text-base font-extrabold shadow-lg shadow-cyan-700/30 flex items-center justify-center gap-2 mt-4"
          >
            <span>💾</span>
            <span>CẤP MÃ SỐ VÙNG TRỒNG (MSVT)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
