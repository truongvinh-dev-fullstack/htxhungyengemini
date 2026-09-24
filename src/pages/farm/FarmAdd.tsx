import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const FarmAdd: React.FC = () => {
  const { currentHTX, currentUser, addFarmZone, goBack, speakText } = useApp();

  const [name, setName] = useState('');
  const [area, setArea] = useState('3.500 m² (7 sào Bắc Bộ)');
  const [variety, setVariety] = useState(
    currentHTX.id === 'dongtao'
      ? 'Gà Đông Tảo thuần chủng F1'
      : currentHTX.id === 'quyetthang'
      ? 'Nhãn lồng tiến vua Hương Chi'
      : 'Lúa giống Bắc Thơm số 7'
  );
  const [season, setSeason] = useState('Vụ Xuân 2026');
  const [notes, setNotes] = useState('Ruộng màu mỡ, hệ thống mương tưới tiêu tự chảy thuận tiện.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên thửa ruộng hoặc khu nuôi.');
      return;
    }

    const defaultImages = {
      anninh: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
      dongtao: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&auto=format&fit=crop&q=80',
      quyetthang: 'https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=600&auto=format&fit=crop&q=80',
    };

    addFarmZone({
      htxId: currentHTX.id,
      ownerId: currentUser.id,
      name: name.trim(),
      variety,
      season,
      seasonStartDate: '15/01/2026',
      seasonEndDate: '30/05/2026',
      seasonStage: 'Mới làm đất - xuống giống (Ngày 1)',
      areaOrQuantity: area,
      forecastYield: currentHTX.id === 'dongtao' ? 'Dự kiến: 1,5 tấn thịt' : 'Dự kiến: 2,0 tấn',
      status: 'Đang canh tác',
      imageUrl: defaultImages[currentHTX.id] || defaultImages.anninh,
      notes,
    });

    speakText(`Đã tạo thành công thửa ruộng ${name}. Thửa đất này sẽ được lưu giữ lịch sử qua mọi mùa vụ.`);
    alert(`Đã lưu thửa ruộng "${name}" thành công!`);
    goBack();
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Khai báo thửa ruộng mới"
        voiceText="Bác khai báo thửa ruộng hoặc chuồng nuôi của gia đình. Thửa đất sẽ được gắn mã số cố định để theo dõi lịch sử qua các mùa vụ canh tác."
      />

      <div className="p-4 space-y-4">
        {/* Banner giải thích nghiệp vụ */}
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl text-xs space-y-1 text-amber-950">
          <div className="flex items-center gap-1.5 font-extrabold text-sm">
            <span>ℹ️</span>
            <span>Tư liệu sản xuất cố định của hộ nông dân:</span>
          </div>
          <p className="leading-relaxed font-medium text-amber-900">
            Mỗi thửa ruộng hoặc khu chuồng chỉ cần khai báo <strong>1 lần duy nhất</strong>. Khi sang mùa vụ mới, bác chỉ cần chọn thửa này và bấm <em>&quot;Bắt đầu vụ mới&quot;</em> mà không cần tạo lại.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              1. Tên thửa ruộng / Khu chuồng / Ao: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Thửa Bãi Soi, Thửa Cánh Đồng Chợ..."
              className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              2. Diện tích canh tác hoặc Quy mô: <span className="text-red-500">*</span>
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
            >
              <option value="1.800 m² (3,6 sào Bắc Bộ)">1.800 m² (3,6 sào Bắc Bộ)</option>
              <option value="2.500 m² (5 sào Bắc Bộ)">2.500 m² (5 sào Bắc Bộ)</option>
              <option value="3.500 m² (7 sào Bắc Bộ)">3.500 m² (7 sào Bắc Bộ)</option>
              <option value="5.000 m² (1 mẫu Bắc Bộ)">5.000 m² (1 mẫu Bắc Bộ)</option>
              <option value="1,2 hecta (120 gốc cây)">1,2 hecta (120 gốc cây)</option>
              <option value="500 con gà thả vườn">500 con gà thả vườn</option>
              <option value="Ao nuôi 2.000 m² mặt nước">Ao nuôi 2.000 m² mặt nước</option>
            </select>
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              3. Mùa vụ đầu tiên áp dụng:
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
            >
              <option value="Vụ Xuân 2026">🌾 Vụ Xuân 2026 (Chính vụ)</option>
              <option value="Vụ Mùa 2026">☀️ Vụ Mùa 2026</option>
              <option value="Lứa nuôi Tết 2026">🐔 Lứa nuôi Tết 2026</option>
              <option value="Vụ Nhãn 2026">🌳 Vụ Nhãn 2026</option>
            </select>
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              4. Giống cây trồng / Vật nuôi áp dụng:
            </label>
            <select
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
            >
              {currentHTX.id === 'dongtao' ? (
                <>
                  <option value="Gà Đông Tảo thuần chủng F1">Gà Đông Tảo thuần chủng F1 chân to</option>
                  <option value="Gà Đông Tảo lai thả vườn">Gà Đông Tảo lai thả vườn</option>
                  <option value="Gà giống 1 tháng tuổi">Gà giống 1 tháng tuổi</option>
                </>
              ) : currentHTX.id === 'quyetthang' ? (
                <>
                  <option value="Nhãn lồng tiến vua Hương Chi">Nhãn lồng tiến vua Hương Chi</option>
                  <option value="Nhãn Miền Thiết Hưng Yên">Nhãn Miền Thiết Hưng Yên</option>
                  <option value="Cá lăng lồng sông Luộc">Cá lăng lồng sông Luộc</option>
                </>
              ) : (
                <>
                  <option value="Lúa giống Bắc Thơm số 7">Lúa giống Bắc Thơm số 7 thuần</option>
                  <option value="Lúa giống ST25 Hưng Yên">Lúa giống ST25 Hưng Yên</option>
                  <option value="Lúa giống nếp cái hoa vàng">Lúa giống nếp cái hoa vàng</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              5. Ghi chú vị trí & đặc điểm đất đai:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vị trí thửa đất, đường nước, chất đất..."
              className="w-full p-3 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:border-amber-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-amber-700 hover:bg-amber-800 active:scale-95 text-white text-xl font-extrabold shadow-lg shadow-amber-700/30 flex items-center justify-center gap-2 mt-4"
          >
            <span>💾</span>
            <span>LƯU THỬA RUỘNG MỚI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
