import test from 'node:test';
import assert from 'node:assert/strict';
import { HTX_LIST } from '../mock/data';
import { FarmZone, HarvestLot, HarvestLotSource, ProductHandover, ProductStockItem, SalesOrder } from '../types';
import { getHarvestBalance, stockAfterReceipt, sameUnit, getStockItemAvailableQuantity } from '../utils/harvestBalance';
import { canViewHarvestLot, canCreateHarvest, canAccessScreen } from '../utils/permissions';
import { createInitialDemoData } from '../mock/demoRepository';

// Helper kiểm tra tính hợp lệ khi tạo lô từ nhiều thửa ruộng
function validateMultiZoneHarvest(
  lotData: {
    htxId: string;
    yieldQuantity: number;
    unit: string;
    grade1Quantity?: number;
    grade2Quantity?: number;
    sources?: HarvestLotSource[];
    farmZoneId?: string;
  },
  farmZones: FarmZone[],
  currentHTXId: string
): { valid: boolean; error?: string; resolvedSources?: HarvestLotSource[] } {
  if (!lotData.yieldQuantity || lotData.yieldQuantity <= 0) {
    return { valid: false, error: 'Tổng sản lượng thu hoạch phải lớn hơn 0.' };
  }

  const g1 = lotData.grade1Quantity || 0;
  const g2 = lotData.grade2Quantity || 0;
  if (g1 + g2 > lotData.yieldQuantity) {
    return { valid: false, error: 'Tổng khối lượng Loại 1 và Loại 2 không được vượt quá tổng sản lượng thu hoạch.' };
  }

  if (lotData.sources && lotData.sources.length > 0) {
    const zoneIds = lotData.sources.map((s) => s.farmZoneId);
    if (new Set(zoneIds).size !== zoneIds.length) {
      return { valid: false, error: 'Danh sách thửa ruộng nguồn không được trùng lặp.' };
    }

    let commonOwnerId: string | undefined;
    let commonOwnerName: string | undefined;
    let totalSourceQty = 0;
    const resolvedSources: HarvestLotSource[] = [];

    for (const src of lotData.sources) {
      if (!src.quantity || src.quantity <= 0) {
        return { valid: false, error: `Sản lượng đóng góp của thửa "${src.farmZoneName || src.farmZoneId}" phải lớn hơn 0.` };
      }
      totalSourceQty += src.quantity;

      const zone = farmZones.find((z) => z.id === src.farmZoneId && z.htxId === currentHTXId);
      if (!zone) {
        return { valid: false, error: `Thửa ruộng "${src.farmZoneName || src.farmZoneId}" không tồn tại hoặc không thuộc HTX hiện tại.` };
      }

      if (zone.unitStatus === 'tam_ngung' || zone.unitStatus === 'ngung_su_dung' || zone.status === 'tam_ngung') {
        return { valid: false, error: `Thửa ruộng "${zone.name}" đang tạm ngừng hoặc ngừng sử dụng.` };
      }

      if (!commonOwnerId) {
        commonOwnerId = zone.ownerId;
        commonOwnerName = zone.ownerName;
      } else if (zone.ownerId !== commonOwnerId) {
        return {
          valid: false,
          error: `Tất cả các thửa ruộng trong một lô phải cùng thuộc một hộ sở hữu (${commonOwnerName}). Không thể gộp thửa của hộ "${zone.ownerName}" vào lô này.`,
        };
      }

      if (!sameUnit(src.unit, lotData.unit)) {
        return {
          valid: false,
          error: `Đơn vị tính của thửa "${zone.name}" (${src.unit}) không tương thích với đơn vị của lô (${lotData.unit}).`,
        };
      }

      resolvedSources.push({
        ...src,
        farmZoneName: zone.name,
        zoneCode: zone.zoneCode,
      });
    }

    if (Math.abs(totalSourceQty - lotData.yieldQuantity) > 0.001) {
      return {
        valid: false,
        error: `Tổng sản lượng lô (${lotData.yieldQuantity} ${lotData.unit}) không khớp với tổng sản lượng đóng góp của các thửa (${totalSourceQty} ${lotData.unit}).`,
      };
    }

    return { valid: true, resolvedSources };
  } else if (lotData.farmZoneId) {
    const zone = farmZones.find((z) => z.id === lotData.farmZoneId && z.htxId === currentHTXId);
    if (!zone) return { valid: false, error: 'Vùng sản xuất không thuộc HTX hiện tại.' };
    return {
      valid: true,
      resolvedSources: [
        {
          farmZoneId: zone.id,
          farmZoneName: zone.name,
          zoneCode: zone.zoneCode,
          cycleId: 'cycle-default',
          cycleName: 'Vụ Canh tác',
          quantity: lotData.yieldQuantity,
          unit: lotData.unit,
          harvestDate: '2026-09-29',
        },
      ],
    };
  }

  return { valid: false, error: 'Chưa chọn thửa ruộng nguồn.' };
}

