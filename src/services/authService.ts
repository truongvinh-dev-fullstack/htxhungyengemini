import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/api';
import { UserProfile } from '../types';
import { DEMO_USERS } from '../mock/data';

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export const authService = {
  /**
   * Đăng nhập Zalo bằng số điện thoại
   */
  async loginWithZaloPhone(phone: string): Promise<{ success: boolean; reason?: string; user?: UserProfile; token?: string }> {
    if (API_CONFIG.USE_MOCK) {
      // Mock Data Fallback
      const normalizedPhone = phone.replace(/\s+/g, '');
      const user = Object.values(DEMO_USERS).find(u => u.phone.replace(/\s+/g, '') === normalizedPhone);
      if (user) {
        localStorage.setItem('hungyen_access_token', 'mock_token_' + user.id);
        localStorage.setItem('hungyen_user_profile', JSON.stringify(user));
        return { success: true, user, token: 'mock_token_' + user.id };
      }
      return { success: false, reason: 'Số điện thoại này chưa được đăng ký trong danh sách thành viên HTX.' };
    }

    try {
      const res = await apiClient<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH.ZALO_LOGIN, {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      localStorage.setItem('hungyen_access_token', res.token);
      localStorage.setItem('hungyen_user_profile', JSON.stringify(res.user));
      return { success: true, user: res.user, token: res.token };
    } catch (err: any) {
      return { success: false, reason: err.message || 'Lỗi kết nối máy chủ xác thực' };
    }
  },

  /**
   * Lấy thông tin tài khoản hiện tại
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    if (API_CONFIG.USE_MOCK) {
      const saved = localStorage.getItem('hungyen_user_profile');
      return saved ? JSON.parse(saved) : null;
    }
    try {
      return await apiClient<UserProfile>(API_CONFIG.ENDPOINTS.AUTH.ME);
    } catch {
      return null;
    }
  },

  /**
   * Đăng xuất
   */
  logout(): void {
    localStorage.removeItem('hungyen_access_token');
    localStorage.removeItem('hungyen_user_profile');
  },
};
