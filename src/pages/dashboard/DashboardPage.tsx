import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const DashboardPage: React.FC = () => {
  const { currentRole, currentHTX, currentUser, orders, inventory, members, farmZones } = useApp();

  // SRS Compliance: Only 'Hoàn thành' orders are counted towards realized revenue
  const completedOrders = orders.filter((o) => o.status === 'Hoàn thành');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'Mới' || o.status === 'Đang giao');
  const totalStockValue = inventory.reduce((sum, item) => sum + item.stock * (item.unitPrice || 0), 0);

  // Scoped metrics for household R06
  const myOrders = currentRole === 'R06'
    ? orders.filter((o) => o.sellerId === currentUser.id || (!o.sellerId && currentHTX.id === 'anninh'))
    : orders;
  const myCompletedOrders = myOrders.filter((o) => o.status === 'Hoàn thành');
  const myRevenue = myCompletedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // CN-3.4.3: 3 tabs Báo cáo quản trị cho Lãnh đạo HTX (R02)
  const [reportTab, setReportTab] = useState<'members' | 'production' | 'sales'>('production');
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  const getDashboardTitle = () => {
    switch (currentRole) {
      case 'R02':
        return 'Báo cáo quản trị HTX';
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
          /* CN-3.4.1 & CN-3.4.3: Dashboard & Báo cáo quản trị lãnh đạo HTX (R02) */
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-3xl p-5 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-200">
                  TỔNG QUAN HỢP TÁC XÃ
                </span>
                {/* Bộ lọc thời gian */}
                <div className="flex bg-black/30 rounded-xl p-0.5 gap-0.5 text-[11px] font-bold">
                  <button
                    onClick={() => setTimeRange('month')}
                    className={`px-2 py-0.5 rounded-lg ${timeRange === 'month' ? 'bg-white text-emerald-950 font-black' : 'text-emerald-100'}`}
                  >
                    Tháng
                  </button>
                  <button
                    onClick={() => setTimeRange('quarter')}
                    className={`px-2 py-0.5 rounded-lg ${timeRange === 'quarter' ? 'bg-white text-emerald-950 font-black' : 'text-emerald-100'}`}
                  >
                    Quý
                  </button>
                  <button
                    onClick={() => setTimeRange('year')}
                    className={`px-2 py-0.5 rounded-lg ${timeRange === 'year' ? 'bg-white text-emerald-950 font-black' : 'text-emerald-100'}`}
                  >
                    Năm
                  </button>
                </div>
              </div>
              <h3 className="text-2xl font-extrabold">{currentHTX.name}</h3>
              <p className="text-xs text-emerald-100 flex items-center justify-between">
                <span>Kỳ báo cáo: {timeRange === 'month' ? 'Tháng 09/2026' : timeRange === 'quarter' ? 'Quý III/2026' : 'Năm 2026'}</span>
                <span className="text-[10px] text-emerald-300/80 italic font-mono">[Mô phỏng demo]</span>
              </p>
            </div>

            {/* CN-3.4.3: 3 TAB BÁO CÁO QUẢN TRỊ */}
            <div className="flex bg-slate-200 p-1 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setReportTab('members')}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                  reportTab === 'members'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 Thành viên
              </button>
              <button
                type="button"
                onClick={() => setReportTab('production')}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                  reportTab === 'production'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🌾 Sản xuất
              </button>
              <button
                type="button"
                onClick={() => setReportTab('sales')}
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                  reportTab === 'sales'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💰 Bán hàng
              </button>
            </div>

            {/* TAB 1: BÁO CÁO THÀNH VIÊN */}
            {reportTab === 'members' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                    <span className="text-2xl">👥</span>
                    <span className="text-xs font-bold text-slate-500 block">Tổng thành viên</span>
                    <span className="text-2xl font-extrabold text-slate-900">{members.length || 128}</span>
                    <span className="text-[11px] text-emerald-700 font-bold block">100% chính thức</span>
                  </div>
                  <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                    <span className="text-2xl">🌱</span>
                    <span className="text-xs font-bold text-slate-500 block">Số tổ sản xuất</span>
                    <span className="text-2xl font-extrabold text-slate-900">3 tổ</span>
                    <span className="text-[11px] text-blue-700 font-bold block">Đầy đủ tổ trưởng</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-base font-extrabold text-slate-900">Phân bố thành viên theo tổ</h4>
                  <div className="space-y-2.5 pt-1">
                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-800">Tổ 1 - Canh tác chính</div>
                        <div className="text-xs text-slate-500">Tổ trưởng: Bác Nguyễn Văn Thắng</div>
                      </div>
                      <span className="text-sm font-black text-emerald-800">45 hộ</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-800">Tổ 2 - Giống chất lượng cao</div>
                        <div className="text-xs text-slate-500">Tổ trưởng: Bác Trần Văn Tuấn</div>
                      </div>
                      <span className="text-sm font-black text-emerald-800">42 hộ</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-800">Tổ 3 - Mở rộng hữu cơ</div>
                        <div className="text-xs text-slate-500">Tổ trưởng: Bác Hoàng Thị Mai</div>
                      </div>
                      <span className="text-sm font-black text-emerald-800">41 hộ</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BÁO CÁO SẢN XUẤT */}
            {reportTab === 'production' && (
              <div className="space-y-4">
                {/* 4 Executive KPI Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                    <span className="text-2xl">👥</span>
                    <span className="text-xs font-bold text-slate-500 block">Tổng thành viên</span>
                    <span className="text-2xl font-extrabold text-slate-900">{members.length || 128}</span>
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
                    <span className="text-2xl">🗺️</span>
                    <span className="text-xs font-bold text-slate-500 block">Thửa ruộng / vùng</span>
                    <span className="text-2xl font-extrabold text-slate-900">{farmZones.length} vùng</span>
                    <span className="text-[11px] text-emerald-700 font-bold block">Đã cấp mã QR</span>
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

            {/* TAB 3: BÁO CÁO BÁN HÀNG */}
            {reportTab === 'sales' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                    <span className="text-2xl">💰</span>
                    <span className="text-xs font-bold text-slate-500 block">Doanh thu thực thu</span>
                    <span className="text-xl font-extrabold text-purple-900">{totalRevenue.toLocaleString()} đ</span>
                    <span className="text-[11px] text-emerald-700 font-bold block">{completedOrders.length} đơn hoàn thành</span>
                  </div>

                  <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-1">
                    <span className="text-2xl">🏬</span>
                    <span className="text-xs font-bold text-slate-500 block">Giá trị kho vật tư</span>
                    <span className="text-xl font-extrabold text-amber-900">{totalStockValue.toLocaleString()} đ</span>
                    <span className="text-[11px] text-blue-700 font-bold block">{inventory.length} mặt hàng</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-base font-extrabold text-slate-900">Danh mục bán hoàn thành</h4>
                  <div className="space-y-2">
                    {completedOrders.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Chưa có đơn hàng nào hoàn thành trong kỳ.</p>
                    ) : (
                      completedOrders.map((o) => (
                        <div key={o.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-slate-800">{o.productName}</div>
                            <div className="text-slate-500">{o.customerName} • {o.quantity} {o.unit}</div>
                          </div>
                          <span className="font-extrabold text-purple-900 text-sm">{o.totalAmount.toLocaleString()} đ</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
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
                    3. Doanh thu xuất bán (thực thu)
                  </span>
                  <div className="text-2xl font-extrabold text-purple-900 mt-1">
                    {myRevenue.toLocaleString()} đ
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">{myCompletedOrders.length} đơn hoàn thành / {myOrders.length} đơn</span>
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
