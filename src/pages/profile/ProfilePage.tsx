import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const ProfilePage: React.FC = () => {
  const { currentUser, currentHTX, logout, navigateTo, speakText, currentRole, setRole, setHTX } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(currentUser.phone);
  const [address, setAddress] = useState(currentUser.address);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    speakText('Đã cập nhật thông tin cá nhân thành công!');
    alert('Đã cập nhật thông tin!');
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Tài khoản cá nhân"
        voiceText={`Hồ sơ thành viên ${currentUser.name}, thuộc ${currentHTX.name}. Bác có thể cập nhật thông tin hoặc đổi mật khẩu tại đây.`}
      />

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm text-center space-y-3 relative">
          <div className="relative inline-block mx-auto">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-md mx-auto"
            />
            <button
              onClick={() => alert('Đã mở thư viện ảnh để đổi ảnh đại diện!')}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs shadow-md border-2 border-white"
              title="Đổi ảnh đại diện"
            >
              📷
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">{currentUser.name}</h2>
            <div className="inline-block bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full mt-1">
              {currentUser.team} • {currentUser.role}
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">{currentHTX.name}</p>
          </div>
        </div>

        {/* Member Details */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-base font-extrabold text-slate-900">Thông tin hộ thành viên</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              {isEditing ? 'Hủy sửa' : 'Chỉnh sửa'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Số điện thoại:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl border border-slate-300 text-sm font-bold bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Địa chỉ thường trú:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-12 px-3 rounded-xl border border-slate-300 text-sm font-bold bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-700 text-white rounded-xl font-bold text-sm shadow"
              >
                Lưu thay đổi
              </button>
            </form>
          ) : (
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-extrabold text-slate-900">{phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Số CCCD:</span>
                <span className="font-mono font-bold text-slate-900">{currentUser.cccd}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Địa chỉ:</span>
                <span className="font-bold text-slate-900 text-right">{address}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-emerald-700">✓ Đang hoạt động</span>
              </div>
            </div>
          )}
        </div>

        {/* Chuyển đổi vai trò Demo trực tiếp trong trang tài khoản */}
        <div className="bg-amber-50 rounded-3xl p-5 border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-950 font-extrabold text-sm border-b border-amber-200 pb-2">
            <span className="text-xl">🔄</span>
            <span>Chuyển vai trò thử nghiệm (Demo Sở NN&PTNT)</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-900 block">1. Chọn vai trò trải nghiệm:</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'R06', name: 'R06: Hộ nông dân', desc: 'Bác An - Ghi nhật ký, thu hoạch, xem thửa của mình' },
                { id: 'R05', name: 'R05: Tổ trưởng sản xuất', desc: 'Bác Thắng - Quản lý tổ viên, hỗ trợ ghi hộ' },
                { id: 'R04', name: 'R04: Kế toán / Bán hàng', desc: 'Chị Dung - Kho vật tư, bán hàng, đối soát' },
                { id: 'R03', name: 'R03: Cán bộ Kỹ thuật', desc: 'Kỹ sư Hoàng - Mùa vụ, VietGAP, sơ chế, tem QR' },
                { id: 'R02', name: 'R02: Ban Quản trị HTX', desc: 'Ông Minh - Báo cáo toàn HTX, duyệt thành viên' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRole(r.id as any);
                    speakText(`Đã chuyển sang vai trò ${r.name}`);
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    currentRole === r.id
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-md font-bold'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold">{r.name}</span>
                    {currentRole === r.id && (
                      <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <div className={`text-xs mt-0.5 ${currentRole === r.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {r.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-amber-200">
            <label className="text-xs font-bold text-amber-900 block">2. Chọn Hợp tác xã:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'anninh', name: 'HTX An Ninh', icon: '🌾' },
                { id: 'dongtao', name: 'HTX Đông Tảo', icon: '🐓' },
                { id: 'quyetthang', name: 'HTX Quyết Thắng', icon: '🍈' },
              ].map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setHTX(h.id as any);
                    speakText(`Đã chuyển sang ${h.name}`);
                  }}
                  className={`p-2 rounded-2xl border-2 text-center text-xs transition-all ${
                    currentHTX.id === h.id
                      ? 'bg-agri-700 text-white border-agri-800 font-bold shadow-md'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xl mb-0.5">{h.icon}</div>
                  <div className="font-bold truncate">{h.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Actions - Pure Zalo */}
        <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
            <span className="text-xl">💬</span>
            <div>
              <strong>Tài khoản đã liên kết với Zalo:</strong>
              <div className="text-[11px] text-blue-700">Xác thực an toàn không cần mật khẩu theo chuẩn Zalo Mini App.</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-4 px-4 font-extrabold text-base text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <span className="text-xl">🚪</span>
            <span>Đăng xuất khỏi Mini App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