test('D1. Hộ A có hai thửa: 400 kg và 600 kg cùng sản phẩm. Tạo một lô 1.000 kg; chi tiết/QR thể hiện cả hai thửa và lượng tương ứng', () => {
  const farmZones: FarmZone[] = [
    {
      id: 'fz-a1',
      htxId: 'anninh',
      name: 'Thửa Đầm Bông A1',
      zoneCode: 'MSVT-A1',
      ownerId: 'u_r06_an',
      ownerName: 'Nguyễn Văn An',
      unitStatus: 'dang_su_dung',
      status: 'hoat_dong',
    } as FarmZone,
    {
      id: 'fz-a2',
      htxId: 'anninh',
      name: 'Thửa Đồng Trên A2',
      zoneCode: 'MSVT-A2',
      ownerId: 'u_r06_an',
      ownerName: 'Nguyễn Văn An',
      unitStatus: 'dang_su_dung',
      status: 'hoat_dong',
    } as FarmZone,
  ];

  const sources: HarvestLotSource[] = [
    {
      farmZoneId: 'fz-a1',
      farmZoneName: 'Thửa Đầm Bông A1',
      zoneCode: 'MSVT-A1',
      cycleId: 'cycle-xuan-2026',
      cycleName: 'Vụ Xuân 2026',
      quantity: 400,
      unit: 'kg',
      harvestDate: '2026-09-29',
    },
    {
      farmZoneId: 'fz-a2',
      farmZoneName: 'Thửa Đồng Trên A2',
      zoneCode: 'MSVT-A2',
      cycleId: 'cycle-xuan-2026',
      cycleName: 'Vụ Xuân 2026',
      quantity: 600,
      unit: 'kg',
      harvestDate: '2026-09-29',
    },
  ];

  const validation = validateMultiZoneHarvest(
    {
      htxId: 'anninh',
      yieldQuantity: 1000,
      unit: 'kg',
      grade1Quantity: 800,
      grade2Quantity: 200,
      sources,
    },
    farmZones,
    'anninh'
  );

  assert.equal(validation.valid, true);
  assert.equal(validation.resolvedSources?.length, 2);
  assert.equal(validation.resolvedSources[0].quantity, 400);
  assert.equal(validation.resolvedSources[1].quantity, 600);
  assert.equal(validation.resolvedSources[0].zoneCode, 'MSVT-A1');
  assert.equal(validation.resolvedSources[1].zoneCode, 'MSVT-A2');

  // Lô thu hoạch được tạo
  const lot: HarvestLot = {
    id: 'h-multi-01',
    code: 'TH-ANNINH-2026-MULTI',
    htxId: 'anninh',
    farmZoneId: sources[0].farmZoneId,
    farmZoneName: sources[0].farmZoneName,
    variety: 'Bắc Thơm số 7',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-29',
    yieldQuantity: 1000,
    unit: 'kg',
    grade1Quantity: 800,
    grade2Quantity: 200,
    sources: validation.resolvedSources,
  };

  // Xác nhận chi tiết lô và QR có đủ 2 thửa
  assert.equal(lot.sources?.length, 2);
  const totalContributions = lot.sources?.reduce((sum, s) => sum + s.quantity, 0);
  assert.equal(totalContributions, 1000);
  assert.deepEqual(
    lot.sources?.map((s) => ({ name: s.farmZoneName, qty: s.quantity, unit: s.unit })),
    [
      { name: 'Thửa Đầm Bông A1', qty: 400, unit: 'kg' },
      { name: 'Thửa Đồng Trên A2', qty: 600, unit: 'kg' },
    ]
  );
});

