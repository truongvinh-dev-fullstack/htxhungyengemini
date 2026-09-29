import test from 'node:test';
import assert from 'node:assert/strict';
import { HTX_LIST } from '../mock/data';
import { HarvestLot, ProductHandover, ProductStockItem, SalesOrder } from '../types';
import { getHarvestBalance, stockAfterReceipt, getStockAvailableQuantity } from '../utils/harvestBalance';
import { canViewHarvestLot, canViewProductStock } from '../utils/permissions';
import { saveDemoData, loadDemoData, createInitialDemoData } from '../mock/demoRepository';

test('Kịch bản nghiệp vụ chuẩn 1.500 kg (SRS v2.1): Thu hoạch -> Phiếu gửi -> Tiếp nhận -> Bán hàng HTX & Hộ', () => {
  const now = new Date().toISOString();
  const anninh = HTX_LIST.anninh;

  // 1. Hộ Nguyễn Văn An tại HTX An Ninh thu hoạch 1.500 kg
  const lot: HarvestLot = {
    id: 'h-test-1500',
    code: 'TH-AN-TEST-1500',
    htxId: 'anninh',
    farmZoneId: 'fz-01',
    variety: 'Bắc Thơm số 7',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    farmZoneName: 'Thửa Đầm Bông',
    date: '2026-09-29',
    yieldQuantity: 1500,
    unit: 'kg',
    processingStatus: 'chua_so_che',
    allocation: {
      directSaleQuantity: 0,
      deliveredToHTXQuantity: 0,
      packagedAtFarmQuantity: 0,
      processedAtFarmQuantity: 0,
      remainingAvailable: 1500,
    },
  };

  // Tồn ban đầu tại hộ
  let productStocks: ProductStockItem[] = [
    {
      id: 'stock-an-onfarm-1500',
      htxId: 'anninh',
      harvestLotId: lot.id,
      harvestLotCode: lot.code,
      variety: lot.variety || '',
      ownerType: 'ho_dan',
      ownerId: 'u_r06_an',
      ownerName: 'Nguyễn Văn An',
      holderId: 'u_r06_an',
      holderName: 'Nguyễn Văn An',
      locationName: 'Kho tại hộ bác An',
      state: 'hang_tho',
      quantity: 1500,
      unit: 'kg',
      updatedAt: now,
    },
  ];

  let handovers: ProductHandover[] = [];
  let orders: SalesOrder[] = [];

  // Kiểm tra ban đầu: hộ có 1.500 kg khả dụng
  assert.equal(getHarvestBalance(lot, handovers, orders).availableQuantity, 1500);

  // 2. Tạo phiếu bán đứt HTX 1.000 kg và phiếu ký gửi HTX 300 kg; 200 kg còn lại tại hộ
  const slip1: ProductHandover = {
    id: 'gn-test-1000',
    code: 'GN-AN-1000',
    htxId: 'anninh',
    harvestLotId: lot.id,
    harvestLotCode: lot.code,
    variety: lot.variety || '',
    senderId: 'u_r06_an',
    senderName: 'Nguyễn Văn An',
    handoverType: 'mua_dut',
    productState: 'hang_tho',
    declaredQuantity: 1000,
    unit: 'kg',
    unitPrice: 11000,
    agreedUnitPrice: 11000,
    status: 'cho_kiem_nhan',
    createdAt: now,
  };

  const slip2: ProductHandover = {
    id: 'gn-test-300',
    code: 'GN-AN-300',
    htxId: 'anninh',
    harvestLotId: lot.id,
    harvestLotCode: lot.code,
    variety: lot.variety || '',
    senderId: 'u_r06_an',
    senderName: 'Nguyễn Văn An',
    handoverType: 'ky_gui',
    productState: 'hang_tho',
    declaredQuantity: 300,
    unit: 'kg',
    status: 'cho_kiem_nhan',
    createdAt: now,
  };

  handovers = [slip1, slip2];

  // 200 kg còn lại tại hộ (khả dụng)
  assert.equal(getHarvestBalance(lot, handovers, orders).availableQuantity, 200);
  assert.equal(getHarvestBalance(lot, handovers, orders).pendingQuantity, 1300);

  // 3. Trước khi HTX xác nhận:
  // - R04 thấy hai phiếu trong hộp tiếp nhận
  const r04Inbox = handovers.filter((h) => h.htxId === 'anninh' && h.status === 'cho_kiem_nhan');
  assert.equal(r04Inbox.length, 2);
  assert.deepEqual(r04Inbox.map((h) => h.code), ['GN-AN-1000', 'GN-AN-300']);

  // - Kho thành phẩm HTX CHƯA tăng 1.300 kg (vẫn bằng 0 kg hàng HTX giữ cho lô này)
  const htxStocksBefore = productStocks.filter(
    (s) => canViewProductStock('R04', s, 'anninh', 'u_r04_dung') && s.harvestLotId === lot.id
  );
  assert.equal(htxStocksBefore.length, 0);

  // 4. Sau khi xác nhận tiếp nhận 2 phiếu:
  // HTX xác nhận mua đứt 1.000 kg
  const stockMuaDut = stockAfterReceipt(slip1, anninh, 1000, 'Đạt chuẩn loại 1', now);
  // HTX xác nhận nhận ký gửi 300 kg
  const stockKyGui = stockAfterReceipt(slip2, anninh, 300, 'Đạt chuẩn gửi kho', now);

  // Cập nhật trạng thái 2 phiếu sang da_kiem_nhan
  handovers = handovers.map((h) => {
    if (h.id === slip1.id) return { ...h, status: 'da_kiem_nhan' as const, receivedQuantity: 1000, differenceQuantity: 0 };
    if (h.id === slip2.id) return { ...h, status: 'da_kiem_nhan' as const, receivedQuantity: 300, differenceQuantity: 0 };
    return h;
  });

  // Trừ tồn vật lý tại hộ và bổ sung tồn vào kho HTX
  productStocks = [
    stockMuaDut,
    stockKyGui,
    ...productStocks.map((s) => {
      if (s.id === 'stock-an-onfarm-1500') {
        return { ...s, quantity: s.quantity - 1300, updatedAt: now };
      }
      return s;
    }),
  ];

  // Kiểm tra sau khi xác nhận:
  // - Kho thành phẩm HTX có 1.000 kg HTX sở hữu và 300 kg hộ ký gửi
  const htxHeldStocks = productStocks.filter(
    (s) => canViewProductStock('R04', s, 'anninh', 'u_r04_dung') && s.harvestLotId === lot.id
  );
  assert.equal(htxHeldStocks.length, 2);

  const ownedStock = htxHeldStocks.find((s) => s.ownerType === 'htx')!;
  const consignedStock = htxHeldStocks.find((s) => s.ownerType === 'ho_dan')!;
  assert.ok(ownedStock);
  assert.ok(consignedStock);
  assert.equal(ownedStock.quantity, 1000);
  assert.equal(ownedStock.holderId, 'anninh');
  assert.equal(consignedStock.quantity, 300);
  assert.equal(consignedStock.ownerId, 'u_r06_an');
  assert.equal(consignedStock.holderId, 'anninh');

  // - Tồn tại hộ là 200 kg
  const householdStock = productStocks.find((s) => s.id === 'stock-an-onfarm-1500')!;
  assert.equal(householdStock.quantity, 200);

  // 5. HTX giao bán 200 kg hàng sở hữu và 100 kg hàng ký gửi
  // Đơn 1: HTX bán hàng sở hữu 200 kg (đã giao)
  const orderHtxOwned: SalesOrder = {
    id: 'ord-htx-owned-200',
    code: 'DH-AN-2026-801',
    htxId: 'anninh',
    sellerType: 'htx',
    sellerId: 'anninh',
    sellerName: 'HTX An Ninh',
    customerName: 'Công ty Lương thực Miền Bắc',
    customerPhone: '0912 345 678',
    productName: 'Lúa Bắc Thơm số 7',
    harvestLotId: lot.id,
    stockItemId: ownedStock.id,
    quantity: 200,
    deliveredQuantity: 200,
    deliveryStatus: 'da_giao',
    unit: 'kg',
    pricePerUnit: 18000,
    totalAmount: 3600000,
    status: 'Hoàn thành',
    date: '2026-09-29',
  };

  // Đơn 2: HTX bán hàng ký gửi 100 kg (đã giao)
  const orderHtxConsigned: SalesOrder = {
    id: 'ord-htx-consigned-100',
    code: 'DH-AN-2026-802',
    htxId: 'anninh',
    sellerType: 'htx',
    sellerId: 'anninh',
    sellerName: 'HTX An Ninh',
    customerName: 'Đại lý gạo An Phát',
    customerPhone: '0987 654 321',
    productName: 'Lúa Bắc Thơm số 7 (Ký gửi hộ bác An)',
    harvestLotId: lot.id,
    stockItemId: consignedStock.id,
    sourceHandoverId: slip2.id,
    sourceOwnerId: 'u_r06_an',
    quantity: 100,
    deliveredQuantity: 100,
    deliveryStatus: 'da_giao',
    unit: 'kg',
    pricePerUnit: 18000,
    totalAmount: 1800000,
    status: 'Hoàn thành',
    date: '2026-09-29',
  };

  orders = [orderHtxOwned, orderHtxConsigned];

  // Trừ tồn vật lý sau khi giao bán
  productStocks = productStocks.map((s) => {
    if (s.id === ownedStock.id) return { ...s, quantity: s.quantity - 200, updatedAt: now };
    if (s.id === consignedStock.id) return { ...s, quantity: s.quantity - 100, updatedAt: now };
    return s;
  });

  // Kiểm tra: kho còn 800 kg sở hữu + 200 kg ký gửi
  const updatedOwned = productStocks.find((s) => s.id === ownedStock.id)!;
  const updatedConsigned = productStocks.find((s) => s.id === consignedStock.id)!;
  assert.equal(updatedOwned.quantity, 800);
  assert.equal(updatedConsigned.quantity, 200);

  // 6. Hộ bán trực tiếp 50 kg: tồn tại hộ còn 150 kg; kho HTX không đổi
  const orderFarmerDirect: SalesOrder = {
    id: 'ord-farmer-direct-50',
    code: 'DH-AN-2026-803',
    htxId: 'anninh',
    sellerType: 'ho_dan',
    sellerId: 'u_r06_an',
    sellerName: 'Bác Nguyễn Văn An',
    customerName: 'Khách mua tại thôn',
    customerPhone: '0904 111 222',
    productName: 'Thóc tươi Bắc Thơm số 7',
    harvestLotId: lot.id,
    quantity: 50,
    deliveredQuantity: 50,
    deliveryStatus: 'da_giao',
    unit: 'kg',
    pricePerUnit: 12000,
    totalAmount: 600000,
    status: 'Hoàn thành',
    date: '2026-09-29',
  };

  orders = [orderFarmerDirect, ...orders];

  // Trừ tồn tại hộ 50 kg
  productStocks = productStocks.map((s) => {
    if (s.id === householdStock.id) {
      return { ...s, quantity: s.quantity - 50, updatedAt: now };
    }
    return s;
  });

  // Tồn tại hộ còn 150 kg
  const finalHouseholdStock = productStocks.find((s) => s.id === householdStock.id)!;
  assert.equal(finalHouseholdStock.quantity, 150);

  // Kho HTX không đổi: vẫn 800 kg sở hữu + 200 kg ký gửi
  assert.equal(productStocks.find((s) => s.id === ownedStock.id)!.quantity, 800);
  assert.equal(productStocks.find((s) => s.id === consignedStock.id)!.quantity, 200);

  // 7. Chuyển vai trò, đổi màn hình và tải lại ứng dụng vẫn thấy cùng mã lô, mã phiếu, lượng và trạng thái
  // Kiểm tra tính nhất quán qua Demo Repository storage
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, value); },
  };

  const baseData = createInitialDemoData();
  const snapshot = {
    ...baseData,
    harvests: [lot, ...baseData.harvests],
    handovers: [...handovers, ...baseData.handovers],
    productStocks: [...productStocks, ...baseData.productStocks],
    orders: [...orders, ...baseData.orders],
  };

  saveDemoData(storage, snapshot);
  const reloaded = loadDemoData(storage);

  // Khớp mã lô, mã phiếu, số lượng và trạng thái sau khi nạp lại
  const reloadedLot = reloaded.data.harvests.find((h) => h.id === lot.id)!;
  assert.equal(reloadedLot.code, 'TH-AN-TEST-1500');

  const reloadedSlip1 = reloaded.data.handovers.find((h) => h.id === slip1.id)!;
  assert.equal(reloadedSlip1.code, 'GN-AN-1000');
  assert.equal(reloadedSlip1.receivedQuantity, 1000);
  assert.equal(reloadedSlip1.status, 'da_kiem_nhan');

  const reloadedSlip2 = reloaded.data.handovers.find((h) => h.id === slip2.id)!;
  assert.equal(reloadedSlip2.code, 'GN-AN-300');
  assert.equal(reloadedSlip2.receivedQuantity, 300);
  assert.equal(reloadedSlip2.status, 'da_kiem_nhan');

  const reloadedOwnedStock = reloaded.data.productStocks.find((s) => s.id === ownedStock.id)!;
  assert.equal(reloadedOwnedStock.quantity, 800);
  assert.equal(reloadedOwnedStock.ownerType, 'htx');

  const reloadedConsignedStock = reloaded.data.productStocks.find((s) => s.id === consignedStock.id)!;
  assert.equal(reloadedConsignedStock.quantity, 200);
  assert.equal(reloadedConsignedStock.ownerId, 'u_r06_an');

  const reloadedHouseholdStock = reloaded.data.productStocks.find((s) => s.id === householdStock.id)!;
  assert.equal(reloadedHouseholdStock.quantity, 150);

  // Không phát sinh bản ghi trùng cho lô này
  assert.equal(reloaded.data.handovers.filter((h) => h.harvestLotId === lot.id).length, 2);
  assert.equal(reloaded.data.orders.filter((o) => o.harvestLotId === lot.id).length, 3);
  assert.equal(reloaded.data.productStocks.filter((s) => s.harvestLotId === lot.id).length, 3);
});
