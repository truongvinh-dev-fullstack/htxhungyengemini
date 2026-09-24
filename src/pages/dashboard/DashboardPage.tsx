import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const DashboardPage: React.FC = () => {
  const { currentRole, currentHTX, currentUser, orders, inventory } = useApp();

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalStockValue = inventory.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const getDashboardTitle = () => {
    switch (currentRole) {
      case 'R02':
        return 'Báo cáo toàn HTX';
      case 'R04':
        return 'Báo cáo Doanh thu & Bán hàng';
      case 'R03':
        return 'Báo cáo Kỹ thuật & Mùa vụ';
      case 'R05':
        return 'Báo cáo Tổ sản xuất';
      case 'R06':
      default:
        return 'Báo cáo mùa vụ của tôi';
    }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={getDashboardTitle()}
        voiceText={`Báo cáo ${getDashboardTitle()} ${currentHTX.name}.`}
      />

      <div className="p-4 space-y-4">
        {currentRole === 'R02' && (
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
                <span className="text-[11px] text-amber-700 font-bold block">Thu hoạch vụ Xuân</span>
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
        )}

        {currentRole === 'R04' && (
          /* Dashboard Kế toán / Bán hàng (R04) */
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-800 text-white rounded-3xl p-5 shadow-lg space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-200">
                TỔNG KẾT DOANH THU & KHO
              </span>
              <h3 className="text-2xl font-extrabold">{currentUser.name}</h3>
              <p className="text-xs text-purple-100">Ban Kế toán & Quản lý bán hàng HTX</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">💰</span>
                <span className="text-xs font-bold text-slate-500 block">Doanh thu đơn hàng</span>
                <span className="text-xl font-extrabold text-purple-900">{totalRevenue.toLocaleString()} đ</span>
                <span className="text-[11px] text-emerald-700 font-bold block">{orders.length} đơn đã tạo</span>
              </div>

              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">🏬</span>
                <span className="text-xs font-bold text-slate-500 block">Giá trị tồn kho</span>
                <span className="text-xl font-extrabold text-amber-900">{totalStockValue.toLocaleString()} đ</span>
                <span className="text-[11px] text-blue-700 font-bold block">{inventory.length} danh mục vật tư</span>
              </div>

              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">📦</span>
                <span className="text-xs font-bold text-slate-500 block">Đơn hoàn thành</span>
                <span className="text-2xl font-extrabold text-emerald-700">100%</span>
                <span className="text-[11px] text-slate-500 font-medium block">Không có khiếu nại</span>
              </div>

              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">🤝</span>
                <span className="text-xs font-bold text-slate-500 block">Khách hàng / Đối tác</span>
                <span className="text-2xl font-extrabold text-slate-900">18 đối tác</span>
                <span className="text-[11px] text-emerald-700 font-bold block">Siêu thị & đại lý</span>
              </div>
            </div>
          </div>
        )}

        {currentRole === 'R03' && (
          /* Dashboard Cán bộ kỹ thuật (R03) */
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-cyan-800 to-blue-800 text-white rounded-3xl p-5 shadow-lg space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-200">
                CHỈ SỐ GIÁM SÁT KỸ THUẬT & MÙA VỤ
              </span>
              <h3 className="text-2xl font-extrabold">{currentUser.name}</h3>
              <p className="text-xs text-cyan-100">Tổ Kỹ thuật Nông nghiệp & Quản lý chất lượng</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">🌾</span>
                <span className="text-xs font-bold text-slate-500 block">Diện tích giám sát</span>
                <span className="text-2xl font-extrabold text-slate-900">185 ha</span>
                <span className="text-[11px] text-emerald-700 font-bold block">100% chuẩn VietGAP</span>
              </div>

              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">📖</span>
                <span className="text-xs font-bold text-slate-500 block">Tỷ lệ nộp nhật ký</span>
                <span className="text-2xl font-extrabold text-emerald-700">94.5%</span>
                <span className="text-[11px] text-slate-500 font-medium block">Kiểm tra định kỳ</span>
              </div>

              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">🧪</span>
                <span className="text-xs font-bold text-slate-500 block">Lô sơ chế đạt chuẩn</span>
                <span className="text-2xl font-extrabold text-cyan-800">100%</span>
                <span className="text-[11px] text-emerald-700 font-bold block">Đạt tiêu chuẩn an toàn</span>
              </div>

              <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                <span className="text-2xl">📦</span>
                <span className="text-xs font-bold text-slate-500 block">Tem QR đã cấp</span>
                <span className="text-2xl font-extrabold text-blue-900">15.000</span>
                <span className="text-[11px] text-emerald-700 font-bold block">Truy xuất minh bạch</span>
              </div>
            </div>
          </div>
        )}

        {(currentRole === 'R06' || currentRole === 'R05') && (
          /* CN-3.4.2: Dashboard cho thành viên / Hộ nông dân (R06) & Tổ trưởng (R05) */
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-agri-800 to-agri-700 text-white rounded-3xl p-5 shadow-lg space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-wider text-agri-200">
                {currentRole === 'R05' ? 'KẾT QUẢ SẢN XUẤT TỔ' : 'KẾT QUẢ SẢN XUẤT CỦA BÁC'}
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
