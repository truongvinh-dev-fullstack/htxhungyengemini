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

export type ProductionUnitStatus =
  | 'dang_su_dung'
  | 'tam_ngung'
  | 'ngung_su_dung'
  | 'Đang sử dụng'
  | 'Tạm ngừng sử dụng'
  | 'Ngừng sử dụng';

export type ProductionCycleStatus =
  | 'du_kien'
  | 'dang_thuc_hien'
  | 'tam_dung'
  | 'cho_tong_ket'
  | 'da_ket_thuc'
  | 'da_huy'
  | 'Dự kiến'
  | 'Đang thực hiện'
  | 'Tạm dừng'
  | 'Chờ tổng kết'
  | 'Đã kết thúc'
  | 'Đã hủy'
  | 'Đang canh tác'
  | 'Đã thu hoạch'
  | 'Nghỉ vụ';

export interface ProductionCycle {
  cycleId?: string; // Định danh chu kỳ sản xuất
  unitId?: string;
  farmingDays?: number;
  seasonId: string; // Tương thích dữ liệu cũ
  cycleName?: string; // Tên chu kỳ (Vụ Mùa 2026, Lứa gà thịt Tết 2026...)
  seasonName: string;
  year: number;
  status: ProductionCycleStatus; // Trạng thái chu kỳ: Dự kiến, Đang thực hiện, Tạm dừng, Chờ tổng kết, Đã kết thúc, Đã hủy
  processVersion?: string; // Phiên bản quy trình kỹ thuật áp dụng (VD: "VietGAP v2.1")
  processName?: string; // Tên quy trình
  processId?: string;
  startDate?: string;
  endDate?: string;
  seasonStartDate?: string;
  seasonEndDate?: string;
  seasonStartTime?: string;
  seasonEndTime?: string;
  stage?: string;
  seasonStage?: string;
  expectedYieldValue?: number;
  stockedQuantity?: number; // Số con nhập riêng cho lứa nuôi; không phải sức chứa cố định của chuồng/lồng
  expectedYieldUnit?: string;
  expectedHarvestDate?: string;
  forecastYield?: string;
  yieldResult?: string;
  quality?: string;
  harvestDate?: string;
  notes?: string;
  variety?: string;
  productName?: string;
  areaValue?: number;
  areaUnit?: string;
  areaOrQuantity?: string;
  ownerId?: string;
  ownerName?: string;
}

export type SeasonHistoryItem = ProductionCycle;

export interface ProductionUnit {
  id: string; // ID kỹ thuật (fz-01, fz-02...)
  unitCode?: string; // Mã định danh đơn vị (MSVT-AN-01)
  zoneCode: string;
  htxId: HTXId;
  ownerId: string;
  ownerName: string;
  name: string; // Thửa Đầm Bông, Khu chuồng trại 1, Lồng cá sông Luộc...
  productionType: 'Trồng trọt' | 'Chăn nuôi' | 'Thủy sản' | 'Cây ăn quả';
  facilityType?: 'thua_ruong' | 'vuon_cay' | 'chuong_nuoi' | 'chuong_trai' | 'long_ca' | 'long_be' | 'ao_nuoi' | 'ao_ho';
  location?: string;
  dimensionType?: 'dien_tich' | 'so_con' | 'the_tich';
  isPlant?: boolean;
  isPermanent?: boolean;
  dimensionValue?: number;
  dimensionUnit?: string;

  // Trạng thái sử dụng của ĐƠN VỊ: Đang sử dụng | Tạm ngừng sử dụng | Ngừng sử dụng
  status: ProductionUnitStatus;
  unitStatus?: ProductionUnitStatus;
  statusNote?: string;
  statusNotes?: string; // Ghi chú lý do tạm ngừng/ngừng sử dụng

  areaValue: number;
  areaUnit: string;
  areaOrQuantity: string;
  soilOrWaterCondition: string;
  imageUrl: string;
  notes: string;

  // Quan hệ 1 đơn vị có nhiều chu kỳ
  cycles?: ProductionCycle[];
  seasonHistory?: ProductionCycle[];

  // Tương thích ngược (deprecated - tính từ activeCycle)
  currentSeasonId?: string;
  season?: string;
  variety?: string;
  farmingDays?: number;
  expectedYieldValue?: number;
  expectedYieldUnit?: string;
  expectedHarvestDate?: string;
  forecastYield?: string;
  seasonStartDate?: string;
  seasonEndDate?: string;
  seasonStage?: string;
}

