import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { canApproveMember } from '../../utils/permissions';

export const MemberApproval: React.FC = () => {
  const {
    currentHTX,
    currentUser,
    currentRole,
    memberRequests,
    approveMemberRequest,
    rejectMemberRequest,
    speakText,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('Chưa cư trú tại địa bàn xã');

  const htxRequests = memberRequests.filter((r) => !r.htxId || r.htxId === currentHTX.id);
  const pendingRequests = htxRequests.filter((r) => r.status === 'pending');
  const historyRequests = htxRequests.filter((r) => r.status === 'approved' || r.status === 'rejected');

  const handleApprove = (id: string, name: string) => {
    const res = approveMemberRequest(id);
    if (res.success) {
      speakText(`Đã phê duyệt thành công cho bác ${name} tham gia Hợp tác xã!`);
    } else {
      alert(res.message || 'Không thể phê duyệt');
    }
  };

  const handleReject = (id: string, name: string) => {
    const res = rejectMemberRequest(id, reason);
    if (res.success) {
      setRejectingId(null);
      speakText(`Đã từ chối yêu cầu của bác ${name}.`);
    } else {
      alert(res.message || 'Không thể từ chối');
    }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Phê duyệt thành viên"
        voiceText="Màn hình phê duyệt yêu cầu gia nhập Hợp tác xã. Bác hãy kiểm tra kỹ thông tin và phê duyệt hoặc xem lại lịch sử xét duyệt."
      />

      <div className="p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>⏳ Chờ xét duyệt</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-300 text-slate-700'
              }`}
            >
              {pendingRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📜 Lịch sử đã duyệt</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'history' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-700'
              }`}
            >
              {historyRequests.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Pending Requests */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200">
                <span className="text-5xl">🎉</span>
                <h4 className="text-xl font-bold text-slate-800">Đã xử lý hết yêu cầu!</h4>
                <p className="text-sm text-slate-500">
                  Hiện tại không có hồ sơ nào đang chờ phê duyệt tại {currentHTX.shortName}.
                </p>
              </div>
            ) : (
              pendingRequests.map((req) => {
                const canApprove = canApproveMember(currentRole, currentUser.team, req.team);

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-md space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-400">
                          Ngày nộp đơn: {req.applyDate}
                        </span>
                        <h4 className="text-xl font-extrabold text-slate-900 mt-0.5">{req.name}</h4>
                        <p className="text-sm text-slate-600 font-medium">{req.village}</p>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                        Chờ duyệt
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                      <div>• <strong>Số điện thoại:</strong> {req.phone}</div>
                      <div>• <strong>Số CCCD:</strong> {req.cccd}</div>
                      <div>• <strong>Tổ sản xuất đăng ký:</strong> <span className="font-bold text-indigo-700">{req.team || 'Chưa phân tổ'}</span></div>
                      <div>• <strong>Hợp tác xã:</strong> {currentHTX.name}</div>
                    </div>

                    {!canApprove && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium flex items-center gap-2">
                        <span>ℹ️</span>
                        <span>
                          Hồ sơ đăng ký <strong>{req.team || 'tổ khác'}</strong>. Cần Ban Quản trị HTX (R02) hoặc Tổ trưởng tổ tương ứng phê duyệt.
                        </span>
                      </div>
                    )}

                    {canApprove && rejectingId === req.id && (
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
                    )}

                    {canApprove && rejectingId !== req.id && (
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
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: History (Approved & Rejected) */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyRequests.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200">
                <span className="text-5xl">📋</span>
                <h4 className="text-xl font-bold text-slate-800">Chưa có lịch sử xét duyệt</h4>
                <p className="text-sm text-slate-500">
                  Các hồ sơ đã được duyệt hoặc từ chối sẽ được lưu vết đầy đủ tại đây.
                </p>
              </div>
            ) : (
              historyRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-extrabold text-slate-900">{req.name}</h4>
                      <p className="text-xs text-slate-500">{req.village}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {req.status === 'approved' ? '✓ Đã phê duyệt' : '✕ Đã từ chối'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs text-slate-700">
                    <div>• <strong>SĐT:</strong> {req.phone} | <strong>CCCD:</strong> {req.cccd}</div>
                    <div>• <strong>Tổ sản xuất:</strong> {req.team || 'Chưa phân'}</div>
                    {req.approvedBy && (
                      <div>
                        • <strong>Người duyệt:</strong>{' '}
                        <span className="font-bold text-slate-900">{req.approvedBy}</span>
                      </div>
                    )}
                    {req.approvedAt && (
                      <div>• <strong>Ngày duyệt:</strong> {req.approvedAt}</div>
                    )}
                    {req.rejectionReason && (
                      <div className="text-red-700 font-semibold pt-1">
                        • <strong>Lý do từ chối:</strong> {req.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
