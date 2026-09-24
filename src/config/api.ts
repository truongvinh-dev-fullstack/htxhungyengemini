// Cấu hình môi trường và API Endpoint
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  USE_MOCK: import.meta.env.VITE_USE_MOCK === 'true',
  TIMEOUT_MS: 15000,
  ENDPOINTS: {
    AUTH: {
      ZALO_LOGIN: '/auth/zalo-login',
      ME: '/auth/me',
      LOGOUT: '/auth/logout',
    },
    DIARY: {
      BASE: '/diaries',
      BY_ID: (id: string) => `/diaries/${id}`,
      LOCK: (id: string) => `/diaries/${id}/lock`,
      UPLOAD_IMAGE: '/diaries/upload-image',
    },
    ZONE: {
      BASE: '/farm-zones',
      BY_ID: (id: string) => `/farm-zones/${id}`,
    },
    HARVEST: {
      BASE: '/harvest-lots',
      BY_ID: (id: string) => `/harvest-lots/${id}`,
    },
    PACKAGE: {
      BASE: '/packaged-products',
      BY_ID: (id: string) => `/packaged-products/${id}`,
      GENERATE_QR: '/packaged-products/generate-qr',
    },
    WAREHOUSE: {
      INVENTORY: '/inventory',
      TRANSACTIONS: '/inventory/transactions',
      IMPORT: '/inventory/import',
      EXPORT: '/inventory/export',
    },
    ORDER: {
      BASE: '/orders',
      BY_ID: (id: string) => `/orders/${id}`,
      INVOICE: (id: string) => `/orders/${id}/invoice`,
    },
    MEMBERS: {
      BASE: '/members',
      REQUESTS: '/members/requests',
      APPROVE: (id: string) => `/members/requests/${id}/approve`,
      REJECT: (id: string) => `/members/requests/${id}/reject`,
    },
    NOTIFICATIONS: {
      BASE: '/notifications',
      MARK_READ: (id: string) => `/notifications/${id}/read`,
    },
  },
};
