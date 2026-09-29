import { FarmZone, ProductionTask, UserProfile } from '../types';
import { matchSeasonForZone } from './seasonMatcher';

const phoneKey = (value?: string) => (value || '').replace(/\D/g, '');
const pending = (task: ProductionTask) =>
  (task.status === 'chua_lam' || task.status === 'tre') && !task.diaryId;

const assignedToOwner = (task: ProductionTask, owner?: Pick<UserProfile, 'id' | 'phone'>) =>
  !!owner && (task.assignedTo === owner.id || (phoneKey(task.assignedTo).length > 0 && phoneKey(task.assignedTo) === phoneKey(owner.phone)));

const withinDays = (date: string, from: string, before: number, after: number) => {
  const delta = (Date.parse(`${date}T00:00:00`) - Date.parse(`${from}T00:00:00`)) / 86400000;
  return Number.isFinite(delta) && delta >= -before && delta <= after;
};

/** Công việc là dữ liệu nền của vụ/lứa; chỉ gợi ý khi có thể ghi nhật ký cho đúng chu kỳ. */
export function getDiaryTaskHints(
  tasks: ProductionTask[],
  zone: FarmZone | undefined,
  cycleId: string | undefined,
  performedAt: string,
  user: Pick<UserProfile, 'id' | 'phone' | 'role'>
): ProductionTask[] {
  if (!zone || !cycleId || matchSeasonForZone(zone, performedAt, false, cycleId).status !== 'matched') return [];
  const day = performedAt.slice(0, 10);
  return tasks.filter((task) =>
    pending(task) && task.htxId === zone.htxId && task.farmZoneId === zone.id && task.cycleId === cycleId &&
    (user.role !== 'R06' || (zone.ownerId === user.id && assignedToOwner(task, user))) &&
    withinDays(task.dueDate, day, 14, 7)
  ).sort((a, b) => Math.abs(Date.parse(a.dueDate) - Date.parse(day)) - Math.abs(Date.parse(b.dueDate) - Date.parse(day)));
}

/** Tạo nhắc nhở trong ứng dụng cho các việc đến hạn của vụ/lứa đang hoạt động. */
export function getDueTaskReminders(
  tasks: ProductionTask[],
  zones: FarmZone[],
  owners: UserProfile[],
  today: string
): Array<{ task: ProductionTask; ownerId: string }> {
  return tasks.reduce<Array<{ task: ProductionTask; ownerId: string }>>((reminders, task) => {
    if (!pending(task) || !withinDays(task.dueDate, today, 14, 3)) return reminders;
    const zone = zones.find((item) => item.id === task.farmZoneId && item.htxId === task.htxId);
    const owner = owners.find((item) => item.id === zone?.ownerId && item.htxId === task.htxId);
    if (!zone || !owner || owner.status !== 'active' || owner.role !== 'R06' || !assignedToOwner(task, owner) || !task.cycleId) return reminders;
    if (matchSeasonForZone(zone, task.dueDate, false, task.cycleId).status !== 'matched') return reminders;
    if (matchSeasonForZone(zone, today, false, task.cycleId).status !== 'matched') return reminders;
    reminders.push({ task, ownerId: owner.id });
    return reminders;
  }, []);
}

export const taskReminderId = (taskId: string) => `reminder-task-${taskId}`;

export function inferDiaryWorkType(task: Pick<ProductionTask, 'title' | 'taskCategory'>): string | undefined {
  const title = task.title.toLowerCase();
  if (title.includes('gặt') || title.includes('thu hoạch')) return 'thu_hoach';
  if (title.includes('phân bón') || title.includes('bón')) return 'bon_phan';
  if (title.includes('tiêm') || title.includes('vắc') || title.includes('thuốc') || title.includes('phun')) return 'phun_thuoc';
  if (title.includes('cho ăn') || title.includes('thức ăn')) return 'cho_an';
  if (title.includes('tỉa') || title.includes('vệ sinh') || title.includes('lưới') || title.includes('cành')) return 've_sinh';
  if (title.includes('tưới') || title.includes('làm cỏ') || title.includes('điều tiết nước')) return 'tuoi_nuoc';
  if (task.taskCategory === 'thu_hoach') return 'thu_hoach';
  return 'khac';
}
