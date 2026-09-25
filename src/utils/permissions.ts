import { UserRole, DiaryEntry, HTXId } from '../types';

/**
 * Kiểm tra quyền hạn truy cập màn hình theo vai trò (SRS Mục 7 - Ma trận phân quyền)
 */
export const canAccessScreen = (role: UserRole | undefined, screen: string): boolean => {
  // Các màn hình công khai hoặc đăng nhập
  const publicScreens = ['auth_login', 'auth_register', 'trace_scan', 'trace_result'];
  if (publicScreens.includes(screen)) {
    return true;
  }

  // Nếu chưa đăng nhập hoặc không có vai trò
  if (!role) {
    return false;
  }

  // Các màn hình dùng chung cho mọi vai trò nội bộ đã đăng nhập
  const commonScreens = ['home', 'profile', 'notifications', 'notification_detail', 'dashboard'];
  if (commonScreens.includes(screen)) {
    return true;
  }

  switch (screen) {
    // Sổ nhật ký đồng ruộng
    case 'diary_list':
    case 'diary_detail':
      return ['R06', 'R05', 'R03', 'R02'].includes(role);
    case 'diary_add':
      // R06 ghi của hộ, R05 ghi hộ/hỗ trợ, R03 hướng dẫn kỹ thuật
      return ['R06', 'R05', 'R03'].includes(role);

    // Vùng sản xuất / Thửa ruộng
    case 'farm_list':
    case 'farm_detail':
      return ['R06', 'R05', 'R03', 'R02'].includes(role);
    case 'farm_add':
      return ['R06', 'R03'].includes(role);

    // Thu hoạch
    case 'harvest_list':
    case 'harvest_detail':
      return ['R06', 'R05', 'R03', 'R02'].includes(role);
    case 'harvest_add':
      return ['R06', 'R03'].includes(role);

    // Sơ chế
    case 'processing_list':
    case 'processing_detail':
      return ['R03', 'R02', 'R05', 'R06'].includes(role);
    case 'processing_add':
      return ['R03', 'R02'].includes(role);

    // Đóng gói & Mã QR
    case 'packaging_list':
    case 'packaging_qr':
      return ['R03', 'R02', 'R05', 'R06'].includes(role);
    case 'packaging_add':
      return ['R03', 'R02'].includes(role);

    // Bán hàng & Đơn hàng
    case 'sales_list':
    case 'sales_detail':
      // R04, R02 quản lý HTX; R06 xem đơn của hộ mình
      return ['R04', 'R02', 'R06'].includes(role);
    case 'sales_add':
      return ['R04', 'R06'].includes(role);

    // Quản lý kho & Vật tư
    case 'inventory_list':
    case 'inventory_detail':
      return ['R04', 'R02', 'R03', 'R06'].includes(role);
    case 'inventory_add':
    case 'inventory_tx':
    case 'inventory_tx_detail':
      // Chỉ Kế toán/Thủ kho R04 được lập phiếu nhập/xuất kho
      return role === 'R04';

    // Quản lý thành viên & Phê duyệt
    case 'members_list':
    case 'member_detail':
      return ['R02', 'R05', 'R03', 'R04'].includes(role);
    case 'member_add':
      return ['R02', 'R05', 'R03'].includes(role);
    case 'members_approval':
      // CN-2.3.5 / CN-3.2.4: R02 duyệt toàn HTX, R05 duyệt trong tổ
      return ['R02', 'R05'].includes(role);

    default:
      return true;
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
  currentUserName: string
): { canEdit: boolean; canDelete: boolean; reason?: string } => {
  const locked = isDiaryLocked(entry);

  if (locked) {
    return {
      canEdit: false,
      canDelete: false,
      reason: 'Nhật ký đã qua 24 giờ và được hệ thống mã hóa bảo vệ tính minh bạch VietGAP, không thể chỉnh sửa hoặc xóa.',
    };
  }

  // R03 (Cán bộ kỹ thuật) có toàn quyền điều chỉnh hướng dẫn kỹ thuật
  if (role === 'R03') {
    return { canEdit: true, canDelete: true };
  }

  // R05 (Tổ trưởng) có quyền hỗ trợ ghi/sửa cho tổ viên trong 24h
  if (role === 'R05') {
    return { canEdit: true, canDelete: true };
  }

  // R06 chỉ được sửa/xóa nhật ký do chính mình lập
  if (role === 'R06') {
    if (entry.createdBy === currentUserName) {
      return { canEdit: true, canDelete: true };
    }
    return {
      canEdit: false,
      canDelete: false,
      reason: 'Bác chỉ có thể chỉnh sửa nhật ký do chính hộ mình ghi.',
    };
  }

  return {
    canEdit: false,
    canDelete: false,
    reason: 'Vai trò hiện tại không có quyền thao tác trên nhật ký này.',
  };
};

/**
 * Kiểm tra quyền phê duyệt thành viên (R02 duyệt toàn HTX, R05 duyệt trong tổ)
 */
export const canApproveMember = (
  role: UserRole,
  userTeam?: string,
  requestTeam?: string
): boolean => {
  if (role === 'R02') return true;
  if (role === 'R05') {
    // Nếu cả hai đều có thông tin tổ, kiểm tra cùng tổ; nếu không mặc định tổ trưởng duyệt hồ sơ đăng ký tổ mình
    if (userTeam && requestTeam) {
      return userTeam.includes(requestTeam) || requestTeam.includes(userTeam);
    }
    return true;
  }
  return false;
};