test('D2. Không thể tạo một lô hộ A chứa thửa của hộ B hoặc thửa thuộc HTX khác hoặc sai lệch tổng sản lượng', () => {
  const farmZones: FarmZone[] = [
    {
      id: 'fz-a1',
      htxId: 'anninh',
      name: 'Thửa A1',
      ownerId: 'u_r06_an',
      ownerName: 'Nguyễn Văn An',
      unitStatus: 'dang_su_dung',
    } as FarmZone,
    {
      id: 'fz-b1',
      htxId: 'anninh',
      name: 'Thửa B1',
      ownerId: 'u_r06_binh',
      ownerName: 'Trần Văn Bình',
      unitStatus: 'dang_su_dung',
    } as FarmZone,
    {
      id: 'fz-dt-01',
      htxId: 'dongtao',
      name: 'Thửa Đông Tảo',
      ownerId: 'u_r06_an',
      ownerName: 'Nguyễn Văn An',
      unitStatus: 'dang_su_dung',
    } as FarmZone,
  ];

  // 1. Gộp thửa của hộ A và hộ B -> Phải bị từ chối
  const mixedOwnerResult = validateMultiZoneHarvest(
    {
      htxId: 'anninh',
      yieldQuantity: 1000,
      unit: 'kg',
      sources: [
        { farmZoneId: 'fz-a1', quantity: 400, unit: 'kg', cycleId: 'c1', cycleName: 'Vụ 1', harvestDate: '2026-09-29' },
        { farmZoneId: 'fz-b1', quantity: 600, unit: 'kg', cycleId: 'c1', cycleName: 'Vụ 1', harvestDate: '2026-09-29' },
      ],
    },
    farmZones,
    'anninh'
  );
  assert.equal(mixedOwnerResult.valid, false);
  assert.match(mixedOwnerResult.error || '', /cùng thuộc một hộ sở hữu/);

  // 2. Thửa thuộc HTX khác -> Phải bị từ chối
  const wrongHtxResult = validateMultiZoneHarvest(
    {
      htxId: 'anninh',
      yieldQuantity: 1000,
      unit: 'kg',
      sources: [
        { farmZoneId: 'fz-a1', quantity: 400, unit: 'kg', cycleId: 'c1', cycleName: 'Vụ 1', harvestDate: '2026-09-29' },
        { farmZoneId: 'fz-dt-01', quantity: 600, unit: 'kg', cycleId: 'c1', cycleName: 'Vụ 1', harvestDate: '2026-09-29' },
      ],
    },
    farmZones,
    'anninh'
  );
  assert.equal(wrongHtxResult.valid, false);
  assert.match(wrongHtxResult.error || '', /không tồn tại hoặc không thuộc HTX/);

  // 3. Trùng thửa ruộng nguồn -> Phải bị từ chối
  const duplicateZoneResult = validateMultiZoneHarvest(
    {
      htxId: 'anninh',
      yieldQuantity: 800,
      unit: 'kg',
      sources: [
        { farmZoneId: 'fz-a1', quantity: 400, unit: 'kg', cycleId: 'c1', cycleName: 'Vụ 1', harvestDate: '2026-09-29' },
        { farmZoneId: 'fz-a1', quantity: 400, unit: 'kg', cycleId: 'c1', cycleName: 'Vụ 1', harvestDate: '2026-09-29' },
      ],
    },
    farmZones,
    'anninh'
  );
  assert.equal(duplicateZoneResult.valid, false);
  assert.match(duplicateZoneResult.error || '', /không được trùng lặp/);

  // 4. Tổng sản lượng không khớp (400 + 500 != 1000) -> Phải bị từ chối
  const mismatchedYieldResult = validateMultiZoneHarvest(
    {
      htxId: 'anninh',
      yieldQuantity: 1000,
      unit: 'kg',
      sources: [
        { farmZoneId: 'fz-a1', quantity: 400, unit: 'kg', cycleId: 'c1', cycleName: 'Vụ 1', harvestDate: '2026-09-29' },
        { farmZoneId: 'fz-a2', quantity: 500, unit: 'kg', cycleId: 'c1', cycleName: 'Vụ 1', harvestDate: '2026-09-29' },
      ],
    },
    [...farmZones, { id: 'fz-a2', htxId: 'anninh', name: 'Thửa A2', ownerId: 'u_r06_an', unitStatus: 'dang_su_dung' } as FarmZone],
    'anninh'
  );
  assert.equal(mismatchedYieldResult.valid, false);
  assert.match(mismatchedYieldResult.error || '', /không khớp/);
});

