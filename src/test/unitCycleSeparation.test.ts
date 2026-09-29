import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_FARM_ZONES } from '../mock/data';
import {
  getActiveCycle,
  getUpcomingCycles,
  getPastCycles,
  getUnitStatusInfo,
  getCycleStatusInfo,
  getCycleTerm,
  getFacilityTypeLabel,
  migrateLegacyUnit,
} from '../utils/productionUtils';
import { matchSeasonForZone } from '../utils/seasonMatcher';
import { canAccessScreen } from '../utils/permissions';

test('1. Đơn vị sản xuất và Chu kỳ sản xuất - Tách bạch trạng thái và 6 kịch bản demo', async (t) => {
  await t.test('Demo 1: Thửa lúa An Ninh đang sử dụng, chưa có vụ nào (fz-02)', () => {
    const fz02 = INITIAL_FARM_ZONES.find((z) => z.id === 'fz-02');
    assert.ok(fz02, 'fz-02 phải tồn tại');
    assert.equal(fz02.unitStatus, 'dang_su_dung', 'Trạng thái nơi sản xuất là dang_su_dung');
    assert.equal(fz02.seasonHistory?.length || 0, 0, 'Chưa có chu kỳ vụ nào trong seasonHistory');

    // getActiveCycle phải trả về null
    const active = getActiveCycle(fz02);
    assert.equal(active, null, 'Không có chu kỳ đang thực hiện');

    // matchSeasonForZone phải trả về no_season
    const match = matchSeasonForZone(fz02, '2026-09-28');
    assert.equal(match.status, 'no_season', 'Không thể ghi nhật ký khi chưa có chu kỳ');
    assert.match(match.message || '', /chưa có vụ\/lứa/i, 'Thông báo giải thích rõ ràng');
  });

  await t.test('Demo 2: Thửa lúa An Ninh có vụ Xuân đã kết thúc và vụ Mùa đang thực hiện (fz-01)', () => {
    const fz01 = INITIAL_FARM_ZONES.find((z) => z.id === 'fz-01');
    assert.ok(fz01, 'fz-01 phải tồn tại');
    assert.equal(fz01.unitStatus, 'dang_su_dung');

    const active = getActiveCycle(fz01);
    assert.ok(active, 'Phải có chu kỳ đang thực hiện');
    assert.equal(active.seasonId, 's-fz-01-mua-2026');
    assert.equal(active.status, 'dang_thuc_hien');
    assert.ok(active.processVersion, 'Chu kỳ tham chiếu phiên bản quy trình');

    const past = getPastCycles(fz01);
    assert.ok(past.some((c) => c.seasonId === 's-fz-01-xuan-2026'), 'Vụ Xuân 2026 nằm trong lịch sử');
    assert.equal(past.find((c) => c.seasonId === 's-fz-01-xuan-2026')?.status, 'da_ket_thuc');

    // Kiểm tra thuật ngữ là "Vụ sản xuất"
    assert.equal(getCycleTerm(fz01), 'Vụ sản xuất');
  });

  await t.test('Demo 3: Vườn nhãn Quyết Thắng có các chu kỳ ở nhiều năm trên cùng một vườn (fz-04)', () => {
    const fz04 = INITIAL_FARM_ZONES.find((z) => z.id === 'fz-04');
    assert.ok(fz04, 'fz-04 phải tồn tại');
    assert.equal(fz04.unitStatus, 'dang_su_dung');

    const years = (fz04.seasonHistory || []).map((s) => s.year);
    assert.ok(years.includes(2024), 'Có vụ 2024');
    assert.ok(years.includes(2025), 'Có vụ 2025');
    assert.ok(years.includes(2026), 'Có vụ 2026');

    const active = getActiveCycle(fz04);
    assert.equal(active?.seasonId, 's-fz-04-nhan-2026');
    assert.equal(active?.status, 'dang_thuc_hien');

    const past = getPastCycles(fz04);
    assert.equal(past.length >= 2, true, 'Có ít nhất 2 vụ đã kết thúc trong lịch sử');
  });

  await t.test('Demo 4: Chuồng gà Đông Tảo có lứa đã kết thúc và lứa mới đang thực hiện (fz-03)', () => {
    const fz03 = INITIAL_FARM_ZONES.find((z) => z.id === 'fz-03');
    assert.ok(fz03, 'fz-03 phải tồn tại');
    assert.equal(fz03.unitStatus, 'dang_su_dung');
    assert.equal(getCycleTerm(fz03), 'Lứa nuôi', 'Chăn nuôi dùng thuật ngữ Lứa nuôi');
    assert.equal(getFacilityTypeLabel(fz03.facilityType), 'Chuồng trại');

    const active = getActiveCycle(fz03);
    assert.ok(active);
    assert.equal(active.seasonId, 's-fz-03-tet-2026');
    assert.equal(active.status, 'dang_thuc_hien');

    const past = getPastCycles(fz03);
    assert.ok(past.some((c) => c.seasonId === 's-fz-03-tet-2025'));
    assert.equal(past.find((c) => c.seasonId === 's-fz-03-tet-2025')?.status, 'da_ket_thuc');
  });

  await t.test('Demo 5: Lồng/ao cá Quyết Thắng có đúng một lứa nuôi (fz-05)', () => {
    const fz05 = INITIAL_FARM_ZONES.find((z) => z.id === 'fz-05');
    assert.ok(fz05, 'fz-05 phải tồn tại');
    assert.equal(fz05.unitStatus, 'dang_su_dung');
    assert.equal(getCycleTerm(fz05), 'Lứa nuôi', 'Thủy sản dùng thuật ngữ Lứa nuôi');
    assert.equal(getFacilityTypeLabel(fz05.facilityType), 'Lồng bè');

    assert.equal(fz05.seasonHistory?.length, 1, 'Chỉ có đúng một lứa nuôi');
    const active = getActiveCycle(fz05);
    assert.ok(active);
    assert.equal(active.seasonId, 's-fz-05-ca-2026');
  });

  await t.test('Demo 6: Một đơn vị tạm ngừng sử dụng (fz-06)', () => {
    const fz06 = INITIAL_FARM_ZONES.find((z) => z.id === 'fz-06');
    assert.ok(fz06, 'fz-06 phải tồn tại');
    assert.equal(fz06.unitStatus, 'tam_ngung', 'Trạng thái là tam_ngung');
    assert.ok(fz06.statusNote, 'Có lý do tạm ngừng sử dụng');

    // matchSeasonForZone phải chặn và trả về thông báo phù hợp
    const match = matchSeasonForZone(fz06, '2026-09-28');
    assert.equal(match.status, 'no_season');
    assert.match(match.message || '', /tạm ngừng sử dụng/i);
  });
});

