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
    speakText,
  } = useApp();

  const handleVoiceWelcome = () => {
    speakText(
      `Kính chào bác ${currentUser.name}, thành viên ${currentHTX.name}. Thời tiết Hưng Yên hôm nay 28 độ C, trời râm mát, rất thuận lợi ra đồng chăm sóc lúa. Bác hãy bấm vào ô Sổ nhật ký để ghi lại công việc hôm nay nhé.`
    );
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title={currentHTX.shortName}
        showBack={false}
        voiceText={`Trang chủ ${currentHTX.name}. Bác ${currentUser.name} hãy chọn các ô lớn bên dưới để làm việc.`}
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
                <p className="text-agri-100 text-sm font-medium">Kính chào bà con</p>
                <h2 className="text-xl font-extrabold leading-tight text-white">{currentUser.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="bg-amber-300 text-amber-950 px-2 py-0.5 rounded-full text-xs font-bold">
                    {currentUser.team}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleVoiceWelcome}
              className="w-12 h-12 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-2xl active:scale-95 transition-all shadow"
              title="Nghe lời chào và hướng dẫn"
            >
              📢
            </button>
          </div>

          {/* Weather Widget */}
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-agri-50">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-xl">⛅</span>
              <span>Hưng Yên hôm nay: <strong>28°C</strong>, Râm mát</span>
            </div>
            <div className="text-amber-200 font-bold">Thuận lợi làm đồng</div>
          </div>
        </div>

        {/* CN-3.5.4: Prominent Reminder Banner if Diary Not Written Today */}
        {!todayHasDiary && (
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

        {/* Big Grid of Actions for Elderly Users */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h3 className="text-lg font-bold text-slate-800">Chức năng chính</h3>
            <span className="text-xs text-slate-500 font-semibold">Chạm vào ô để mở</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 1. Sổ nhật ký đồng ruộng (Priority 1) */}
            <button
              onClick={() => navigateTo('diary_list')}
              className="grid-menu-card bg-white hover:border-agri-600 active:scale-95 transition-all text-left p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mb-2">
                📖
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Sổ nhật ký đồng ruộng
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">Ghi chép công việc mỗi ngày</p>
              </div>
            </button>

            {/* 2. Vùng sản xuất của tôi */}
            <button
              onClick={() => navigateTo('farm_list')}
              className="grid-menu-card bg-white hover:border-agri-600 active:scale-95 transition-all text-left p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl mb-2">
                🌾
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Vùng sản xuất của tôi
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">Thửa ruộng, chuồng trại, ao</p>
              </div>
            </button>

            {/* 3. Thu hoạch */}
            <button
              onClick={() => navigateTo('harvest_list')}
              className="grid-menu-card bg-white hover:border-agri-600 active:scale-95 transition-all text-left p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center text-2xl mb-2">
                🚜
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Thu hoạch
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">Ghi sản lượng lúa, gà, nhãn</p>
              </div>
            </button>

            {/* 4. Đóng gói sản phẩm & mã QR */}
            <button
              onClick={() => navigateTo('packaging_list')}
              className="grid-menu-card bg-white hover:border-agri-600 active:scale-95 transition-all text-left p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-2xl mb-2">
                📦
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Đóng gói sản phẩm
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">Tạo mã tem QR dán bao bì</p>
              </div>
            </button>

            {/* 5. Bán hàng / Đơn hàng */}
            <button
              onClick={() => navigateTo('sales_list')}
              className="grid-menu-card bg-white hover:border-agri-600 active:scale-95 transition-all text-left p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-2xl mb-2">
                🛒
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Bán hàng / Đơn hàng
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">Quản lý bán nông sản & đơn</p>
              </div>
            </button>

            {/* 6. Quét mã truy xuất nguồn gốc */}
            <button
              onClick={() => navigateTo('trace_scan')}
              className="grid-menu-card bg-white hover:border-agri-600 active:scale-95 transition-all text-left p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center text-2xl mb-2">
                📷
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Quét mã xem nguồn gốc
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">Mở camera xem thông tin</p>
              </div>
            </button>

            {/* 7. Báo cáo của tôi / Dashboard */}
            <button
              onClick={() => navigateTo('dashboard')}
              className="grid-menu-card bg-white hover:border-agri-600 active:scale-95 transition-all text-left p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-2xl mb-2">
                📊
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                  {currentRole === 'R02' ? 'Báo cáo toàn HTX' : 'Báo cáo của tôi'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">Sản lượng & doanh thu vụ</p>
              </div>
            </button>

            {/* 8. R05: Thành viên HTX (Chỉ hiện khi là R05 Tổ trưởng hoặc R02) */}
            {(currentRole === 'R05' || currentRole === 'R02') && (
              <button
                onClick={() => navigateTo('members_list')}
                className="grid-menu-card bg-emerald-50/70 border-emerald-300 hover:border-emerald-600 active:scale-95 transition-all text-left p-4 rounded-2xl border-2 shadow-sm flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-2xl mb-2">
                  👥
                </div>
                <div>
                  <div className="inline-block bg-emerald-200 text-emerald-900 text-[10px] font-bold px-1.5 py-0.5 rounded mb-0.5">
                    CHỈ TỔ TRƯỞNG
                  </div>
                  <h4 className="text-lg font-extrabold text-emerald-950 leading-tight">
                    Thành viên HTX
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 font-medium">Quản lý & duyệt thành viên</p>
                </div>
              </button>
            )}

            {/* 9. R04: Kho vật tư (Chỉ hiện khi là R04 Kế toán/Kho hoặc R02) */}
            {(currentRole === 'R04' || currentRole === 'R02') && (
              <button
                onClick={() => navigateTo('inventory_list')}
                className="grid-menu-card bg-amber-50/70 border-amber-300 hover:border-amber-600 active:scale-95 transition-all text-left p-4 rounded-2xl border-2 shadow-sm flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-700 text-white flex items-center justify-center text-2xl mb-2">
                  🏬
                </div>
                <div>
                  <div className="inline-block bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded mb-0.5">
                    CHỈ KẾ TOÁN/KHO
                  </div>
                  <h4 className="text-lg font-extrabold text-amber-950 leading-tight">
                    Kho vật tư
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 font-medium">Giống, phân bón, nhập xuất</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Quick Contact & Technical Support */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl">
              📞
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold">Tổ trưởng hỗ trợ kỹ thuật</div>
              <div className="text-base font-bold text-slate-800">Bác Thắng: 0912 888 999</div>
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
