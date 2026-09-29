import test from 'node:test';
import assert from 'node:assert/strict';
import { clearDemoData, createInitialDemoData, loadDemoData, saveDemoData } from '../mock/demoRepository';
import { validateDemoData } from '../mock/validateDemoData';
import { allocationAfterReceipt, getHarvestBalance, stockAfterReceipt, validateHandoverQuantity, validateReceiptQuantity } from '../utils/harvestBalance';
import { ProductHandover } from '../types';
import { HTX_LIST } from '../mock/data';
import { canAccessScreen, canViewHarvestLot } from '../utils/permissions';

test('fixture ba HTX có liên kết, nguồn và tiền hợp lệ', () => {
  assert.deepEqual(validateDemoData(createInitialDemoData()), []);
});

test('R06 thấy các lô của An, R04 thấy toàn HTX; màn phiếu chỉ mở đúng vai trò', () => {
  const data = createInitialDemoData();
  const anLots = data.harvests.filter((lot) => canViewHarvestLot('R06', lot, 'anninh', 'u_r06_an'));
  assert.deepEqual(anLots.map((lot) => lot.code).sort(), ['TH-AN-2026-001', 'TH-AN-2026-001B', 'TH-AN-2026-002', 'TH-AN-2026-003', 'TH-ANNINH-2026-982']);
  assert.equal(data.harvests.filter((lot) => canViewHarvestLot('R04', lot, 'anninh', 'u_r04_dung')).length, 5);
  assert.equal(data.harvests.filter((lot) => canViewHarvestLot('R04', lot, 'dongtao', 'u_r04_dung')).length, 1);
  assert.equal(data.harvests.filter((lot) => canViewHarvestLot('R04', lot, 'anninh', 'u_r04_dung', data.handovers)).length, 2);
  for (const role of ['R02', 'R03', 'R04', 'R06'] as const) assert.equal(canAccessScreen(role, 'handover_detail'), true);
});

test('hộ An giữ chỗ 300 kg ký gửi, kiểm nhận và từ chối không dùng trùng nguồn', () => {
  const data = createInitialDemoData();
  const lot = data.harvests.find((item) => item.code === 'TH-AN-2026-003')!;
  assert.equal(getHarvestBalance(lot, data.handovers, data.orders).availableQuantity, 500);
  const slip: ProductHandover = {
    id: 'gn-test', code: 'GN-AN-TEST', htxId: 'anninh', harvestLotId: lot.id, harvestLotCode: lot.code,
    variety: lot.variety || '', senderId: lot.ownerId!, senderName: lot.ownerName || '', handoverType: 'ky_gui',
    productState: 'hang_tho', declaredQuantity: 300, unit: 'kg', status: 'cho_kiem_nhan', createdAt: '2026-09-29',
  };
  const pending = [slip, ...data.handovers];
  assert.equal(getHarvestBalance(lot, pending, data.orders).availableQuantity, 200);
  assert.ok(validateHandoverQuantity(lot, pending, data.orders, 201, 'kg'));
  assert.ok(validateReceiptQuantity(lot, slip, pending, data.orders, 501));
  assert.equal(validateReceiptQuantity(lot, slip, pending, data.orders, 280), undefined);
  const receivedStock = stockAfterReceipt(slip, HTX_LIST.anninh, 280, 'Đạt', '2026-09-29T10:00:00Z');
  assert.equal(receivedStock.ownerId, 'u_r06_an');
  assert.equal(receivedStock.holderId, 'anninh');
  assert.equal(receivedStock.handoverId, slip.id);
  const receivedLot = { ...lot, allocation: allocationAfterReceipt(lot, pending, data.orders, 280) };
  const confirmed = [{ ...slip, status: 'da_kiem_nhan' as const, receivedQuantity: 280, differenceQuantity: -20 }, ...data.handovers];
  assert.equal(getHarvestBalance(receivedLot, confirmed, data.orders).availableQuantity, 220);
  assert.equal(getHarvestBalance(receivedLot, confirmed, data.orders).receivedQuantity, 1280);
  assert.equal(getHarvestBalance(lot, data.handovers, data.orders).receivedQuantity, 1000);
  assert.equal(getHarvestBalance(lot, [{ ...slip, status: 'tu_choi' }, ...data.handovers], data.orders).availableQuantity, 500);
});

