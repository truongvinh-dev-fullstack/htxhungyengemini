import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialDemoData } from '../mock/demoRepository';
import { getProductStateBadge, getStockItemAvailableQuantity, getStockAvailableQuantity } from '../utils/harvestBalance';
import { ProductHandover, Order } from '../types';

test('Yêu cầu 1: Nhãn trạng thái theo ProductStockItem.state hiển thị đúng emoji và tên trạng thái', () => {
  const rawBadge = getProductStateBadge('hang_tho');
  assert.equal(rawBadge.label, '🌾 Hàng thô · Chưa sơ chế');

  const procBadge = getProductStateBadge('da_xu_ly');
  assert.equal(procBadge.label, '⚙️ Đã sơ chế');

  const pkgBadge = getProductStateBadge('da_dong_goi');
  assert.equal(pkgBadge.label, '📦 Đã đóng gói');
});

test('Yêu cầu 2 & 3: Lô TH-ANNINH-2026-982 có 3 dòng tồn độc lập về trạng thái, số lượng, đơn vị và khả dụng riêng biệt', () => {
  const data = createInitialDemoData();

  const rawStock = data.productStocks.find((s) => s.id === 'stock-an-982-raw')!;
  const procStock = data.productStocks.find((s) => s.id === 'stock-an-982-proc')!;
  const pkgStock = data.productStocks.find((s) => s.id === 'stock-an-982-pkg')!;

  assert.ok(rawStock, 'Dòng hàng thô phải tồn tại');
  assert.ok(procStock, 'Dòng sơ chế phải tồn tại');
  assert.ok(pkgStock, 'Dòng đóng gói phải tồn tại');

  // Kiểm tra trạng thái và đơn vị
  assert.equal(rawStock.state, 'hang_tho');
  assert.equal(rawStock.quantity, 660);
  assert.equal(rawStock.unit, 'kg');

  assert.equal(procStock.state, 'da_xu_ly');
  assert.equal(procStock.quantity, 95);
  assert.equal(procStock.unit, 'kg');

  assert.equal(pkgStock.state, 'da_dong_goi');
  assert.equal(pkgStock.quantity, 12);
  assert.equal(pkgStock.unit, 'hộp');

  // Khả dụng riêng biệt cho từng thẻ (Không dùng chung số dư 660 của lô nguồn)
  const rawAvail = getStockItemAvailableQuantity(rawStock, data.orders, data.handovers);
  const procAvail = getStockItemAvailableQuantity(procStock, data.orders, data.handovers);
  const pkgAvail = getStockItemAvailableQuantity(pkgStock, data.orders, data.handovers);

  assert.equal(rawAvail.availableQuantity, 660, 'Khả dụng hàng thô phải là 660 kg');
  assert.equal(procAvail.availableQuantity, 95, 'Khả dụng hàng sơ chế phải là 95 kg, KHÔNG được bằng 660');
  assert.equal(pkgAvail.availableQuantity, 12, 'Khả dụng hàng đóng gói phải là 12 hộp, KHÔNG được bằng 660');
});

test('Yêu cầu 3 & 4: Phiếu gửi HTX đang chờ từ hàng thô chỉ trừ khả dụng hàng thô, không ảnh hưởng sơ chế và đóng gói', () => {
  const data = createInitialDemoData();
  const rawStock = data.productStocks.find((s) => s.id === 'stock-an-982-raw')!;
  const procStock = data.productStocks.find((s) => s.id === 'stock-an-982-proc')!;
  const pkgStock = data.productStocks.find((s) => s.id === 'stock-an-982-pkg')!;

  // Tạo phiếu gửi hàng HTX cho hàng thô: 100 kg
  const pendingSlip: ProductHandover = {
    id: 'gn-test-raw',
    code: 'GN-TEST-RAW',
    htxId: 'anninh',
    harvestLotId: rawStock.harvestLotId,
    harvestLotCode: rawStock.harvestLotCode,
    stockItemId: rawStock.id,
    variety: rawStock.variety,
    senderId: rawStock.ownerId,
    senderName: rawStock.ownerName,
    handoverType: 'ky_gui',
    productState: 'hang_tho',
    declaredQuantity: 100,
    unit: 'kg',
    status: 'cho_kiem_nhan',
    createdAt: '2026-09-29',
  };

  const handoversWithPending = [pendingSlip, ...data.handovers];

  const rawAvail = getStockItemAvailableQuantity(rawStock, data.orders, handoversWithPending);
  const procAvail = getStockItemAvailableQuantity(procStock, data.orders, handoversWithPending);
  const pkgAvail = getStockItemAvailableQuantity(pkgStock, data.orders, handoversWithPending);

  assert.equal(rawAvail.availableQuantity, 560, 'Khả dụng hàng thô giảm còn 560 kg');
  assert.equal(rawAvail.pendingHandoverQuantity, 100);
  assert.equal(procAvail.availableQuantity, 95, 'Khả dụng hàng sơ chế không bị giảm');
  assert.equal(pkgAvail.availableQuantity, 12, 'Khả dụng hàng đóng gói không bị giảm');
});

test('Yêu cầu 4: Đơn bán trực tiếp từ dòng đóng gói (hộp) giữ chỗ riêng theo stockItemId, không trừ vào hàng thô', () => {
  const data = createInitialDemoData();
  const rawStock = data.productStocks.find((s) => s.id === 'stock-an-982-raw')!;
  const procStock = data.productStocks.find((s) => s.id === 'stock-an-982-proc')!;
  const pkgStock = data.productStocks.find((s) => s.id === 'stock-an-982-pkg')!;

  // Tạo đơn bán 4 hộp từ dòng đóng gói
  const pkgOrder: Order = {
    id: 'ord-test-pkg',
    code: 'ORD-TEST-PKG',
    customerName: 'Khách mua lẻ',
    customerPhone: '0912345678',
    deliveryAddress: 'Hà Nội',
    orderDate: '2026-09-29',
    deliveryDate: '2026-09-30',
    status: 'Chờ giao hàng',
    paymentStatus: 'Chưa thanh toán',
    sellerType: 'ho_dan',
    sellerId: pkgStock.ownerId,
    sellerName: pkgStock.ownerName,
    htxId: 'anninh',
    harvestLotId: pkgStock.harvestLotId,
    stockItemId: pkgStock.id,
    productName: pkgStock.variety,
    productState: 'da_dong_goi',
    spec: pkgStock.spec,
    quantity: 4,
    unit: 'hộp',
    pricePerUnit: 120000,
    totalAmount: 480000,
  };

  const ordersWithPkg = [pkgOrder, ...data.orders];

  const rawAvail = getStockItemAvailableQuantity(rawStock, ordersWithPkg, data.handovers);
  const procAvail = getStockItemAvailableQuantity(procStock, ordersWithPkg, data.handovers);
  const pkgAvail = getStockItemAvailableQuantity(pkgStock, ordersWithPkg, data.handovers);

  assert.equal(pkgAvail.availableQuantity, 8, 'Khả dụng đóng gói giảm từ 12 còn 8 hộp');
  assert.equal(pkgAvail.reservedOrdersQuantity, 4);
  assert.equal(rawAvail.availableQuantity, 660, 'Khả dụng hàng thô vẫn giữ nguyên 660 kg');
  assert.equal(procAvail.availableQuantity, 95, 'Khả dụng hàng sơ chế vẫn giữ nguyên 95 kg');
});
