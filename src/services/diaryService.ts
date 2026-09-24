import { apiClient, uploadFile } from './apiClient';
import { API_CONFIG } from '../config/api';
import { DiaryEntry, HTXId } from '../types';
import { INITIAL_DIARIES } from '../mock/data';

export const diaryService = {
  /**
   * Lấy danh sách nhật ký sản xuất
   */
  async getDiaries(htxId: HTXId, zoneId?: string): Promise<DiaryEntry[]> {
    if (API_CONFIG.USE_MOCK) {
      let filtered = INITIAL_DIARIES.filter(d => d.htxId === htxId);
      if (zoneId) {
        filtered = filtered.filter(d => d.farmZoneId === zoneId);
      }
      return filtered;
    }

    const query = zoneId ? `?htxId=${htxId}&zoneId=${zoneId}` : `?htxId=${htxId}`;
    return apiClient<DiaryEntry[]>(`${API_CONFIG.ENDPOINTS.DIARY.BASE}${query}`);
  },

  /**
   * Tạo bản ghi nhật ký mới
   */
  async createDiary(entry: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry> {
    if (API_CONFIG.USE_MOCK) {
      const newEntry: DiaryEntry = {
        ...entry,
        id: 'nk_' + Date.now(),
      };
      return newEntry;
    }

    return apiClient<DiaryEntry>(API_CONFIG.ENDPOINTS.DIARY.BASE, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  /**
   * Khóa nhật ký sau 24h
   */
  async lockDiary(id: string): Promise<DiaryEntry> {
    if (API_CONFIG.USE_MOCK) {
      return { id } as DiaryEntry;
    }
    return apiClient<DiaryEntry>(API_CONFIG.ENDPOINTS.DIARY.LOCK(id), {
      method: 'PUT',
    });
  },

  /**
   * Tải ảnh chụp hiện trường lên Cloud
   */
  async uploadPhoto(file: File | Blob): Promise<string> {
    if (API_CONFIG.USE_MOCK) {
      // Mock photo url
      return URL.createObjectURL(file);
    }
    return uploadFile(API_CONFIG.ENDPOINTS.DIARY.UPLOAD_IMAGE, file, 'photo');
  },
};
