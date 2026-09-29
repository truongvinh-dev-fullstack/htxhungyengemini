import { DemoData } from './demoRepository';
import { getHarvestBalance, sameUnit } from '../utils/harvestBalance';
import { DEMO_USERS } from './data';
import { matchSeasonForZone } from '../utils/seasonMatcher';

export function validateDemoData(data: DemoData): string[] {
  const errors: string[] = [];
  const zoneById = new Map(data.farmZones.map((item) => [item.id, item]));
  const lotById = new Map(data.harvests.map((item) => [item.id, item]));
  const stockById = new Map(data.productStocks.map((item) => [item.id, item]));
  const packageById = new Map(data.packages.map((item) => [item.id, item]));
  const processingById = new Map(data.processingLots.map((item) => [item.id, item]));
  const userIds = new Set([...data.members, ...Object.values(DEMO_USERS)].map((item) => item.id));
  const check = (condition: boolean, message: string) => { if (!condition) errors.push(message); };

  for (const lot of data.harvests) {
    const zone = zoneById.get(lot.farmZoneId);
    check(!!zone && zone.htxId === lot.htxId && zone.ownerId === lot.ownerId, `${lot.code}: vùng/HTX/chủ hộ không khớp`);
    check(!!lot.ownerId && userIds.has(lot.ownerId), `${lot.code}: chủ hộ không tồn tại`);
    check(matchSeasonForZone(zone, lot.date, true, lot.cycleId || lot.seasonId).status === 'matched', `${lot.code}: ngày thu hoạch không thuộc vụ/lứa`);
    check(lot.yieldQuantity > 0 && Number.isFinite(lot.yieldQuantity), `${lot.code}: sản lượng không hợp lệ`);
    const balance = getHarvestBalance(lot, data.handovers, data.orders);
    check(!balance.isOverdrawn, `${lot.code}: lượng giao/bán/sơ chế vượt sản lượng`);
    check(balance.availableQuantity >= 0, `${lot.code}: tồn âm`);
  }
  for (const slip of data.handovers) {
    const lot = lotById.get(slip.harvestLotId);
    check(!!lot && lot.htxId === slip.htxId && lot.code === slip.harvestLotCode && lot.ownerId === slip.senderId, `${slip.code}: lô/hộ/HTX không khớp`);
    check(!lot || sameUnit(lot.unit, slip.unit), `${slip.code}: đơn vị không khớp`);
    check(slip.declaredQuantity > 0 && (slip.status !== 'da_kiem_nhan' || (slip.receivedQuantity || 0) > 0), `${slip.code}: lượng giao không hợp lệ`);
    if (slip.status === 'cho_kiem_nhan') check(slip.receivedQuantity === undefined, `${slip.code}: phiếu chờ đã ghi thực nhận`);
    if (slip.status === 'da_kiem_nhan') {
      check(slip.differenceQuantity === (slip.receivedQuantity || 0) - slip.declaredQuantity, `${slip.code}: sai dấu chênh lệch`);
      if (slip.handoverType === 'mua_dut') check(slip.totalAmount === (slip.receivedQuantity || 0) * (slip.agreedUnitPrice || slip.unitPrice || 0), `${slip.code}: sai tiền mua đứt`);
      if (slip.handoverType === 'ky_gui') check(slip.totalAmount === undefined, `${slip.code}: ký gửi tạo tiền mua đứt`);
    }
  }
  for (const stock of data.productStocks) {
    const lot = lotById.get(stock.harvestLotId);
    check(!!lot && lot.htxId === stock.htxId && lot.code === stock.harvestLotCode, `${stock.id}: lô/HTX không khớp`);
    check(stock.quantity >= 0 && Number.isFinite(stock.quantity) && (!lot || stock.state === 'da_dong_goi' || sameUnit(lot.unit, stock.unit)), `${stock.id}: tồn/đơn vị không hợp lệ`);
    check(stock.ownerType === 'htx' ? stock.ownerId === stock.htxId : userIds.has(stock.ownerId), `${stock.id}: chủ hàng không hợp lệ`);
    if (stock.handoverId) {
      const slip = data.handovers.find((item) => item.id === stock.handoverId);
      check(!!slip && slip.status === 'da_kiem_nhan' && slip.harvestLotId === stock.harvestLotId && slip.htxId === stock.htxId, `${stock.id}: phiếu nguồn không hợp lệ`);
      if (slip?.handoverType === 'ky_gui') {
        check(stock.ownerType === 'ho_dan' && stock.ownerId === slip.senderId && stock.holderId === stock.htxId, `${stock.id}: ký gửi sai chủ/bên giữ`);
        const sold = data.orders.filter((order) => order.stockItemId === stock.id && order.status !== 'Đã hủy').reduce((sum, order) => sum + order.quantity, 0);
        check(stock.quantity + sold <= (slip.receivedQuantity || 0), `${stock.id}: ký gửi bán vượt thực nhận`);
      }
    }
  }
  for (const proc of data.processingLots) {
    const lot = lotById.get(proc.harvestLotId);
    check(!!lot && lot.htxId === proc.htxId && sameUnit(lot.unit, proc.unit), `${proc.code}: lô/đơn vị không khớp`);
    check(proc.inputQuantity > 0 && proc.outputQuantity > 0 && proc.outputQuantity <= proc.inputQuantity && (!lot || proc.inputQuantity <= lot.yieldQuantity), `${proc.code}: sơ chế vượt nguồn`);
  }
  for (const pkg of data.packages) {
    const lot = lotById.get(pkg.harvestLotId);
    const proc = pkg.processingLotId ? processingById.get(pkg.processingLotId) : undefined;
    check(!!lot && lot.htxId === pkg.htxId, `${pkg.code}: lô/HTX không khớp`);
    check(!pkg.processingLotId || (!!proc && proc.harvestLotId === pkg.harvestLotId), `${pkg.code}: mẻ sơ chế không khớp`);
    if (proc && !pkg.isLiveProduct) check(pkg.packQuantity * (pkg.netWeightPerPack || 1) <= proc.outputQuantity && sameUnit(pkg.netWeightUnit || proc.unit, proc.unit), `${pkg.code}: đóng gói vượt đầu ra`);
  }
  for (const lot of data.harvests) {
    const processedOutput = lot.processingInfo?.outputQuantity;
    if (!processedOutput) continue;
    const processedStock = data.productStocks.filter((stock) => stock.harvestLotId === lot.id && stock.state === 'da_xu_ly').reduce((sum, stock) => sum + stock.quantity, 0);
    const processedSales = data.orders.filter((order) => order.harvestLotId === lot.id && order.stockItemId && data.productStocks.find((stock) => stock.id === order.stockItemId)?.state === 'da_xu_ly' && order.status !== 'Đã hủy').reduce((sum, order) => sum + order.quantity, 0);
    const packaged = data.packages.filter((pkg) => pkg.harvestLotId === lot.id && pkg.processingLotId && !pkg.isLiveProduct).reduce((sum, pkg) => sum + pkg.packQuantity * (pkg.netWeightPerPack || 1), 0);
    check(processedStock + processedSales + packaged <= processedOutput + 0.001, `${lot.code}: sơ chế/đóng gói/bán dùng trùng đầu ra`);
  }
  for (const order of data.orders) {
    const lot = order.harvestLotId ? lotById.get(order.harvestLotId) : undefined;
    const stock = order.stockItemId ? stockById.get(order.stockItemId) : undefined;
    const pkg = order.productId ? packageById.get(order.productId) : undefined;
    check(!!lot || !!stock || !!pkg, `${order.code}: thiếu nguồn bán`);
    check(!lot || lot.htxId === order.htxId, `${order.code}: lô khác HTX`);
    check(!stock || (stock.htxId === order.htxId && stock.harvestLotId === order.harvestLotId && sameUnit(stock.unit, order.unit)), `${order.code}: tồn nguồn/đơn vị không khớp`);
    check(!pkg || (pkg.htxId === order.htxId && sameUnit(pkg.unit, order.unit)), `${order.code}: gói/đơn vị không khớp`);
    check(order.quantity > 0 && order.totalAmount === order.quantity * order.pricePerUnit && (order.deliveredQuantity || 0) <= order.quantity, `${order.code}: lượng/tiền không hợp lệ`);
    if (order.sellerType === 'ho_dan' && lot) check(order.sellerId === lot.ownerId, `${order.code}: hộ bán không sở hữu lô`);
    if (order.sourceHandoverId) check(data.handovers.some((item) => item.id === order.sourceHandoverId && item.harvestLotId === order.harvestLotId), `${order.code}: phiếu ký gửi/thu mua không khớp`);
  }
  return errors;
}