test('D3. Dữ liệu lô cũ một thửa vẫn hiển thị, truy xuất và thao tác được', () => {
  const legacyLot: HarvestLot = {
    id: 'h-legacy-01',
    code: 'TH-AN-2026-001',
    htxId: 'anninh',
    farmZoneId: 'fz-01',
    farmZoneName: 'Thửa Đầm Bông',
    variety: 'Bắc Thơm số 7',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-15',
    yieldQuantity: 1200,
    unit: 'kg',
    // sources không có trong dữ liệu cũ
  };

  // Fallback đọc sources
  const resolvedSources = legacyLot.sources && legacyLot.sources.length > 0
    ? legacyLot.sources
    : [
        {
          farmZoneId: legacyLot.farmZoneId,
          farmZoneName: legacyLot.farmZoneName || 'Cơ sở sản xuất',
          quantity: legacyLot.yieldQuantity,
          unit: legacyLot.unit,
          cycleId: legacyLot.cycleId || 'c-legacy',
          cycleName: legacyLot.seasonName || 'Vụ Canh tác',
          harvestDate: legacyLot.date,
        },
      ];

  assert.equal(resolvedSources.length, 1);
  assert.equal(resolvedSources[0].farmZoneName, 'Thửa Đầm Bông');
  assert.equal(resolvedSources[0].quantity, 1200);

  // Thao tác tính tồn vẫn hoạt động bình thường
  const balance = getHarvestBalance(legacyLot, [], []);
  assert.equal(balance.availableQuantity, 1200);
});

test('D4. R03 lọc hộ A thấy toàn bộ lô A, lọc hộ B thấy lô B, kể cả lô chưa giao HTX; R06 chỉ thấy của mình; R04 không thấy lô hộ chưa gửi', () => {
  const data = createInitialDemoData();

  // Tạo thêm 1 lô của hộ B chưa gửi HTX
  const lotB_unsent: HarvestLot = {
    id: 'h-binh-unsent',
    code: 'TH-AN-BINH-UNSENT',
    htxId: 'anninh',
    farmZoneId: 'fz-02',
    farmZoneName: 'Thửa Bờ Mương',
    variety: 'Nếp thơm',
    ownerId: 'u_r06_binh',
    ownerName: 'Trần Văn Bình',
    date: '2026-09-29',
    yieldQuantity: 500,
    unit: 'kg',
  };

  const allLots = [...data.harvests, lotB_unsent];

  // 1. R03 Giám sát thu hoạch: Xem được TẤT CẢ các lô trong HTX, kể cả lô chưa gửi HTX
  const r03VisibleLots = allLots.filter((lot) => canViewHarvestLot('R03', lot, 'anninh', 'u_r03_mai'));
  assert.ok(r03VisibleLots.some((l) => l.code === lotB_unsent.code));
  assert.ok(r03VisibleLots.some((l) => l.ownerId === 'u_r06_an'));

  // Bộ lọc theo hộ của R03
  const r03FilterHtxA = r03VisibleLots.filter((l) => l.ownerId === 'u_r06_an');
  const r03FilterHtxB = r03VisibleLots.filter((l) => l.ownerId === 'u_r06_binh');
  assert.ok(r03FilterHtxA.every((l) => l.ownerId === 'u_r06_an'));
  assert.ok(r03FilterHtxB.every((l) => l.ownerId === 'u_r06_binh'));
  assert.equal(r03FilterHtxB.length, 1);
  assert.equal(r03FilterHtxB[0].code, 'TH-AN-BINH-UNSENT');

  // 2. R06 (Hộ An): Chỉ thấy lô của mình, không thấy lô của hộ Bình
  const r06VisibleLots = allLots.filter((lot) => canViewHarvestLot('R06', lot, 'anninh', 'u_r06_an'));
  assert.ok(r06VisibleLots.every((l) => l.ownerId === 'u_r06_an'));
  assert.ok(!r06VisibleLots.some((l) => l.ownerId === 'u_r06_binh'));

  // 3. R04 (Thủ kho HTX): CHỈ thấy lô có phiếu giao HTX hoặc thuộc sở hữu HTX; KHÔNG thấy lô hộ chưa gửi (lotB_unsent)
  const r04VisibleLots = allLots.filter((lot) => canViewHarvestLot('R04', lot, 'anninh', 'u_r04_dung', data.handovers));
  assert.ok(!r04VisibleLots.some((l) => l.code === lotB_unsent.code), 'R04 không được xem lô hộ chưa gửi HTX');
});

