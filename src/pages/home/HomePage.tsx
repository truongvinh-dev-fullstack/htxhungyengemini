import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { canAccessScreen } from '../../utils/permissions';

export const HomePage: React.FC = () => {
  const {
    currentUser,
    currentHTX,
    currentRole,
    currentCoopConfig,
    navigateTo,
    todayHasDiary,
    notifications,
    getMobileQuickSummary,
  } = useApp();

  const quickSummary = getMobileQuickSummary();

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'R02':
        return { label: 'Ban Quản trị HTX', color: 'bg-indigo-100 text-indigo-950 border-indigo-300' };
      case 'R03':
        return { label: 'Cán bộ Kỹ thuật', color: 'bg-cyan-100 text-cyan-950 border-cyan-300' };
      case 'R04':
        return { label: 'Kế toán / Bán hàng', color: 'bg-amber-100 text-amber-950 border-amber-300' };
      case 'R06':
      default:
        return { label: 'Hộ nông dân / Xã viên', color: 'bg-emerald-100 text-emerald-950 border-emerald-300' };
    }
  };

  const roleBadge = getRoleBadge();

  // Định nghĩa các nút chức năng theo đúng vai trò (Role-Based Action Items)
  const getActionCards = () => {
    switch (currentRole) {
      case 'R04': // KẾ TOÁN / BÁN HÀNG:
        return [
          {
            id: 'product_stock',
            title: 'Kho thành phẩm HTX',
            subtitle: 'Hàng HTX giữ (sở hữu & hộ ký gửi)',
            icon: '📦',
            color: 'bg-blue-100 text-blue-900',
            border: 'hover:border-blue-600',
            screen: 'product_stock_list',
          },
          {
            id: 'inventory',
            title: 'Kho vật tư HTX',
            subtitle: 'Quản lý nhập/xuất giống, phân, thuốc',
            icon: '🏬',
            color: 'bg-amber-100 text-amber-800',
            border: 'hover:border-amber-600',
            screen: 'inventory_list',
          },
          {
            id: 'sales',
            title: 'Đơn hàng & Bán hàng',
            subtitle: 'Quản lý đơn bán & đối tác',
            icon: '🛒',
            color: 'bg-purple-100 text-purple-800',
            border: 'hover:border-purple-600',
            screen: 'sales_list',
          },
          {
            id: 'handover',
            title: 'Hộp phiếu gửi HTX',
            subtitle: 'Kiểm nhận mua đứt & ký gửi',
            icon: '⚖️',
            color: 'bg-sky-100 text-sky-900',
            border: 'hover:border-sky-600',
            screen: 'handover_list',
          },
          {
            id: 'harvest',
            title: 'Nguồn cung thu hoạch',
            subtitle: 'Lô HTX tự sản xuất & hàng hộ gửi',
            icon: '🚜',
            color: 'bg-orange-100 text-orange-800',
            border: 'hover:border-orange-600',
            screen: 'harvest_list',
          },
          {
            id: 'packaging',
            title: 'Lô đóng gói & QR',
            subtitle: 'Xem sản phẩm đã đóng gói và tem QR',
            icon: '🏷️',
            color: 'bg-indigo-100 text-indigo-800',
            border: 'hover:border-indigo-600',
            screen: 'packaging_list',
          },
          {
            id: 'feedbacks',
            title: 'Đánh giá & Phản hồi',
            subtitle: 'Ý kiến thương lái & khách mua',
            icon: '⭐',
            color: 'bg-emerald-100 text-emerald-800',
            border: 'hover:border-emerald-600',
            screen: 'feedback_list',
          },
          {
            id: 'finance',
            title: 'Doanh thu & Báo cáo bán',
            subtitle: 'Doanh số, dòng tiền & đối soát',
            icon: '📊',
            color: 'bg-teal-100 text-teal-800',
            border: 'hover:border-teal-600',
            screen: 'dashboard',
          },
        ];

      case 'R03': // CÁN BỘ KỸ THUẬT:
        return [
          {
            id: 'farm',
            title: 'Vùng sản xuất & Thửa ruộng',
            subtitle: 'Bản đồ thửa, chuồng, lồng nuôi',
            icon: '🗺️',
            color: 'bg-amber-100 text-amber-800',
            border: 'hover:border-amber-600',
            screen: 'farm_list',
          },
          {
            id: 'diary',
            title: 'Giám sát nhật ký sản xuất',
            subtitle: 'Kiểm tra tuân thủ chuẩn VietGAP',
            icon: '📖',
            color: 'bg-emerald-100 text-emerald-800',
            border: 'hover:border-emerald-600',
            screen: 'diary_list',
          },
          {
            id: 'harvest',
            title: 'Giám sát Thu hoạch',
            subtitle: 'Kiểm tra ngày thu & cách ly (PHI)',
            icon: '🚜',
            color: 'bg-orange-100 text-orange-800',
            border: 'hover:border-orange-600',
            screen: 'harvest_list',
          },
          {
            id: 'packaging',
            title: 'Đóng gói & Mã QR',
            subtitle: 'Tạo mã QR truy xuất & in tem',
            icon: '📦',
            color: 'bg-blue-100 text-blue-800',
            border: 'hover:border-blue-600',
            screen: 'packaging_list',
          },
          {
            id: 'feedbacks',
            title: 'Chất lượng sau xuất bán',
            subtitle: 'Theo dõi phản hồi người tiêu dùng',
            icon: '⭐',
            color: 'bg-purple-100 text-purple-800',
            border: 'hover:border-purple-600',
            screen: 'feedback_list',
          },
          {
            id: 'trace',
            title: 'Quét thẩm định QR',
            subtitle: 'Kiểm tra chuỗi truy xuất nguồn gốc',
            icon: '📷',
            color: 'bg-red-100 text-red-800',
            border: 'hover:border-red-600',
            screen: 'trace_scan',
          },
        ];

      case 'R02': // BAN QUẢN TRỊ HTX:
        return [
          {
            id: 'dashboard',
            title: 'Bảng điều khiển HTX',
            subtitle: 'Chỉ số sản lượng & doanh thu HTX',
            icon: '📊',
            color: 'bg-teal-100 text-teal-800',
            border: 'hover:border-teal-600',
            screen: 'dashboard',
          },
          {
            id: 'product_stock',
            title: 'Kho thành phẩm HTX',
            subtitle: 'Hàng HTX giữ (sở hữu & hộ ký gửi)',
            icon: '📦',
            color: 'bg-blue-100 text-blue-900',
            border: 'hover:border-blue-600',
            screen: 'product_stock_list',
          },
          {
            id: 'inventory',
            title: 'Kho vật tư HTX',
            subtitle: 'Quản lý giống, phân bón, thuốc BVTV',
            icon: '🏬',
            color: 'bg-amber-100 text-amber-800',
            border: 'hover:border-amber-600',
            screen: 'inventory_list',
          },
          {
            id: 'handover',
            title: 'Hộp phiếu gửi HTX',
            subtitle: 'Kiểm nhận mua đứt & ký gửi xã viên',
            icon: '⚖️',
            color: 'bg-sky-100 text-sky-900',
            border: 'hover:border-sky-600',
            screen: 'handover_list',
          },
          {
            id: 'diary',
            title: 'Nhật ký sản xuất',
            subtitle: 'Xem ghi chép của các vụ/lứa trong HTX',
            icon: '📖',
            color: 'bg-emerald-100 text-emerald-800',
            border: 'hover:border-emerald-600',
            screen: 'diary_list',
          },
          {
            id: 'members',
            title: 'Danh sách Thành viên',
            subtitle: 'Xem hồ sơ xã viên & vùng canh tác',
            icon: '👥',
            color: 'bg-emerald-700 text-white',
            border: 'hover:border-emerald-600',
            screen: 'members_list',
          },
          {
            id: 'farm',
            title: 'Tổng thể Vùng sản xuất',
            subtitle: 'Quy mô diện tích, chuồng trại, lồng cá',
            icon: '🌾',
            color: 'bg-amber-100 text-amber-800',
            border: 'hover:border-amber-600',
            screen: 'farm_list',
          },
          {
            id: 'sales',
            title: 'Tình hình Tiêu thụ & Đơn',
            subtitle: 'Hợp đồng xuất bán & đối tác',
            icon: '🛒',
            color: 'bg-purple-100 text-purple-800',
            border: 'hover:border-purple-600',
            screen: 'sales_list',
          },
          {
            id: 'feedbacks',
            title: 'Ý kiến Khách & Đối tác',
            subtitle: 'Đánh giá chất lượng sau bán hàng',
            icon: '⭐',
            color: 'bg-indigo-100 text-indigo-800',
            border: 'hover:border-indigo-600',
            screen: 'feedback_list',
          },
          {
            id: 'packaging',
            title: 'Đóng gói & Chuỗi giá trị',
            subtitle: 'Thành phẩm OCOP & tem truy xuất QR',
            icon: '📦',
            color: 'bg-blue-100 text-blue-800',
            border: 'hover:border-blue-600',
            screen: 'packaging_list',
          },
        ];

      case 'R06': // HỘ NÔNG DÂN:
      default:
        return [
          {
            id: 'diary',
            title: 'Nhật ký sản xuất',
            subtitle: 'Ghi việc đã làm, xem gợi ý từ vụ/lứa',
            icon: '📖',
            color: 'bg-emerald-100 text-emerald-900',
            border: 'hover:border-emerald-600',
            screen: 'diary_list',
          },
          {
            id: 'farm',
            title: 'Nơi sản xuất của tôi',
            subtitle: 'Thửa ruộng, vườn cây, chuồng trại, ao lồng',
            icon: '🏡',
            color: 'bg-amber-100 text-amber-800',
            border: 'hover:border-amber-600',
            screen: 'farm_list',
          },
          {
            id: 'harvest',
            title: 'Khai báo thu hoạch',
            subtitle: 'Ghi sản lượng lúa, gà, nhãn, cá',
            icon: '🚜',
            color: 'bg-orange-100 text-orange-800',
            border: 'hover:border-orange-600',
            screen: 'harvest_list',
          },
          {
            id: 'handover',
            title: 'Phiếu giao HTX của tôi',
            subtitle: 'Xem phiếu đang chờ và lượng HTX đã nhận',
            icon: '🚚',
            color: 'bg-sky-100 text-sky-900',
            border: 'hover:border-sky-600',
            screen: 'handover_list',
          },
          {
            id: 'product_stock',
            title: 'Tồn sản phẩm của tôi',
            subtitle: 'Nông sản tại hộ & Hàng ký gửi tại HTX',
            icon: '📦',
            color: 'bg-blue-100 text-blue-900',
            border: 'hover:border-blue-600',
            screen: 'product_stock_list',
          },
          {
            id: 'sales',
            title: 'Bán nông sản của hộ',
            subtitle: 'Tạo đơn bán thương lái, khách lẻ',
            icon: '🛒',
            color: 'bg-purple-100 text-purple-800',
            border: 'hover:border-purple-600',
            screen: 'sales_list',
          },
          {
            id: 'inventory',
            title: 'Vật tư HTX đã cấp',
            subtitle: 'Xem giống, phân bón HTX cấp cho hộ',
            icon: '🏬',
            color: 'bg-emerald-100 text-emerald-900',
            border: 'hover:border-emerald-600',
            screen: 'inventory_list',
          },
          {
            id: 'packaging',
            title: 'Đóng gói & Tem QR',
            subtitle: 'Dán tem QR truy xuất nông sản',
            icon: '🏷️',
            color: 'bg-indigo-100 text-indigo-800',
            border: 'hover:border-indigo-600',
            screen: 'packaging_list',
          },
          {
            id: 'feedbacks',
            title: 'Phản hồi từ người mua',
            subtitle: 'Xem đánh giá của thương lái, khách lẻ',
            icon: '⭐',
            color: 'bg-amber-100 text-amber-800',
            border: 'hover:border-amber-600',
            screen: 'feedback_list',
          },
          {
            id: 'trace',
            title: 'Quét mã xem nguồn gốc',
            subtitle: 'Mở camera xem thông tin QR',
            icon: '📷',
            color: 'bg-red-100 text-red-800',
            border: 'hover:border-red-600',
            screen: 'trace_scan',
          },
          {
            id: 'dashboard',
            title: 'Báo cáo mùa vụ của tôi',
            subtitle: 'Sản lượng & doanh thu vụ của hộ',
            icon: '📊',
            color: 'bg-teal-100 text-teal-800',
            border: 'hover:border-teal-600',
            screen: 'dashboard',
          },
        ];
    }
  };

  const actionCards = getActionCards().filter((card) => canAccessScreen(currentRole, card.screen));

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={currentHTX.shortName}
        showBack={false}
        voiceText={`Trang chủ ${currentHTX.name}. Vai trò ${roleBadge.label}. Bác ${currentUser.name} hãy chọn các ô bên dưới để làm việc.`}
      />

      <div className="p-4 space-y-4">
        {/* Welcome & Weather Card */}
        <div className="bg-gradient-to-r from-agri-800 to-agri-700 text-white rounded-3xl p-4 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 rounded-2xl border-2 border-white object-cover shadow"
              />
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold leading-tight text-white">{currentUser.name}</h2>
                <div className="text-agri-100 text-xs font-medium mt-0.5">
                  {currentHTX.name}
                </div>
              </div>
            </div>
          </div>

          {/* Weather Widget */}
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-agri-50">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-xl">⛅</span>
              <span>Hưng Yên hôm nay: <strong>28°C</strong>, Râm mát</span>
            </div>
            <div className="text-amber-200 font-bold">
              {currentRole === 'R04' ? 'Thuận lợi giao thương' : currentRole === 'R03' ? 'Thời tiết tốt cho mùa vụ' : 'Thuận lợi làm đồng'}
            </div>
          </div>
        </div>

        {/* Mobile Quick Summary Widget (Dữ liệu giao dịch thật) */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-800">📊 Tóm tắt hiện trường</span>
              <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-full">
                Thời gian thực
              </span>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{currentHTX.shortName}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {currentRole === 'R06' && <button type="button" onClick={() => navigateTo('notifications')} className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
              <div className="text-lg font-black text-amber-800">{notifications.filter((notice) => notice.reminderTaskId && !notice.isRead).length}</div>
              <div className="text-[11px] text-slate-600 font-bold mt-0.5">Nhắc ghi</div>
            </button>}

            {canAccessScreen(currentRole, 'diary_list') && <button type="button" onClick={() => navigateTo('diary_list')} className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <div className="text-lg font-black text-emerald-800">{todayHasDiary ? '✓' : '—'}</div>
              <div className="text-[11px] text-slate-600 font-bold mt-0.5">Nhật ký hôm nay</div>
            </button>}

            {canAccessScreen(currentRole, 'handover_list') && (
              <button type="button"
                onClick={() => navigateTo('handover_list', { status: 'cho_kiem_nhan' })}
                className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 active:scale-95 transition-all"
              >
                <div className="text-lg font-black text-amber-700">{quickSummary.pendingHandoversCount}</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5 leading-tight">Chờ nhận</div>
              </button>
            )}

            <button type="button"
              onClick={() => navigateTo('sales_list')}
              className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 active:scale-95 transition-all"
            >
              <div className="text-lg font-black text-purple-700">{quickSummary.pendingDeliveryOrdersCount}</div>
              <div className="text-[10px] text-slate-500 font-bold mt-0.5 leading-tight">Chờ giao</div>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Sản lượng thực tế / Dự kiến:</span>
            <span className="font-extrabold text-slate-900">
              {quickSummary.totalActualYield.toLocaleString('vi-VN')} / {quickSummary.totalEstimatedYield.toLocaleString('vi-VN')} {quickSummary.yieldUnit}
              {quickSummary.yieldUnit === 'kg' && quickSummary.totalEstimatedYield >= 1000 && (
                <span className="text-[11px] font-semibold text-slate-500 ml-1">
                  ({(quickSummary.totalActualYield / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} / {(quickSummary.totalEstimatedYield / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tấn)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Action Banner Theo Đúng Từng Vai Trò */}
        {currentRole === 'R06' && !todayHasDiary && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-4 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-lg font-extrabold leading-snug">Ghi lại việc bác đã làm</h3>
                <p className="text-xs text-amber-100 font-medium mt-0.5">
                  Ghi nhanh chỉ 4 bước để đảm bảo nguồn gốc sản phẩm
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('diary_add')}
              className="bg-white text-orange-700 hover:bg-orange-50 active:scale-95 px-3.5 py-2.5 rounded-2xl font-extrabold text-sm whitespace-nowrap shadow-md"
            >
              Ghi ngay ➜
            </button>
          </div>
        )}

        {currentRole === 'R04' && (
          <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-3xl p-4 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📦</span>
              <div>
                <h3 className="text-base font-extrabold leading-snug">Quản lý Bán hàng & Xuất nhập kho</h3>
                <p className="text-xs text-purple-200 font-medium mt-0.5">
                  Có đơn hàng mới đang chờ duyệt xuất bán & đối soát công nợ
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('sales_list')}
              className="bg-white text-indigo-800 hover:bg-purple-50 active:scale-95 px-3.5 py-2 rounded-2xl font-extrabold text-xs whitespace-nowrap shadow"
            >
              Xem đơn ➜
            </button>
          </div>
        )}

        {currentRole === 'R03' && (
          <div className="bg-gradient-to-r from-cyan-700 to-blue-700 text-white rounded-3xl p-4 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔬</span>
              <div>
                <h3 className="text-base font-extrabold leading-snug">Giám sát Kỹ thuật & Chuỗi sau thu hoạch</h3>
                <p className="text-xs text-cyan-200 font-medium mt-0.5">
                  Theo dõi thời gian cách ly (PHI), quy trình sơ chế & tem mã QR
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('packaging_list')}
              className="bg-white text-cyan-900 hover:bg-cyan-50 active:scale-95 px-3.5 py-2 rounded-2xl font-extrabold text-xs whitespace-nowrap shadow"
            >
              Đóng gói & Mã QR ➜
            </button>
          </div>
        )}

        {currentRole === 'R02' && (
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-3xl p-4 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📊</span>
              <div>
                <h3 className="text-base font-extrabold leading-snug">Bảng điều khiển Ban Quản trị HTX</h3>
                <p className="text-xs text-indigo-200 font-medium mt-0.5">
                  Tổng hợp sản lượng mùa vụ, doanh thu toàn HTX và theo dõi thành viên
                </p>
              </div>
            </div>
            <button
              onClick={() => navigateTo('dashboard')}
              className="bg-amber-300 text-amber-950 hover:bg-amber-400 active:scale-95 px-3.5 py-2 rounded-2xl font-extrabold text-xs whitespace-nowrap shadow"
            >
              Báo cáo HTX ➜
            </button>
          </div>
        )}

        {/* Big Grid of Actions - Tự động thích ứng theo Role */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-lg font-bold text-slate-800">Chức năng chính</h3>
            <span className="text-xs text-slate-500 font-semibold">Chạm vào ô để mở</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {actionCards.map((card) => (
              <button
                key={card.id}
                onClick={() => navigateTo(card.screen)}
                className={`grid-menu-card bg-white ${card.border} active:scale-95 transition-all text-left p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between`}
              >
                <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center text-2xl mb-2`}>
                  {card.icon}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-normal">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Contact & Technical Support */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl">
              📞
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold">
                {currentRole === 'R06'
                  ? 'Ban Quản trị HTX hỗ trợ'
                  : currentRole === 'R04'
                  ? 'Kế toán trưởng / Tài chính'
                  : currentRole === 'R03'
                  ? 'Trạm Khuyến nông & BVTV Huyện'
                  : 'Hỗ trợ Kỹ thuật Sở NN&PTNT'}
              </div>
              <div className="text-base font-bold text-slate-800">
                {currentRole === 'R06'
                  ? 'Đại diện HTX: 0912 888 999'
                  : currentRole === 'R04'
                  ? 'Chị Dung: 0983 234 567'
                  : currentRole === 'R03'
                  ? 'KS. Hoàng: 0936 888 777'
                  : 'Sở NN&PTNT: 0221 386 2456'}
              </div>
            </div>
          </div>
          <a
            href="tel:0912888999"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
          >
            Gọi điện
          </a>
        </div>
      </div>
    </div>
  );
};

