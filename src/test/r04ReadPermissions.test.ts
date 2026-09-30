import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  canAccessScreen,
  canConfirmHandover,
  canOpenHarvestCreateScreen,
  canViewHarvestLot,
  canViewPackagedProduct,
} from '../utils/permissions';
import { INITIAL_HARVESTS, INITIAL_PACKAGES, INITIAL_PRODUCT_STOCKS } from '../mock/data';
import { createInitialDemoData, loadDemoData, saveDemoData } from '../mock/demoRepository';

describe('R04 xem nguồn cung và lô đóng gói', () => {
  it('mở được danh sách, chi tiết và QR nhưng không mở được màn tạo', () => {
    for (const screen of ['harvest_list', 'harvest_detail', 'packaging_list', 'packaging_qr']) {
      assert.equal(canAccessScreen('R04', screen), true, screen);
    }
    for (const screen of ['harvest_add', 'packaging_add', 'processing_add']) {
      assert.equal(canAccessScreen('R04', screen), false, screen);
    }
    assert.equal(canOpenHarvestCreateScreen('R04'), false);
    assert.equal(canAccessScreen('R04', 'sales_add'), true);
    assert.equal(canAccessScreen('R04', 'inventory_tx'), true);
    assert.equal(canConfirmHandover('R04'), true);
  });

  it('chỉ xem bản ghi thuộc HTX hiện tại', () => {
    const lot = INITIAL_HARVESTS[0];
    const pkg = INITIAL_PACKAGES[0];
    assert.ok(lot);
    assert.ok(pkg);
    const otherHtx = lot.htxId === 'anninh' ? 'dongtao' : 'anninh';

    assert.equal(canViewHarvestLot('R04', lot, lot.htxId, 'r04-user'), true);
    assert.equal(canViewHarvestLot('R04', lot, otherHtx, 'r04-user'), false);
    assert.equal(canViewPackagedProduct('R04', pkg, pkg.htxId, 'r04-user'), true);
    assert.equal(canViewPackagedProduct('R04', pkg, pkg.htxId === 'anninh' ? 'dongtao' : 'anninh', 'r04-user'), false);
  });

  it('chỉ xem lô đóng gói HTX sở hữu hoặc đang giữ, gồm hàng ký gửi', () => {
    const byId = (id: string) => INITIAL_PACKAGES.find((pkg) => pkg.id === id)!;
    assert.equal(canViewPackagedProduct('R04', byId('pkg-01'), 'anninh', 'r04-user'), true); // HTX thu mua
    assert.equal(canViewPackagedProduct('R04', byId('pkg-02'), 'anninh', 'r04-user'), false); // Tại hộ
    assert.equal(canViewPackagedProduct('R04', byId('pkg-03'), 'dongtao', 'r04-user'), false); // Tại hộ
    assert.equal(canViewPackagedProduct('R04', byId('pkg-04'), 'quyetthang', 'r04-user'), true); // HTX thu mua
    assert.equal(canViewPackagedProduct('R04', byId('pkg-qt-thung-15'), 'quyetthang', 'r04-user'), true); // Ký gửi
    assert.equal(canViewPackagedProduct('R04', byId('pkg-qt-ca-live'), 'quyetthang', 'r04-user'), false); // Tại hộ

    const htxSelfProduced = { ...byId('pkg-01'), id: 'pkg-htx-self', holderId: undefined };
    assert.equal(canViewPackagedProduct('R04', htxSelfProduced, 'anninh', 'r04-user'), true);
    const htxOwnedAtHousehold = { ...byId('pkg-01'), id: 'pkg-away', holderId: 'u_r06_an' };
    assert.equal(canViewPackagedProduct('R04', htxOwnedAtHousehold, 'anninh', 'r04-user'), false);

    const receivedPackage = byId('pkg-02');
    const receivedStock = {
      ...INITIAL_PRODUCT_STOCKS[0], id: 'stock-received-package',
      packageId: receivedPackage.id, packageCode: receivedPackage.code,
      ownerType: 'ho_dan' as const, ownerId: 'u_r06_an', holderId: 'anninh', quantity: 20,
    };
    assert.equal(canViewPackagedProduct('R04', receivedPackage, 'anninh', 'r04-user', undefined, [receivedStock]), true);
  });

  it('khôi phục thông tin sở hữu của lô demo đã lưu từ phiên cũ', () => {
    const data = createInitialDemoData();
    data.packages = data.packages.map(({ ownerType, ownerId, ownerName, holderId, holderName, ...pkg }) => pkg);
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    };
    saveDemoData(storage, data);
    const restored = loadDemoData(storage).data.packages;
    assert.equal(canViewPackagedProduct('R04', restored.find((pkg) => pkg.id === 'pkg-qt-thung-15')!, 'quyetthang', 'r04-user'), true);
    assert.equal(canViewPackagedProduct('R04', restored.find((pkg) => pkg.id === 'pkg-02')!, 'anninh', 'r04-user'), false);
  });

  it('giữ quyền cũ của R02, R03, R06 và phạm vi hộ', () => {
    for (const role of ['R02', 'R03', 'R06'] as const) {
      for (const screen of ['harvest_list', 'harvest_detail', 'harvest_add', 'packaging_list', 'packaging_qr', 'packaging_add']) {
        assert.equal(canAccessScreen(role, screen), true, `${role}: ${screen}`);
      }
    }
    const lot = INITIAL_HARVESTS.find((item) => !!item.ownerId);
    assert.ok(lot);
    assert.equal(canViewHarvestLot('R06', lot, lot.htxId, lot.ownerId!), true);
    assert.equal(canViewHarvestLot('R06', lot, lot.htxId, 'another-household'), false);
    const pkg = INITIAL_PACKAGES.find((item) => item.harvestLotId === lot.id);
    if (pkg) {
      assert.equal(canViewPackagedProduct('R06', pkg, pkg.htxId, lot.ownerId!, lot), true);
      assert.equal(canViewPackagedProduct('R06', pkg, pkg.htxId, 'another-household', lot), false);
    }
  });
});
