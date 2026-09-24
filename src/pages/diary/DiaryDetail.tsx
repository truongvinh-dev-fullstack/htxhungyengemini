import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { DiaryEntry } from '../../types';

export const DiaryDetail: React.FC = () => {
  const { screenParams, deleteDiary, goBack, speakText } = useApp();
  const entry: DiaryEntry = screenParams?.entry;
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

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

  const handleDelete = () => {
    deleteDiary(entry.id);
    speakText('Đã xóa bản ghi nhật ký.');
    goBack();
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Chi tiết nhật ký"
        voiceText={`Chi tiết nhật ký ngày ${entry.date}, công việc ${entry.workTypeName} tại ${entry.farmZoneName}.`}
      />

      <div className="p-4 space-y-4">
        {/* Lock status banner (CN-3.5.6) */}
        {entry.isLocked ? (
          <div className="p-4 bg-slate-100 border-2 border-slate-300 rounded-3xl flex items-start gap-3 text-slate-700">
            <span className="text-3xl">🔒</span>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                Đã lưu, không thể sửa
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Nhật ký đã qua 24 giờ và được hệ thống mã hóa, lưu vết phục vụ truy xuất nguồn gốc nông sản an toàn.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl flex items-start gap-3 text-amber-900">
            <span className="text-3xl">⏳</span>
            <div>
              <h4 className="text-base font-extrabold text-amber-950">
                Trong hạn chỉnh sửa (còn dưới 24h)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Bác có thể chỉnh sửa hoặc xóa nhật ký này nếu có nhầm lẫn trước khi bản ghi bị khóa tự động.
              </p>
            </div>
          </div>
        )}

        {/* Big Card with Photo */}
        <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-sm space-y-4">
          <div className="relative aspect-video bg-slate-100">
            <img
              src={entry.photoUrl}
              alt={entry.workTypeName}
              className="w-full h-full object-cover"
            />
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
            </div>

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
                <span className="text-base font-extrabold text-slate-900">{entry.date}</span>
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

        {/* Delete button if within 24h */}
        {!entry.isLocked && (
          <div className="pt-2">
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
                <span>Xóa nhật ký này (còn hạn 24h)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
