import { UserRole, DiaryEntry, HarvestLot, PackagedProduct, ProductHandover, ProductStockItem } from '../types';
import { getPackageOwnership } from './packageOwnership';

export const canViewHarvestScreen = (role: UserRole | undefined): boolean =>
  role === 'R02' || role === 'R03' || role === 'R04' || role === 'R06';

export const canOpenHarvestCreateScreen = (role: UserRole | undefined): boolean =>
  role === 'R02' || role === 'R03' || role === 'R06';

export const canViewPackagingScreen = (role: UserRole | undefined): boolean =>
  role === 'R02' || role === 'R03' || role === 'R04' || role === 'R06';

export const canViewHarvestLot = (
  role: UserRole | undefined,
  lot: HarvestLot,
  htxId: string,
  userId: string,
  handovers?: ProductHandover[]
): boolean => {
  if (!canViewHarvestScreen(role)) return false;
  const lotHtxId = lot.htxId || htxId;
  if (lotHtxId !== htxId) return false;

  // Lô do HTX tự sản xuất hoặc sở hữu chung
  if (!lot.ownerId || lot.ownerId === 'htx' || lot.ownerId === htxId) {
    return true;
  }

  // R03 Giám sát Thu hoạch và R02 Ban Quản trị HTX xem được toàn bộ lô thuộc HTX
  if (role === 'R03' || role === 'R02') {
    return true;
  }

  // Hộ nông dân R06 xem lô của chính hộ mình
  if (role === 'R06') {
    return (
      lot.ownerId === userId ||
      (lot.ownerId && lot.ownerId.toLowerCase() === userId.toLowerCase())
    );
  }

  // SRS v2.1: Màn "Nguồn cung thu hoạch" và chi tiết lô của R04
  // chỉ gồm thu hoạch do HTX tự sản xuất và các phiếu/lượng hộ đã chủ động gửi HTX.
  if (role === 'R04') {
    if (!handovers) return true; // Fallback khi không truyền danh sách phiếu
    return handovers.some(
      (h) =>
        (h.harvestLotId === lot.id ||
          h.harvestLotCode === lot.code ||
          h.harvestLotId === lot.code) &&
        (h.htxId === htxId || !h.htxId)
    );
  }
  return false;
};

export const canViewProductStock = (
  role: UserRole | undefined,
  stock: ProductStockItem,
  htxId: string,
  userId: string
): boolean => {
  if (!role || stock.htxId !== htxId) return false;
  const isHeldByHTX = stock.holderId === htxId || (stock.ownerType === 'htx' && !stock.holderId);
  if (role === 'R04' || role === 'R02') {
    // Kho thành phẩm HTX: CHỈ hiển thị sản phẩm HTX đang giữ (gồm HTX sở hữu và Hộ ký gửi)
    // Tồn sản phẩm còn tại hộ không thuộc Kho thành phẩm HTX
    return isHeldByHTX;
  }
  if (role === 'R06') {
    // Hộ R06 chỉ xem tồn tại hộ của chính mình hoặc hàng ký gửi của chính mình tại HTX
    return stock.ownerId === userId;
  }
  if (role === 'R03') {
    return isHeldByHTX || stock.ownerId === userId;
  }
  return false;
};

export const canViewPackagedProduct = (
  role: UserRole | undefined,
  pkg: PackagedProduct,
  htxId: string,
  userId: string,
  sourceLot?: HarvestLot,
  productStocks: ProductStockItem[] = []
): boolean => {
  if (!canViewPackagingScreen(role) || pkg.htxId !== htxId) return false;

  if (role === 'R04') {
    const { ownerType, holderId } = getPackageOwnership(pkg, productStocks);
    // Hàng HTX sở hữu hoặc hàng ký gửi đang do HTX giữ; loại hàng còn tại hộ.
    return holderId === htxId || (ownerType === 'htx' && !holderId);
  }

  if (role === 'R06') {
    return sourceLot?.ownerId === userId || pkg.ownerId === userId ||
      !!pkg.sourceBatches?.some((batch) => batch.ownerId === userId);
  }
  return true;
};

/**
 * Kiểm tra quyền hạn truy cập màn hình theo vai trò (SRS Mục 7 - Ma trận phân quyền)
 */
