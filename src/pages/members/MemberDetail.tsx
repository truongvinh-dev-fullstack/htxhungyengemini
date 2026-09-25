import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { UserProfile } from '../../types';

export const MemberDetail: React.FC = () => {
  const { screenParams, goBack, farmZones, diaries, navigateTo, currentHTX } = useApp();
  const member: UserProfile = screenParams?.member;

  if (!member) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy thông tin thành viên.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  // Lọc thửa ruộng và nhật ký của thành viên này
  const memberZones = farmZones.filter((z) => z.ownerId === member.id);
  const memberDiaries = diaries.filter(
    (d) => d.createdBy === member.name || memberZones.some((z) => z.id === d.farmZoneId)
  );

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Hồ sơ thành viên"
        voiceText={`Hồ sơ chi tiết của thành viên ${member.name}, thuộc ${member.team || 'Hợp tác xã'}.`}
      />

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm text-center space-y-3">
          <img
            src={member.avatar}
            alt={member.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-md mx-auto"
          />
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">{member.name}</h2>
            <div className="inline-block bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full mt-1">
              {member.team} • {member.role}
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">{currentHTX.name}</p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <a
              href={`tel:${member.phone.replace(/\s+/g, '')}`}
              className="flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow"
            >
              <span>📞</span>
              <span>Gọi điện: {member.phone}</span>
            </a>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <h3 className="text-base font-extrabold text-slate-900 border-b pb-2">
            Thông tin nhân thân & Pháp lý
          </h3>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Số điện thoại Zalo:</span>
              <span className="font-extrabold text-slate-900">{member.phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Số Căn cước công dân:</span>
              <span className="font-mono font-bold text-slate-900">{member.cccd}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Địa chỉ thường trú:</span>
              <span className="font-bold text-slate-900 text-right">{member.address}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Tổ sản xuất:</span>
              <span className="font-bold text-slate-900">{member.team}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Trạng thái:</span>
              <span className="font-extrabold text-emerald-700">✓ Đang hoạt động</span>
            </div>
          </div>
        </div>

        {/* CN-3.2.3: Lịch sử sản xuất & Thửa ruộng của thành viên */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Vùng canh tác của hộ ({memberZones.length})
            </h3>
          </div>

          {memberZones.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              Chưa có thửa ruộng hoặc khu nuôi gắn với tài khoản này.
            </p>
          ) : (
            <div className="space-y-2">
              {memberZones.map((z) => (
                <div
                  key={z.id}
                  onClick={() => navigateTo('farm_detail', { zone: z })}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-amber-400"
                >
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{z.name}</h4>
                    <p className="text-xs text-slate-500">{z.variety} • {z.areaOrQuantity}</p>
                  </div>
                  <span className="text-xs text-amber-700 font-bold">Xem ➜</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nhật ký gần đây của hộ */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Nhật ký đồng ruộng gần đây ({memberDiaries.length})
            </h3>
          </div>

          {memberDiaries.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              Chưa có ghi chép nhật ký nào từ thành viên này.
            </p>
          ) : (
            <div className="space-y-2">
              {memberDiaries.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigateTo('diary_detail', { entry: d })}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-emerald-400"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{d.workTypeIcon}</span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{d.workTypeName}</h4>
                      <p className="text-[11px] text-slate-500">{d.date} • {d.farmZoneName}</p>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold">Xem ➜</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