test('2. Chuyển đổi dữ liệu cũ an toàn (migrateLegacyUnit)', async (t) => {
  await t.test('Đơn vị cũ có status "Đang canh tác" nhưng không có seasonHistory: không tự tạo vụ giả', () => {
    const legacyUnit: any = {
      id: 'fz-legacy-empty',
      name: 'Thửa ruộng cũ chưa có vụ',
      status: 'Đang canh tác', // Trạng thái cũ
      season: '',
      seasonHistory: [],
    };

    const migrated = migrateLegacyUnit(legacyUnit);
    assert.equal(migrated.unitStatus, 'dang_su_dung', 'Được chuyển về trạng thái sử dụng dang_su_dung');
    assert.equal(migrated.seasonHistory?.length, 0, 'Không tự sinh ra vụ giả mạo');
    assert.equal(getActiveCycle(migrated), null, 'Không có vụ hiện hành');
  });

  await t.test('Đơn vị cũ có seasonHistory và status "Đang canh tác": map chu kỳ sang dang_thuc_hien an toàn', () => {
    const legacyUnit: any = {
      id: 'fz-legacy-with-seasons',
      name: 'Thửa ruộng cũ có vụ',
      status: 'Đang canh tác',
      season: 'Vụ Mùa 2025',
      seasonHistory: [
        {
          seasonId: 's-old-1',
          seasonName: 'Vụ Mùa 2025',
          status: 'Đang canh tác',
          year: 2025,
        },
        {
          seasonId: 's-old-2',
          seasonName: 'Vụ Xuân 2025',
          status: 'Đã thu hoạch',
          year: 2025,
        },
      ],
    };

    const migrated = migrateLegacyUnit(legacyUnit);
    assert.equal(migrated.unitStatus, 'dang_su_dung');
    const active = getActiveCycle(migrated);
    assert.equal(active?.seasonId, 's-old-1');
    assert.equal(active?.status, 'dang_thuc_hien');

    const past = getPastCycles(migrated);
    assert.equal(past.length, 1);
    assert.equal(past[0].status, 'da_ket_thuc');
  });
});

