import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { MemberRequest } from '../../types';

export const MemberApproval: React.FC = () => {
  const { memberRequests, approveMemberRequest, rejectMemberRequest, speakText } = useApp();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('Chưa cư trú tại địa bàn xã');

  const pendingRequests = memberRequests.filter((r) => r.status === 'pending');

  const handleApprove = (id: string, name: string) => {
    approveMemberRequest(id);
    speakText(`Đã phê duyệt thành công cho bác ${name} tham gia Hợp tác xã!`);
  };

  const handleReject = (id: string, name: string) => {
    rejectMemberRequest(id, reason);
    setRejectingId(null);
    speakText(`Đã từ chối yêu cầu của bác ${name}.`);
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Phê duyệt thành viên"
        voiceText="Màn hình phê duyệt yêu cầu gia nhập Hợp tác xã. Bác tổ trưởng hãy kiểm tra kỹ thông tin và bấm nút xanh để Phê duyệt hoặc nút đỏ để Từ chối."
      />

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-slate-800">Yêu cầu đăng ký chờ xét duyệt</h3>
          <span className="text-xs bg-amber-200 text-amber-900 font-extrabold px-2.5 py-1 rounded-full">
            {pendingRequests.length} hồ sơ
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200">
            <span className="text-5xl">🎉</span>
            <h4 className="text-xl font-bold text-slate-800">Đã xử lý hết yêu cầu!</h4>
            <p className="text-sm text-slate-500">
              Hiện tại không có hồ sơ nào đang chờ phê duyệt. Khi có bà con đăng ký mới, thông báo sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          pendingRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-md space-y-4"
            >
              <div>
                <span className="text-xs font-bold text-slate-400">
                  Ngày gửi: {req.applyDate}
                </span>
                <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">{req.name}</h4>
                <p className="text-sm text-slate-600 font-medium">{req.village}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <div>• <strong>Số điện thoại:</strong> {req.phone}</div>
                <div>• <strong>Số CCCD:</strong> {req.cccd}</div>
                <div>• <strong>Trạng thái:</strong> <span className="text-amber-700 font-bold">Chờ duyệt</span></div>
              </div>

              {rejectingId === req.id ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-red-900 block">
                    Chọn lý do từ chối:
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2 rounded-xl border border-red-300 text-xs font-bold"
                  >
                    <option value="Chưa cư trú tại địa bàn xã">Chưa cư trú tại địa bàn xã</option>
                    <option value="Số CCCD hoặc SĐT không chính xác">Số CCCD hoặc SĐT không chính xác</option>
                    <option value="Đã đủ định mức thành viên tổ">Đã đủ định mức thành viên tổ</option>
                  </select>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setRejectingId(null)}
                      className="flex-1 py-2 bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleReject(req.id, req.name)}
                      className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow"
                    >
                      Xác nhận từ chối
                    </button>
                  </div>
                </div>
              ) : (
                /* 2 BIG BUTTONS: DUYỆT (GREEN) & TỪ CHỐI (RED) */
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setRejectingId(req.id)}
                    className="py-4 rounded-2xl bg-red-100 hover:bg-red-200 active:scale-95 text-red-700 font-extrabold text-base border-2 border-red-300 flex items-center justify-center gap-1.5"
                  >
                    <span>✕</span>
                    <span>TỪ CHỐI</span>
                  </button>

                  <button
                    onClick={() => handleApprove(req.id, req.name)}
                    className="py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-base shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>PHÊ DUYỆT</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
