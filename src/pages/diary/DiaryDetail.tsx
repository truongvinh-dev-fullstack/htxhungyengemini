import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { DiaryEntry } from '../../types';
import { isDiaryLocked, canModifyDiary, canApproveDiaryAdjustment } from '../../utils/permissions';
import { diaryWorkTypes } from './workTypes';
import { matchSeasonForZone } from '../../utils/seasonMatcher';

export const DiaryDetail: React.FC = () => {
  const {
    screenParams,
    deleteDiary,
    updateDiary,
    goBack,
    diaries,
    farmZones,
    inventory,
    currentUser,
    currentRole,
    diaryAdjustments,
    createDiaryAdjustmentRequest,
    approveDiaryAdjustmentRequest,
    rejectDiaryAdjustmentRequest,
  } = useApp();

  const initialEntry: DiaryEntry = screenParams?.entry;
  const foundEntry = diaries.find((d) => d.id === initialEntry?.id);
  const entry = currentRole === 'R06' && !farmZones.some((zone) => zone.id === foundEntry?.farmZoneId && zone.ownerId === currentUser.id)
    ? undefined
    : foundEntry;

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [proposedNotes, setProposedNotes] = useState(entry?.notes || '');
  const [proposedSupplies, setProposedSupplies] = useState(entry?.suppliesUsed || '');

  // Form edit trong hạn 24h
  const [editNotes, setEditNotes] = useState(entry?.notes || '');
  const [editSupplies, setEditSupplies] = useState(entry?.suppliesUsed || '');
  const [editWorkName, setEditWorkName] = useState(entry?.workTypeName || '');
  const [editWorkTypes, setEditWorkTypes] = useState<string[]>(entry?.workTypes || []);
  const [editDate, setEditDate] = useState(entry?.date || '');
  const [editPerformedAt, setEditPerformedAt] = useState(entry?.performedAt || '');
  const [editPhoto, setEditPhoto] = useState(entry?.photoUrl || '');
  const [editDescription, setEditDescription] = useState(entry?.workDescription || '');
  const [editWeather, setEditWeather] = useState(entry?.weatherCondition || '');
  const [editPhiDays, setEditPhiDays] = useState(entry?.phiDays?.toString() || '');
  const [editMaterialId, setEditMaterialId] = useState(entry?.materialId || '');
  const [editMaterialQuantity, setEditMaterialQuantity] = useState(entry?.materialQuantity?.toString() || '');

  const diaryMaterials = inventory.filter((item) => item.category !== 'BaoBi');
  const editMaterial = diaryMaterials.find((item) => item.id === editMaterialId);
  const targetZone = farmZones.find((z) => z.id === entry?.farmZoneId);

  const editSeasonMatch = React.useMemo(() => {
    if (!targetZone) return { status: 'no_season' as const, message: 'Không tìm thấy thửa' };
    const time = entry?.performedAt ? editPerformedAt : editDate;
    return matchSeasonForZone(targetZone, time, true);
  }, [targetZone, entry?.performedAt, editPerformedAt, editDate]);

  if (!entry) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy nhật ký.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  const locked = isDiaryLocked(entry);
  const modifyPerm = canModifyDiary(currentRole, entry, currentUser.name, currentUser.id);
  const isManagerR02 = canApproveDiaryAdjustment(currentRole);

  // Phiếu đề nghị điều chỉnh đang chờ duyệt
  const pendingAdjustment = diaryAdjustments.find(
    (a) => a.diaryId === entry.id && a.status === 'pending'
  );

  const handleDelete = () => {
    if (!entry) return;
    const res = deleteDiary(entry.id);
    if (!res.success) {
      alert(res.message);
    } else {
      goBack();
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    if (entry.workTypes && editWorkTypes.length === 0) {
      alert('Vui lòng chọn ít nhất một công việc.');
      return;
    }
    if (entry.performedAt ? !editPerformedAt || Number.isNaN(new Date(editPerformedAt).getTime()) : !editDate) {
      alert('Vui lòng chọn ngày và giờ thực hiện hợp lệ.');
      return;
    }
    if (editSeasonMatch.status !== 'matched' || !editSeasonMatch.season) {
      alert(editSeasonMatch.message || 'Thời điểm thực hiện không thuộc mùa vụ nào của thửa.');
      return;
    }

    const selectedWorks = diaryWorkTypes.filter((work) => editWorkTypes.includes(work.id));
    const res = updateDiary(entry.id, {
      workTypeName: entry.workTypes ? selectedWorks.map((work) => work.name).join(' • ') : editWorkName.trim() || entry.workTypeName,
      workTypes: entry.workTypes ? editWorkTypes : undefined,
      workType: entry.workTypes ? editWorkTypes[0] : entry.workType,
      workTypeIcon: entry.workTypes ? selectedWorks.map((work) => work.icon).join(' ') : entry.workTypeIcon,
      date: entry.performedAt ? editPerformedAt.slice(0, 10) : editDate,
      performedAt: entry.performedAt ? editPerformedAt : undefined,
      seasonId: editSeasonMatch.season.seasonId,
      seasonName: editSeasonMatch.season.seasonName,
      photoUrl: editPhoto,
      workDescription: editDescription.trim() || undefined,
      materialId: editMaterial?.id,
      materialQuantity: editMaterial ? Number(editMaterialQuantity) : undefined,
      materialUnit: editMaterial?.unit,
      suppliesUsed: editMaterial ? `${editMaterialQuantity} ${editMaterial.unit} ${editMaterial.name}` : entry.workTypes ? undefined : editSupplies.trim() || undefined,
      phiDays: editPhiDays ? Number(editPhiDays) : undefined,
      weatherCondition: editWeather.trim() || undefined,
      notes: editNotes.trim(),
    });

    if (!res.success) {
      alert(res.message);
    } else {
      setIsEditing(false);
    }
  };

  const handleSendAdjustmentRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentReason.trim()) {
      alert('Vui lòng ghi rõ lý do đề nghị điều chỉnh.');
      return;
    }

    const res = createDiaryAdjustmentRequest({
      diaryId: entry.id,
      reason: adjustmentReason.trim(),
      proposedNotes: proposedNotes.trim(),
      proposedSuppliesUsed: proposedSupplies.trim() || undefined,
    });

    if (res.success) {
      alert('Đã gửi phiếu đề nghị điều chỉnh nhật ký thành công! Ban Quản trị HTX sẽ xem xét phê duyệt.');
      setShowAdjustmentModal(false);
      setAdjustmentReason('');
    } else {
      alert(res.message || 'Lỗi khi gửi phiếu điều chỉnh.');
    }
  };

  const handleApproveAdjustment = (reqId: string) => {
    if (window.confirm('Xác nhận phê duyệt phiếu điều chỉnh nhật ký này? Nhật ký gốc sẽ được cập nhật kèm ghi nhận lịch sử kiểm toán.')) {
      const res = approveDiaryAdjustmentRequest(reqId, 'Đã thẩm tra thực tế hiện trường và phê duyệt');
      if (res.success) {
        alert('Đã phê duyệt điều chỉnh nhật ký thành công!');
      } else {
        alert(res.message || 'Lỗi khi duyệt.');
      }
    }
  };

  const handleRejectAdjustment = (reqId: string) => {
    const reason = prompt('Nhập lý do từ chối điều chỉnh:');
    if (reason) {
      const res = rejectDiaryAdjustmentRequest(reqId, reason);
      if (res.success) {
        alert('Đã từ chối phiếu điều chỉnh.');
      } else {
        alert(res.message || 'Lỗi khi từ chối.');
      }
    }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Chi tiết nhật ký sản xuất"
        voiceText={`Chi tiết nhật ký ngày ${entry.date}, công việc ${entry.workTypeName} tại ${entry.farmZoneName}.`}
      />

      <div className="p-4 space-y-4">
        {/* Banner trạng thái khóa 24h & Phiếu đề nghị điều chỉnh */}
        {locked ? (
          <div className="p-4 bg-slate-100 border-2 border-slate-300 rounded-3xl space-y-2 text-slate-700">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🔒</span>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  Đã khóa sau 24 giờ (Bảo vệ VietGAP)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Nhật ký đã qua 24 giờ kể từ thời điểm tạo và được hệ thống mã hóa bảo vệ tính minh bạch VietGAP.
                </p>
              </div>
            </div>

            {/* Thông báo nếu có phiếu đề nghị đang chờ duyệt */}
            {pendingAdjustment && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs space-y-1.5 text-amber-950">
                <div className="font-extrabold flex justify-between items-center text-amber-900">
                  <span>📋 Có phiếu đề nghị điều chỉnh đang chờ duyệt</span>
                  <span className="bg-amber-200 px-2 py-0.5 rounded-full text-[10px]">Chờ R02 duyệt</span>
                </div>
                <div><strong>Lý do:</strong> {pendingAdjustment.reason}</div>
                <div><strong>Ghi chú mới:</strong> {pendingAdjustment.proposedNotes}</div>

                {isManagerR02 && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleRejectAdjustment(pendingAdjustment.id)}
                      className="flex-1 py-2 rounded-xl border border-rose-300 bg-white text-rose-700 font-bold text-xs"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => handleApproveAdjustment(pendingAdjustment.id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-sm"
                    >
                      Duyệt điều chỉnh
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl flex items-start gap-3 text-amber-900">
            <span className="text-3xl">⏳</span>
            <div>
              <h4 className="text-base font-extrabold text-amber-950">
                Trong hạn chỉnh sửa (dưới 24h)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                {modifyPerm.canEdit
                  ? 'Bác có thể chỉnh sửa hoặc xóa nhật ký này nếu có nhầm lẫn trước khi bản ghi bị hệ thống tự động khóa vĩnh viễn.'
                  : (modifyPerm.reason || 'Bác chỉ có quyền xem nhật ký này.')}
              </p>
            </div>
          </div>
        )}

        {/* Thẻ nội dung nhật ký */}
        <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm space-y-4">
          {entry.photoUrl && (
            <div className="relative aspect-video bg-slate-100">
              <img src={entry.photoUrl} alt={entry.workTypeName} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-5 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Cơ sở / Vùng sản xuất
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {entry.farmZoneName}
              </h3>
              {entry.seasonName && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black">
                  <span>🌱</span>
                  <span>Chu kỳ / Mùa vụ: {entry.seasonName}</span>
                </div>
              )}
              <p className="text-sm text-slate-600 mt-1">
                Hộ phụ trách: <strong>{entry.subjectOwnerName || farmZones.find((zone) => zone.id === entry.farmZoneId)?.ownerName || 'Chưa rõ'}</strong>
              </p>
            </div>

            {/* Công việc đã thực hiện */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide block">
                Công việc đã thực hiện:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {entry.workTypeName.split(' • ').map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-white text-emerald-950 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-emerald-300 shadow-xs"
                  >
                    <span>✓</span>
                    <span>{name}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Thời điểm thực hiện</span>
                <span className="text-base font-extrabold text-slate-900">{entry.performedAt?.replace('T', ' ') || entry.date}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-bold block">Người ghi nhật ký</span>
                <span className="text-base font-extrabold text-slate-900">{entry.createdBy}</span>
              </div>
            </div>

            {entry.suppliesUsed && (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-xs text-emerald-800 font-bold block">Vật tư sử dụng:</span>
                <span className="text-base font-extrabold text-emerald-950">{entry.suppliesUsed}</span>
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ghi chú tình hình ruộng / cơ sở:
              </span>
              <p className="mt-1 text-base text-slate-800 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {entry.notes || 'Không có ghi chú thêm.'}
              </p>
            </div>
          </div>
        </div>

        {/* LỊCH SỬ ĐIỀU CHỈNH NHẬT KÝ ĐÃ DUYỆT (Audit trail VietGAP) */}
        {entry.adjustmentHistory && entry.adjustmentHistory.length > 0 && (
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="text-xl">📜</span>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Lịch sử điều chỉnh đã được phê duyệt ({entry.adjustmentHistory.length})
              </h3>
            </div>
            <div className="space-y-2">
              {entry.adjustmentHistory.map((adj, idx) => (
                <div key={idx} className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-blue-950">
                    <span>Đợt {idx + 1}: Ngày {adj.date}</span>
                    <span className="text-emerald-700">Duyệt bởi: {adj.reviewer}</span>
                  </div>
                  <div><strong>Lý do điều chỉnh:</strong> {adj.reason}</div>
                  <div className="text-slate-600"><strong>Thay đổi:</strong> {adj.changeSummary}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nút hành động */}
        {locked ? (
          /* Khi đã khóa sau 24h: Nút gửi phiếu đề nghị điều chỉnh */
          !pendingAdjustment && (
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow flex items-center justify-center gap-2 active:scale-95"
            >
              <span>📋</span>
              <span>GỬI ĐỀ NGHỊ ĐIỀU CHỈNH NHẬT KÝ (R02 DUYỆT)</span>
            </button>
          )
        ) : (
          /* Khi chưa khóa và có quyền sửa */
          modifyPerm.canEdit && !isEditing && (
            <div className="pt-2 space-y-3">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow flex items-center justify-center gap-2"
              >
                <span>✏️</span>
                <span>Chỉnh sửa nhật ký (còn hạn 24h)</span>
              </button>

              <button
                onClick={() => setShowConfirmDelete(true)}
                className="w-full py-3.5 rounded-2xl bg-red-100 hover:bg-red-200 text-red-700 font-extrabold text-sm border border-red-300 flex items-center justify-center gap-2"
              >
                <span>🗑️</span>
                <span>Xóa nhật ký này</span>
              </button>
            </div>
          )
        )}
      </div>

      {/* Modal đề nghị điều chỉnh nhật ký sau 24h */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>📋</span> Đề nghị điều chỉnh nhật ký
              </h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-500 font-bold">✕</button>
            </div>

            <form onSubmit={handleSendAdjustmentRequest} className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Do nhật ký đã bị khóa tự động theo quy định lưu vết VietGAP, việc điều chỉnh thông tin cần được <strong>Ban Quản trị HTX phê duyệt</strong> để đảm bảo tính pháp lý và lịch sử kiểm toán.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Lý do đề nghị điều chỉnh: <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="VD: Nhập nhầm lượng phân bón, bổ sung điều kiện sâu bệnh..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nội dung ghi chú đề xuất mới:
                </label>
                <textarea
                  rows={2}
                  value={proposedNotes}
                  onChange={(e) => setProposedNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-black shadow"
                >
                  Gửi đề nghị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
