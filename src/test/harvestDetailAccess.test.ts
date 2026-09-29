import test from 'node:test';
import assert from 'node:assert/strict';
import { HarvestLot, ProductHandover } from '../types';
import { canViewHarvestLot, canAccessScreen } from '../utils/permissions';
import { createInitialDemoData } from '../mock/demoRepository';

test('1. Kiểm tra quyền truy cập màn hình harvest_detail cho tất cả vai trò', () => {
  assert.equal(canAccessScreen('R06', 'harvest_detail'), true);
  assert.equal(canAccessScreen('R03', 'harvest_detail'), true);
  assert.equal(canAccessScreen('R04', 'harvest_detail'), true);
  assert.equal(canAccessScreen('R02', 'harvest_detail'), true);
});

test('2. R06 mở xem chi tiết các lô thu hoạch của mình (kể cả lô chưa sơ chế, có sơ chế, lô mới)', () => {
  const data = createInitialDemoData();
  const anninhHarvests = data.harvests.filter((h) => h.htxId === 'anninh');

  for (const lot of anninhHarvests) {
    const canView = canViewHarvestLot('R06', lot, 'anninh', 'u_r06_an', data.handovers);
    assert.equal(canView, true, `Hộ An (R06) phải xem được chi tiết lô ${lot.code}`);
  }

  // Lô mới tạo 600 kg TH-ANNINH-2026-736
  const newLot: HarvestLot = {
    id: 'h-an-736',
    code: 'TH-ANNINH-2026-736',
    htxId: 'anninh',
    farmZoneId: 'fz-01',
    variety: 'Lúa giống Bắc Thơm số 7',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-29',
    yieldQuantity: 600,
    unit: 'kg',
  };
  assert.equal(canViewHarvestLot('R06', newLot, 'anninh', 'u_r06_an', data.handovers), true);
});

test('3. R03 (Cán bộ Kỹ thuật) xem được chi tiết TOÀN BỘ lô trong HTX', () => {
  const data = createInitialDemoData();
  const anninhHarvests = data.harvests.filter((h) => h.htxId === 'anninh');

  for (const lot of anninhHarvests) {
    const canView = canViewHarvestLot('R03', lot, 'anninh', 'u_r03_hoang', data.handovers);
    assert.equal(canView, true, `R03 phải xem được chi tiết lô ${lot.code} trong HTX`);
  }

  // Lô mới tạo 600 kg TH-ANNINH-2026-736
  const newLot: HarvestLot = {
    id: 'h-an-736',
    code: 'TH-ANNINH-2026-736',
    htxId: 'anninh',
    farmZoneId: 'fz-01',
    variety: 'Lúa giống Bắc Thơm số 7',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-29',
    yieldQuantity: 600,
    unit: 'kg',
  };
  assert.equal(canViewHarvestLot('R03', newLot, 'anninh', 'u_r03_hoang', data.handovers), true);
});

test('4. R02 (Ban Quản trị HTX) xem được chi tiết lô thu hoạch trong HTX', () => {
  const data = createInitialDemoData();
  const anninhHarvests = data.harvests.filter((h) => h.htxId === 'anninh');

  for (const lot of anninhHarvests) {
    const canView = canViewHarvestLot('R02', lot, 'anninh', 'u_r02_minh', data.handovers);
    assert.equal(canView, true, `R02 Ban Quản trị phải xem được lô ${lot.code}`);
  }
});

test('5. R04 xem được lô có phiếu giao HTX và khớp cả harvestLotId lẫn harvestLotCode', () => {
  const data = createInitialDemoData();

  // h-01 có phiếu giao nhận gn-an-02
  const lot01 = data.harvests.find((h) => h.id === 'h-01')!;
  assert.equal(canViewHarvestLot('R04', lot01, 'anninh', 'u_r04_dung', data.handovers), true);

  // Phiếu chỉ lưu harvestLotCode
  const customHandovers: ProductHandover[] = [
    {
      id: 'gn-test-code',
      code: 'GN-TEST',
      htxId: 'anninh',
      harvestLotId: '',
      harvestLotCode: 'TH-AN-2026-002',
      senderId: 'u_r06_an',
      senderName: 'Nguyễn Văn An',
      receiverId: 'u_r04_dung',
      receiverName: 'Thủ kho',
      handoverType: 'mua_dut',
      productState: 'hang_tho',
      declaredQuantity: 500,
      receivedQuantity: 500,
      differenceQuantity: 0,
      unit: 'kg',
      createdAt: '2026-09-29',
      status: 'da_kiem_nhan',
    },
  ];
  const lot02 = data.harvests.find((h) => h.id === 'h-02')!;
  assert.equal(canViewHarvestLot('R04', lot02, 'anninh', 'u_r04_dung', customHandovers), true);
});

test('6. Độ chịu lỗi khi lô thiếu htxId hoặc viết thường', () => {
  const legacyLot: HarvestLot = {
    id: 'h-legacy',
    code: 'TH-LEGACY-01',
    farmZoneId: 'fz-01',
    variety: 'Lúa giống',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-29',
    yieldQuantity: 300,
    unit: 'kg',
  };
  // Khi lot.htxId là undefined, canViewHarvestLot vẫn fallback an toàn theo htxId truyền vào
  assert.equal(canViewHarvestLot('R06', legacyLot, 'anninh', 'u_r06_an'), true);
  assert.equal(canViewHarvestLot('R03', legacyLot, 'anninh', 'u_r03_hoang'), true);
});
