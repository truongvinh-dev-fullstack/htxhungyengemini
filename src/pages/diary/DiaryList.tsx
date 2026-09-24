import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { DiaryEntry } from '../../types';

export const DiaryList: React.FC = () => {
  const { diaries, navigateTo, currentHTX } = useApp();

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Sổ nhật ký đồng ruộng"
        voiceText="Đây là danh sách nhật ký đồng ruộng của bác. Bác có thể xem lại các công việc đã làm hoặc bấm nút Ghi nhật ký mới màu xanh ở góc dưới."
      />

      <div className="p-4 space-y-4">
        {/* Top Action Banner */}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-emerald-950">Ghi việc hôm nay</h3>
            <p className="text-xs text-emerald-800 font-medium mt-0.5">
              4 bước đơn giản, có chụp ảnh thực tế
            </p>
          </div>
          <button
            onClick={() => navigateTo('diary_add')}
            className="bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white px-4 py-3 rounded-2xl font-extrabold text-base flex items-center gap-2 shadow-md shadow-emerald-700/30 whitespace-nowrap"
          >
            <span className="text-xl">➕</span>
            <span>Ghi mới</span>
          </button>
        </div>

        {/* Timeline list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-slate-800">Lịch sử công việc</h3>
            <span className="text-xs text-slate-500 font-semibold">{diaries.length} bản ghi</span>
          </div>

          {diaries.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200">
              <span className="text-5xl">🌾</span>
              <h4 className="text-xl font-bold text-slate-800">Chưa có nhật ký nào</h4>
              <p className="text-sm text-slate-500">
                Bác hãy bấm nút "Ghi mới" ở trên để ghi lại công việc chăm sóc đồng ruộng nhé.
              </p>
            </div>
          ) : (
            diaries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => navigateTo('diary_detail', { entry })}
                className="bg-white rounded-3xl p-4 border-2 border-slate-200 hover:border-emerald-600 active:scale-[0.98] transition-all shadow-sm cursor-pointer space-y-3"
              >
                {/* Header with Date & Lock Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{entry.workTypeIcon}</span>
                    <div>
                      <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
                        {entry.workTypeName}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold">
                        {entry.date} • {entry.farmZoneName}
                      </p>
                    </div>
                  </div>

                  {/* CN-3.5.6: Lock Status or Editable */}
                  {entry.isLocked ? (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-300 px-2.5 py-1 rounded-full text-xs font-bold">
                      <span>🔒</span>
                      <span>Đã khóa, không thể sửa</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
                      <span>✏️</span>
                      <span>Có thể sửa (trong 24h)</span>
                    </span>
                  )}
                </div>

                {/* Photo & Notes snippet */}
                <div className="flex gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <img
                    src={entry.photoUrl}
                    alt={entry.workTypeName}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    {entry.suppliesUsed && (
                      <div className="text-xs font-bold text-emerald-800">
                        📦 Vật tư: {entry.suppliesUsed}
                      </div>
                    )}
                    <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                      {entry.notes || 'Không có ghi chú thêm.'}
                    </p>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Người ghi: {entry.createdBy}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs font-bold text-emerald-700 pt-1">
                  <span>Chạm để xem chi tiết ➜</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
