import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

export const MemberList: React.FC = () => {
  const { members, navigateTo, currentHTX } = useApp();

  const htxMembers = members.filter((m) => !m.htxId || m.htxId === currentHTX.id);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Danh sách thành viên HTX"
        voiceText={`Danh sách thành viên chính thức của ${currentHTX.name}. Bác có thể bấm vào từng hộ để xem hồ sơ và thửa ruộng canh tác.`}
      />

      <div className="p-4 space-y-4">
        {/* HTX Info Summary */}
        <div className="bg-emerald-800 text-white rounded-3xl p-4 shadow-md flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold">{currentHTX.name}</h3>
            <p className="text-xs text-emerald-200 mt-0.5 font-medium">
              Tổng số {htxMembers.length} hộ thành viên chính thức
            </p>
          </div>
          <span className="text-3xl">{currentHTX.logo}</span>
        </div>

        {/* Member Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-extrabold text-slate-800">Hộ thành viên ({htxMembers.length})</h3>
            <span className="text-xs text-slate-500 font-semibold">Xem chi tiết ➜</span>
          </div>

          {htxMembers.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center space-y-2 border border-slate-200">
              <span className="text-4xl">👥</span>
              <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu thành viên</p>
              <p className="text-xs text-slate-500">
                Hồ sơ thành viên được đồng bộ từ Cổng thông tin Quản trị HTX.
              </p>
            </div>
          ) : (
            htxMembers.map((m) => (
              <div
                key={m.id}
                onClick={() => navigateTo('member_detail', { member: m })}
                className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-emerald-500 active:scale-[0.98] transition-all shadow-sm flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-13 h-13 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-base font-extrabold text-slate-900 truncate">{m.name}</h4>
                    <p className="text-xs text-slate-500 font-semibold truncate">{m.address}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-emerald-700 font-bold">
                      <span>📞 {m.phone}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">{m.role === 'R06' ? 'Xã viên' : 'Ban quản lý'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={`tel:${m.phone.replace(/\s+/g, '')}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg shadow-sm"
                    title="Gọi điện thoại"
                  >
                    📞
                  </a>
                  <span className="text-slate-400 text-xs font-bold">➜</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
