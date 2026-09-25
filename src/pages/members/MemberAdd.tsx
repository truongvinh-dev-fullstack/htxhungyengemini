import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { UserProfile } from '../../types';

export const MemberAdd: React.FC = () => {
  const { addMember, goBack, speakText, currentHTX, currentUser } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cccd, setCccd] = useState('');
  const [address, setAddress] = useState('');
  const [team, setTeam] = useState(currentUser.team || 'Tổ 1 - Lúa sạch');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !cccd.trim()) {
      alert('Vui lòng điền đầy đủ thông tin Họ tên, SĐT và CCCD (*)');
      return;
    }

    addMember({
      name: name.trim(),
      role: 'R06',
      phone: phone.trim(),
      cccd: cccd.trim(),
      htxId: currentHTX.id,
      team,
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
      address: address.trim() || `Thôn xã thuộc ${currentHTX.name}`,
    });

    speakText(`Đã bổ sung thành công thành viên ${name} vào tổ sản xuất!`);
    alert(`Đã thêm thành viên "${name}" thành công!`);
    goBack();
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Thêm thành viên tổ"
        voiceText="Bác tổ trưởng hãy nhập các thông tin cơ bản để bổ sung hộ thành viên mới vào tổ sản xuất nhé."
      />

      <div className="p-4 space-y-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              1. Họ và tên xã viên: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn Bình"
              className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              2. Số điện thoại Zalo: <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Số điện thoại chính xác dùng Zalo..."
              className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              3. Số Căn cước công dân (CCCD): <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cccd}
              onChange={(e) => setCccd(e.target.value)}
              placeholder="12 số CCCD gắn chip..."
              className="w-full h-14 px-4 rounded-2xl border-2 border-slate-300 text-base font-bold text-slate-900 bg-slate-50 focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              4. Tổ sản xuất phân công:
            </label>
            <input
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full h-13 px-4 rounded-2xl border-2 border-slate-300 text-sm font-bold text-slate-900 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5">
              5. Địa chỉ thôn xóm cư trú:
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Thôn, xã..."
              className="w-full h-13 px-4 rounded-2xl border-2 border-slate-300 text-sm font-medium text-slate-900 bg-slate-50"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xl font-extrabold shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 mt-4"
          >
            <span>💾</span>
            <span>LƯU HỒ SƠ THÀNH VIÊN</span>
          </button>
        </form>
      </div>
    </div>
  );
};
