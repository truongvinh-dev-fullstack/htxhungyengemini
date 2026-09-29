import {
  FarmZone,
  ProductionUnit,
  ProductionCycle,
  SeasonHistoryItem,
  ProductionUnitStatus,
  ProductionCycleStatus,
} from '../types';

/**
 * Chuẩn hóa trạng thái sử dụng của đơn vị sản xuất
 */
export function getUnitStatusInfo(status?: string): {
  code: 'dang_su_dung' | 'tam_ngung' | 'ngung_su_dung';
  label: string;
  badgeClass: string;
  isAvailable: boolean;
} {
  const s = (status || '').toLowerCase().trim();
  if (s === 'tam_ngung' || s.includes('tạm ngừng') || s.includes('tam ngung')) {
    return {
      code: 'tam_ngung',
      label: 'Tạm ngừng sử dụng',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      isAvailable: false,
    };
  }
  if (s === 'ngung_su_dung' || s.includes('ngừng sử dụng') || s.includes('ngung su dung')) {
    return {
      code: 'ngung_su_dung',
      label: 'Ngừng sử dụng',
      badgeClass: 'bg-red-100 text-red-900 border-red-300',
      isAvailable: false,
    };
  }
  // Mặc định hoặc 'dang_su_dung' hoặc các chuỗi cũ (Đang canh tác, Đang đẻ nhánh...)
  return {
    code: 'dang_su_dung',
    label: 'Đang sử dụng',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    isAvailable: true,
  };
}

/**
 * Chuẩn hóa trạng thái chu kỳ sản xuất
 */
export function getCycleStatusInfo(status?: string): {
  code: 'du_kien' | 'dang_thuc_hien' | 'tam_dung' | 'cho_tong_ket' | 'da_ket_thuc' | 'da_huy';
  label: string;
  badgeClass: string;
  isActive: boolean;
  isUpcoming: boolean;
  isCompleted: boolean;
} {
  const s = (status || '').toLowerCase().trim();
  if (s === 'du_kien' || s.includes('dự kiến') || s.includes('du kien')) {
    return {
      code: 'du_kien',
      label: 'Dự kiến',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
      isActive: false,
      isUpcoming: true,
      isCompleted: false,
    };
  }
  if (s === 'tam_dung' || s.includes('tạm dừng') || s.includes('tam dung')) {
    return {
      code: 'tam_dung',
      label: 'Tạm dừng',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      isActive: false,
      isUpcoming: false,
      isCompleted: false,
    };
  }
  if (s === 'cho_tong_ket' || s.includes('chờ tổng kết') || s.includes('cho tong ket')) {
    return {
      code: 'cho_tong_ket',
      label: 'Chờ tổng kết',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
      isActive: false,
      isUpcoming: false,
      isCompleted: false,
    };
  }
  if (s === 'da_huy' || s.includes('hủy') || s.includes('da huy')) {
    return {
      code: 'da_huy',
      label: 'Đã hủy',
      badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
      isActive: false,
      isUpcoming: false,
      isCompleted: true,
    };
  }
  if (
    s === 'da_ket_thuc' ||
    s.includes('đã kết thúc') ||
    s.includes('da ket thuc') ||
    s === 'da_thu_hoach' ||
    s.includes('đã thu hoạch') ||
    s.includes('nghỉ vụ')
  ) {
    return {
      code: 'da_ket_thuc',
      label: 'Đã kết thúc',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
      isActive: false,
      isUpcoming: false,
      isCompleted: true,
    };
  }
  // Mặc định hoặc dang_thuc_hien / Đang thực hiện / Đang canh tác
  return {
    code: 'dang_thuc_hien',
    label: 'Đang thực hiện',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    isActive: true,
    isUpcoming: false,
    isCompleted: false,
  };
}

/**
 * Lấy thuật ngữ chu kỳ theo loại hình cơ sở (Vụ sản xuất cho lúa/nhãn, Lứa nuôi cho gà/cá)
 */
export function getCycleTerm(unit?: Partial<FarmZone>): string {
  if (!unit) return 'Vụ/lứa';
  const prodType = (unit.productionType || '').toLowerCase();
  const facType = (unit.facilityType || '').toLowerCase();

  if (prodType.includes('chăn nuôi') || facType === 'chuong_nuoi') {
    return 'Lứa nuôi';
  }
  if (prodType.includes('thủy sản') || facType === 'long_ca' || facType === 'ao_nuoi') {
    return 'Lứa nuôi';
  }
  if (prodType.includes('trồng trọt') || prodType.includes('cây ăn quả') || facType === 'thua_ruong' || facType === 'vuon_cay') {
    return 'Vụ sản xuất';
  }
  return 'Vụ/lứa';
}

/**
 * Lấy nhãn loại hình cơ sở sản xuất
 */