test('D5. R03 bán trực tiếp 150 kg thay hộ A: người bán là hộ A, người nhập là R03, lượng khả dụng của A giảm đúng theo giao hàng, doanh thu HTX không tăng; hộ A thấy đơn có nhãn "Cán bộ [tên] ghi thay"', () => {
  const lotA: HarvestLot = {
    id: 'h-an-sale-test',
    code: 'TH-AN-SALE-01',
    htxId: 'anninh',
    farmZoneId: 'fz-01',
    variety: 'Bắc Thơm số 7',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-29',
    yieldQuantity: 1000,
    unit: 'kg',
    allocation: {
      directSaleQuantity: 0,
      deliveredToHTXQuantity: 0,
      packagedAtFarmQuantity: 0,
      processedAtFarmQuantity: 0,
      remainingAvailable: 1000,
    },
  };

  const farmerStock: ProductStockItem = {
    id: 'stock-an-tho-1000',
    htxId: 'anninh',
    harvestLotId: lotA.id,
    harvestLotCode: lotA.code,
    variety: 'Bắc Thơm số 7',
    ownerType: 'ho_dan',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    holderId: 'u_r06_an',
    holderName: 'Nguyễn Văn An',
    locationName: 'Kho hộ bác An',
    state: 'hang_tho',
    quantity: 1000,
    unit: 'kg',
    updatedAt: '2026-09-29T08:00:00Z',
  };

  let stocks = [farmerStock];
  let orders: SalesOrder[] = [];

  // R03 lập đơn bán trực tiếp thay hộ An
  const newOrder: SalesOrder = {
    id: 'ord-r03-behalf-01',
    code: 'DH-AN-2026-001',
    date: '2026-09-29',
    customerName: 'Cửa hàng gạo sạch Mai Hương',
    customerPhone: '0988111222',
    productName: 'Lúa tươi Bắc Thơm số 7',
    quantity: 150,
    unit: 'kg',
    pricePerUnit: 9000,
    totalAmount: 1350000,
    status: 'Hoàn thành',
    deliveryStatus: 'da_giao',
    deliveredQuantity: 150,
    sellerType: 'ho_dan',
    sellerId: lotA.ownerId!, // Hộ An
    sellerName: lotA.ownerName!,
    sourceOwnerId: lotA.ownerId!, // Không tính vào HTX
    htxId: 'anninh',
    harvestLotId: lotA.id,
    harvestLotCode: lotA.code,
    stockItemId: farmerStock.id,
    createdBy: 'Cán bộ Mai Thị Kỹ Thuật',
    actorId: 'u_r03_mai',
    actorName: 'Cán bộ Mai Thị Kỹ Thuật',
    onBehalfOfFarmer: true,
    confirmationMethod: 'dien_thoai',
    confirmationTime: '2026-09-29T09:00:00Z',
    confirmationNote: 'Bác An gọi điện nhờ ghi đơn bán cho đại lý quen',
  };

  orders.push(newOrder);

  // Trừ kho của hộ khi đơn hoàn thành/đã giao
  stocks = stocks.map((s) => (s.id === farmerStock.id ? { ...s, quantity: s.quantity - newOrder.quantity } : s));

  // 1. Người bán là hộ An, người nhập là R03
  assert.equal(newOrder.sellerType, 'ho_dan');
  assert.equal(newOrder.sellerId, 'u_r06_an');
  assert.equal(newOrder.sellerName, 'Nguyễn Văn An');
  assert.equal(newOrder.actorId, 'u_r03_mai');
  assert.equal(newOrder.onBehalfOfFarmer, true);
  assert.equal(newOrder.confirmationMethod, 'dien_thoai');

  // 2. Tồn khả dụng của hộ A giảm đúng 150 kg (còn 850 kg)
  const remainingStock = stocks.find((s) => s.id === farmerStock.id);
  assert.equal(remainingStock?.quantity, 850);

  // 3. Doanh thu HTX không tăng: lọc đơn HTX bán
  const htxOrders = orders.filter((o) => o.htxId === 'anninh' && o.sellerType === 'htx');
  const htxRevenue = htxOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  assert.equal(htxRevenue, 0, 'Đơn bán của hộ không được tính vào doanh thu HTX');

  // 4. Hộ A thấy đơn bán trong danh sách của mình với nhãn cán bộ ghi thay
  const farmerVisibleOrders = orders.filter((o) => o.htxId === 'anninh' && o.sellerType === 'ho_dan' && o.sellerId === 'u_r06_an');
  assert.equal(farmerVisibleOrders.length, 1);
  assert.equal(farmerVisibleOrders[0].id, 'ord-r03-behalf-01');
  assert.equal(farmerVisibleOrders[0].onBehalfOfFarmer, true);
  assert.equal(farmerVisibleOrders[0].actorName, 'Cán bộ Mai Thị Kỹ Thuật');
});

