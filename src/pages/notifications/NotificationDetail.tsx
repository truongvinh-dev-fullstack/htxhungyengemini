import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { AppNotification } from '../../types';

export const NotificationDetail: React.FC = () => {
  const { screenParams, goBack, navigateTo } = useApp();
  const item: AppNotification = screenParams?.notification;

  if (!item) {
    return (
      <div className="p-4 text-center">
        <p>Không tìm thấy thông báo.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl font-bold">
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Chi tiết thông báo"
        voiceText={`Thông báo: ${item.title}. Nội dung: ${item.content}`}
      />

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs text-slate-400 font-bold block">{item.date}</span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1 leading-snug">
              {item.title}
            </h2>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 leading-relaxed">
            {item.summary}
          </div>

          <div className="text-base text-slate-800 leading-relaxed space-y-2">
            <p>{item.content}</p>
          </div>

          {/* Action button */}
          {item.actionScreen ? (
            <button
              onClick={() => navigateTo(item.actionScreen!)}
              className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-lg shadow-md flex items-center justify-center gap-2 mt-4"
            >
              <span>➜</span>
              <span>{item.actionLabel || 'Xem chi tiết'}</span>
            </button>
          ) : item.type === 'reminder' ? (
            <button
              onClick={() => navigateTo('diary_add')}
              className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-lg shadow-md flex items-center justify-center gap-2 mt-4"
            >
              <span>📝</span>
              <span>Ghi nhật ký ngay bây giờ</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
