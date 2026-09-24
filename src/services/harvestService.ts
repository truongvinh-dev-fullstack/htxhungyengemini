import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/api';
import { HarvestLot, HTXId } from '../types';
import { INITIAL_HARVESTS } from '../mock/data';

export const harvestService = {
  /**
   * Lấy danh sách lô thu hoạch
   */
  async getHarvests(htxId: HTXId): Promise<HarvestLot[]> {
    if (API_CONFIG.USE_MOCK) {
      return INITIAL_HARVESTS.filter(h => h.htxId === htxId);
    }
    return apiClient<HarvestLot[]>(`${API_CONFIG.ENDPOINTS.HARVEST.BASE}?htxId=${htxId}`);
  },

  /**
   * Khai báo lô thu hoạch mới
   */
  async createHarvest(lot: Omit<HarvestLot, 'id'>): Promise<HarvestLot> {
    if (API_CONFIG.USE_MOCK) {
      const newLot: HarvestLot = {
        ...lot,
        id: 'lh_' + Date.now(),
      };
      return newLot;
    }
    return apiClient<HarvestLot>(API_CONFIG.ENDPOINTS.HARVEST.BASE, {
      method: 'POST',
      body: JSON.stringify(lot),
    });
  },
};
