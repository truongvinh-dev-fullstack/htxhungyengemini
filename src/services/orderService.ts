import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/api';
import { SalesOrder, HTXId } from '../types';
import { INITIAL_ORDERS } from '../mock/data';

export const orderService = {
  /**
   * Danh sách đơn hàng bán
   */
  async getOrders(htxId: HTXId): Promise<SalesOrder[]> {
    if (API_CONFIG.USE_MOCK) {
      return INITIAL_ORDERS.filter(o => o.htxId === htxId);
    }
    return apiClient<SalesOrder[]>(`${API_CONFIG.ENDPOINTS.ORDER.BASE}?htxId=${htxId}`);
  },

  /**
   * Tạo đơn hàng mới
   */
  async createOrder(order: Omit<SalesOrder, 'id'>): Promise<SalesOrder> {
    if (API_CONFIG.USE_MOCK) {
      const newOrder: SalesOrder = {
        ...order,
        id: 'ord_' + Date.now(),
      };
      return newOrder;
    }
    return apiClient<SalesOrder>(API_CONFIG.ENDPOINTS.ORDER.BASE, {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  /**
   * Cập nhật trạng thái đơn hàng
   */
  async updateOrderStatus(id: string, status: SalesOrder['status']): Promise<SalesOrder> {
    if (API_CONFIG.USE_MOCK) {
      return { id, status } as SalesOrder;
    }
    return apiClient<SalesOrder>(API_CONFIG.ENDPOINTS.ORDER.BY_ID(id), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