export function getFacilityTypeLabel(unitOrType?: Partial<FarmZone> | string): string {
  if (!unitOrType) return 'Nơi sản xuất';
  const facType = (typeof unitOrType === 'string' ? unitOrType : unitOrType.facilityType || '').toLowerCase();
  switch (facType) {
    case 'thua_ruong':
      return 'Thửa ruộng';
    case 'vuon_cay':
      return 'Vườn cây';
    case 'chuong_nuoi':
    case 'chuong_trai':
      return 'Chuồng trại';
    case 'long_ca':
    case 'long_be':
      return 'Lồng bè';
    case 'ao_nuoi':
    case 'ao_ho':
      return 'Ao nuôi';
    default:
      if (typeof unitOrType === 'object' && unitOrType.productionType) {
        return unitOrType.productionType;
      }
      return 'Nơi sản xuất';
  }
}

/**
 * Lấy chu kỳ đang thực hiện của đơn vị sản xuất.
 * - Không mặc định lấy phần tử đầu tiên.
 * - Chỉ lấy chu kỳ có trạng thái đang thực hiện.
 * - Nếu không có chu kỳ nào đang thực hiện, trả về null.
 */
export function getActiveCycle(unit?: FarmZone | null): ProductionCycle | null {
  if (!unit) return null;
  const history = getCycles(unit);
  if (history.length === 0) return null;

  // Lọc các chu kỳ có trạng thái 'dang_thuc_hien' hoặc 'Đang thực hiện' hoặc 'Đang canh tác'
  const activeCandidates = history.filter((c) => {
    const info = getCycleStatusInfo(c.status);
    return info.isActive;
  });

  if (activeCandidates.length === 1) {
    return activeCandidates[0];
  }

  return null;
}

export function getCycles(unit?: FarmZone | null): ProductionCycle[] {
  if (!unit) return [];
  return unit.cycles?.length ? unit.cycles : unit.seasonHistory || [];
}

/**
 * Lấy các chu kỳ dự kiến của đơn vị sản xuất
 */
export function getUpcomingCycles(unit?: FarmZone | null): ProductionCycle[] {
  if (!unit) return [];
  const history = getCycles(unit);
  return history.filter((c) => getCycleStatusInfo(c.status).isUpcoming);
}

/**
 * Lấy lịch sử các chu kỳ đã kết thúc / đã tổng kết / đã hủy
 */
export function getPastCycles(unit?: FarmZone | null): ProductionCycle[] {
  if (!unit) return [];
  const history = getCycles(unit);
  return history.filter((c) => {
    const info = getCycleStatusInfo(c.status);
    return info.isCompleted || info.code === 'cho_tong_ket' || info.code === 'tam_dung';
  });
}

/**
 * Chuyển đổi an toàn dữ liệu đơn vị cũ sang mô hình mới (tránh mất mát dữ liệu và không tự tạo vụ giả)
 */
export function migrateLegacyUnit(legacy: any): FarmZone {
  // Chuẩn hóa trạng thái đơn vị sản xuất: 'dang_su_dung' | 'tam_ngung' | 'ngung_su_dung'
  let unitStatus: ProductionUnitStatus = 'dang_su_dung';
  const rawStatus = (legacy.unitStatus || legacy.status || '').toLowerCase();
  if (rawStatus.includes('tạm ngừng') || rawStatus === 'tam_ngung') {
    unitStatus = 'tam_ngung';
  } else if (rawStatus.includes('ngừng sử dụng') || rawStatus === 'ngung_su_dung') {
    unitStatus = 'ngung_su_dung';
  } else {
    unitStatus = 'dang_su_dung';
  }

  // Chuẩn hóa seasonHistory sang ProductionCycle
  const rawHistory: any[] = [...(legacy.cycles || []), ...(legacy.seasonHistory || [])];
  const seen = new Set<string>();
  const migratedHistory: ProductionCycle[] = rawHistory.map((item, index) => ({
    ...item,
    seasonId: item.seasonId || item.cycleId || `cycle-legacy-${legacy.id}-${index}`,
  })).filter((item) => {
    const id = item.cycleId || item.seasonId;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  }).map((item) => {
    const cycleStatusInfo = getCycleStatusInfo(item.status);
    return {
      ...item,
      cycleId: item.cycleId || item.seasonId,
      unitId: item.unitId || legacy.id,
      cycleName: item.cycleName || item.seasonName,
      status: cycleStatusInfo.code as ProductionCycleStatus,
      processVersion: item.processVersion || (item.quality ? `Chuẩn ${item.quality}` : 'Quy trình VietGAP HTX'),
      processName: item.processName || 'Quy trình sản xuất HTX',
    };
  });

  return {
    ...legacy,
    unitStatus,
    status: unitStatus,
    statusNote: legacy.statusNote || legacy.statusNotes,
    seasonHistory: migratedHistory,
    cycles: migratedHistory,
  };
}
