import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const DashboardPage: React.FC = () => {
  const { currentRole, currentHTX, currentUser, orders } = useApp();

  const isLeader = currentRole === 'R02';
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={isLeader ? 'Báo cáo toàn HTX' : 'Báo cáo của tôi'}
        voiceText={
          isLeader
            ? `Báo cáo tổng hợp toàn ${currentHTX.name} dành cho ban quản trị. Tổng số 128 thành viên, 185 hecta diện tích canh tác.`
            : `Báo cáo cá nhân của bác ${currentUser.name}. Diện tích 6.000 mét vuông, sản lượng vụ này 3,7 tấn, doanh thu tháng đạt ${totalRevenue.toLocaleString()} đồng.`
        }
      />

      <div className="p-4 space-y-4">
        {isLeader ? (
          /* CN-3.4.1: Dashboard lãnh đạo HTX (R02) */
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-3xl p-5 shadow-lg space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-200">
                TỔNG QUAN HỢP TÁC XÃ
              </span>
              <h3 className="text-2xl font-extrabold">{currentHTX.name}</h3>
              <p className="text-xs text-emerald-100">Cập nhật lúc 08:30 hôm nay</p>
            </div>

            {/* 4 Executive KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">👥</span>
                <span className="text-xs font-bold text-slate-500 block">Tổng thành viên</span>
                <span className="text-2xl font-extrabold text-slate-900">128</span>
                <span className="text-[11px] text-emerald-700 font-bold block">+3 hộ tháng này</span>
              </div>

              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">🌾</span>
                <span className="text-xs font-bold text-slate-500 block">Quy mô canh tác</span>
                <span className="text-2xl font-extrabold text-slate-900">185 ha</span>
                <span className="text-[11px] text-emerald-700 font-bold block">100% VietGAP</span>
              </div>

              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">🚜</span>
                <span className="text-xs font-bold text-slate-500 block">Sản lượng dự kiến</span>
                <span className="text-2xl font-extrabold text-slate-900">920 tấn</span>
                <span className="text-[11px] text-amber-700 font-bold block">Thu hoạch tháng 10</span>
              </div>

              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">💰</span>
                <span className="text-xs font-bold text-slate-500 block">Doanh thu quý</span>
                <span className="text-xl font-extrabold text-purple-900">2,85 tỷ đ</span>
                <span className="text-[11px] text-emerald-700 font-bold block">Đạt 95% chỉ tiêu</span>
              </div>
            </div>

            {/* Simple Bar Chart Visualization */}
            <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
              <h4 className="text-base font-extrabold text-slate-900">
                Sản lượng theo từng tổ sản xuất (tấn)
              </h4>
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Tổ 1 - Lúa sạch (Bác Thắng)</span>
                    <span>320 tấn (100%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Tổ 2 - Lúa đặc sản</span>
                    <span>280 tấn (88%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Tổ 3 - Giống lúa mới</span>
                    <span>190 tấn (60%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '55%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CN-3.4.2: Dashboard cho thành viên / Hộ nông dân (R06) */
          /* SRS: Tối đa 3 thẻ số liệu lớn + 1 biểu đồ đơn giản */
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-agri-800 to-agri-700 text-white rounded-3xl p-5 shadow-lg space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-wider text-agri-200">
                KẾT QUẢ SẢN XUẤT CỦA BÁC
              </span>
              <h3 className="text-2xl font-extrabold">{currentUser.name}</h3>
              <p className="text-xs text-agri-100">{currentUser.team} • Vụ Xuân 2026</p>
            </div>

            {/* 3 BIG KPI CARDS */}
            <div className="grid grid-cols-1 gap-3">
              {/* Card 1: Diện tích */}
              <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    1. Diện tích canh tác
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">6.000 m²</div>
                  <span className="text-xs text-slate-500 font-semibold">2 thửa ruộng chính (12 sào)</span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl">
                  📐
                </div>
              </div>

              {/* Card 2: Sản lượng */}
              <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    2. Sản lượng vụ này
                  </span>
                  <div className="text-3xl font-extrabold text-amber-900 mt-1">3,7 tấn</div>
                  <span className="text-xs text-emerald-700 font-bold">Đã thu hoạch 2 lô</span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl">
                  🌾
                </div>
              </div>

              {/* Card 3: Doanh thu */}
              <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    3. Doanh thu bán hàng
                  </span>
                  <div className="text-2xl font-extrabold text-purple-900 mt-1">
                    {totalRevenue.toLocaleString()} đ
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">{orders.length} đơn hàng</span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-3xl">
                  💵
                </div>
              </div>
            </div>

            {/* 1 Simple Progress Visual */}
            <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
              <h4 className="text-base font-extrabold text-slate-900">
                Tiến độ mùa vụ lúa Vụ Xuân 2026
              </h4>
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Giai đoạn: Nuôi đòng & trổ bông</span>
                  <span className="text-emerald-700 font-extrabold">Ngày thứ 68/95</span>
                </div>
                <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '72%' }} />
                </div>
                <div className="text-xs text-slate-500 text-center pt-1 font-semibold">
                  Khoảng 25 ngày nữa sẽ bước vào đợt gặt rộ
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
