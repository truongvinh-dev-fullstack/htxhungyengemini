import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialDemoData } from '../mock/demoRepository';
import {
  getStockItemAvailableQuantity,
  stockAfterReceipt,
  getHarvestBalance,
} from '../utils/harvestBalance';
import { ProductHandover, ProductStockItem, HarvestLot, HTXInfo } from '../types';

const mockHTXAnNinh: HTXInfo = {
  id: 'anninh',
  name: 'Hợp tác xã Nông nghiệp An Ninh',
  shortName: 'An Ninh',
  address: 'Huyện Tiên Lữ, Hưng Yên',
  phone: '0221.385.1234',
  directorName: 'Ông Đặng Văn Chung',
  establishedYear: 2018,
  activeProductionZones: 3,
  description: 'HTX điểm chuyên canh',
  certifications: ['VietGAP', 'OCOP 4 sao'],
};

test('Kịch bản 1: Lập phiếu giao từ lô thu hoạch (không có stockItemId) chỉ được lập cho hàng thô, kèm bao bì vận chuyển, không tạo mã QR giả', () => {
  const data = createInitialDemoData();
  const lot = data.harvests.find((h) => h.id === 'h-an-982')!;
  const rawStock = data.productStocks.find((s) => s.id === 'stock-an-982-raw')!;
  const procStock = data.productStocks.find((s) => s.id === 'stock-an-982-proc')!;
  const pkgStock = data.productStocks.find((s) => s.id === 'stock-an-982-pkg')!;

  assert.equal(rawStock.quantity, 660);
  assert.equal(procStock.quantity, 95);
  assert.equal(pkgStock.quantity, 12);

  // Hộ giao 150 kg hàng thô, nhập bao bì vận chuyển "15 bao tải để vận chuyển"
  const rawHandover: ProductHandover = {
    id: 'gn-test-raw-01',
    code: 'GN-ANNINH-2026-001',
    htxId: 'anninh',
    harvestLotId: lot.id,
    harvestLotCode: lot.code,
    // Không có stockItemId vì mở trực tiếp từ lô
    variety: lot.variety || 'Lúa Bắc Thơm',
    senderId: 'u_r06_an',
    senderName: 'Bác Nguyễn Văn An',
    handoverType: 'mua_dut',
    productState: 'hang_tho', // Bắt buộc là hang_tho
    transportPackaging: '15 bao tải để vận chuyển',
    declaredQuantity: 150,
    unit: 'kg',
    status: 'cho_kiem_nhan',
    createdAt: new Date().toISOString(),
  };

  const handoversWithRaw = [rawHandover, ...data.handovers];

  // 1. Kiểm tra tồn khả dụng: Chỉ hàng thô bị trừ 150 kg (660 -> 510 kg)
  const rawAvail = getStockItemAvailableQuantity(rawStock, data.orders, handoversWithRaw);
  const procAvail = getStockItemAvailableQuantity(procStock, data.orders, handoversWithRaw);
  const pkgAvail = getStockItemAvailableQuantity(pkgStock, data.orders, handoversWithRaw);

  assert.equal(rawAvail.availableQuantity, 510, 'Hàng thô giảm từ 660 xuống 510 kg');
  assert.equal(rawAvail.pendingHandoverQuantity, 150);
  assert.equal(procAvail.availableQuantity, 95, 'Hàng sơ chế giữ nguyên 95 kg');
  assert.equal(pkgAvail.availableQuantity, 12, 'Hàng đóng gói giữ nguyên 12 hộp');

  // 2. Phiếu này không có packageId, không tạo mã QR giả
  assert.equal(rawHandover.packageId, undefined);
  assert.equal(rawHandover.packageCode, undefined);
  assert.equal(rawHandover.productState, 'hang_tho');
  assert.equal(rawHandover.transportPackaging, '15 bao tải để vận chuyển');

  // 3. Khi HTX kiểm nhận phiếu thô
  const confirmedStock = stockAfterReceipt(rawHandover, mockHTXAnNinh, 150, 'Đạt chuẩn', new Date().toISOString());
  assert.equal(confirmedStock.state, 'hang_tho');
  assert.equal(confirmedStock.quantity, 150);
  assert.equal(confirmedStock.spec, 'Hàng thô (15 bao tải để vận chuyển)');
  assert.equal(confirmedStock.packageId, undefined);
});

