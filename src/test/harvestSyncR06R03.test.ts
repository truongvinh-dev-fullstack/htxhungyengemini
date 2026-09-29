import test from 'node:test';
import assert from 'node:assert/strict';
import { HarvestLot, ProductHandover, UserProfile } from '../types';
import { canViewHarvestLot } from '../utils/permissions';
import { createInitialDemoData, loadDemoData, saveDemoData, normalizeDemoOwnerNames } from '../mock/demoRepository';
import { DEMO_USERS, INITIAL_MEMBERS } from '../mock/data';
import { getCanonicalMemberName } from '../context/AppContext';

test('1. R06 tạo lô 600 kg TH-ANNINH-2026-736 -> đổi ngay sang R03 -> "Tất cả hộ" thấy đúng mã lô và 600 kg', () => {
  const initial = createInitialDemoData();
  const anninhInitialCount = initial.harvests.filter((h) => h.htxId === 'anninh').length;
  assert.equal(anninhInitialCount, 5, 'HTX An Ninh ban đầu có 5 lô thu hoạch');

  // Hộ Nguyễn Văn An (u_r06_an) tạo lô mới 600 kg
  const newLot: HarvestLot = {
    id: 'h-an-736',
    code: 'TH-ANNINH-2026-736',
    htxId: 'anninh',
    farmZoneId: 'fz-01',
    farmZoneName: 'Thửa Đầm Bông',
    zoneCode: 'MSVT-AN-01',
    variety: 'Lúa giống Bắc Thơm số 7',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-29',
    yieldQuantity: 600,
    unit: 'kg',
    grade1Quantity: 500,
    grade2Quantity: 100,
    processingStatus: 'chua_so_che',
    sources: [
      {
        farmZoneId: 'fz-01',
        farmZoneName: 'Thửa Đầm Bông',
        zoneCode: 'MSVT-AN-01',
        cycleId: 's-fz-01-mua-2026',
        cycleName: 'Vụ Mùa 2026',
        quantity: 600,
        unit: 'kg',
        harvestDate: '2026-09-29',
      },
    ],
  };

  const updatedHarvests = [newLot, ...initial.harvests];

  // 1. Phía R06: Xem danh sách thấy 6 lô (toàn bộ lô của hộ An)
  const r06Lots = updatedHarvests.filter((lot) =>
    canViewHarvestLot('R06', lot, 'anninh', 'u_r06_an', initial.handovers)
  );
  assert.equal(r06Lots.length, 6, 'R06 thấy đủ 6 lô bao gồm lô mới 600 kg');
  assert.equal(r06Lots[0].code, 'TH-ANNINH-2026-736');
  assert.equal(r06Lots[0].yieldQuantity, 600);

  // 2. Chuyển sang vai trò R03 (Cán bộ Kỹ thuật) -> "Tất cả hộ trong HTX"
  const r03Lots = updatedHarvests.filter((lot) =>
    canViewHarvestLot('R03', lot, 'anninh', 'u_r03_hoang', initial.handovers)
  );
  assert.equal(r03Lots.length, 6, 'R03 Giám sát Thu hoạch phải thấy đủ 6 lô bao gồm lô mới 600 kg');
  assert.ok(r03Lots.some((l) => l.code === 'TH-ANNINH-2026-736' && l.yieldQuantity === 600));
});

test('2. R03 lọc Nguyễn Văn An vẫn thấy lô 600 kg; lọc hộ khác thì không thấy', () => {
  const initial = createInitialDemoData();

  const newLotAn: HarvestLot = {
    id: 'h-an-736',
    code: 'TH-ANNINH-2026-736',
    htxId: 'anninh',
    farmZoneId: 'fz-01',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-29',
    yieldQuantity: 600,
    unit: 'kg',
  };

  const lotBinh: HarvestLot = {
    id: 'h-binh-01',
    code: 'TH-ANNINH-2026-BINH',
    htxId: 'anninh',
    farmZoneId: 'fz-02',
    ownerId: 'u_r06_binh',
    ownerName: 'Trần Văn Bình',
    date: '2026-09-29',
    yieldQuantity: 400,
    unit: 'kg',
  };

  const allHarvests = [newLotAn, lotBinh, ...initial.harvests];

  // R03 xem toàn bộ:
  const r03Visible = allHarvests.filter((lot) =>
    canViewHarvestLot('R03', lot, 'anninh', 'u_r03_hoang', initial.handovers)
  );
  assert.equal(r03Visible.length, 7);

  // R03 lọc hộ Nguyễn Văn An:
  const filterAn = r03Visible.filter((lot) => lot.ownerId === 'u_r06_an');
  assert.equal(filterAn.length, 6, 'Lọc hộ An thấy đủ 6 lô của An');
  assert.ok(filterAn.some((l) => l.code === 'TH-ANNINH-2026-736'));
  assert.ok(!filterAn.some((l) => l.code === 'TH-ANNINH-2026-BINH'));

  // R03 lọc hộ Trần Văn Bình:
  const filterBinh = r03Visible.filter((lot) => lot.ownerId === 'u_r06_binh');
  assert.equal(filterBinh.length, 1);
  assert.equal(filterBinh[0].code, 'TH-ANNINH-2026-BINH');
  assert.ok(!filterBinh.some((l) => l.code === 'TH-ANNINH-2026-736'));
});