test('mua đứt chuyển chủ sang HTX; ký gửi không sinh tiền mua đứt', () => {
  const data = createInitialDemoData();
  const purchase = data.handovers.find((item) => item.id === 'gn-03')!;
  const consignment = data.handovers.find((item) => item.id === 'gn-02')!;
  assert.equal(stockAfterReceipt(purchase, HTX_LIST.anninh, 1000, 'Đạt', '2026-09-29').ownerId, 'anninh');
  assert.equal(stockAfterReceipt(consignment, HTX_LIST.quyetthang, 150, 'Đạt', '2026-09-29').ownerId, 'u_r06_mai');
  assert.equal(consignment.totalAmount, undefined);
  const sale = data.orders.find((item) => item.id === 'ord-qt-02')!;
  assert.equal(sale.sourceHandoverId, consignment.id);
  assert.equal(sale.sourceOwnerId, consignment.senderId);
});

test('repository di trú key cũ và lưu một snapshot có phiên bản', () => {
  const data = createInitialDemoData();
  const memory = new Map<string, string>([
    ['hungyen_harvests', JSON.stringify([{ ...data.harvests[0], ownerId: 'mem-01' }, ...data.harvests.slice(1)])],
    ['hungyen_farm_zones', JSON.stringify([{ ...data.farmZones[0], ownerId: 'mem-01' }, ...data.farmZones.slice(1)])],
    ['hungyen_diaries', JSON.stringify([{ ...data.diaries[0], subjectOwnerId: 'mem-01' }, ...data.diaries.slice(1)])],
  ]);
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } };
  const loaded = loadDemoData(storage);
  assert.equal(loaded.data.harvests[0].ownerId, 'u_r06_an');
  assert.equal(loaded.data.farmZones[0].ownerId, 'u_r06_an');
  assert.equal(loaded.data.diaries[0].subjectOwnerId, 'u_r06_an');
  saveDemoData(storage, loaded.data);
  assert.equal(loadDemoData(storage).data.harvests[0].ownerId, 'u_r06_an');
  assert.equal(JSON.parse(memory.get('hungyen_demo_data_v1')!).schemaVersion, 1);
  clearDemoData({ removeItem: (key: string) => { memory.delete(key); } });
  assert.equal(memory.has('hungyen_demo_data_v1'), false);
  assert.equal(memory.has('hungyen_harvests'), false);
  assert.deepEqual(validateDemoData(loadDemoData(storage).data), []);
});

test('di trú lần sơ chế chỉ được lưu trong lô thành cùng sự kiện và tồn sau sơ chế', () => {
  const data = createInitialDemoData();
  const lot = data.harvests.find((item) => item.id === 'h-05')!;
  const event = { id: 'proc-user', date: '2026-09-29', method: 'Sấy thóc', inputQuantity: 450, outputQuantity: 420,
    unit: 'kg', lossQuantity: 30, lossRatePercent: 6.67, recoveryRatePercent: 93.33 };
  const memory = new Map<string, string>([['hungyen_harvests', JSON.stringify(data.harvests.map((item) => item.id === lot.id ? { ...item, processingStatus: 'da_so_che', processingInfo: event, processingHistory: [event] } : item))]]);
  const loaded = loadDemoData({ getItem: (key) => memory.get(key) ?? null });
  assert.equal(loaded.data.processingLots.filter((item) => item.harvestLotId === lot.id && item.inputQuantity === 450).length, 1);
  assert.equal(loaded.data.productStocks.find((item) => item.id === 'stock-htx-an-05')?.quantity, 550);
  assert.equal(loaded.data.productStocks.find((item) => item.id === 'stock-legacy-h-05-0')?.quantity, 420);
  assert.ok(loaded.notice);
});
