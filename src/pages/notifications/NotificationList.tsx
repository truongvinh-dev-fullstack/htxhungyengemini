import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { AppNotification } from '../../types';

export const NotificationList: React.FC = () => {
  const { notifications, navigateTo, markNotificationAsRead } = useApp();

  const handleOpen = (item: AppNotification) => {
    markNotificationAsRead(item.id);
    navigateTo('notification_detail', { notification: item });
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Thông báo từ HTX"
        voiceText="Đây là danh sách thông báo, lịch thời vụ và nhắc nhở từ Ban quản trị và Tổ trưởng."
      />

      <div className="p-4 space-y-3">
        {notifications.map((item) => (
          <div
            key={item.id}
            onClick={() => handleOpen(item)}
            className={`p-4 rounded-3xl border-2 transition-all cursor-pointer active:scale-[0.98] ${
              !item.isRead
                ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
                  item.type === 'reminder'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {item.type === 'reminder' ? '⏰' : '📢'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">{item.date}</span>
                  {!item.isRead && (
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                  )}
                </div>
                <h4 className="text-base font-extrabold text-slate-900 leading-tight mt-0.5">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