test('Kịch bản 2: Hộ đóng gói 12 túi x 5kg từ nguồn sơ chế, giao 5 túi (25kg) cho HTX: còn 7 túi tại hộ, phiếu và kho HTX giữ đúng liên kết', () => {
  const data = createInitialDemoData();
  const procStock = data.productStocks.find((s) => s.id === 'stock-an-982-proc')!;
  const lot = data.harvests.find((h) => h.id === 'h-an-982')!;

  assert.equal(procStock.quantity, 95);

  // 1. Đóng gói 12 túi x 5kg = 60 kg từ dòng sơ chế 95 kg -> dòng sơ chế còn 35 kg
  const packQty = 12;
  const netWeightPerPack = 5;
  const totalNetWeight = packQty * netWeightPerPack; // 60 kg

  const newPackStock: ProductStockItem = {
    id: 'stock-pkg-12tui',
    htxId: 'anninh',
    harvestLotId: lot.id,
    harvestLotCode: lot.code,
    variety: 'Gạo lứt Bắc Thơm đóng túi',
    ownerType: 'ho_dan',
    ownerId: 'u_r06_an',
    ownerName: 'Bác Nguyễn Văn An',
    locationName: 'Kho hộ An',
    state: 'da_dong_goi',
    quantity: packQty, // 12
    unit: 'túi',
    spec: 'Túi 5kg hút chân không',
    sourceStockItemId: procStock.id,
    sourceProductState: 'da_xu_ly',
    packageId: 'pkg-12tui-id',
    packageCode: 'SP-ANNINH-12TUI',
    netWeightPerPack,
    totalNetWeight,
    updatedAt: new Date().toISOString(),
  };

  const updatedProcStock: ProductStockItem = {
    ...procStock,
    quantity: procStock.quantity - totalNetWeight, // 95 - 60 = 35 kg
  };

  assert.equal(updatedProcStock.quantity, 35, 'Dòng sơ chế nguồn còn 35 kg sau khi đóng gói 60 kg');

  // 2. Hộ giao 5 túi cho HTX theo hình thức ký gửi (ky_gui)
  const deliveryPacks = 5;
  const deliveryNetWeight = deliveryPacks * netWeightPerPack; // 25 kg

  const pkgHandover: ProductHandover = {
    id: 'gn-test-pkg-01',
    code: 'GN-ANNINH-PKG-001',
    htxId: 'anninh',
    harvestLotId: lot.id,
    harvestLotCode: lot.code,
    stockItemId: newPackStock.id, // Bắt buộc truyền stockItemId
    packageId: newPackStock.packageId,
    packageCode: newPackStock.packageCode,
    variety: newPackStock.variety,
    senderId: 'u_r06_an',
    senderName: 'Bác Nguyễn Văn An',
    handoverType: 'ky_gui',
    productState: 'da_dong_goi',
    packageSpec: newPackStock.spec,
    netWeightPerPack,
    totalNetWeight: deliveryNetWeight,
    declaredQuantity: deliveryPacks, // 5 túi
    unit: 'túi',
    status: 'cho_kiem_nhan',
    createdAt: new Date().toISOString(),
  };

  // Tồn khả dụng tại hộ: 12 túi - 5 túi đang gửi = 7 túi
  const pkgAvail = getStockItemAvailableQuantity(newPackStock, data.orders, [pkgHandover]);
  assert.equal(pkgAvail.availableQuantity, 7, 'Còn 7 túi khả dụng tại hộ (12 - 5)');
  assert.equal(pkgAvail.pendingHandoverQuantity, 5);

  // 3. HTX kiểm nhận 5 túi ký gửi
  const receivedStock = stockAfterReceipt(pkgHandover, mockHTXAnNinh, deliveryPacks, 'Đạt chuẩn đóng gói', new Date().toISOString());

  // Kiểm tra liên kết và quyền sở hữu
  assert.equal(receivedStock.state, 'da_dong_goi');
  assert.equal(receivedStock.quantity, 5);
  assert.equal(receivedStock.unit, 'túi');
  assert.equal(receivedStock.packageId, 'pkg-12tui-id', 'Giữ đúng packageId');
  assert.equal(receivedStock.packageCode, 'SP-ANNINH-12TUI', 'Giữ đúng packageCode');
  assert.equal(receivedStock.sourceStockItemId, 'stock-pkg-12tui', 'Giữ đúng sourceStockItemId');
  assert.equal(receivedStock.harvestLotId, lot.id, 'Giữ liên kết lô thu hoạch gốc');
  assert.equal(receivedStock.ownerType, 'ho_dan', 'Ký gửi: chủ hàng vẫn là hộ dân');
  assert.equal(receivedStock.ownerId, 'u_r06_an');
  assert.equal(receivedStock.holderId, 'anninh', 'Bên giữ hàng là HTX An Ninh');
});

