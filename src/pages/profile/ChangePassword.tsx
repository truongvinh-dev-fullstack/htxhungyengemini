import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const ChangePassword: React.FC = () => {
  const { goBack, speakText } = useApp();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    setIsSuccess(true);
    speakText('Đã đổi mật khẩu thành công!');
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Đổi mật khẩu"
        voiceText="Bác hãy nhập mật khẩu cũ và đặt mật khẩu mới tối thiểu 6 ký tự nhé."
      />

      <div className="p-4 space-y-4">
        {isSuccess ? (
          <div className="bg-white rounded-3xl p-6 text-center space-y-4 shadow-sm border border-slate-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto">
              ✓
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Đổi mật khẩu thành công!</h3>
            <p className="text-sm text-slate-600">
              Mật khẩu mới đã được cập nhật cho tài khoản của bác.
            </p>
            <button
              onClick={goBack}
              className="w-full py-4 bg-emerald-700 text-white font-extrabold rounded-2xl shadow"
            >
              Quay lại trang tài khoản
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-base font-bold text-slate-800 mb-1">
                Mật khẩu hiện tại: <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                placeholder="Nhập mật khẩu cũ..."
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1">
                Mật khẩu mới: <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Tối thiểu 6 ký tự..."
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1">
                Nhập lại mật khẩu mới: <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold bg-slate-50"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-lg font-extrabold shadow-lg shadow-emerald-700/30 transition-all mt-4"
            >
              CẬP NHẬT MẬT KHẨU
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
