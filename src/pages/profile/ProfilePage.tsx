import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const ProfilePage: React.FC = () => {
  const { currentUser, currentHTX, logout, navigateTo, speakText } = useApp();
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