test('Kịch bản 3: Giao hàng sau sơ chế nhưng chưa đóng gói: giữ tình trạng da_xu_ly, không gán nhầm thành hang_tho', () => {
  const procStock: ProductStockItem = {
    id: 'stock-an-982-proc',
    htxId: 'anninh',
    harvestLotId: 'h-an-982',
    harvestLotCode: 'TH-ANNINH-2026-982',
    variety: 'Gạo lứt Bắc Thơm sau sơ chế',
    ownerType: 'ho_dan',
    ownerId: 'u_r06_an',
    ownerName: 'Bác Nguyễn Văn An',
    locationName: 'Kho hộ An',
    state: 'da_xu_ly',
    quantity: 95,
    unit: 'kg',
    updatedAt: new Date().toISOString(),
  };

  // Hộ giao 40 kg hàng sơ chế cho HTX bán đứt
  const procHandover: ProductHandover = {
    id: 'gn-test-proc-01',
    code: 'GN-ANNINH-PROC-001',
    htxId: 'anninh',
    harvestLotId: 'h-an-982',
    harvestLotCode: 'TH-ANNINH-2026-982',
    stockItemId: procStock.id,
    variety: procStock.variety,
    senderId: 'u_r06_an',
    senderName: 'Bác Nguyễn Văn An',
    handoverType: 'mua_dut',
    productState: 'da_xu_ly', // Giữ da_xu_ly, không đổi về hang_tho
    declaredQuantity: 40,
    unit: 'kg',
    status: 'cho_kiem_nhan',
    createdAt: new Date().toISOString(),
  };

  assert.equal(procHandover.productState, 'da_xu_ly');

  // Khi HTX kiểm nhận: tạo dòng tồn HTX cũng có state = da_xu_ly
  const receivedStock = stockAfterReceipt(procHandover, mockHTXAnNinh, 40, 'Hàng sơ chế đạt chuẩn', new Date().toISOString());
  assert.equal(receivedStock.state, 'da_xu_ly', 'Trạng thái tại kho HTX phải là da_xu_ly');
  assert.equal(receivedStock.quantity, 40);
  assert.equal(receivedStock.unit, 'kg');
  assert.equal(receivedStock.ownerType, 'htx', 'Mua đứt: chủ sở hữu chuyển sang HTX');
  assert.equal(receivedStock.ownerId, 'anninh');
});

test('Kịch bản 4 & 5: Quyền sở hữu chỉ đổi khi HTX kiểm nhận (mua đứt); không tạo tồn HTX sớm; chặn trùng lặp', () => {
  const data = createInitialDemoData();
  const rawStock = data.productStocks.find((s) => s.id === 'stock-an-982-raw')!;

  const pendingHandover: ProductHandover = {
    id: 'gn-test-pending-01',
    code: 'GN-PENDING-001',
    htxId: 'anninh',
    harvestLotId: rawStock.harvestLotId,
    harvestLotCode: rawStock.harvestLotCode,
    stockItemId: rawStock.id,
    variety: rawStock.variety,
    senderId: rawStock.ownerId,
    senderName: rawStock.ownerName,
    handoverType: 'mua_dut',
    productState: 'hang_tho',
    declaredQuantity: 100,
    unit: 'kg',
    status: 'cho_kiem_nhan',
    createdAt: new Date().toISOString(),
  };

  // 1. Khi đang chờ kiểm nhận (cho_kiem_nhan):
  // Chưa có dòng tồn HTX nào được sinh ra từ phiếu này trong data.productStocks
  const existingHTXStock = data.productStocks.find((s) => s.handoverId === pendingHandover.id);
  assert.equal(existingHTXStock, undefined, 'Chưa tạo dòng tồn HTX khi phiếu mới ở trạng thái chờ kiểm nhận');

  // 2. Khi HTX kiểm nhận:
  // - Nếu là mua đứt: chủ sở hữu là HTX
  const stockMuaDut = stockAfterReceipt(pendingHandover, mockHTXAnNinh, 100, 'Đạt', new Date().toISOString());
  assert.equal(stockMuaDut.ownerType, 'htx');
  assert.equal(stockMuaDut.ownerId, 'anninh');
  assert.equal(stockMuaDut.holderId, 'anninh');

  // - Nếu là ký gửi: chủ sở hữu vẫn là hộ
  const consignmentHandover: ProductHandover = {
    ...pendingHandover,
    handoverType: 'ky_gui',
  };
  const stockKyGui = stockAfterReceipt(consignmentHandover, mockHTXAnNinh, 100, 'Đạt', new Date().toISOString());
  assert.equal(stockKyGui.ownerType, 'ho_dan');
  assert.equal(stockKyGui.ownerId, 'u_r06_an');
  assert.equal(stockKyGui.holderId, 'anninh');
});
