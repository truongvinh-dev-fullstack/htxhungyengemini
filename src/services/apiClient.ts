import { API_CONFIG } from '../config/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Gửi HTTP Request chuẩn tới Backend API
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const token = localStorage.getItem('hungyen_access_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Thiết lập timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Xử lý mã HTTP không thành công
    if (!response.ok) {
      let errorMessage = `Lỗi máy chủ (${response.status})`;
      let errorData: any = null;

      try {
        errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Response không phải JSON
      }

      // Xử lý tự động khi token hết hạn (401)
      if (response.status === 401) {
        localStorage.removeItem('hungyen_access_token');
        localStorage.removeItem('hungyen_user_profile');
      }

      throw new ApiError(errorMessage, response.status, errorData);
    }

    // Nếu response rỗng (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    const json = await response.json();
    // Nếu backend bọc trong chuẩn ApiResponse { success, data, message }
    if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
      return json.data as T;
    }

    return json as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError('Quá thời gian kết nối tới máy chủ (Timeout)', 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Không thể kết nối tới máy chủ', 0);
  }
}

/**
 * Upload file đa phương tiện (ảnh chụp ruộng/sản phẩm)
 */
export async function uploadFile(endpoint: string, file: File | Blob, fieldName = 'file'): Promise<string> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const token = localStorage.getItem('hungyen_access_token');

  const formData = new FormData();
  formData.append(fieldName, file);

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    throw new ApiError('Tải lên hình ảnh thất bại', response.status);
  }

  const json = await response.json();
  return json.url || json.data?.url || '';
}
