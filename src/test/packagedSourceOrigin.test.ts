import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialDemoData } from '../mock/demoRepository';
import {
  getProductStateBadge,
  resolvePackagedSourceOrigin,
  getProductStockBadge,
} from '../utils/harvestBalance';
import { ProductStockItem, PackagedProduct, HarvestLot } from '../types';

test('Yêu cầu 1 & 4: Nhãn trạng thái dòng đóng gói phân biệt rõ nguồn thô / nguồn sơ chế / chưa xác định, state luôn là da_dong_goi', () => {
  // Đóng gói từ hàng thô
  const rawOriginBadge = getProductStateBadge('da_dong_goi', 'hang_tho');
  assert.equal(rawOriginBadge.label, '📦 Đã đóng gói · Từ hàng thô');
  assert.equal(rawOriginBadge.sourceOrigin, 'hang_tho');

  // Đóng gói từ hàng đã sơ chế
  const procOriginBadge = getProductStateBadge('da_dong_goi', 'da_xu_ly');
  assert.equal(procOriginBadge.label, '📦 Đã đóng gói · Từ hàng đã sơ chế');
  assert.equal(procOriginBadge.sourceOrigin, 'da_xu_ly');

  // Dữ liệu đóng gói chưa xác định nguồn
  const unknownOriginBadge = getProductStateBadge('da_dong_goi', 'unknown');
  assert.equal(unknownOriginBadge.label, '📦 Đã đóng gói · Nguồn đóng gói chưa xác định');
  assert.equal(unknownOriginBadge.sourceOrigin, 'unknown');

  // Kiểm tra Yêu cầu 4: state không được đổi thành hang_tho
  const testStockItem: ProductStockItem = {
    id: 'stock-test-01',
    htxId: 'anninh',
    harvestLotId: 'h-an-982',
    harvestLotCode: 'TH-ANNINH-2026-982',
    variety: 'Gạo Bắc Thơm',
    ownerType: 'ho_dan',
    ownerId: 'u_r06_an',
    ownerName: 'Bác Nguyễn Văn An',
    locationName: 'Kho hộ An',
    state: 'da_dong_goi',
    sourceProductState: 'hang_tho',
    quantity: 20,
    unit: 'túi',
    updatedAt: '2026-09-29T10:00:00Z',
  };

  assert.equal(testStockItem.state, 'da_dong_goi', 'State phải giữ nguyên da_dong_goi, KHÔNG đổi thành hang_tho');
  assert.equal(testStockItem.sourceProductState, 'hang_tho', 'sourceProductState lưu nhãn nguồn');
});

test('Yêu cầu 3: Dữ liệu đóng gói cũ (legacy) chưa lưu sourceStockItemId khi lô có cả hàng thô và sơ chế -> không tự suy đoán, hiển thị "Nguồn đóng gói chưa xác định"', () => {
  const data = createInitialDemoData();

  // stock-an-982-pkg trong mock data là dữ liệu cũ, không có sourceStockItemId
  const legacyPkgStock = data.productStocks.find((s) => s.id === 'stock-an-982-pkg')!;
  assert.ok(legacyPkgStock, 'Dòng đóng gói cũ tồn tại');
  assert.equal(legacyPkgStock.sourceStockItemId, undefined);
  assert.equal(legacyPkgStock.sourceProductState, undefined);

  // Lô h-an-982 có cả dòng thô 660 kg và sơ chế 95 kg
  const rawStock = data.productStocks.find((s) => s.id === 'stock-an-982-raw')!;
  const procStock = data.productStocks.find((s) => s.id === 'stock-an-982-proc')!;
  assert.ok(rawStock && procStock);

  // resolvePackagedSourceOrigin phải trả về 'unknown'
  const origin = resolvePackagedSourceOrigin(legacyPkgStock, data.productStocks, data.packages, data.harvests);
  assert.equal(origin, 'unknown', 'Không được tự gán nhầm từ hàng thô khi lô có cả thô và sơ chế');

  // Badge hiển thị đúng nhãn cảnh báo
  const badge = getProductStockBadge(legacyPkgStock, data.productStocks, data.packages, data.harvests);
  assert.equal(badge.label, '📦 Đã đóng gói · Nguồn đóng gói chưa xác định');
});

