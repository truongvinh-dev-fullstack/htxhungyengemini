import { FarmZone, SeasonHistoryItem } from '../types';
import { getCycles, getCycleStatusInfo, getUnitStatusInfo } from './productionUtils';

export interface SeasonMatchResult {
  status: 'matched' | 'no_season' | 'overlap';
  season?: SeasonHistoryItem;
  message?: string;
  seasons?: SeasonHistoryItem[];
}

/**
 * Chuẩn hóa chuỗi ngày/giờ theo múi giờ Việt Nam và chuyển đổi sang mili-giây UTC để so sánh.
 * Hỗ trợ các định dạng:
 * - DD/MM/YYYY
 * - YYYY-MM-DD
 * - YYYY-MM-DDTHH:mm
 * - DD/MM/YYYY HH:mm
 * - Kèm tham số timeStr tùy chọn (VD: "08:00", "12:00")
 */
export function parseVietnamDateTime(
  dateStr?: string,
  isEnd: boolean = false,
  explicitTime?: string
): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  let year = 0;
  let month = 0;
  let day = 0;
  let hour = isEnd ? 23 : 0;
  let minute = isEnd ? 59 : 0;
  let second = isEnd ? 59 : 0;
  let millisecond = isEnd ? 999 : 0;
  let hasExplicitTime = false;

  // Trường hợp dạng ISO / datetime-local: YYYY-MM-DDTHH:mm hoặc YYYY-MM-DD HH:mm
  if (trimmed.includes('T') || (trimmed.includes('-') && trimmed.includes(':'))) {
    const [datePart, timePart] = trimmed.split(/[T ]/);
    const dateParts = datePart.split('-').map(Number);
    if (dateParts.length === 3 && dateParts.every((n) => !Number.isNaN(n))) {
      year = dateParts[0];
      month = dateParts[1];
      day = dateParts[2];
    }
    if (timePart) {
      const timeParts = timePart.split(':').map(Number);
      if (timeParts.length >= 2 && !Number.isNaN(timeParts[0]) && !Number.isNaN(timeParts[1])) {
        hour = timeParts[0];
        minute = timeParts[1];
        second = timeParts[2] && !Number.isNaN(timeParts[2]) ? timeParts[2] : 0;
        millisecond = 0;
        hasExplicitTime = true;
      }
    }
  } else if (trimmed.includes('/')) {
    // Dạng DD/MM/YYYY hoặc DD/MM/YYYY HH:mm
    const [datePart, timePart] = trimmed.split(' ');
    const parts = datePart.split('/').map(Number);
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      day = parts[0];
      month = parts[1];
      year = parts[2];
    }
    if (timePart) {
      const timeParts = timePart.split(':').map(Number);
      if (timeParts.length >= 2 && !Number.isNaN(timeParts[0]) && !Number.isNaN(timeParts[1])) {
        hour = timeParts[0];
        minute = timeParts[1];
        second = timeParts[2] && !Number.isNaN(timeParts[2]) ? timeParts[2] : 0;
        millisecond = 0;
        hasExplicitTime = true;
      }
    }
  } else if (trimmed.includes('-')) {
    // Dạng YYYY-MM-DD
    const parts = trimmed.split('-').map(Number);
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      year = parts[0];
      month = parts[1];
      day = parts[2];
    }
  }

  if (!year || !month || !day) {
    const fallbackDate = new Date(trimmed);
    if (!Number.isNaN(fallbackDate.getTime())) {
      return fallbackDate.getTime();
    }
    return null;
  }

  // Nếu có explicitTime bổ sung (VD: seasonStartTime="08:00" hoặc seasonEndTime="12:00")
  if (explicitTime && typeof explicitTime === 'string') {
    const timeParts = explicitTime.trim().split(':').map(Number);
    if (timeParts.length >= 2 && !Number.isNaN(timeParts[0]) && !Number.isNaN(timeParts[1])) {
      hour = timeParts[0];
      minute = timeParts[1];
      second = timeParts[2] && !Number.isNaN(timeParts[2]) ? timeParts[2] : 0;
      millisecond = 0;
      hasExplicitTime = true;
    }
  }

  // Quy tắc chuẩn hóa:
  // Nếu là mốc kết thúc VÀ không có giờ chỉ định (hasExplicitTime === false):
  // Ngày kết thúc được tính hết ngày (đến 23:59:59.999 của ngày đó).
  if (isEnd && !hasExplicitTime) {
    hour = 23;
    minute = 59;
    second = 59;
    millisecond = 999;
  }

  return Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
}

/**
 * Kiểm tra xem một thời điểm (performedAt) có nằm trong khoảng thời gian của mùa vụ không.
 * Quy tắc: bắt đầu <= thời điểm thực hiện < kết thúc (nếu có giờ chuyển giao trong ngày)
 * hoặc bắt đầu <= thời điểm thực hiện <= kết thúc hết ngày.
 */
