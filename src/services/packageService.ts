import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/api';
import { PackagedProduct, HTXId } from '../types';
import { INITIAL_PACKAGES } from '../mock/data';

export const packageService = {
  /**
   * Lấy danh sách sản phẩm đóng gói dán tem QR
   */
  async getPackages(htxId: HTXId): Promise<PackagedProduct[]> {
    if (API_CONFIG.USE_MOCK) {
      return INITIAL_PACKAGES.filter(p => p.htxId === htxId);
    }
    return apiClient<PackagedProduct[]>(`${API_CONFIG.ENDPOINTS.PACKAGE.BASE}?htxId=${htxId}`);
  },

  /**
   * Tạo đóng gói và sinh mã QR
   */
  async createPackage(pkg: Omit<PackagedProduct, 'id'>): Promise<PackagedProduct> {
    if (API_CONFIG.USE_MOCK) {
      const newPkg: PackagedProduct = {
        ...pkg,
        id: 'pkg_' + Date.now(),
      };
      return newPkg;
    }
    return apiClient<PackagedProduct>(API_CONFIG.ENDPOINTS.PACKAGE.BASE, {
      method: 'POST',
      body: JSON.stringify(pkg),
    });
  },
};
