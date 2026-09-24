import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/api';
import { UserProfile, MemberRequest, HTXId } from '../types';
import { INITIAL_MEMBERS, INITIAL_MEMBER_REQUESTS } from '../mock/data';

export const memberService = {
  /**
   * Danh sách thành viên HTX
   */
  async getMembers(htxId: HTXId): Promise<UserProfile[]> {
    if (API_CONFIG.USE_MOCK) {
      return INITIAL_MEMBERS.filter(m => m.htxId === htxId);
    }
    return apiClient<UserProfile[]>(`${API_CONFIG.ENDPOINTS.MEMBERS.BASE}?htxId=${htxId}`);
  },

  /**
   * Danh sách yêu cầu xin gia nhập HTX chờ duyệt
   */
  async getRequests(htxId: HTXId): Promise<MemberRequest[]> {
    if (API_CONFIG.USE_MOCK) {
      return INITIAL_MEMBER_REQUESTS.filter(r => r.htxId === htxId);
    }
    return apiClient<MemberRequest[]>(`${API_CONFIG.ENDPOINTS.MEMBERS.REQUESTS}?htxId=${htxId}`);
  },

  /**
   * Phê duyệt thành viên
   */
  async approveRequest(id: string): Promise<boolean> {
    if (API_CONFIG.USE_MOCK) {
      return true;
    }
    await apiClient(API_CONFIG.ENDPOINTS.MEMBERS.APPROVE(id), { method: 'POST' });
    return true;
  },

  /**
   * Từ chối duyệt thành viên
   */
  async rejectRequest(id: string, reason: string): Promise<boolean> {
    if (API_CONFIG.USE_MOCK) {
      return true;
    }
    await apiClient(API_CONFIG.ENDPOINTS.MEMBERS.REJECT(id), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return true;
  },
};
