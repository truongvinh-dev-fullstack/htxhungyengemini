// Data types matching SRS v1.1 Module 3

export type UserRole = 'R06' | 'R04' | 'R03' | 'R02';
// R06: Thành viên / Hộ nông dân
// R04: Kế toán / Bán hàng
// R03: Cán bộ kỹ thuật
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
  avatar: string;
  address: string;
  status: 'active' | 'pending' | 'rejected' | 'inactive';
}

export interface SeasonHistoryItem {
  seasonName: string;
  year: number;
  yieldResult: string;
  status: 'Đang canh tác' | 'Đã thu hoạch' | 'Nghỉ vụ';
  quality?: string;
  harvestDate?: string;
}

export interface FarmZone {
  id: string; // ID kỹ thuật nội bộ duy nhất (fz-01, fz-02...)
  zoneCode: string; // Mã số vùng trồng / cơ sở sản xuất (MSVT, VD: MSVT-AN-01)
  htxId: HTXId;
  ownerId: string; // ID hộ nông dân phụ trách
  ownerName: string; // Tên hộ nông dân phụ trách
  name: string; // VD: Thửa Đầm Bông (Cánh đồng Lớn)
  productionType: 'Trồng trọt' | 'Chăn nuôi' | 'Thủy sản' | 'Cây ăn quả';
  variety: string; // Giống cây / vật nuôi
  season: string; // Mùa vụ canh tác
  seasonStartDate?: string;
  seasonEndDate?: string;
  seasonStage?: string;
  seasonHistory?: SeasonHistoryItem[];
  areaValue: number; // Giá trị số diện tích / quy mô
  areaUnit: string; // Đơn vị: m², ha, sào, con, chuồng, lồng
  areaOrQuantity: string; // Chuỗi hiển thị: "3.500 m² (7 sào Bắc Bộ)"
  expectedYieldValue: number; // Giá trị số sản lượng dự kiến
  expectedYieldUnit: string; // Đơn vị: tấn, tạ, kg, con
  expectedHarvestDate: string; // Ngày thu hoạch dự kiến
  forecastYield: string; // Chuỗi hiển thị: "Dự kiến thu: 2,1 tấn — còn khoảng 25 ngày"
  soilOrWaterCondition: string; // Đặc điểm đất thổ nhưỡng hoặc nguồn nước
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
  performedAt?: string; // Giờ thực hiện tại địa phương, dạng YYYY-MM-DDTHH:mm
  workType: string;
  workTypes?: string[];
  workTypeName: string;
  workTypeIcon: string;
  suppliesUsed?: string;
  workDescription?: string;
  materialId?: string;
  materialQuantity?: number;
  materialUnit?: string;
  phiDays?: number;
  weatherCondition?: string;
  weatherSuggestedAt?: string;
  subjectOwnerId?: string; // Hộ phụ trách vùng, có thể khác người ghi hộ
  subjectOwnerName?: string;
  photoUrl: string;
  notes: string;
  createdAt: string; // ISO string
  isLocked: boolean; // Quá 24h hoặc đã mã hóa lưu vết -> không thể sửa
  createdBy: string;
  createdById?: string;
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

export interface ProcessingLot {
  id: string;
  code: string; // SC-AN-2026-001
  htxId: HTXId;
  harvestLotId: string;
  harvestLotCode: string;
  farmZoneName: string;
  productName: string;
  date: string;
  method: string; // Xay xát tách trấu, Sấy lạnh, Làm sạch phân loại, Hút chân không
  inputQuantity: number;
  outputQuantity: number;
  unit: string; // kg, con
  lossRatePercent: number; // e.g. 15.5
  operatorName: string;
  photoUrl: string;
  notes: string;
  status: 'Đã sơ chế' | 'Đã đóng gói';
}

export interface PackagedProduct {
  id: string;
  code: string; // SP-2026-089
  htxId: HTXId;
  harvestLotId: string;
  processingLotId?: string;
  processingLotCode?: string;
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
  unitPrice: number;
  minStockAlert: number;
  description?: string;
}

export interface StockTransaction {
  id: string;
  code: string;
  type: 'import' | 'export';
  htxId: HTXId;
  date: string;
  itemId?: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalAmount?: number;
  recipientOrSupplier: string;
  notes: string;
}

export interface SalesOrder {
  id: string;
  code: string;
  htxId: HTXId;
  sellerId?: string;
  sellerName?: string;
  customerName: string;
  customerPhone: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  status: 'Mới' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy';
  cancelReason?: string;
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
  approvedBy?: string;
  approvedAt?: string;
}

export interface AppNotification {
  id: string;
  htxId?: HTXId;
  userId?: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  type: 'reminder' | 'system' | 'approval' | 'alert' | 'order';
  isRead: boolean;
  actionScreen?: string;
  actionLabel?: string;
}