export type FarmZone = ProductionUnit;

export interface DiaryAdjustmentHistory {
  date: string;
  reviewer: string;
  reason: string;
  changeSummary: string;
}

export interface DiaryAdjustmentRequest {
  id: string;
  htxId: HTXId;
  diaryId: string;
  farmZoneId: string;
  farmZoneName: string;
  requesterId: string;
  requesterName: string;
  reason: string;
  originalNotes: string;
  originalWorkTypeName: string;
  proposedNotes: string;
  proposedWorkTypeName?: string;
  proposedSuppliesUsed?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  htxId: HTXId;
  farmZoneId: string;
  farmZoneName: string;
  cycleId?: string; // Định danh chu kỳ sản xuất
  cycleName?: string;
  seasonId?: string; // Gắn với mùa vụ canh tác (tương thích)
  seasonName?: string;
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
  adjustmentHistory?: DiaryAdjustmentHistory[];
  createdBy: string;
  createdById?: string;
  taskId?: string; // ID công việc liên kết nếu ghi từ kế hoạch giao trước
  taskTitle?: string;
  isIncident?: boolean; // Việc phát sinh ngoài kế hoạch
}

export interface QualityCriterionItem {
  id: string;
  name: string; // Tiêu chí: Độ ẩm, Brix, Vảy rồng, Trọng lượng TB...
  standardValue: string; // Giá trị tiêu chuẩn: "< 14%", ">= 18° Brix", "Chân to vảy thịt"
  standardTarget?: string; // Tên alias tương thích
  actualValue?: string; // Giá trị thực tế đo được
  isPassed?: boolean;
}

export interface QualityCriteriaConfig {
  productType: string;
  categoryName?: string;
  criteria: QualityCriterionItem[];
  grades: { id: string; name: string; description: string }[];
}

