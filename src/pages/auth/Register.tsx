import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HTXId } from '../../types';

export const Register: React.FC = () => {
  const { navigateTo, addMemberRequest, speakText } = useApp();
  const [htxId, setHtxId] = useState<HTXId>('anninh');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cccd, setCccd] = useState('');
  const [village, setVillage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !cccd.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
      return;
    }

    addMemberRequest({
      name: fullName.trim(),
      phone: phone.trim(),
      cccd: cccd.trim(),
      htxId,
      village: village.trim() || 'Thôn xã thuộc địa bàn HTX',
    });

    speakText(`Đã gửi thành công hồ sơ đăng ký của bác ${fullName}. Vui lòng chờ Ban quản trị phê duyệt.`);
    setIsSubmitted(true);
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
            <h1 className="text-2xl font-extrabold text-slate-900">Đăng ký thành viên</h1>
            <p className="text-sm text-slate-500">Gia nhập Hợp tác xã tỉnh Hưng Yên</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="bg-white rounded-3xl p-6 shadow-md text-center space-y-4 mt-6">
            <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center text-4xl">
              ⏳
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Yêu cầu đang chờ duyệt</h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Kính gửi bác <strong className="text-slate-900">{fullName}</strong>, hồ sơ đăng ký tham gia HTX của bác đã được gửi thành công tới Ban Quản trị.
            </p>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-sm text-amber-900 space-y-1">
              <div>• <strong>Họ tên:</strong> {fullName}</div>
              <div>• <strong>Số điện thoại:</strong> {phone}</div>
              <div>• <strong>Số CCCD:</strong> {cccd}</div>
              <div>• <strong>Trạng thái:</strong> <span className="text-amber-700 font-bold">Chờ Tổ trưởng/BQT phê duyệt</span></div>
            </div>
            <p className="text-sm text-slate-500">
              Ngay sau khi được phê duyệt, bác sẽ nhận được thông báo qua Zalo và có thể bắt đầu ghi nhật ký đồng ruộng.
            </p>
            <button
              onClick={() => navigateTo('auth_login')}
              className="w-full py-4 rounded-2xl bg-agri-700 text-white text-lg font-bold shadow-md hover:bg-agri-800"
            >
              Quay lại màn hình đăng nhập
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 shadow-md space-y-4">
            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                1. Chọn Hợp tác xã muốn tham gia <span className="text-red-500">*</span>
              </label>
              <select
                value={htxId}
                onChange={(e) => setHtxId(e.target.value as HTXId)}
                className="w-full h-14 px-3 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-800 bg-slate-50 focus:border-agri-700 focus:outline-none"
              >
                <option value="anninh">HTX Dịch vụ Nông nghiệp An Ninh (Lúa sạch)</option>
                <option value="dongtao">HTX Chăn nuôi & Kinh doanh Gà Đông Tảo</option>
                <option value="quyetthang">HTX Cây ăn quả & NTTS Quyết Thắng</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                2. Họ và tên của bác <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-slate-50 focus:border-agri-700 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                3. Số điện thoại (dùng Zalo) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại..."
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-slate-50 focus:border-agri-700 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                4. Số Căn cước công dân (CCCD) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cccd}
                onChange={(e) => setCccd(e.target.value)}
                placeholder="Nhập 12 số CCCD gắn chip..."
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-slate-50 focus:border-agri-700 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-800 mb-1.5">
                5. Thôn / Xóm cư trú
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Ví dụ: Thôn An Xá, xã An Ninh"
                className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-lg font-bold text-slate-900 bg-slate-50 focus:border-agri-700 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-agri-700 hover:bg-agri-800 active:scale-95 text-white text-xl font-bold shadow-lg shadow-agri-700/30 transition-all mt-4"
            >
              GỬI YÊU CẦU THAM GIA HTX
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
