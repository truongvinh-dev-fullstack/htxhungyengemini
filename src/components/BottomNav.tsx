import React from 'react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, notifications, currentRole } = useApp();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getWorkspaceTabConfig = () => {
    switch (currentRole) {
      case 'R04':
        return { icon: '🏬', label: 'Kho & Bán' };
      case 'R02':
        return { icon: '📊', label: 'Báo cáo' };
      case 'R03':
        return { icon: '🌾', label: 'Mùa vụ & Lô' };
      case 'R05':
        return { icon: '👥', label: 'Tổ sản xuất' };
      case 'R06':
      default:
        return { icon: '📖', label: 'Sổ nhật ký' };
    }
  };

  const workspaceTab = getWorkspaceTabConfig();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-slate-200 z-30 flex items-center justify-around py-1.5 px-2 shadow-lg safe-bottom">
      <button
        onClick={() => setActiveTab('home')}
        className={`zalo-nav-tab flex-1 ${activeTab === 'home' ? 'active' : ''}`}
      >
        <span className="text-2xl mb-0.5">🏠</span>
        <span className="text-sm font-bold">Trang chủ</span>
      </button>

      <button
        onClick={() => setActiveTab('diary')}
        className={`zalo-nav-tab flex-1 ${activeTab === 'diary' ? 'active' : ''}`}
      >
        <span className="text-2xl mb-0.5">{workspaceTab.icon}</span>
        <span className="text-sm font-bold">{workspaceTab.label}</span>
      </button>

      <button
        onClick={() => setActiveTab('notifications')}
        className={`zalo-nav-tab flex-1 relative ${activeTab === 'notifications' ? 'active' : ''}`}
      >
        <div className="relative inline-block">
          <span className="text-2xl mb-0.5">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white animate-bounce">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-sm font-bold">Thông báo</span>
      </button>

      <button
        onClick={() => setActiveTab('profile')}
        className={`zalo-nav-tab flex-1 ${activeTab === 'profile' ? 'active' : ''}`}
      >
        <span className="text-2xl mb-0.5">👤</span>
        <span className="text-sm font-bold">Tài khoản</span>
      </button>
    </nav>
  );
};
