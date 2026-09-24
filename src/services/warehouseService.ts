import { apiClient } from './apiClient';
import { API_CONFIG } from '../config/api';
import { InventoryItem, StockTransaction, HTXId } from '../types';
import { INITIAL_INVENTORY, INITIAL_TRANSACTIONS } from '../mock/data';

export const warehouseService = {
  /**
   * Danh sách tồn kho vật tư
   */
  async getInventory(htxId: HTXId): Promise<InventoryItem[]> {
    if (API_CONFIG.USE_MOCK) {
      return INITIAL_INVENTORY.filter(i => i.htxId === htxId);
    }
    return apiClient<InventoryItem[]>(`${API_CONFIG.ENDPOINTS.WAREHOUSE.INVENTORY}?htxId=${htxId}`);
  },

  /**
   * Lịch sử giao dịch nhập/xuất kho
   */
  async getTransactions(htxId: HTXId): Promise<StockTransaction[]> {
    if (API_CONFIG.USE_MOCK) {
      return INITIAL_TRANSACTIONS.filter(t => t.htxId === htxId);
    }
    return apiClient<StockTransaction[]>(`${API_CONFIG.ENDPOINTS.WAREHOUSE.TRANSACTIONS}?htxId=${htxId}`);
  },

  /**
   * Tạo phiếu xuất / nhập kho
   */
  async createTransaction(tx: Omit<StockTransaction, 'id'>): Promise<StockTransaction> {
    if (API_CONFIG.USE_MOCK) {
      const newTx: StockTransaction = {
        ...tx,
        id: 'tx_' + Date.now(),
      };
      return newTx;
    }
    const endpoint = tx.type === 'export' ? API_CONFIG.ENDPOINTS.WAREHOUSE.EXPORT : API_CONFIG.ENDPOINTS.WAREHOUSE.IMPORT;
    return apiClient<StockTransaction>(endpoint, {
      method: 'POST',
      body: JSON.stringify(tx),
    });
  },
};