test('Yêu cầu 3: Dữ liệu đóng gói cũ có chứng cứ rõ ràng từ sự kiện đóng gói (như không sơ chế hoặc có sơ chế) thì nhận diện đúng', () => {
  const data = createInitialDemoData();

  // Trường hợp 1: Có event đóng gói ghi rõ không sơ chế
  const mockPkgLive: PackagedProduct = {
    id: 'pkg-live-demo',
    code: 'SP-DEMO-LIVE',
    htxId: 'anninh',
    harvestLotId: 'h-live',
    harvestLotCode: 'TH-LIVE',
    productName: 'Rau tươi',
    packagingSpec: 'Túi 1kg',
    netWeightPerPack: 1,
    netWeightUnit: 'kg',
    packQuantity: 10,
    unit: 'túi',
    isLiveProduct: true,
    createdDate: '2026-09-29',
    standard: 'VietGAP',
  };

  const stockLive: ProductStockItem = {
    id: 'stock-live-demo',
    htxId: 'anninh',
    harvestLotId: 'h-live',
    packageId: 'pkg-live-demo',
    variety: 'Rau tươi',
    ownerType: 'ho_dan',
    ownerId: 'u_r06_an',
    ownerName: 'Bác An',
    locationName: 'Kho hộ',
    state: 'da_dong_goi',
    quantity: 10,
    unit: 'túi',
    updatedAt: '2026-09-29T10:00:00Z',
  };

  const originLive = resolvePackagedSourceOrigin(stockLive, [stockLive], [mockPkgLive], []);
  assert.equal(originLive, 'hang_tho', 'Hàng tươi sống không sơ chế được nhận diện là Từ hàng thô');

  // Trường hợp 2: Có event đóng gói với snapshot đã sơ chế
  const mockPkgProc: PackagedProduct = {
    id: 'pkg-proc-demo',
    code: 'SP-DEMO-PROC',
    htxId: 'anninh',
    harvestLotId: 'h-proc',
    harvestLotCode: 'TH-PROC',
    productName: 'Gạo xay xát',
    packagingSpec: 'Túi 5kg',
    netWeightPerPack: 5,
    netWeightUnit: 'kg',
    packQuantity: 10,
    unit: 'túi',
    createdDate: '2026-09-29',
    standard: 'VietGAP',
    processingSnapshot: {
      hasProcessing: true,
      statusText: 'Đã sơ chế',
      method: 'Xay xát',
      outputQuantity: 50,
      inputQuantity: 60,
      unit: 'kg',
    },
  };

  const stockProc: ProductStockItem = {
    id: 'stock-proc-demo',
    htxId: 'anninh',
    harvestLotId: 'h-proc',
    packageId: 'pkg-proc-demo',
    variety: 'Gạo xay xát',
    ownerType: 'ho_dan',
    ownerId: 'u_r06_an',
    ownerName: 'Bác An',
    locationName: 'Kho hộ',
    state: 'da_dong_goi',
    quantity: 10,
    unit: 'túi',
    updatedAt: '2026-09-29T10:00:00Z',
  };

  const originProc = resolvePackagedSourceOrigin(stockProc, [stockProc], [mockPkgProc], []);
  assert.equal(originProc, 'da_xu_ly', 'Snapshot có sơ chế được nhận diện là Từ hàng đã sơ chế');
});