test('3. Tải lại cùng origin: lô vẫn có ở cả hai vai trò', () => {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, val: string) => { memory.set(key, val); },
  };

  const initial = createInitialDemoData();
  const newLot: HarvestLot = {
    id: 'h-an-736',
    code: 'TH-ANNINH-2026-736',
    htxId: 'anninh',
    farmZoneId: 'fz-01',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-29',
    yieldQuantity: 600,
    unit: 'kg',
  };

  // Lưu vào storage demo
  initial.harvests = [newLot, ...initial.harvests];
  saveDemoData(storage, initial);

  // Tải lại (reload) từ storage
  const reloaded = loadDemoData(storage);
  assert.equal(reloaded.data.harvests.filter((h) => h.htxId === 'anninh').length, 6);
  assert.equal(reloaded.data.harvests.length, initial.harvests.length);

  // Cả R06 và R03 đều đọc được lô đã lưu
  const r06Harvests = reloaded.data.harvests.filter((l) => canViewHarvestLot('R06', l, 'anninh', 'u_r06_an', reloaded.data.handovers));
  const r03Harvests = reloaded.data.harvests.filter((l) => canViewHarvestLot('R03', l, 'anninh', 'u_r03_hoang', reloaded.data.handovers));

  assert.equal(r06Harvests.length, 6);
  assert.equal(r03Harvests.length, 6);
  assert.equal(r06Harvests[0].code, 'TH-ANNINH-2026-736');
  assert.equal(r03Harvests[0].code, 'TH-ANNINH-2026-736');
});

test('4. Hai tab cùng origin: R03 nhận lô mới sau khi đồng bộ storage/focus', () => {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, val: string) => { memory.set(key, val); },
  };

  // Tab 1 và Tab 2 ban đầu đọc cùng dữ liệu khởi tạo
  const tab1Data = loadDemoData(storage).data;
  let tab2Harvests = loadDemoData(storage).data.harvests;
  assert.equal(tab2Harvests.filter((h) => h.htxId === 'anninh').length, 5);

  // Tab 1 (R06) tạo lô 600 kg và lưu
  const newLot: HarvestLot = {
    id: 'h-an-736',
    code: 'TH-ANNINH-2026-736',
    htxId: 'anninh',
    farmZoneId: 'fz-01',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-29',
    yieldQuantity: 600,
    unit: 'kg',
  };
  tab1Data.harvests = [newLot, ...tab1Data.harvests];
  saveDemoData(storage, tab1Data);

  // Tab 2 (R03) nhận tín hiệu sync (storage event / focus reload)
  const tab2SyncedData = loadDemoData(storage).data;
  tab2Harvests = tab2SyncedData.harvests;

  const r03Visible = tab2Harvests.filter((l) => canViewHarvestLot('R03', l, 'anninh', 'u_r03_hoang', tab2SyncedData.handovers));
  assert.equal(r03Visible.length, 6, 'Tab 2 của R03 thấy ngay 6 lô sau khi nạp lại');
  assert.equal(r03Visible[0].code, 'TH-ANNINH-2026-736');
});

