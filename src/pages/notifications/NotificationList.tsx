import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';
import { AppNotification } from '../../types';

export const NotificationList: React.FC = () => {
  const { notifications, navigateTo, markNotificationAsRead, currentHTX, currentUser } = useApp();
  const [filterType, setFilterType] = React.useState<string>('all');

  const filteredNotifications = notifications.filter((n) => {
    // Scope to current HTX if defined
    if (n.htxId && n.htxId !== currentHTX.id) return false;
    // Scope to target user if defined
    if (n.userId && n.userId !== currentUser.id) return false;

    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const handleOpen = (item: AppNotification) => {
    markNotificationAsRead(item.id);
    navigateTo('notification_detail', { notification: item });
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return { icon: '⏰', bg: 'bg-amber-100 text-amber-800' };
      case 'approval':
        return { icon: '👥', bg: 'bg-emerald-100 text-emerald-800' };
      case 'order':
        return { icon: '🛒', bg: 'bg-purple-100 text-purple-800' };
      case 'alert':
        return { icon: '⚠️', bg: 'bg-red-100 text-red-800' };
      case 'system':
      default:
        return { icon: '📢', bg: 'bg-blue-100 text-blue-800' };
    }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <Header
        title="Thông báo từ HTX"
        voiceText="Đây là danh sách thông báo, lịch thời vụ và nhắc nhở từ Ban Quản trị Hợp tác xã."
      />

      <div className="p-4 space-y-3">
        {/* CN-3.10.1: Bộ lọc thông báo */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'reminder', label: '⏰ Nhắc việc' },
            { id: 'approval', label: '👥 Duyệt hồ sơ' },
            { id: 'order', label: '🛒 Đơn hàng' },
            { id: 'alert', label: '⚠️ Cảnh báo' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                filterType === tab.id
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-2 border border-slate-200">
            <span className="text-4xl block">🔔</span>
            <h4 className="text-base font-bold text-slate-700">Không có thông báo nào</h4>
            <p className="text-xs text-slate-400">Không có tin mới trong mục đã chọn.</p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const { icon, bg } = getNotifIcon(item.type);
            return (
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
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${bg}`}
                  >
                    {icon}
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
            );
          })
        )}
      </div>
    </div>
  );
};