export const canAccessScreen = (role: UserRole | undefined, screen: string): boolean => {
  // Các màn hình công khai hoặc đăng nhập
  const publicScreens = ['auth_login', 'trace_scan', 'trace_result'];
  if (publicScreens.includes(screen)) {
    return true;
  }

  // Nếu chưa đăng nhập hoặc không có vai trò
  if (!role) {
    return false;
  }

  // Các màn hình dùng chung cho mọi vai trò nội bộ đã đăng nhập
  const commonScreens = ['home', 'profile', 'notifications', 'notification_detail', 'dashboard', 'feedback_list'];
  if (commonScreens.includes(screen)) {
    return true;
  }

  switch (screen) {
    case 'handover_list':
    case 'handover_detail':
      return ['R02', 'R04', 'R06', 'R03'].includes(role);
    // Nhật ký sản xuất
    case 'diary_list':
    case 'diary_detail':
      return ['R06', 'R03', 'R02'].includes(role);
    case 'diary_add':
      // R06 ghi của hộ, R03 hướng dẫn kỹ thuật
      return ['R06', 'R03'].includes(role);

    // Vùng sản xuất / Thửa ruộng
    case 'farm_list':
    case 'farm_detail':
    case 'farm_season_detail':
      return ['R06', 'R03', 'R02'].includes(role);
    case 'farm_add':
    case 'farm_cycle_add':
      // Chỉ Cán bộ Kỹ thuật R03 được tạo mới vùng sản xuất/thửa ruộng
      return role === 'R03';

    // Thu hoạch
    case 'harvest_list':
    case 'harvest_detail':
      return canViewHarvestScreen(role);
    case 'harvest_add':
      return canOpenHarvestCreateScreen(role);

    // Sơ chế
    case 'processing_list':
    case 'processing_detail':
      return ['R03', 'R02', 'R06'].includes(role);
    case 'processing_add':
      // R06 sơ chế lô mình, R03/R02 sơ chế mẻ HTX
      return ['R06', 'R03', 'R02'].includes(role);

    // Đóng gói & Mã QR
    case 'packaging_list':
    case 'packaging_qr':
      return canViewPackagingScreen(role);
    case 'packaging_add':
      return canManagePackaging(role);

    // Bán hàng & Đơn hàng
    case 'sales_list':
    case 'sales_detail':
      // R04, R02 quản lý HTX; R06 xem đơn của hộ mình; R03 xem/thao tác đơn thay hộ
      return ['R04', 'R02', 'R06', 'R03'].includes(role);
    case 'sales_add':
      // R04, R02 bán hàng HTX; R06 bán trực tiếp; R03 bán thay hộ
      return ['R04', 'R06', 'R02', 'R03'].includes(role);

    // Kho thành phẩm & Tồn nông sản
    case 'product_stock_list':
    case 'product_stock_detail':
      return ['R04', 'R02', 'R06', 'R03'].includes(role);

    // Quản lý kho & Vật tư
    case 'inventory_list':
    case 'inventory_detail':
      return ['R04', 'R02', 'R03', 'R06'].includes(role);
    case 'inventory_add':
    case 'inventory_tx':
    case 'inventory_tx_detail':
      // Chỉ Kế toán/Thủ kho R04 được lập phiếu nhập/xuất kho
      return role === 'R04';

    // Quản lý thành viên (chỉ xem danh sách & chi tiết hồ sơ)
    case 'members_list':
    case 'member_detail':
      return ['R02', 'R03', 'R04'].includes(role);

    default:
      return false;
  }
};

/**
 * Kiểm tra quy tắc khóa nhật ký sau 24 giờ (CN-2.5.5 / CN-2.5.10)
 */
export const isDiaryLocked = (entry: DiaryEntry): boolean => {
  if (entry.isLocked) return true;
  if (!entry.createdAt) return false;

  const createdTime = new Date(entry.createdAt).getTime();
  if (isNaN(createdTime)) return false;

  const diffHours = (Date.now() - createdTime) / (1000 * 60 * 60);
  return diffHours >= 24;
};

/**
 * Kiểm tra quyền sửa/xóa nhật ký
 */