export function isPerformedAtInSeason(
  season: SeasonHistoryItem,
  performedAtStr: string
): boolean {
  if (!season.seasonStartDate || !season.seasonEndDate) return false;

  const performedMs = parseVietnamDateTime(performedAtStr, false);
  if (performedMs === null) return false;

  const startMs = parseVietnamDateTime(
    season.seasonStartDate,
    false,
    season.seasonStartTime
  );
  if (startMs === null) return false;

  // Nếu có seasonEndTime cụ thể: dùng quy tắc start <= performed < end
  // Nếu chỉ có ngày kết thúc: endMs là 23:59:59.999, dùng start <= performed <= endMs
  const hasSpecificEndTime = Boolean(
    season.seasonEndTime ||
    (season.seasonEndDate.includes(':') && season.seasonEndDate.includes(' '))
  );

  const endMs = parseVietnamDateTime(
    season.seasonEndDate,
    true,
    season.seasonEndTime
  );
  if (endMs === null) return false;

  if (hasSpecificEndTime) {
    return performedMs >= startMs && performedMs < endMs;
  }

  return performedMs >= startMs && performedMs <= endMs;
}

/**
 * Tìm mùa vụ phù hợp duy nhất cho thửa ruộng tại thời điểm thực hiện (performedAt).
 * - Không mặc định dùng currentSeasonId.
 * - Trả về 'no_season' nếu không có vụ nào chứa performedAt.
 * - Trả về 'overlap' nếu có nhiều hơn 1 vụ cùng khớp thời gian (không tự động chọn).
 * - Trả về 'matched' nếu tìm thấy đúng 1 vụ.
 */
export function matchSeasonForZone(
  zone: FarmZone | undefined,
  performedAtStr: string,
  allowEnded: boolean = false,
  requestedCycleId?: string
): SeasonMatchResult {
  if (!zone) {
    return {
      status: 'no_season',
      message: 'Chưa chọn nơi sản xuất hoặc nơi sản xuất không tồn tại.',
    };
  }

  // 1. Kiểm tra trạng thái sử dụng của đơn vị sản xuất
  if (!getUnitStatusInfo(zone.unitStatus || zone.status).isAvailable) {
    const statusText = zone.unitStatus === 'ngung_su_dung' ? 'Ngừng sử dụng' : 'Tạm ngừng sử dụng';
    return {
      status: 'no_season',
      message: `Nơi sản xuất đang ở trạng thái "${statusText}"${zone.statusNote ? ` (${zone.statusNote})` : ''}. Không thể tạo nhật ký hoặc thu hoạch mới.`,
    };
  }

  const history = getCycles(zone);
  if (history.length === 0) {
    return {
      status: 'no_season',
      message: 'Nơi sản xuất này chưa có vụ/lứa nào được lập từ Web HTX.',
    };
  }

  const matched = history.filter((season) =>
    isPerformedAtInSeason(season, performedAtStr)
  );

  if (matched.length === 0) {
    return {
      status: 'no_season',
      message: 'Thời điểm thực hiện không thuộc khoảng thời gian của bất kỳ vụ/lứa nào của nơi sản xuất.',
    };
  }

  if (requestedCycleId && !matched.some((cycle) => (cycle.cycleId || cycle.seasonId) === requestedCycleId)) {
    return { status: 'no_season', message: 'Vụ/lứa được chọn không phù hợp với thời điểm thực hiện.' };
  }

  if (matched.length > 1 && !requestedCycleId) {
    const names = matched.map((s) => s.seasonName).join(', ');
    return {
      status: 'overlap',
      message: `Thời điểm thực hiện bị trùng lặp giữa nhiều vụ/lứa (${names}). Vui lòng kiểm tra lại ngày giờ thực hiện.`,
      seasons: matched,
    };
  }

  const candidate = requestedCycleId ? matched.find((cycle) => (cycle.cycleId || cycle.seasonId) === requestedCycleId)! : matched[0];

  // 2. Kiểm tra trạng thái hoạt động của chu kỳ
  if (!allowEnded) {
    if (getCycleStatusInfo(candidate.status).code === 'da_ket_thuc') {
      return {
        status: 'no_season',
        message: `${candidate.seasonName} đã kết thúc. Không thể thêm nhật ký hoặc thu hoạch mới vào vụ/lứa đã kết thúc.`,
      };
    }
    if (getCycleStatusInfo(candidate.status).code === 'du_kien') {
      return {
        status: 'no_season',
        message: `${candidate.seasonName} đang ở trạng thái Dự kiến, chưa bắt đầu thực hiện.`,
      };
    }
    if (!getCycleStatusInfo(candidate.status).isActive) {
      return {
        status: 'no_season',
        message: `${candidate.seasonName} ở trạng thái ${getCycleStatusInfo(candidate.status).label}, chưa thể ghi dữ liệu sản xuất.`,
      };
    }
  }

  return {
    status: 'matched',
    season: candidate,
  };
}