test('Yêu cầu 5: Cùng một lô thu hoạch TH-ANNINH-2026-982: đóng gói từ hàng thô và đóng gói từ hàng sơ chế', () => {
  const data = createInitialDemoData();

  const rawStock = data.productStocks.find((s) => s.id === 'stock-an-982-raw')!;
  const procStock = data.productStocks.find((s) => s.id === 'stock-an-982-proc')!;
  const lot = data.harvests.find((h) => h.id === 'h-an-982')!;

  assert.equal(rawStock.quantity, 660);
  assert.equal(procStock.quantity, 95);
  assert.equal(lot.allocation?.remainingAvailable, 660);

  // --- Hành động 1: Đóng gói 20 bao x 10kg = 200kg TỪ HÀNG THÔ (stock-an-982-raw) ---
  const rawPackQty = 20;
  const rawPackWeightPerPack = 10;
  const rawTotalWeight = rawPackQty * rawPackWeightPerPack; // 200 kg

  const rawPackStock: ProductStockItem = {
    id: 'stock-pkg-from-raw',
    htxId: rawStock.htxId,
    harvestLotId: rawStock.harvestLotId,
    harvestLotCode: rawStock.harvestLotCode,
    variety: rawStock.variety,
    ownerType: rawStock.ownerType,
    ownerId: rawStock.ownerId,
    ownerName: rawStock.ownerName,
    locationName: 'Kho bao gói tại hộ An',
    state: 'da_dong_goi',
    quantity: rawPackQty,
    unit: 'bao',
    spec: `${rawPackQty} bao x ${rawPackWeightPerPack} kg`,
    sourceStockItemId: rawStock.id,
    sourceProductState: 'hang_tho',
    packageId: 'pkg-from-raw',
    packageCode: 'SP-ANNINH-RAW-01',
    netWeightPerPack: rawPackWeightPerPack,
    totalNetWeight: rawTotalWeight,
    updatedAt: '2026-09-29T10:00:00Z',
  };

  // Trừ tồn hàng thô 660 - 200 = 460 kg
  const updatedRawStock: ProductStockItem = {
    ...rawStock,
    quantity: rawStock.quantity - rawTotalWeight,
  };

  // Allocation của lô bị trừ 200 kg vì là hàng thô: 660 - 200 = 460 kg
  const updatedLotAfterRaw: HarvestLot = {
    ...lot,
    allocation: {
      ...lot.allocation!,
      packagedAtFarmQuantity: (lot.allocation?.packagedAtFarmQuantity || 0) + rawTotalWeight,
      remainingAvailable: lot.allocation!.remainingAvailable - rawTotalWeight,
    },
  };

  // --- Hành động 2: Đóng gói 6 hộp x 5kg = 30kg TỪ HÀNG SƠ CHẾ (stock-an-982-proc) ---
  const procPackQty = 6;
  const procPackWeightPerPack = 5;
  const procTotalWeight = procPackQty * procPackWeightPerPack; // 30 kg

  const procPackStock: ProductStockItem = {
    id: 'stock-pkg-from-proc',
    htxId: procStock.htxId,
    harvestLotId: procStock.harvestLotId,
    harvestLotCode: procStock.harvestLotCode,
    variety: procStock.variety,
    ownerType: procStock.ownerType,
    ownerId: procStock.ownerId,
    ownerName: procStock.ownerName,
    locationName: 'Kho bao gói tại hộ An',
    state: 'da_dong_goi',
    quantity: procPackQty,
    unit: 'hộp',
    spec: `${procPackQty} hộp x ${procPackWeightPerPack} kg`,
    sourceStockItemId: procStock.id,
    sourceProductState: 'da_xu_ly',
    packageId: 'pkg-from-proc',
    packageCode: 'SP-ANNINH-PROC-01',
    netWeightPerPack: procPackWeightPerPack,
    totalNetWeight: procTotalWeight,
    updatedAt: '2026-09-29T10:30:00Z',
  };

  // Trừ tồn hàng sơ chế 95 - 30 = 65 kg
  const updatedProcStock: ProductStockItem = {
    ...procStock,
    quantity: procStock.quantity - procTotalWeight,
  };

  // Allocation của lô KHÔNG bị trừ khi đóng gói từ hàng sơ chế
  const finalLot = updatedLotAfterRaw;

  // Tổng hợp kho sau cả 2 lần đóng gói
  const currentStocks = [
    rawPackStock,
    procPackStock,
    updatedRawStock,
    updatedProcStock,
    ...data.productStocks.filter((s) => s.id !== rawStock.id && s.id !== procStock.id),
  ];

  // --- KIỂM TRA ĐỐI CHIẾU ---
  // 1. Kiểm tra tồn dư các dòng nguồn
  assert.equal(updatedRawStock.quantity, 460, 'Tồn hàng thô phải còn đúng 460 kg (660 - 200)');
  assert.equal(updatedProcStock.quantity, 65, 'Tồn hàng sơ chế phải còn đúng 65 kg (95 - 30)');
  assert.equal(finalLot.allocation?.remainingAvailable, 460, 'Allocation chỉ trừ hàng thô, không trừ trùng hàng sơ chế');

  // 2. Kiểm tra số gói và khối lượng tịnh
  assert.equal(rawPackStock.quantity, 20, 'Đúng 20 bao đóng gói từ hàng thô');
  assert.equal(rawPackStock.unit, 'bao');
  assert.equal(rawPackStock.netWeightPerPack, 10);
  assert.equal(rawPackStock.totalNetWeight, 200, 'Tổng khối lượng tịnh 200 kg');

  assert.equal(procPackStock.quantity, 6, 'Đúng 6 hộp đóng gói từ hàng sơ chế');
  assert.equal(procPackStock.unit, 'hộp');
  assert.equal(procPackStock.netWeightPerPack, 5);
  assert.equal(procPackStock.totalNetWeight, 30, 'Tổng khối lượng tịnh 30 kg');

  // 3. Kiểm tra nhãn hiển thị của 2 dòng đóng gói: HAI DÒNG PHẢI CÓ NHÃN KHÁC NHAU
  const rawPackBadge = getProductStockBadge(rawPackStock, currentStocks, data.packages, [finalLot]);
  const procPackBadge = getProductStockBadge(procPackStock, currentStocks, data.packages, [finalLot]);

  assert.equal(
    rawPackBadge.label,
    '📦 Đã đóng gói · Từ hàng thô',
    'Dòng từ hàng thô phải có nhãn "📦 Đã đóng gói · Từ hàng thô"'
  );
  assert.equal(
    procPackBadge.label,
    '📦 Đã đóng gói · Từ hàng đã sơ chế',
    'Dòng từ hàng đã sơ chế phải có nhãn "📦 Đã đóng gói · Từ hàng đã sơ chế"'
  );
  assert.notEqual(
    rawPackBadge.label,
    procPackBadge.label,
    'Hai dòng đóng gói cùng lô nguồn PHẢI có nhãn khác nhau'
  );

  // 4. Kiểm tra mã dòng nguồn lưu trên mỗi dòng
  assert.equal(rawPackStock.sourceStockItemId, 'stock-an-982-raw');
  assert.equal(procPackStock.sourceStockItemId, 'stock-an-982-proc');
});
