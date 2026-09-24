import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { UserProfile } from '../../types';

export const MemberList: React.FC = () => {
  const { members, memberRequests, navigateTo, currentRole } = useApp();

  const pendingCount = memberRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Quản lý thành viên tổ"
        voiceText="Màn hình quản lý thành viên tổ sản xuất. Bác tổ trưởng có thể xem danh sách các hộ thành viên hoặc bấm vào banner chờ duyệt để phê duyệt thành viên mới."
      />

      <div className="p-4 space-y-4">
        {/* CN-3.2.4: Approval Banner with Pending Count */}
        <div
          onClick={() => navigateTo('members_approval')}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-4 shadow-md flex items-center justify-between cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
              📝
            </div>
            <div>
              <h3 className="text-lg font-extrabold leading-tight">Yêu cầu đăng ký mới</h3>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                {pendingCount > 0
                  ? `Có ${pendingCount} hộ đang chờ bác phê duyệt`
                  : 'Không có yêu cầu chờ duyệt'}
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="bg-white text-orange-700 text-sm font-extrabold px-3 py-1.5 rounded-full shadow">
              Duyệt ngay ({pendingCount})
            </span>
          )}
        </div>

        {/* Member Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-slate-800">Thành viên trong tổ</h3>
            <span className="text-xs text-slate-500 font-semibold">{members.length} hộ</span>
          </div>

          {members.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={m.avatar}
                  alt={m.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-base font-extrabold text-slate-900 truncate">{m.name}</h4>
                  <p className="text-xs text-slate-500 font-semibold truncate">{m.address}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-emerald-700 font-bold">
                    <span>📞 {m.phone}</span>
                    <span>•</span>
                    <span>{m.team}</span>
                  </div>
                </div>
              </div>

              <a
                href={`tel:${m.phone.replace(/\s+/g, '')}`}
                className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
                title="Gọi điện thoại"
              >
                📞
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