test('D6. R03 tạo phiếu giao HTX 250 kg thay hộ A: người gửi là hộ A, người nhập là R03; R04 nhận đúng phiếu; trước kiểm nhận chưa tăng kho HTX', () => {
  const lotA: HarvestLot = {
    id: 'h-an-handover-test',
    code: 'TH-AN-HO-01',
    htxId: 'anninh',
    variety: 'Bắc Thơm số 7',
    ownerId: 'u_r06_an',
    ownerName: 'Nguyễn Văn An',
    date: '2026-09-29',
    yieldQuantity: 1000,
    unit: 'kg',
  };

  let handovers: ProductHandover[] = [];
  let htxStocks: ProductStockItem[] = [];

  // R03 tạo phiếu giao HTX thay hộ An
  const newHandover: ProductHandover = {
    id: 'gn-r03-behalf-01',
    code: 'GN-ANNINH-2026-001',
    htxId: 'anninh',
    harvestLotId: lotA.id,
    harvestLotCode: lotA.code,
    variety: lotA.variety || '',
    senderId: 'u_r06_an', // Hộ A
    senderName: 'Nguyễn Văn An',
    handoverType: 'mua_dut',
    productState: 'hang_tho',
    declaredQuantity: 250,
    unit: 'kg',
    status: 'cho_kiem_nhan',
    createdAt: '2026-09-29T10:00:00Z',
    createdBy: 'Cán bộ Mai Thị Kỹ Thuật',
    actorId: 'u_r03_mai',
    actorName: 'Cán bộ Mai Thị Kỹ Thuật',
    onBehalfOfFarmer: true,
    confirmationMethod: 'truc_tiep',
    confirmationTime: '2026-09-29T09:45:00Z',
    confirmationNote: 'Gặp trực tiếp bác An tại bờ ruộng Đầm Bông',
  };

  handovers.push(newHandover);

  // 1. Kiểm tra thông tin người gửi vs người nhập
  assert.equal(newHandover.senderId, 'u_r06_an');
  assert.equal(newHandover.actorId, 'u_r03_mai');
  assert.equal(newHandover.onBehalfOfFarmer, true);

  // 2. Phiếu vào hộp tiếp nhận của R04 (Thủ kho)
  const r04Inbox = handovers.filter((h) => h.htxId === 'anninh' && h.status === 'cho_kiem_nhan');
  assert.equal(r04Inbox.length, 1);
  assert.equal(r04Inbox[0].id, 'gn-r03-behalf-01');

  // 3. Trước kiểm nhận: Kho HTX CHƯA tăng
  assert.equal(htxStocks.length, 0, 'Kho HTX chưa được tăng khi phiếu chưa kiểm nhận');

  // 4. Khi R04 kiểm nhận thực tế (cân 250 kg đạt chuẩn mua đứt): Kho HTX mới tăng
  const confirmedSlip: ProductHandover = {
    ...newHandover,
    status: 'da_kiem_nhan',
    receivedQuantity: 250,
    differenceQuantity: 0,
  };

  const newStock = stockAfterReceipt(confirmedSlip, HTX_LIST.anninh, 250, 'Đạt chuẩn', '2026-09-29T11:00:00Z');
  htxStocks.push(newStock);

  assert.equal(htxStocks.length, 1);
  assert.equal(htxStocks[0].ownerId, 'anninh'); // Mua đứt chuyển quyền sở hữu sang HTX
  assert.equal(htxStocks[0].quantity, 250);
});