test('3. Kiểm soát quyền ghi và ràng buộc chu kỳ (matchSeasonForZone)', async (t) => {
  await t.test('Không ghi nhật ký được vào chu kỳ đã kết thúc', () => {
    const fz01 = INITIAL_FARM_ZONES.find((z) => z.id === 'fz-01');
    assert.ok(fz01);

    // Thời điểm trong Vụ Xuân 2026 (15/01/2026 - 30/05/2026, đã kết thúc)
    const match = matchSeasonForZone(fz01, '2026-03-15');
    assert.equal(match.status, 'no_season');
    assert.match(match.message || '', /đã kết thúc/i);
  });

  await t.test('Ghi nhật ký thành công vào chu kỳ đang thực hiện', () => {
    const fz01 = INITIAL_FARM_ZONES.find((z) => z.id === 'fz-01');
    assert.ok(fz01);

    // Thời điểm trong Vụ Mùa 2026 (05/06/2026 - 31/10/2026, đang thực hiện)
    const match = matchSeasonForZone(fz01, '2026-09-20');
    assert.equal(match.status, 'matched');
    assert.equal(match.season?.seasonId, 's-fz-01-mua-2026');
  });
});

test('Luồng lập vụ tách quyền tạo, ID ổn định và không chọn nhầm chu kỳ', () => {
  assert.equal(canAccessScreen('R03', 'farm_cycle_add'), true);
  for (const role of ['R02', 'R04', 'R06'] as const) assert.equal(canAccessScreen(role, 'farm_cycle_add'), false);

  const legacy = {
    ...INITIAL_FARM_ZONES.find((unit) => unit.id === 'fz-01')!,
    cycles: undefined,
    seasonHistory: [
      { seasonId: 'cycle-2025', seasonName: 'Vụ Xuân', year: 2025, status: 'Đã thu hoạch' },
      { seasonId: 'cycle-2026', seasonName: 'Vụ Xuân', year: 2026, status: 'Đang canh tác', seasonStartDate: '2026-01-01', seasonEndDate: '2026-12-31' },
    ],
  };
  const migrated = migrateLegacyUnit(legacy);
  const repeated = migrateLegacyUnit(migrated);
  assert.deepEqual(repeated.cycles?.map((cycle) => cycle.cycleId), ['cycle-2025', 'cycle-2026']);
  assert.equal(repeated.cycles?.length, 2);
  assert.equal(repeated.cycles?.[0].seasonName, repeated.cycles?.[1].seasonName);
  assert.equal(matchSeasonForZone(repeated, '2026-06-01', false, 'cycle-2026').season?.cycleId, 'cycle-2026');
  assert.equal(matchSeasonForZone(repeated, '2026-06-01', false, 'cycle-2025').status, 'no_season');

  const overlap = migrateLegacyUnit({
    ...legacy,
    cycles: [
      { seasonId: 'a', seasonName: 'Lứa 1', year: 2026, status: 'dang_thuc_hien', seasonStartDate: '2026-01-01', seasonEndDate: '2026-12-31' },
      { seasonId: 'b', seasonName: 'Lứa 2', year: 2026, status: 'dang_thuc_hien', seasonStartDate: '2026-01-01', seasonEndDate: '2026-12-31' },
    ],
    seasonHistory: [],
  });
  assert.equal(getActiveCycle(overlap), null);
  assert.equal(matchSeasonForZone(overlap, '2026-06-01').status, 'overlap');
  assert.equal(matchSeasonForZone(overlap, '2026-06-01', false, 'b').season?.cycleId, 'b');

  const planned = migrateLegacyUnit({ ...legacy, cycles: [{ seasonId: 'planned', seasonName: 'Vụ Mùa', year: 2026, status: 'du_kien', seasonStartDate: '2026-01-01', seasonEndDate: '2026-12-31' }], seasonHistory: [] });
  assert.equal(getActiveCycle(planned), null);
  assert.equal(matchSeasonForZone(planned, '2026-06-01', false, 'planned').status, 'no_season');
  assert.equal(getUpcomingCycles(planned)[0].cycleId, 'planned');
});
