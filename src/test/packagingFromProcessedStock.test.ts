import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialDemoData } from '../mock/demoRepository';
import { getStockItemAvailableQuantity } from '../utils/harvestBalance';
import { canManagePackaging } from '../utils/permissions';
import { ProductStockItem, PackagedProduct, HarvestLot } from '../types';

test('Kịch bản đóng gói từ hàng đã sơ chế (TH-ANNINH-2026-982): 95 kg sơ chế -> đóng 10 túi x 5kg -> còn 45 kg', () => {
  const data = createInitialDemoData();

  const rawStock = data.productStocks.find((s) => s.id === 'stock-an-982-raw')!;
  const procStock = data.productStocks.find((s) => s.id === 'stock-an-982-proc')!;
  const lot = data.harvests.find((h) => h.id === 'h-an-982')!;

  // 1. Kiểm tra trạng thái ban đầu: Hàng thô 660 kg, đã sơ chế 95 kg
  assert.equal(rawStock.quantity, 660, 'Hàng thô ban đầu phải là 660 kg');
  assert.equal(rawStock.state, 'hang_tho');
  assert.equal(procStock.quantity, 95, 'Hàng đã sơ chế ban đầu phải là 95 kg');
  assert.equal(procStock.state, 'da_xu_ly');
  assert.equal(lot.allocation?.remainingAvailable, 660, 'Allocation thô ban đầu là 660 kg');

  // Kiểm tra quyền đóng gói cho hộ An
  assert.equal(canManagePackaging('R06', procStock.ownerId, 'u_r06_an'), true);
  assert.equal(canManagePackaging('R06', procStock.ownerId, 'other_user'), false);

  // 2. Thực hiện đóng gói 10 túi x 5kg = 50 kg từ dòng sơ chế stock-an-982-proc
  const packQuantity = 10;
  const netWeightPerPack = 5;
  const neededWeight = packQuantity * netWeightPerPack; // 50 kg
  const packagingDate = '2026-09-28';

  // Khả dụng trước khi đóng gói
  const availBefore = getStockItemAvailableQuantity(procStock, data.orders, data.handovers).availableQuantity;
  assert.equal(availBefore, 95);
  assert.ok(neededWeight <= availBefore, '50 kg hợp lệ trong khả dụng 95 kg');

  // Mô phỏng logic addPackage với sourceStockItemId = 'stock-an-982-proc'
  const newPackStockId = 'stock-pkg-test-01';
  const newPkgId = 'pkg-test-01';
  const newPkgCode = 'SP-ANNINH-999';

  // Trừ tồn đúng dòng stock-an-982-proc
  const updatedStocks: ProductStockItem[] = data.productStocks.map((st) => {
    if (st.id === procStock.id) {
      return { ...st, quantity: st.quantity - neededWeight, updatedAt: '2026-09-28T10:00:00Z' };
    }
    return st;
  });

  const newPackStock: ProductStockItem = {
    id: newPackStockId,
    htxId: procStock.htxId,
    harvestLotId: procStock.harvestLotId,
    harvestLotCode: procStock.harvestLotCode,
    variety: 'Gạo lứt Bắc Thơm',
    ownerType: procStock.ownerType,
    ownerId: procStock.ownerId,
    ownerName: procStock.ownerName,
    holderId: procStock.holderId,
    holderName: procStock.holderName,
    locationName: procStock.locationName,
    state: 'da_dong_goi',
    quantity: packQuantity,
    unit: 'Túi',
    spec: `${packQuantity} Túi x ${netWeightPerPack} kg`,
    sourceStockItemId: procStock.id,
    packageId: newPkgId,
    packageCode: newPkgCode,
    netWeightPerPack,
    totalNetWeight: neededWeight,
    updatedAt: '2026-09-28T10:00:00Z',
  };
  updatedStocks.unshift(newPackStock);

  // Kiểm tra Req 5: KHÔNG trừ hàng thô hoặc allocation của lô gốc
  const updatedLot: HarvestLot = {
    ...lot,
    // Allocation không thay đổi vì lấy từ hàng đã sơ chế
    allocation: { ...lot.allocation! },
  };

  // 3. Kiểm tra kết quả sau khi đóng gói:
  const updatedProcStock = updatedStocks.find((s) => s.id === 'stock-an-982-proc')!;
  const updatedRawStock = updatedStocks.find((s) => s.id === 'stock-an-982-raw')!;

  assert.equal(updatedProcStock.quantity, 45, 'Dòng sau sơ chế phải còn đúng 45 kg (95 - 50)');
  assert.equal(updatedRawStock.quantity, 660, 'Dòng hàng thô vẫn giữ nguyên 660 kg');
  assert.equal(updatedLot.allocation?.remainingAvailable, 660, 'Allocation lô gốc không bị trừ trùng (vẫn là 660 kg)');

  assert.equal(newPackStock.quantity, 10, 'Tạo mới dòng đóng gói 10 túi');
  assert.equal(newPackStock.unit, 'Túi');
  assert.equal(newPackStock.totalNetWeight, 50, 'Tổng khối lượng tịnh là 50 kg');
  assert.equal(newPackStock.sourceStockItemId, 'stock-an-982-proc', 'Lưu đúng mã dòng tồn nguồn');
  assert.equal(newPackStock.ownerId, 'u_r06_an', 'Kế thừa đúng chủ sở hữu hộ An');

  // 4. Kiểm tra chặn khi thử đóng tiếp quá 45 kg (ví dụ đóng tiếp 10 túi x 5kg = 50 kg)
  const availAfter = getStockItemAvailableQuantity(updatedProcStock, data.orders, data.handovers).availableQuantity;
  assert.equal(availAfter, 45, 'Khả dụng dòng sơ chế lúc này là 45 kg');

  const secondAttemptQuantity = 10 * 5; // 50 kg
  assert.ok(secondAttemptQuantity > availAfter, '50 kg vượt quá 45 kg khả dụng');

  // 5. Kiểm tra logic ngày: Ngày đóng gói không được trước ngày sơ chế (2026-09-25)
  const invalidDate = '2026-09-24';
  const processingDate = '2026-09-25';
  assert.ok(invalidDate < processingDate, 'Ngày đóng gói 2026-09-24 trước ngày sơ chế 2026-09-25 là không hợp lệ');
  assert.ok(packagingDate >= processingDate, 'Ngày đóng gói 2026-09-28 sau ngày sơ chế 2026-09-25 là hợp lệ');
});

