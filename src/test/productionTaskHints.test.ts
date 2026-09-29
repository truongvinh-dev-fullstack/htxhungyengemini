import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_USERS, INITIAL_FARM_ZONES, INITIAL_MEMBERS, INITIAL_TASKS } from '../mock/data';
import { canAccessScreen } from '../utils/permissions';
import { getDiaryTaskHints, getDueTaskReminders, inferDiaryWorkType } from '../utils/productionTaskHints';

const zone = INITIAL_FARM_ZONES.find((item) => item.id === 'fz-01')!;
const farmer = DEMO_USERS.R06_anninh;

test('Mini App chỉ mở nhật ký, không mở màn công việc riêng', () => {
  for (const role of ['R02', 'R03', 'R04', 'R06'] as const) {
    assert.equal(canAccessScreen(role, 'tasks_list'), false);
  }
  assert.equal(canAccessScreen('R06', 'diary_list'), true);
  assert.equal(canAccessScreen('R06', 'diary_add'), true);
});

test('Nhắc việc chỉ đến đúng hộ và đúng vụ/lứa đang hoạt động', () => {
  const due = getDueTaskReminders(INITIAL_TASKS, INITIAL_FARM_ZONES, [...INITIAL_MEMBERS, ...Object.values(DEMO_USERS)], '2026-09-29');
  assert.deepEqual(due.filter((item) => item.task.htxId === 'anninh').map((item) => item.task.id), ['task-an-02']);
  assert.equal(due[0].ownerId, farmer.id);
  assert.equal(due.find((item) => item.task.id === 'task-dt-02')?.ownerId, DEMO_USERS.R06_dongtao.id, 'Lứa gà 2026 đang hoạt động, chỉ nhắc đúng hộ Đông Tảo');
});

test('Gợi ý nhật ký lọc theo HTX, hộ, nơi sản xuất, cycleId và ngày', () => {
  const hints = getDiaryTaskHints(INITIAL_TASKS, zone, 's-fz-01-mua-2026', '2026-09-29T09:00', farmer);
  assert.deepEqual(hints.map((item) => item.id), ['task-an-02']);
  assert.deepEqual(getDiaryTaskHints(INITIAL_TASKS, zone, 's-fz-01-xuan-2026', '2026-09-29T09:00', farmer), []);
  assert.deepEqual(getDiaryTaskHints(INITIAL_TASKS, zone, 's-fz-01-mua-2026', '2026-09-29T09:00', DEMO_USERS.R06_dongtao || { ...farmer, id: 'another', phone: '000' }), []);
  assert.equal(inferDiaryWorkType(hints[0]), 'khac', 'Đăng ký sấy không được nhận nhầm là cho vật nuôi ăn');
});
