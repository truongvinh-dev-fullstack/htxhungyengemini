import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { DiaryEntry } from '../../types';
import { isDiaryLocked, canModifyDiary } from '../../utils/permissions';
import { diaryWorkTypes } from './workTypes';

export const DiaryDetail: React.FC = () => {
  const { screenParams, deleteDiary, updateDiary, goBack, diaries, farmZones, inventory, currentUser, currentRole } = useApp();
  const initialEntry: DiaryEntry = screenParams?.entry;
  
  // Lấy dữ liệu mới nhất từ AppContext
  const foundEntry = diaries.find((d) => d.id === initialEntry?.id);
  const entry = currentRole === 'R06' && !farmZones.some((zone) => zone.id === foundEntry?.farmZoneId && zone.ownerId === currentUser.id)
    ? undefined
    : foundEntry;

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    if (editMaterialId && (!Number.isFinite(Number(editMaterialQuantity)) || Number(editMaterialQuantity) <= 0)) {
      alert('Số lượng vật tư phải lớn hơn 0.');
      return;
    }
    if (editPhiDays && (!Number.isInteger(Number(editPhiDays)) || Number(editPhiDays) < 0)) {
      alert('PHI phải là số ngày không âm.');
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
      photoUrl: editPhoto,
      workDescription: editDescription.trim() || undefined,
      materialId: editMaterial?.id,
      materialQuantity: editMaterial ? Number(editMaterialQuantity) : undefined,
      materialUnit: editMaterial?.unit,
      suppliesUsed: editMaterial ? `${editMaterialQuantity} ${editMaterial.unit} ${editMaterial.name}` : entry.workTypes ? undefined : editSupplies.trim() || undefined,
      phiDays: editPhiDays ? Number(editPhiDays) : undefined,
      weatherCondition: editWeather.trim() || undefined,
      weatherSuggestedAt: editWeather.trim() === entry.weatherCondition && editPerformedAt.slice(0, 10) === entry.date ? entry.weatherSuggestedAt : undefined,
      notes: editNotes.trim(),
    });
    if (!res.success) {

      alert(res.message);
    } else {
      setIsEditing(false);

    }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Chi tiết nhật ký"
        voiceText={`Chi tiết nhật ký ngày ${entry.date}, công việc ${entry.workTypeName} tại ${entry.farmZoneName}.`}
      />

      <div className="p-4 space-y-4">
        {/* Lock status banner (CN-3.5.6 & CN-2.5.5) */}
        {locked ? (
          <div className="p-4 bg-slate-100 border-2 border-slate-300 rounded-3xl flex items-start gap-3 text-slate-700">
            <span className="text-3xl">🔒</span>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                Đã khóa sau 24 giờ, không thể sửa
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Nhật ký đã qua 24 giờ kể từ thời điểm tạo và được hệ thống mã hóa bảo vệ tính minh bạch VietGAP (CN-2.5.5).
              </p>
            </div>
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

        {/* Edit Form or View Card */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl p-5 border-2 border-emerald-300 shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>✏️</span> Chỉnh sửa nhật ký
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                Công việc thực hiện
              </label>
              {entry.workTypes ? (
                <div className="grid grid-cols-2 gap-2">
                  {diaryWorkTypes.map((work) => (
                    <label key={work.id} className="flex items-start gap-2 p-2 rounded-xl border border-slate-200 text-sm font-semibold">
                      <input type="checkbox" checked={editWorkTypes.includes(work.id)} onChange={() => setEditWorkTypes((prev) => prev.includes(work.id) ? prev.filter((id) => id !== work.id) : [...prev, work.id])} />
                      <span>{work.icon} {work.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input type="text" value={editWorkName} onChange={(e) => setEditWorkName(e.target.value)} required className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500" />
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                Vật tư nông nghiệp sử dụng (nếu có)
              </label>
              {entry.workTypes ? (
                <div className="space-y-2">
                  <select value={editMaterialId} onChange={(e) => { setEditMaterialId(e.target.value); setEditMaterialQuantity(''); }} className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-semibold">
                    <option value="">Không dùng vật tư</option>
                    {diaryMaterials.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                  </select>
                  {editMaterial && <div className="flex items-center gap-2"><input type="number" min="0.01" step="any" value={editMaterialQuantity} onChange={(e) => setEditMaterialQuantity(e.target.value)} className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl" /><span>{editMaterial.unit}</span></div>}
                </div>
              ) : (
                <input type="text" value={editSupplies} onChange={(e) => setEditSupplies(e.target.value)} className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-semibold" />
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Ngày{entry.performedAt ? ' và giờ' : ''} thực hiện</label>
              {entry.performedAt ? <input type="datetime-local" value={editPerformedAt} onChange={(e) => setEditPerformedAt(e.target.value)} required className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl" /> : <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl" />}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Ảnh hiện trường</label>
              {editPhoto && <img src={editPhoto} alt="Ảnh hiện trường" className="w-full aspect-video object-cover rounded-2xl mb-2" />}
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setEditPhoto(String(reader.result || ''));
                reader.readAsDataURL(file);
              }} className="w-full text-sm" />
              {editPhoto && <button type="button" onClick={() => setEditPhoto('')} className="text-xs text-red-700 font-bold mt-2">Bỏ ảnh</button>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Mô tả nội dung công việc</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Thời gian cách ly PHI (ngày)</label>
              <input type="number" min="0" step="1" value={editPhiDays} onChange={(e) => setEditPhiDays(e.target.value)} className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Điều kiện thời tiết thực tế</label>
              <input type="text" value={editWeather} onChange={(e) => setEditWeather(e.target.value)} className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                Ghi chú thêm tình hình thửa
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                className="w-full p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditWorkName(entry.workTypeName);
                  setEditWorkTypes(entry.workTypes || []);
                  setEditDate(entry.date);
                  setEditPerformedAt(entry.performedAt || '');
                  setEditPhoto(entry.photoUrl);
                  setEditSupplies(entry.suppliesUsed || '');
                  setEditDescription(entry.workDescription || '');
                  setEditWeather(entry.weatherCondition || '');
                  setEditPhiDays(entry.phiDays?.toString() || '');
                  setEditMaterialId(entry.materialId || '');
                  setEditMaterialQuantity(entry.materialQuantity?.toString() || '');
                  setEditNotes(entry.notes || '');
                  setIsEditing(false);
                }}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-2xl font-bold text-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold shadow"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        ) : (
          /* Big Card with Photo */
          <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm space-y-4">
            <div className="relative aspect-video bg-slate-100">
              {entry.photoUrl ? <img src={entry.photoUrl} alt={entry.workTypeName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500">Chưa có ảnh hiện trường</div>}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white text-xs px-3 py-1 rounded-full font-bold">
                {entry.workTypeIcon} {entry.workTypeName}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Vùng sản xuất
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {entry.farmZoneName}
                </h3>
                <p className="text-sm text-slate-600 mt-1">Hộ phụ trách: <strong>{entry.subjectOwnerName || farmZones.find((zone) => zone.id === entry.farmZoneId)?.ownerName || 'Chưa rõ'}</strong></p>
                {entry.subjectOwnerName && entry.createdBy !== entry.subjectOwnerName && <p className="text-xs text-emerald-800 font-semibold mt-1">Nhật ký do cán bộ ghi hộ</p>}
              </div>

              {entry.workDescription && <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200"><span className="text-xs font-bold text-slate-500 block">Mô tả nội dung công việc</span><p className="text-sm text-slate-800 mt-1">{entry.workDescription}</p></div>}

              {/* List of work types */}
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
                  <span className="text-xs text-slate-500 font-bold block">Ngày thực hiện</span>
                  <span className="text-base font-extrabold text-slate-900">{entry.performedAt?.replace('T', ' ') || entry.date}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block">Người ghi</span>
                  <span className="text-base font-extrabold text-slate-900">{entry.createdBy}</span>
                </div>
              </div>

              {entry.suppliesUsed && (
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-bold block">Vật tư sử dụng:</span>
                  <span className="text-base font-extrabold text-emerald-950">{entry.suppliesUsed}</span>
                </div>
              )}

              {entry.phiDays !== undefined && <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200"><span className="text-xs text-amber-800 font-bold block">Thời gian cách ly PHI</span><span className="font-extrabold text-amber-950">{entry.phiDays} ngày</span></div>}
              {entry.weatherCondition && <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200"><span className="text-xs text-blue-800 font-bold block">Điều kiện thời tiết</span><span className="font-semibold text-blue-950">{entry.weatherCondition}</span></div>}

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ghi chú tình hình ruộng:
                </span>
                <p className="mt-1 text-base text-slate-800 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  {entry.notes || 'Không có ghi chú thêm.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons if within 24h and user has permission */}
        {!locked && modifyPerm.canEdit && !isEditing && (
          <div className="pt-2 space-y-3">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow flex items-center justify-center gap-2"
            >
              <span>✏️</span>
              <span>Chỉnh sửa nhật ký (còn hạn 24h)</span>
            </button>

            {showConfirmDelete ? (
              <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-4 text-center space-y-3">
                <p className="text-base font-extrabold text-red-900">
                  Bác có chắc chắn muốn xóa bản ghi nhật ký này không?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    className="flex-1 py-3 bg-white border border-slate-300 rounded-2xl font-bold text-slate-700"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-extrabold shadow"
                  >
                    Xác nhận xóa
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="w-full py-4 rounded-2xl bg-red-100 hover:bg-red-200 text-red-700 font-extrabold text-base border border-red-300 flex items-center justify-center gap-2"
              >
                <span>🗑️</span>
                <span>Xóa nhật ký này</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