export interface ProcessingInfo {
  id?: string;
  date: string; // Ngày sơ chế
  method: string; // Phương pháp/nội dung sơ chế
  inputQuantity: number; // Khối lượng đưa vào
  outputQuantity: number; // Khối lượng sau sơ chế
  unit: string; // Đơn vị: kg, con...
  lossQuantity: number; // Hao hụt = input - output
  lossRatePercent: number; // Tỷ lệ hao hụt (%)
  recoveryRatePercent: number; // Tỷ lệ thu hồi (%)
  notes?: string;
  operatorName?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface HarvestAllocation {
  directSaleQuantity: number; // Đã bán trực tiếp cho thương lái
  deliveredToHTXQuantity: number; // Đã giao / bán cho HTX
  packagedAtFarmQuantity: number; // Hộ tự đóng gói
  processedAtFarmQuantity: number; // Hộ tự sơ chế
  remainingAvailable: number; // Khả dụng còn tồn tại hộ
}

export interface HarvestLotSource {
  farmZoneId: string;
  farmZoneName: string;
  zoneCode?: string;
  cycleId?: string;
  cycleName?: string;
  quantity: number;
  unit: string;
  harvestDate?: string;
}

export interface HarvestLot {
  id: string;
  code: string; // TH-AN-2026-001
  htxId: HTXId;
  farmZoneId: string;
  farmZoneName: string;
  zoneCode?: string; // MSVT mã số vùng trồng
  sources?: HarvestLotSource[]; // Danh sách các thửa/vùng nguồn đóng góp vào lô
  variety?: string; // Giống cây/sản phẩm
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string; // SĐT chủ hộ
  cycleId?: string; // Định danh chu kỳ sản xuất
  cycleName?: string;
  seasonId?: string; // Gắn với mùa vụ cụ thể (tương thích)
  seasonName?: string;
  date: string;
  yieldQuantity: number; // Tổng sản lượng
  grade1Quantity?: number; // Khối lượng Loại 1
  grade2Quantity?: number; // Khối lượng Loại 2
  qualityCategory?: string; // Phân loại tiêu chí chất lượng
  qualityMetric?: string; // Chỉ số chất lượng thực tế
  qualityCriteria?: QualityCriterionItem[]; // Tiêu chí theo loại sản phẩm
  unit: string; // kg, tấn, con
  photoUrl: string;
  notes: string;
  processingStatus?: 'chua_so_che' | 'khong_so_che' | 'da_so_che';
  processingInfo?: ProcessingInfo;
  processingHistory?: ProcessingInfo[]; // Hỗ trợ nhiều lần sơ chế
  allocation?: HarvestAllocation; // Phân bổ sản lượng
  qrCodeUrl?: string; // Mã QR độc lập cho lô bán thô / bán sống không đóng gói
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
  lossQuantity?: number;
  lossRatePercent: number; // e.g. 15.5
  operatorName: string;
  photoUrl: string;
  notes: string;
  status: 'Đã sơ chế' | 'Đã đóng gói';
}

export interface PackagingProcessingSnapshot {
  hasProcessing: boolean;
  statusText: 'Đã sơ chế' | 'Không sơ chế' | 'Chưa sơ chế';
  date?: string;
  method?: string;
  inputQuantity?: number;
  outputQuantity?: number;
  unit?: string;
  lossQuantity?: number;
  lossRatePercent?: number;
  recoveryRatePercent?: number;
  notes?: string;
  operatorName?: string;
}

export interface SourceBatchContribution {
  harvestLotId: string;
  harvestLotCode: string;
  ownerId?: string;
  ownerName?: string;
  quantity: number;
  unit: string;
}

export interface PackagedProduct {
  id: string;
  code: string; // SP-2026-089
  htxId: HTXId;
  harvestLotId: string;
  harvestLotCode?: string; // Mã lô thu hoạch gắn tem (chỉ đọc)
  sourceBatches?: SourceBatchContribution[]; // Gom hàng từ nhiều hộ
  processingLotId?: string;
  processingLotCode?: string;
  productName: string; // Tên sản phẩm in trên nhãn
  packagingSpec?: string; // Quy cách bao bì
  netWeightPerPack?: number; // Khối lượng thực của mỗi gói (VD: 5, 2, 1...)
  netWeightUnit?: string; // Đơn vị khối lượng thực (kg, con...)
  packQuantity: number;
  unit: string; // Gói, Hộp, Túi, Con, Thùng...
  isLiveProduct?: boolean; // Hàng bán sống không ép gói/hạn sử dụng
  parentPackageId?: string; // Nếu HTX đóng gói lại từ gói trước
  packagingLevel?: 'nguyen_trang' | 'dong_goi_lai' | 'dong_goi_moi';
  qrCodeUrl?: string;
  qrStatus?: 'da_phat_hanh' | 'chua_phat_hanh' | 'cho_duyet';
  createdDate: string;
  expiryDate?: string;
  standard: string; // VietGAP, OCOP 4 sao
  certValidUntil?: string; // Thời hạn chứng nhận còn hiệu lực
  certScope?: string; // Phạm vi chứng nhận
  processingSnapshot?: PackagingProcessingSnapshot;
  harvestSnapshot?: {
    harvestDate?: string;
    farmZoneName?: string;
    zoneCode?: string;
    variety?: string;
    ownerName?: string;
    yieldQuantity?: number;
    unit?: string;
    sources?: HarvestLotSource[];
  };
  sourceStockItemId?: string; // Mã dòng tồn nguồn xuất đóng gói
  sourceProductState?: 'hang_tho' | 'da_xu_ly'; // Trạng thái dòng nguồn khi đóng gói
  ownerType?: StockOwnerType;
  ownerId?: string;
  ownerName?: string;
  holderId?: string;
  holderName?: string;
  actorId?: string; // Người thực hiện đóng gói
  actorName?: string;
  onBehalfOfFarmer?: boolean; // R03 đóng gói cho hộ sở hữu
}

export type ProductState = 'hang_tho' | 'da_xu_ly' | 'da_dong_goi' | 'cho_kiem_tra' | 'da_ban';
export type StockOwnerType = 'ho_dan' | 'htx';

export interface ProductStockItem {
  id: string;
  htxId: HTXId;
  harvestLotId: string;
  harvestLotCode: string;
  variety: string;
  ownerType: StockOwnerType;
  ownerId: string;
  ownerName: string;
  holderId?: string; // Bên đang giữ hàng; có thể khác chủ sở hữu khi ký gửi.
  holderName?: string;
  handoverId?: string;
  locationName: string;
  state: ProductState;
  quantity: number;
  unit: string;
  spec?: string; // Quy cách: Thóc tươi, Gạo đóng túi 5kg, Nhãn thùng 10kg, Gà sống...
  processingLotId?: string;
  packageId?: string;
  packageCode?: string;
  sourceStockItemId?: string; // Mã dòng tồn nguồn khi sơ chế hoặc đóng gói
  sourceProductState?: 'hang_tho' | 'da_xu_ly'; // Trạng thái dòng nguồn khi đóng gói
  netWeightPerPack?: number; // Khối lượng tịnh mỗi gói
  totalNetWeight?: number; // Tổng khối lượng tịnh
  notes?: string;
  updatedAt: string;
}

export interface ProductHandover {
  id: string;
  code: string; // GN-QT-2026-001
  htxId: HTXId;
  harvestLotId: string;
  harvestLotCode: string;
  stockItemId?: string; // Định danh dòng tồn nguồn tại hộ nếu xuất từ dòng tồn cụ thể
  packageId?: string; // ID lô đóng gói nếu giao hàng đóng gói
  packageCode?: string; // Mã bao gói nếu có
  processingLotId?: string; // ID lô sơ chế nếu giao hàng sơ chế/đóng gói
  variety: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  receiverName?: string;
  handoverType: 'mua_dut' | 'ky_gui';
  productState: 'hang_tho' | 'da_xu_ly' | 'da_dong_goi';
  packageSpec?: string;
  transportPackaging?: string; // Bao bì vận chuyển (VD: 15 bao tải x 10 kg, chỉ mô tả vận chuyển, trạng thái vẫn là hàng thô)
  netWeightPerPack?: number; // Khối lượng tịnh mỗi gói
  totalNetWeight?: number; // Tổng khối lượng tịnh quy đổi để cân/đối soát
  declaredQuantity: number;
  receivedQuantity?: number;
  differenceQuantity?: number;
  unit: string;
  unitPrice?: number;
  agreedUnitPrice?: number;
  totalAmount?: number;
  estimatedTotalAmount?: number;
  paidAmount?: number;
  paymentStatus?: 'chua_thanh_toan' | 'tam_ung' | 'da_thanh_toan';
  doiSoatStatus?: 'cho_doi_soat' | 'da_khop' | 'lech_da_xac_nhan' | 'khieu_nai';
  disputeNote?: string; // Hộ gửi ý kiến / khiếu nại nếu có chênh lệch cân
  documentPhoto?: string; // Ảnh phiếu cân / biên bản hiện trường
  pickupScheduleDate?: string; // Lịch gom hoặc lịch giao HTX
  qualityAssessment?: string;
  status: 'cho_kiem_nhan' | 'da_kiem_nhan' | 'tu_choi';
  createdAt: string;
  confirmedAt?: string;
  date?: string;
  notes?: string;
  createdBy?: string; // Người lập phiếu (có thể là R03 lập thay)
  actorId?: string; // ID người thao tác thực tế
  actorName?: string; // Tên người thao tác thực tế
  onBehalfOfFarmer?: boolean; // Cờ ghi nhận R03 thao tác thay hộ
  confirmationMethod?: 'truc_tiep' | 'dien_thoai' | 'giay_uy_quyen'; // Phương thức hộ xác nhận
  confirmationTime?: string; // Thời điểm hộ xác nhận
  confirmationNote?: string; // Ghi chú xác nhận / bằng chứng
  isDraft?: boolean; // Lưu nháp nếu chưa có xác nhận của hộ
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
  sellerType?: 'ho_dan' | 'htx';
  sellerId?: string;
  sellerName?: string;
  customerName: string;
  customerPhone: string;
  salesChannel?: 'thuong_lai' | 'dai_ly' | 'sieu_thi' | 'ban_le' | 'online' | 'hoi_cho' | 'truc_tiep';
  productId?: string;
  productName: string;
  harvestLotId?: string;
  harvestLotCode?: string;
  stockItemId?: string;
  sourceHandoverId?: string;
  sourceOwnerId?: string;
  quantity: number;
  deliveredQuantity?: number;
  returnQuantity?: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  status: 'Mới' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy';
  deliveryStatus?: 'chua_giao' | 'dang_giao' | 'da_giao' | 'da_huy';
  deliveryDate?: string;
  deliveryProofPhoto?: string;
  deliveryNotes?: string;
  paymentStatus?: 'chua_thanh_toan' | 'tam_ung' | 'da_thanh_toan';
  paidAmount?: number;
  remainingDebt?: number;
  cancelReason?: string;
  date: string;
  invoiceNumber?: string;
  qrCodeUrl?: string; // Mã QR gắn vào phiếu xuất / đơn bán không đóng gói
  createdBy?: string; // Người tạo đơn (có thể là R03 tạo thay)
  actorId?: string; // ID người thao tác thực tế
  actorName?: string; // Tên người thao tác thực tế
  onBehalfOfFarmer?: boolean; // Cờ ghi nhận R03 thao tác thay hộ
  confirmationMethod?: 'truc_tiep' | 'dien_thoai' | 'giay_uy_quyen'; // Phương thức hộ xác nhận
  confirmationTime?: string; // Thời điểm hộ xác nhận
  confirmationNote?: string; // Ghi chú xác nhận / bằng chứng
  isDraft?: boolean; // Lưu nháp nếu chưa có xác nhận của hộ
}

export interface ProductionTask {
  id: string;
  htxId: HTXId;
  title: string;
  description?: string;
  farmZoneId: string;
  farmZoneName: string;
  cycleId?: string;
  cycleName?: string;
  assignedTo: string; // Phone hoặc ID hộ/người phụ trách
  assigneeName: string;
  dueDate: string;
  status: 'chua_lam' | 'da_lam' | 'tre' | 'huy' | 'can_bo_sung';
  taskCategory: 'dich_vu_htx' | 'tiem_phong_thu_y' | 'cham_soc' | 'kiem_tra' | 'thu_hoach' | 'xuat_ban' | 'phat_sinh';
  diaryId?: string; // ID của nhật ký thực tế đã lưu kết quả cho việc này
  needsAdditionalResult?: boolean; // Việc đã làm nhưng cần bổ sung kết quả
  completedAt?: string;
  resultNotes?: string;
  resultPhoto?: string;
  reportedIssue?: string; // Báo sự cố nếu có
  actualQuantity?: number;
  actualUnit?: string;
  // Dành cho HTX An Ninh: Yêu cầu dịch vụ cơ giới / vật tư
  serviceRequest?: {
    serviceType: 'gat' | 'cay' | 'say' | 'vat_tu' | 'khac';
    requestedDate: string;
    scheduledDate?: string;
    actualQuantity?: number;
    unit?: string;
    status: 'cho_xep_lich' | 'da_xep_lich' | 'hoan_thanh';
    machineOperator?: string;
  };
  // Dành cho HTX Đông Tảo: Kế hoạch lứa nuôi, tiêm phòng, biến động đàn & xuất bán
  livestockLog?: {
    currentBirdCount?: number;
    deadOrCulledCount?: number;
    sampleWeightKg?: number;
    medicationUsed?: string;
    diseaseSymptoms?: string;
    salesRequestStatus?: 'chua_yeu_cau' | 'cho_duyet' | 'da_duyet' | 'tu_choi';
    salesRequestNotes?: string;
  };
  // Dành cho HTX Quyết Thắng: Lứa cá lồng & Vườn cây ăn quả
  fisheryLog?: {
    cageCode?: string;
    batchCode?: string;
    species?: string;
    stockedQuantity?: number;
    feedUsed?: string;
    mortalityCount?: number;
    waterTemperature?: number;
    dissolvedOxygen?: number;
    environmentalNotes?: string;
    estimatedYieldKg?: number;
    harvestCount?: number;
  };
}

export interface CustomerFeedback {
  id: string;
  htxId: HTXId;
  orderId?: string;
  orderCode?: string;
  harvestLotId?: string;
  harvestLotCode?: string;
  customerName: string;
  customerPhoneMasked: string; // Che số bảo mật
  feedbackContent: string;
  rating: number; // 1 - 5 sao
  photoUrl?: string;
  feedbackDate: string;
  status: 'cho_xu_ly' | 'dang_xu_ly' | 'da_giai_quyet';
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedDate?: string;
}

export interface HTXCoopConfig {
  htxId: HTXId;
  enableDetailedWarehouse: boolean; // Chỉ bật kho đầy đủ thí điểm cho An Ninh
  enableDetailedProcessing: boolean; // Bật sơ chế chi tiết
  enableServiceRequest: boolean; // Dịch vụ gặt, cấy, sấy cho lúa
  enableLivestockTracking: boolean; // Quản lý lứa gà, tiêm phòng
  enableFisheryTracking: boolean; // Quản lý cá lồng sông Luộc
  supportedHandoverTypes: Array<'mua_dut' | 'ky_gui'>;
  allowedSalesChannels: Array<'thuong_lai' | 'dai_ly' | 'sieu_thi' | 'ban_le' | 'online' | 'hoi_cho' | 'truc_tiep'>;
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
  actionParams?: Record<string, string>;
  reminderTaskId?: string;
}