export const canModifyDiary = (
  role: UserRole,
  entry: DiaryEntry,
  currentUserName: string,
  currentUserId?: string
): { canEdit: boolean; canDelete: boolean; canRequestAdjustment?: boolean; reason?: string } => {
  const locked = isDiaryLocked(entry);

  if (locked) {
    return {
      canEdit: false,
      canDelete: false,
      canRequestAdjustment: true,
      reason: 'Nhật ký đã qua 24 giờ và được mã hóa lưu vết. Bác có thể gửi Phiếu đề nghị điều chỉnh để Ban Quản trị HTX phê duyệt.',
    };
  }

  // R03 (Cán bộ kỹ thuật) có toàn quyền điều chỉnh hướng dẫn kỹ thuật
  if (role === 'R03') {
    return { canEdit: true, canDelete: true, canRequestAdjustment: false };
  }

  // R06 chỉ được sửa/xóa nhật ký do chính mình lập
  if (role === 'R06') {
    if (entry.createdById ? entry.createdById === currentUserId : entry.createdBy === currentUserName) {
      return { canEdit: true, canDelete: true, canRequestAdjustment: false };
    }
    return {
      canEdit: false,
      canDelete: false,
      canRequestAdjustment: false,
      reason: 'Bác chỉ có thể chỉnh sửa nhật ký do chính hộ mình ghi.',
    };
  }

  return {
    canEdit: false,
    canDelete: false,
    canRequestAdjustment: false,
    reason: 'Vai trò hiện tại không có quyền thao tác trên nhật ký này.',
  };
};

/**
 * Kiểm tra quyền tạo vùng sản xuất mới (chỉ Cán bộ Kỹ thuật R03)
 */
export const canCreateFarmZone = (role: UserRole | undefined): boolean => {
  return role === 'R03';
};

/**
 * Kiểm tra quyền ghi nhận/chỉnh sửa sơ chế:
 * - R03, R02 thao tác cho mẻ của HTX
 * - R06 được sơ chế lô thuộc sở hữu của hộ mình
 */
export const canManageProcessing = (
  role: UserRole | undefined,
  lotOwnerId?: string,
  currentUserId?: string
): boolean => {
  if (role === 'R03' || role === 'R02') return true;
  if (role === 'R06') {
    if (!lotOwnerId || !currentUserId) return true;
    return lotOwnerId === currentUserId;
  }
  return false;
};

/**
 * Kiểm tra quyền đóng gói và cấp tem mã QR:
 * - R03, R02 đóng gói mẻ HTX
 * - R06 được đóng gói sản phẩm của lô mình
 */
export const canManagePackaging = (
  role: UserRole | undefined,
  lotOwnerId?: string,
  currentUserId?: string
): boolean => {
  if (role === 'R03' || role === 'R02') return true;
  if (role === 'R06') {
    if (!lotOwnerId || !currentUserId) return true;
    return lotOwnerId === currentUserId;
  }
  return false;
};

/**
 * Kiểm tra quyền tạo lô thu hoạch:
 * R03, R02 được tạo cho các thửa trong HTX; R06 tạo cho thửa mình phụ trách
 */
export const canCreateHarvest = (
  role: UserRole | undefined,
  zoneOwnerId?: string,
  currentUserId?: string
): boolean => {
  if (!canOpenHarvestCreateScreen(role)) return false;
  if (role === 'R03' || role === 'R02') return true;
  if (role === 'R06') {
    return !!zoneOwnerId && !!currentUserId && zoneOwnerId === currentUserId;
  }
  return false;
};

/**
 * Quyền kiểm nhận hàng và đối soát (R04 Kế toán/Kho, R02 Quản lý HTX)
 */
export const canConfirmHandover = (role: UserRole | undefined): boolean => {
  return role === 'R04' || role === 'R02';
};

/**
 * Quyền duyệt phiếu điều chỉnh nhật ký sau 24 giờ (R02 Ban quản trị HTX)
 */
export const canApproveDiaryAdjustment = (role: UserRole | undefined): boolean => {
  return role === 'R02';
};

/**
 * Quyền phát hành tem QR mang danh nghĩa HTX (R02, R03)
 */
export const canIssueHTXQR = (role: UserRole | undefined): boolean => {
  return role === 'R02' || role === 'R03';
};
