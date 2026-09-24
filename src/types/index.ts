// Data types matching SRS v1.1 Module 3

export type UserRole = 'R06' | 'R05' | 'R04' | 'R02';
// R06: Thành viên / Hộ nông dân
// R05: Tổ trưởng sản xuất
// R04: Kế toán / Bán hàng
// R02: Ban quản trị HTX

export type HTXId = 'anninh' | 'dongtao' | 'quyetthang';

export interface HTXInfo {
  id: HTXId;
  name: string;
  shortName: string;
  address: string;
  district: string;
  productType: string;
  leaderName: string;
  phone: string;
  logo: string;
  bannerTag: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  cccd: string;
  htxId: HTXId;
  team: string; // Tổ sản xuất
  avatar: string;
  address: string;
  status: 'active' | 'pending' | 'rejected' | 'inactive';
}

export interface FarmZone {
  id: string;
  htxId: HTXId;
  ownerId: string;
  name: string; // VD: Thửa Đầm Bông
  variety: string; // Giống cây/vật nuôi: Bắc Thơm số 7, Gà thuần F1...
  season: string; // Vụ Xuân 2026
  areaOrQuantity: string; // 3.500 m² hoặc 500 con
  forecastYield: string; // "Dự kiến thu: 2.2 tấn — còn khoảng 25 ngày"
  status: string;
  imageUrl: string;
  notes: string;
  farmingDays: number;
}

export interface DiaryEntry {
  id: string;
  htxId: HTXId;
  farmZoneId: string;
  farmZoneName: string;
  date: string;
  workType: string;
  workTypes?: string[];
  workTypeName: string;
  workTypeIcon: string;
  suppliesUsed?: string;
  photoUrl: string;
  notes: string;
  createdAt: string; // ISO string
  isLocked: boolean; // Quá 24h hoặc đã mã hóa lưu vết -> không thể sửa
  createdBy: string;
}

export interface HarvestLot {
  id: string;
  code: string; // LH-2026-001
  htxId: HTXId;
  farmZoneId: string;
  farmZoneName: string;
  date: string;
  yieldQuantity: number;
  unit: string; // kg, tấn, con
  photoUrl: string;
  notes: string;
}

export interface PackagedProduct {
  id: string;
  code: string; // SP-2026-089
  htxId: HTXId;
  harvestLotId: string;
  productName: string; // Gạo Bắc Thơm An Ninh túi 5kg
  packQuantity: number;
  unit: string; // Gói, Hộp, Túi, Con
  qrCodeUrl: string;
  createdDate: string;
  expiryDate: string;
  standard: string; // VietGAP, OCOP 4 sao
}

export interface InventoryItem {
  id: string;
  htxId: HTXId;
  name: string;
  category: 'Giong' | 'PhanBon' | 'ThuocBVTV' | 'ThucAn' | 'BaoBi';
  stock: number;
  unit: string;
  minStockAlert: number;
}

export interface StockTransaction {
  id: string;
  code: string;
  type: 'import' | 'export';
  htxId: HTXId;
  date: string;
  itemName: string;
  quantity: number;
  unit: string;
  recipientOrSupplier: string;
  notes: string;
}

export interface SalesOrder {
  id: string;
  code: string;
  htxId: HTXId;
  customerName: string;
  customerPhone: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  status: 'Mới' | 'Đang giao' | 'Hoàn thành';
  date: string;
  invoiceNumber?: string;
}

export interface MemberRequest {
  id: string;
  name: string;
  phone: string;
  cccd: string;
  htxId: HTXId;
  village: string;
  applyDate: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  type: 'reminder' | 'system' | 'approval';
  isRead: boolean;
}
