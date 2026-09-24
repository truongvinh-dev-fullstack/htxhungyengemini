import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/api';
import { AppNotification, HTXId } from '../types';
import { INITIAL_NOTIFICATIONS } from '../mock/data';

export const notificationService = {
  /**
   * Danh sách thông báo
   */
  async getNotifications(htxId: HTXId): Promise<AppNotification[]> {
    if (API_CONFIG.USE_MOCK) {
      return INITIAL_NOTIFICATIONS.filter(n => n.htxId === htxId);
    }
    return apiClient<AppNotification[]>(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS.BASE}?htxId=${htxId}`);
  },

  /**
   * Đánh dấu đã đọc
   */
  async markAsRead(id: string): Promise<boolean> {
    if (API_CONFIG.USE_MOCK) {
      return true;
    }
    await apiClient(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ(id), { method: 'POST' });
    return true;
  },
};