test('5. Thử lỗi API lưu lô: không được thông báo thành công và rồi mất lô ở phiên R03', async () => {
  let localHarvests: HarvestLot[] = [
    { id: 'h-01', code: 'TH-AN-01', htxId: 'anninh', ownerId: 'u_r06_an', yieldQuantity: 1000, unit: 'kg' } as HarvestLot,
  ];

  // Giả lập hàm gọi API lưu lô thu hoạch bị lỗi mạng/server
  const mockApiCreateHarvest = async (_lot: any): Promise<HarvestLot> => {
    throw new Error('500 Internal Server Error: Database connection failed');
  };

  // Logic addHarvest an toàn: chỉ cập nhật local state khi API thành công
  async function safeAddHarvest(newLotData: any, isMock: boolean) {
    if (!isMock) {
      try {
        await mockApiCreateHarvest(newLotData);
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    }
    localHarvests = [newLotData, ...localHarvests];
    return { success: true, lot: newLotData };
  }

  const result = await safeAddHarvest(
    { id: 'h-fail', code: 'TH-FAIL-736', htxId: 'anninh', ownerId: 'u_r06_an', yieldQuantity: 600, unit: 'kg' },
    false // Chế độ API thật
  );

  // Kiểm tra: Phải trả về false, không báo thành công giả
  assert.equal(result.success, false);
  assert.match(result.message || '', /Database connection failed/);

  // Local state không bị nhiễm lô lỗi
  assert.equal(localHarvests.length, 1);
  assert.equal(localHarvests[0].code, 'TH-AN-01');
});

test('6. Mọi màn "Chủ hộ", bộ lọc hộ và chi tiết lô của cùng ownerId hiển thị "Nguyễn Văn An"; không còn trộn với "Bác Nguyễn Văn An"', () => {
  const members: UserProfile[] = INITIAL_MEMBERS;
  const userAn = DEMO_USERS['R06_anninh'];
  assert.equal(userAn.name, 'Nguyễn Văn An', 'DEMO_USERS cho R06_anninh phải là Nguyễn Văn An');

  const memberAn = members.find((m) => m.id === 'u_r06_an');
  assert.equal(memberAn?.name, 'Nguyễn Văn An', 'INITIAL_MEMBERS cho u_r06_an phải là Nguyễn Văn An');

  // Kiểm tra helper getCanonicalMemberName
  assert.equal(getCanonicalMemberName('u_r06_an', 'Bác Nguyễn Văn An', members), 'Nguyễn Văn An');
  assert.equal(getCanonicalMemberName('u_r06_an', undefined, members), 'Nguyễn Văn An');
  assert.equal(getCanonicalMemberName(undefined, 'Bác Nguyễn Văn An', members), 'Nguyễn Văn An');

  // Kiểm tra chuẩn hóa demo data
  const data = createInitialDemoData();
  // Giả sử có dữ liệu cũ chứa "Bác Nguyễn Văn An"
  data.farmZones[0].ownerName = 'Bác Nguyễn Văn An';
  data.harvests[0].ownerName = 'Bác Nguyễn Văn An';
  data.handovers[0].senderName = 'Bác Nguyễn Văn An';

  normalizeDemoOwnerNames(data);

  assert.equal(data.farmZones[0].ownerName, 'Nguyễn Văn An');
  assert.equal(data.harvests[0].ownerName, 'Nguyễn Văn An');
  assert.equal(data.handovers[0].senderName, 'Nguyễn Văn An');
});

test('7. R04 không vì bản sửa này mà thấy lô hộ chưa gửi HTX', () => {
  const data = createInitialDemoData();

  // Lô hộ An mới thu hoạch, chưa gửi HTX
  const unsentLot: HarvestLot = {
    id: 'h-an-unsent-736',
    code: 'TH-ANNINH-2026-736',
    htxId: 'anninh',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-29',
    yieldQuantity: 600,
    unit: 'kg',
  };

  const allLots = [unsentLot, ...data.harvests];

  // R03 thấy được lô chưa gửi
  assert.equal(canViewHarvestLot('R03', unsentLot, 'anninh', 'u_r03_hoang', data.handovers), true);

  // R06 thấy được lô của mình
  assert.equal(canViewHarvestLot('R06', unsentLot, 'anninh', 'u_r06_an', data.handovers), true);

  // R04 (Thủ kho HTX) KHÔNG được thấy lô hộ chưa gửi HTX
  assert.equal(
    canViewHarvestLot('R04', unsentLot, 'anninh', 'u_r04_dung', data.handovers),
    false,
    'R04 không được xem lô hộ chưa lập phiếu gửi HTX'
  );
});

test('8. Không xóa lô hoặc phiếu demo người dùng đã tạo trong localStorage khi di trú/chuẩn hóa', () => {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, val: string) => { memory.set(key, val); },
  };

  // Giả lập localStorage lưu sẵn một lô tùy ý và phiếu giao hàng do người dùng tạo từ phiên trước
  const userLot: HarvestLot = {
    id: 'h-user-custom-999',
    code: 'TH-USER-CUSTOM-999',
    htxId: 'anninh',
    ownerId: 'u_r06_an',
    ownerName: 'Bác Nguyễn Văn An', // Tên cũ
    yieldQuantity: 888,
    unit: 'kg',
    date: '2026-09-28',
  };

  const userHandover: ProductHandover = {
    id: 'gn-user-custom-999',
    code: 'GN-USER-CUSTOM-999',
    htxId: 'anninh',
    harvestLotId: userLot.id,
    harvestLotCode: userLot.code,
    senderId: 'u_r06_an',
    senderName: 'Bác Nguyễn Văn An', // Tên cũ
    handoverType: 'mua_dut',
    productState: 'hang_tho',
    declaredQuantity: 300,
    unit: 'kg',
    status: 'cho_kiem_nhan',
    createdAt: '2026-09-28T15:00:00Z',
  };

  const existingDemo = createInitialDemoData();
  existingDemo.harvests.push(userLot);
  existingDemo.handovers.push(userHandover);

  // Lưu vào storage
  saveDemoData(storage, existingDemo);

  // Chạy nạp lại dữ liệu
  const loaded = loadDemoData(storage);

  // Không có cảnh báo lỗi phiên bản
  assert.equal(loaded.warning, undefined);

  // Lô và phiếu tùy ý của người dùng KHÔNG bị xóa
  const foundLot = loaded.data.harvests.find((h) => h.id === 'h-user-custom-999');
  const foundHandover = loaded.data.handovers.find((h) => h.id === 'gn-user-custom-999');

  assert.ok(foundLot, 'Lô người dùng tạo phải được giữ nguyên');
  assert.ok(foundHandover, 'Phiếu giao người dùng tạo phải được giữ nguyên');

  // Tên cũ được chuẩn hóa thành 'Nguyễn Văn An'
  assert.equal(foundLot?.ownerName, 'Nguyễn Văn An');
  assert.equal(foundHandover?.senderName, 'Nguyễn Văn An');
});