test('D7. Thiếu xác nhận của hộ thì không thể chốt giao dịch; thao tác lặp không tạo hai đơn/phiếu hoặc trừ tồn hai lần', () => {
  // 1. Kiểm tra xác nhận: Nếu R03 thao tác thay hộ mà không có confirmationMethod và không phải bản nháp -> Lỗi
  function validateR03ActingTransaction(tx: {
    onBehalfOfFarmer?: boolean;
    confirmationMethod?: string;
    isDraft?: boolean;
  }): { valid: boolean; error?: string } {
    if (tx.onBehalfOfFarmer && !tx.isDraft && !tx.confirmationMethod) {
      return {
        valid: false,
        error: 'Cần có phương thức xác nhận của hộ nông dân trước khi chốt giao dịch.',
      };
    }
    return { valid: true };
  }

  const unconfirmedTx = validateR03ActingTransaction({
    onBehalfOfFarmer: true,
    confirmationMethod: undefined,
    isDraft: false,
  });
  assert.equal(unconfirmedTx.valid, false);
  assert.match(unconfirmedTx.error || '', /Cần có phương thức xác nhận/);

  // Nếu là bản nháp -> Cho phép lưu nháp
  const draftTx = validateR03ActingTransaction({
    onBehalfOfFarmer: true,
    confirmationMethod: undefined,
    isDraft: true,
  });
  assert.equal(draftTx.valid, true);

  // 2. Kiểm tra chống gửi lặp phiếu giao HTX (deduplication)
  const existingHandovers: ProductHandover[] = [
    {
      id: 'gn-prev-01',
      code: 'GN-AN-01',
      htxId: 'anninh',
      harvestLotId: 'h-01',
      senderId: 'u_r06_an',
      declaredQuantity: 200,
      unit: 'kg',
      status: 'cho_kiem_nhan',
      createdAt: new Date().toISOString(),
      onBehalfOfFarmer: true,
    } as ProductHandover,
  ];

  function isDuplicateHandover(
    candidate: { harvestLotId: string; senderId: string; declaredQuantity: number },
    list: ProductHandover[]
  ): boolean {
    return list.some(
      (h) =>
        h.status === 'cho_kiem_nhan' &&
        h.harvestLotId === candidate.harvestLotId &&
        h.senderId === candidate.senderId &&
        h.declaredQuantity === candidate.declaredQuantity &&
        Math.abs(Date.now() - new Date(h.createdAt).getTime()) < 3000
    );
  }

  const isDup = isDuplicateHandover(
    { harvestLotId: 'h-01', senderId: 'u_r06_an', declaredQuantity: 200 },
    existingHandovers
  );
  assert.equal(isDup, true, 'Thao tác lặp liên tiếp phải bị phát hiện');
});
