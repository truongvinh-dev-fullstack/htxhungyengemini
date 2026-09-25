import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const HomePage: React.FC = () => {
  const {
    currentUser,
    currentHTX,
    currentRole,
    navigateTo,
    todayHasDiary,
  } = useApp();

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
      case 'R04': // KẾ TOÁN / BÁN HÀNG: Tuyệt đối không có "Vùng sản xuất của tôi", không có "Sổ nhật ký"
        return [
          {
            id: 'inventory',
            title: 'Quản lý Kho vật tư',
            subtitle: 'Nhập/xuất/tồn giống, phân, thuốc',
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
            id: 'finance',
            title: 'Doanh thu & Báo cáo bán',
            subtitle: 'Doanh số, dòng tiền & đối soát',
            icon: '📊',
            color: 'bg-teal-100 text-teal-800',
            border: 'hover:border-teal-600',
            screen: 'dashboard',
          },
          {
            id: 'packaging',
            title: 'Kho thành phẩm tem QR',
            subtitle: 'Sản phẩm đóng gói sẵn sàng xuất',
            icon: '📦',
            color: 'bg-blue-100 text-blue-800',
            border: 'hover:border-blue-600',
            screen: 'packaging_list',
          },
          {
            id: 'harvest',
            title: 'Nguồn cung thu hoạch',
            subtitle: 'Sản lượng nông sản về kho',
            icon: '🚜',
            color: 'bg-orange-100 text-orange-800',
            border: 'hover:border-orange-600',
            screen: 'harvest_list',
          },
          {
            id: 'trace',
            title: 'Quét mã xuất kho',
            subtitle: 'Kiểm tra mã QR tem nhãn',
            icon: '📷',
            color: 'bg-red-100 text-red-800',
            border: 'hover:border-red-600',
            screen: 'trace_scan',
          },
        ];

      case 'R03': // CÁN BỘ KỸ THUẬT: Mùa vụ, vùng/thửa, kế hoạch, quy trình, nhật ký, thu hoạch, sơ chế, đóng gói, QR
        return [
          {
            id: 'farm',
            title: 'Vùng sản xuất & Thửa ruộng',
            subtitle: 'Bản đồ thửa, diện tích, cây trồng',
            icon: '🗺️',
            color: 'bg-amber-100 text-amber-800',
            border: 'hover:border-amber-600',
            screen: 'farm_list',
          },
          {
            id: 'diary',
            title: 'Giám sát Sổ nhật ký',
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
            id: 'processing',
            title: 'Quản lý Lô sơ chế',
            subtitle: 'Làm sạch, phân loại nông sản',
            icon: '🧪',
            color: 'bg-cyan-100 text-cyan-800',
            border: 'hover:border-cyan-600',
            screen: 'processing_list',
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
            id: 'trace',
            title: 'Quét thẩm định QR',
            subtitle: 'Kiểm tra chuỗi truy xuất nguồn gốc',
            icon: '📷',
            color: 'bg-red-100 text-red-800',
            border: 'hover:border-red-600',
            screen: 'trace_scan',
          },
        ];

      case 'R02': // BAN QUẢN TRỊ HTX: Dashboard, thành viên, mùa vụ, giám sát sản xuất, báo cáo
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
            subtitle: 'Quy mô diện tích & phân bổ giống',
            icon: '🌾',
            color: 'bg-amber-100 text-amber-800',
            border: 'hover:border-amber-600',
            screen: 'farm_list',
          },
          {
            id: 'diary',
            title: 'Giám sát Thực hiện Quy trình',
            subtitle: 'Theo dõi nhật ký & VietGAP toàn HTX',
            icon: '📖',
            color: 'bg-emerald-100 text-emerald-800',
            border: 'hover:border-emerald-600',
            screen: 'diary_list',
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
            id: 'packaging',
            title: 'Đóng gói & Chuỗi giá trị',
            subtitle: 'Thành phẩm OCOP & tem truy xuất QR',
            icon: '📦',
            color: 'bg-blue-100 text-blue-800',
            border: 'hover:border-blue-600',
            screen: 'packaging_list',
          },
        ];

      case 'R06': // HỘ NÔNG DÂN: Việc hôm nay, thửa/chuồng/ao của mình, nhật ký, thu hoạch, bán nông sản, đóng gói, vật tư được cấp, thông báo
      default:
        return [
          {
            id: 'diary',
            title: 'Sổ nhật ký đồng ruộng',
            subtitle: 'Ghi chép công việc mỗi ngày',
            icon: '📖',
            color: 'bg-emerald-100 text-emerald-800',
            border: 'hover:border-emerald-600',
            screen: 'diary_list',
          },
          {
            id: 'farm',
            title: 'Vùng sản xuất của tôi',
            subtitle: 'Thửa ruộng, chuồng trại, ao của tôi',
            icon: '🌾',
            color: 'bg-amber-100 text-amber-800',
            border: 'hover:border-amber-600',
            screen: 'farm_list',
          },
          {
            id: 'harvest',
            title: 'Khai báo thu hoạch',
            subtitle: 'Ghi sản lượng lúa, gà, nhãn của tôi',
            icon: '🚜',
            color: 'bg-orange-100 text-orange-800',
            border: 'hover:border-orange-600',
            screen: 'harvest_list',
          },
          {
            id: 'sales',
            title: 'Bán nông sản của hộ',
            subtitle: 'Tạo đơn bán cho thương lái, khách lẻ',
            icon: '🛒',
            color: 'bg-purple-100 text-purple-800',
            border: 'hover:border-purple-600',
            screen: 'sales_list',
          },
          {
            id: 'packaging',
            title: 'Đóng gói & Tem QR',
            subtitle: 'Dán tem QR truy xuất nông sản',
            icon: '📦',
            color: 'bg-indigo-100 text-indigo-800',
            border: 'hover:border-indigo-600',
            screen: 'packaging_list',
          },
          {
            id: 'inventory',
            title: 'Vật tư được cấp phát',
            subtitle: 'Xem giống, phân bón HTX cấp',
            icon: '🏬',
            color: 'bg-blue-100 text-blue-800',
            border: 'hover:border-blue-600',
            screen: 'inventory_list',
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

  const actionCards = getActionCards();

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

        {/* Action Banner Theo Đúng Từng Vai Trò */}
        {currentRole === 'R06' && !todayHasDiary && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-4 shadow-lg flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-lg font-extrabold leading-snug">Hôm nay bác chưa ghi nhật ký!</h3>
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
              onClick={() => navigateTo('processing_list')}
              className="bg-white text-cyan-900 hover:bg-cyan-50 active:scale-95 px-3.5 py-2 rounded-2xl font-extrabold text-xs whitespace-nowrap shadow"
            >
              Lô sơ chế ➜
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