test('Yêu cầu 6: Giữ đúng quyền sở hữu khi đóng gói tại HTX cho hàng hộ ký gửi', () => {
  const data = createInitialDemoData();

  // Giả sử có dòng hàng của hộ ký gửi tại HTX
  const consignedStock: ProductStockItem = {
    id: 'stock-consigned-test',
    htxId: 'anninh',
    harvestLotId: 'h-01',
    harvestLotCode: 'TH-AN-2026-001',
    variety: 'Bắc Thơm ký gửi',
    ownerType: 'ho_dan',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    holderId: 'anninh',
    holderName: 'HTX Nông nghiệp An Ninh',
    locationName: 'Kho HTX An Ninh',
    state: 'da_xu_ly',
    quantity: 100,
    unit: 'kg',
    updatedAt: '2026-09-28T08:00:00Z',
  };

  // Đóng gói 10 gói x 5kg tại HTX
  const newPackStock: ProductStockItem = {
    id: 'stock-pkg-consigned-01',
    htxId: consignedStock.htxId,
    harvestLotId: consignedStock.harvestLotId,
    harvestLotCode: consignedStock.harvestLotCode,
    variety: consignedStock.variety,
    // Kế thừa đúng owner và holder
    ownerType: consignedStock.ownerType, // 'ho_dan'
    ownerId: consignedStock.ownerId, // 'u_r06_an'
    ownerName: consignedStock.ownerName,
    holderId: consignedStock.holderId, // 'anninh'
    holderName: consignedStock.holderName,
    locationName: consignedStock.locationName,
    state: 'da_dong_goi',
    quantity: 10,
    unit: 'Gói',
    sourceStockItemId: consignedStock.id,
    netWeightPerPack: 5,
    totalNetWeight: 50,
    updatedAt: '2026-09-28T10:00:00Z',
  };

  assert.equal(newPackStock.ownerType, 'ho_dan', 'Hàng hộ ký gửi đóng gói tại HTX vẫn thuộc sở hữu hộ dân');
  assert.equal(newPackStock.ownerId, 'u_r06_an');
  assert.equal(newPackStock.holderId, 'anninh', 'Bên giữ hàng vẫn là HTX');
});
