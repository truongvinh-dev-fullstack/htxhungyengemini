import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const FarmAdd: React.FC = () => {
  const { currentHTX, goBack, speakText } = useApp();

  const [name, setName] = useState('');
  const [variety, setVariety] = useState(
    currentHTX.id === 'dongtao'
      ? 'Gà Đông Tảo thuần chủng F1'
      : currentHTX.id === 'quyetthang'
      ? 'Nhãn lồng tiến vua Hương Chi'
      : 'Lúa giống Bắc Thơm số 7'
  );
  const [season, setSeason] = useState('Vụ Xuân 2026');
  const [area, setArea] = useState('3.000 m² (6 sào Bắc Bộ)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    speakText('Đã thêm vùng sản xuất mới thành công!');
    alert('Thêm vùng sản xuất thành công!');
    goBack();
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Thêm vùng sản xuất"
        voiceText="Bác hãy chọn giống và mùa vụ có sẵn từ danh mục để tạo thửa ruộng hoặc chuồng nuôi mới."
      />

      <div className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              1. Tên thửa ruộng / Khu chuồng / Ao: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Thửa Cánh Đồng Chợ..."
              className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              2. Chọn Giống cây / Con giống (Có sẵn): <span className="text-red-500">*</span>
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
              3. Chọn Mùa vụ áp dụng: <span className="text-red-500">*</span>
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
            >
              <option value="Vụ Xuân 2026">Vụ Xuân 2026 (Bắt đầu từ tháng 01)</option>
              <option value="Vụ Mùa 2026">Vụ Mùa 2026 (Bắt đầu từ tháng 06)</option>
              <option value="Lứa nuôi Tết 2026">Lứa nuôi Tết 2026</option>
            </select>
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              4. Diện tích canh tác hoặc Quy mô:
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-amber-600 focus:outline-none"
            >
              <option value="2.500 m² (5 sào Bắc Bộ)">2.500 m² (5 sào Bắc Bộ)</option>
              <option value="3.500 m² (7 sào Bắc Bộ)">3.500 m² (7 sào Bắc Bộ)</option>
              <option value="5.000 m² (1 mẫu Bắc Bộ)">5.000 m² (1 mẫu Bắc Bộ)</option>
              <option value="1,2 hecta (120 gốc cây)">1,2 hecta (120 gốc cây)</option>
              <option value="500 con gà thả vườn">500 con gà thả vườn</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-amber-700 hover:bg-amber-800 active:scale-95 text-white text-xl font-extrabold shadow-lg shadow-amber-700/30 flex items-center justify-center gap-2 mt-4"
          >
            <span>💾</span>
            <span>LƯU VÙNG SẢN XUẤT</span>
          </button>
        </form>
      </div>
    </div>
  );
};
