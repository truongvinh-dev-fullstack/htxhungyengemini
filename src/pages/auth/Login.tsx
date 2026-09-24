import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const Login: React.FC = () => {
  const { loginWithZaloPhone, speakText } = useApp();

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('0978 123 456');
  const [customPhone, setCustomPhone] = useState('');
  const [unregisteredError, setUnregisteredError] = useState<{
    phone: string;
  } | null>(null);

  const sampleAccounts = [
    {
      phone: '0978 123 456',
      name: 'Bác Nguyễn Văn An',
      roleCode: 'R06',
      role: 'R06: Hộ nông dân',
      desc: 'Ghi nhật ký, thu hoạch, đóng gói của hộ',
      htx: 'HTX An Ninh (Lúa sạch)',
      tag: 'Hợp lệ',
      color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    {
      phone: '0912 888 999',
      name: 'Bác Trần Văn Thắng',
      roleCode: 'R05',
      role: 'R05: Tổ trưởng',
      desc: 'Quản lý thành viên + Duyệt thành viên mới',
      htx: 'HTX An Ninh (Lúa sạch)',
      tag: 'Hợp lệ',
      color: 'bg-teal-100 text-teal-900 border-teal-300',
    },
    {
      phone: '0983 234 567',
      name: 'Chị Nguyễn Thị Dung',
      roleCode: 'R04',
      role: 'R04: Kế toán / Kho',
      desc: 'Quản lý Kho vật tư + Nhập/Xuất kho',
      htx: 'HTX An Ninh (Lúa sạch)',
      tag: 'Hợp lệ',
      color: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      phone: '0936 888 777',
      name: 'Kỹ sư Lê Văn Hoàng',
      roleCode: 'R03',
      role: 'R03: Cán bộ Kỹ thuật',
      desc: 'Mùa vụ, quy trình VietGAP, lô sơ chế, đóng gói QR',
      htx: 'HTX An Ninh (Lúa sạch)',
      tag: 'Hợp lệ',
      color: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    },
    {
      phone: '0912 345 678',
      name: 'Ông Phạm Văn Minh',
      roleCode: 'R02',
      role: 'R02: Ban Quản trị HTX',
      desc: 'Xem Dashboard báo cáo tổng thể toàn xã',
      htx: 'HTX An Ninh (Lúa sạch)',
      tag: 'Hợp lệ',
      color: 'bg-purple-100 text-purple-900 border-purple-300',
    },
    {
      phone: '0988 765 432',
      name: 'Bác Trần Đình Trọng',
      roleCode: 'R06',
      role: 'R06: Hộ nông dân',
      desc: 'HTX Chăn nuôi gà Đông Tảo tiến vua',
      htx: 'HTX Đông Tảo (Khoái Châu)',
      tag: 'Hợp lệ',
      color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    {
      phone: '0904 555 888',
      name: 'Bác Phạm Thị Mai',
      roleCode: 'R06',
      role: 'R06: Hộ nông dân',
      desc: 'HTX Nhãn lồng & Thủy sản Tân Hưng',
      htx: 'HTX Quyết Thắng (TP. Hưng Yên)',
      tag: 'Hợp lệ',
      color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    {
      phone: '0999 888 777',
      name: 'Khách chưa đăng ký',
      roleCode: 'None',
      role: 'Chưa có hồ sơ',
      desc: 'Thử nghiệm cảnh báo SĐT chưa có trong HTX',
      htx: 'Chưa tham gia HTX nào',
      tag: 'Chưa đăng ký',
      color: 'bg-red-100 text-red-900 border-red-300',
    },
  ];

  const handleOpenZaloAuth = () => {
    setUnregisteredError(null);
    setShowPermissionModal(true);
  };

  const handleConfirmLogin = (phoneToUse?: string) => {
    const finalPhone = phoneToUse || customPhone.trim() || selectedPhone;
    setShowPermissionModal(false);

    const result = loginWithZaloPhone(finalPhone);
    if (!result.success) {
      setUnregisteredError({ phone: finalPhone });
      speakText(
        `Số điện thoại ${finalPhone} chưa được đăng ký trong danh sách thành viên của Hợp tác xã. Bà con vui lòng liên hệ Ban quản trị để đăng ký.`
      );
    } else {
      speakText(`Chào mừng bác ${result.user?.name} đã đăng nhập thành công qua Zalo!`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-agri-800 via-agri-700 to-agri-900 text-white flex flex-col justify-between p-4 safe-bottom">
      {/* Brand Header */}
      <div className="pt-10 pb-4 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-2xl text-5xl mb-4 border-4 border-amber-300">
          🌾
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">HỢP TÁC XÃ HƯNG YÊN</h1>
        <p className="text-base text-agri-100 font-medium mt-1">
          Cơ sở dữ liệu sản xuất & Truy xuất nguồn gốc
        </p>
        <div className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-amber-200 mt-2">
          An Ninh (Lúa) • Đông Tảo (Gà) • Quyết Thắng (Nhãn/Cá)
        </div>
      </div>

      {/* Main Login Card - Pure Zalo */}
      <div className="bg-white text-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {unregisteredError ? (
          /* Error Notification when phone is not registered in HTX */
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl mx-auto shadow-inner animate-bounce">
              ⚠️
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-red-900 leading-tight">
                Số điện thoại chưa đăng ký ở HTX!
              </h2>
              <p className="text-base font-bold text-slate-900 mt-1 font-mono bg-slate-100 py-1.5 px-3 rounded-xl inline-block">
                {unregisteredError.phone}
              </p>
            </div>

            <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-200 text-left text-sm text-red-950 space-y-2 leading-relaxed">
              <p>
                Số điện thoại trên chưa có trong danh bạ thành viên của bất kỳ Hợp tác xã nào trong hệ thống.
              </p>
              <p className="font-medium text-xs text-red-800">
                Bà con vui lòng liên hệ trực tiếp với Ban Quản trị HTX tại địa bàn để được bổ sung vào danh sách xã viên:
              </p>
              <div className="text-xs space-y-1 font-bold pt-1 border-t border-red-200 text-slate-800">
                <div>• HTX An Ninh (Tiền Lữ): <a href="tel:0912345678" className="text-blue-700 underline">0912.345.678</a></div>
                <div>• HTX Đông Tảo (Khoái Châu): <a href="tel:0988765432" className="text-blue-700 underline">0988.765.432</a></div>
                <div>• HTX Quyết Thắng (Tân Hưng): <a href="tel:0904555888" className="text-blue-700 underline">0904.555.888</a></div>
              </div>
            </div>

            <button
              onClick={() => {
                setUnregisteredError(null);
                setShowPermissionModal(true);
              }}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-lg font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>Thử lại với số điện thoại khác</span>
            </button>
          </div>
        ) : (
          /* Normal Zalo Login State */
          <div className="space-y-5">
            <div className="text-center space-y-2 py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-blue-600 text-3xl mb-1">
                💬
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                Đăng nhập bằng tài khoản Zalo
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Ứng dụng tự động kiểm tra số điện thoại Zalo của bà con với danh sách thành viên HTX để đăng nhập.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-sm text-emerald-950 space-y-1.5">
              <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                <span>✓</span> Tiện lợi cho người cao tuổi:
              </div>
              <div className="text-xs text-emerald-800 leading-relaxed">
                • Không cần ghi nhớ mật khẩu phức tạp.<br />
                • Tự động kết nối đúng Hợp tác xã và đúng thửa ruộng của hộ gia đình.
              </div>
            </div>

            <button
              onClick={handleOpenZaloAuth}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xl font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 transition-all"
            >
              <span className="text-2xl">⚡</span>
              <span>ĐĂNG NHẬP BẰNG ZALO</span>
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-agri-200 py-2">
        Hệ thống chuyển đổi số Hợp tác xã Nông nghiệp tỉnh Hưng Yên v1.1
      </div>

      {/* Realistic Zalo Permission & Phone Request Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-slate-900 animate-fade-in max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                Z
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">Yêu cầu cấp quyền Zalo</h3>
                <p className="text-xs text-slate-500">Zalo Mini App • HTX Hưng Yên</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 font-medium">
              Ứng dụng yêu cầu quyền xác thực định danh và <strong>Số điện thoại</strong> để đăng nhập vào Hợp tác xã:
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span>✓</span> Thông tin cá nhân cơ bản (Tên, Ảnh Zalo)
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span>✓</span> Số điện thoại đăng ký Zalo
              </div>
            </div>

            {/* Demo Phone Selector for Reviewers / Testing */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-amber-900 uppercase">
                ⚙️ Chọn nhanh số điện thoại mẫu để thử nghiệm:
              </label>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sampleAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPhone(acc.phone);
                      setCustomPhone('');
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                      selectedPhone === acc.phone && !customPhone
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${acc.color}`}>
                        {acc.role}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          acc.tag === 'Hợp lệ'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {acc.tag}
                      </span>
                    </div>

                    <div className="font-extrabold text-sm text-slate-900 leading-tight">
                      {acc.name} <span className="font-mono text-xs font-semibold text-slate-500">({acc.phone})</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                      {acc.htx}
                    </div>
                    <div className="text-[10px] text-blue-700 italic mt-0.5">
                      ➜ {acc.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* Or type custom phone */}
              <div className="pt-1">
                <input
                  type="tel"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="Hoặc tự gõ số điện thoại khác..."
                  className="w-full h-11 px-3 rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="w-1/3 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200"
              >
                Từ chối
              </button>
              <button
                type="button"
                onClick={() => handleConfirmLogin()}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-bold shadow-md shadow-blue-600/30"
              >
                Cho phép & Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
