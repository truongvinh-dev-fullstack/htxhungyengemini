import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/api';
import { ProcessingLot, HTXId } from '../types';
import { INITIAL_PROCESSING_LOTS } from '../mock/data';

export const processingService = {
  /**
   * Lấy danh sách lô sơ chế
   */
  async getProcessingLots(htxId: HTXId): Promise<ProcessingLot[]> {
    if (API_CONFIG.USE_MOCK) {
      return INITIAL_PROCESSING_LOTS.filter(p => p.htxId === htxId);
    }
    return apiClient<ProcessingLot[]>(`${API_CONFIG.ENDPOINTS.PROCESSING.BASE}?htxId=${htxId}`);
  },

  /**
   * Tạo lô sơ chế mới
   */
  async createProcessingLot(lot: Omit<ProcessingLot, 'id'>): Promise<ProcessingLot> {
    if (API_CONFIG.USE_MOCK) {
      const newLot: ProcessingLot = {
        ...lot,
        id: 'sc_' + Date.now(),
      };
      return newLot;
    }
    return apiClient<ProcessingLot>(API_CONFIG.ENDPOINTS.PROCESSING.BASE, {
      method: 'POST',
      body: JSON.stringify(lot),
    });
  },
};
