import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/api';
import { FarmZone, HTXId } from '../types';
import { INITIAL_FARM_ZONES } from '../mock/data';

export const zoneService = {
  /**
   * Lấy danh sách vùng trồng / chuồng nuôi / ao cá
   */
  async getFarmZones(htxId: HTXId, ownerId?: string): Promise<FarmZone[]> {
    if (API_CONFIG.USE_MOCK) {
      let zones = INITIAL_FARM_ZONES.filter(z => z.htxId === htxId);
      if (ownerId) {
        zones = zones.filter(z => z.ownerId === ownerId);
      }
      return zones;
    }

    const query = ownerId ? `?htxId=${htxId}&ownerId=${ownerId}` : `?htxId=${htxId}`;
    return apiClient<FarmZone[]>(`${API_CONFIG.ENDPOINTS.ZONE.BASE}${query}`);
  },

  /**
   * Chi tiết vùng sản xuất
   */
  async getZoneById(id: string): Promise<FarmZone | null> {
    if (API_CONFIG.USE_MOCK) {
      return INITIAL_FARM_ZONES.find(z => z.id === id) || null;
    }
    return apiClient<FarmZone>(API_CONFIG.ENDPOINTS.ZONE.BY_ID(id));
  },
};
