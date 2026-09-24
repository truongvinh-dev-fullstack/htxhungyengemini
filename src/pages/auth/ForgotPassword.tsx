import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const ForgotPassword: React.FC = () => {
  const { navigateTo } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('0978 123 456');
  const [otp, setOtp] = useState('686868');
  const [newPass, setNewPass] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleResetPass = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 safe-bottom">
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('auth_login')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-300 flex items-center justify-center text-xl text-slate-700 shadow-sm"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Lấy lại mật khẩu</h1>
            <p className="text-sm text-slate-500">Xác thực bằng tin nhắn OTP qua điện thoại</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="bg-white rounded-3xl p-6 shadow-md text-center space-y-4 mt-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center text-4xl">
              ✓
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Đổi mật khẩu thành công!</h2>
            <p className="text-base text-slate-600">
              Mật khẩu mới của bác đã được cập nhật. Bác hãy đăng nhập lại bằng mật khẩu mới này nhé.
            </p>
            <button
              onClick={() => navigateTo('auth_login')}
              className="w-full py-4 rounded-2xl bg-agri-700 text-white text-lg font-bold shadow-md hover:bg-agri-800"
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleSendOtp} className="bg-white rounded-3xl p-5 shadow-md space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-900 leading-relaxed">
              Nhập số điện thoại đã đăng ký với Hợp tác xã để nhận mã xác thực OTP qua tin nhắn SMS hoặc Zalo.
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                Số điện thoại của bác
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập 10 số điện thoại..."
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-slate-50 focus:border-agri-700 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-agri-700 hover:bg-agri-800 text-white text-xl font-bold shadow-lg shadow-agri-700/30 transition-all mt-4"
            >
              GỬI MÃ XÁC THỰC OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPass} className="bg-white rounded-3xl p-5 shadow-md space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-900 leading-relaxed">
              Mã OTP đã được gửi tới số <strong>{phone}</strong>. Vui lòng nhập mã và đặt mật khẩu mới.
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                Mã xác thực OTP (6 chữ số)
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-2xl font-extrabold tracking-widest text-center text-slate-900 bg-slate-50 focus:border-agri-700 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Tối thiểu 6 ký tự..."
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-slate-50 focus:border-agri-700 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-agri-700 hover:bg-agri-800 text-white text-xl font-bold shadow-lg shadow-agri-700/30 transition-all mt-4"
            >
              XÁC NHẬN ĐỔI MẬT KHẨU
            </button>
          </form>
        )}
      </div>

      <div className="text-center py-3">
        <button
          onClick={() => navigateTo('auth_login')}
          className="text-base font-bold text-slate-600 hover:text-slate-900"
        >
          ← Quay lại Đăng nhập
        </button>
      </div>
    </div>
  );
};
