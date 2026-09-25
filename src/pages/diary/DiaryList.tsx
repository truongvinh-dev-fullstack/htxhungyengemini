import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { DiaryEntry } from '../../types';

export const DiaryList: React.FC = () => {
  const { diaries, farmZones, navigateTo, currentHTX, currentRole, currentUser } = useApp();

  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [onlyMine, setOnlyMine] = useState<boolean>(currentRole === 'R06');

  // Lọc nhật ký theo vai trò và thửa ruộng (SRS Mục 7: R06 chỉ xem nhật ký của mình)
  const filteredDiaries = diaries.filter((entry) => {
    // 1. Lọc theo thửa ruộng
    if (selectedZoneId !== 'all' && entry.farmZoneId !== selectedZoneId) {
      return false;
    }

    // 2. R06 bắt buộc chỉ xem nhật ký do chính hộ mình ghi
    if (currentRole === 'R06') {
      if (entry.createdBy !== currentUser.name) {
        return false;
      }
    } else if (onlyMine && entry.createdBy !== currentUser.name) {
      return false;
    }

    return true;
  });

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Sổ nhật ký đồng ruộng"
        voiceText="Đây là danh sách nhật ký đồng ruộng. Bác có thể lọc theo từng thửa ruộng hoặc bấm nút Ghi nhật ký mới để ghi chép công việc nhé."
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

        {/* CN-3.5.1: Bộ lọc Thửa ruộng & Phạm vi hiển thị */}
        <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              🌾 Lọc theo thửa ruộng / vùng nuôi:
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full h-12 px-3 rounded-2xl border-2 border-slate-200 text-sm font-bold text-slate-800 bg-slate-50 focus:border-emerald-600 focus:outline-none"
            >
              <option value="all">Tất cả các thửa ruộng / vùng nuôi</option>
              {farmZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.variety})
                </option>
              ))}
            </select>
          </div>

          {/* Phạm vi xem theo vai trò */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700">
              {currentRole === 'R06' ? 'Nhật ký của hộ tôi' : 'Chỉ xem nhật ký do tôi ghi'}
            </span>
            {currentRole === 'R06' ? (
              <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full border border-emerald-300">
                🔒 Cố định hộ {currentUser.name}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setOnlyMine(!onlyMine)}
                className={`w-12 h-7 rounded-full transition-colors relative p-0.5 ${
                  onlyMine ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                    onlyMine ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Timeline list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-slate-800">Lịch sử công việc</h3>
            <span className="text-xs text-slate-500 font-semibold">{filteredDiaries.length} bản ghi</span>
          </div>

          {filteredDiaries.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200">
              <span className="text-5xl">🌾</span>
              <h4 className="text-xl font-bold text-slate-800">Không tìm thấy nhật ký phù hợp</h4>
              <p className="text-sm text-slate-500">
                Bác hãy thử chọn &quot;Tất cả các thửa ruộng&quot; hoặc bấm nút &quot;Ghi mới&quot; ở trên nhé.
              </p>
            </div>
          ) : (
            filteredDiaries.map((entry) => (
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
