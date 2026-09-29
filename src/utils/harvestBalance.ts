import { HarvestAllocation, HarvestLot, HTXInfo, ProductHandover, ProductState, ProductStockItem, SalesOrder } from '../types';

const EPSILON = 0.001;

export const sameUnit = (left: string, right: string) => left.trim().toLowerCase() === right.trim().toLowerCase();

export type PackagedSourceOrigin = 'hang_tho' | 'da_xu_ly' | 'unknown';

export const getProductStateBadge = (
  state: ProductState | undefined,
  sourceProductState?: PackagedSourceOrigin
) => {
  switch (state) {
    case 'hang_tho':
      return {
        label: '🌾 Hàng thô · Chưa sơ chế',
        shortLabel: 'Hàng thô',
        color: 'bg-amber-100 text-amber-900 border-amber-300',
      };
    case 'da_xu_ly':
      return {
        label: '⚙️ Đã sơ chế',
        shortLabel: 'Đã sơ chế',
        color: 'bg-cyan-100 text-cyan-900 border-cyan-300',
      };
    case 'da_dong_goi':
      if (sourceProductState === 'hang_tho') {
        return {
          label: '📦 Đã đóng gói · Từ hàng thô',
          shortLabel: 'Đóng gói · Hàng thô',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          sourceOrigin: 'hang_tho' as const,
        };
      }
      if (sourceProductState === 'da_xu_ly') {
        return {
          label: '📦 Đã đóng gói · Từ hàng đã sơ chế',
          shortLabel: 'Đóng gói · Sau sơ chế',
          color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          sourceOrigin: 'da_xu_ly' as const,
        };
      }
      if (sourceProductState === 'unknown') {
        return {
          label: '📦 Đã đóng gói · Nguồn đóng gói chưa xác định',
          shortLabel: 'Nguồn đóng gói chưa xác định',
          color: 'bg-slate-100 text-slate-700 border-slate-300',
          sourceOrigin: 'unknown' as const,
        };
      }
      return {
        label: '📦 Đã đóng gói',
        shortLabel: 'Đã đóng gói',
        color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      };
    case 'cho_kiem_tra':
      return {
        label: '⏳ Chờ kiểm tra',
        shortLabel: 'Chờ kiểm tra',
        color: 'bg-yellow-100 text-yellow-900 border-yellow-300',
      };
    case 'da_ban':
      return {
        label: '✅ Đã xuất bán',
        shortLabel: 'Đã bán',
        color: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    default:
      return {
        label: '🌾 Hàng thô · Chưa sơ chế',
        shortLabel: 'Hàng thô',
        color: 'bg-amber-100 text-amber-900 border-amber-300',
      };
  }
};

/**
 * Xác định nguồn gốc dòng đóng gói: từ hàng thô, từ hàng đã sơ chế, hoặc chưa xác định.
 * Tuân thủ quy tắc: Không suy đoán từ tên sản phẩm; không gán nhầm khi lô có cả hàng thô và hàng sơ chế.
 */
export function resolvePackagedSourceOrigin(
  stock: ProductStockItem,
  allStocks?: ProductStockItem[],
  packages?: PackagedProduct[],
  harvests?: HarvestLot[]
): PackagedSourceOrigin {
  if (stock.state !== 'da_dong_goi') {
    return stock.state === 'da_xu_ly' ? 'da_xu_ly' : 'hang_tho';
  }

  // 1. Xác định trực tiếp từ thuộc tính sourceProductState đã lưu
  if (stock.sourceProductState === 'hang_tho') return 'hang_tho';
  if (stock.sourceProductState === 'da_xu_ly') return 'da_xu_ly';

  // 2. Tra cứu bằng sourceStockItemId (Yêu cầu 1)
  if (stock.sourceStockItemId && allStocks) {
    const source = allStocks.find((s) => s.id === stock.sourceStockItemId);
    if (source) {
      if (source.state === 'hang_tho') return 'hang_tho';
      if (source.state === 'da_xu_ly') return 'da_xu_ly';
    }
  }

  // 3. Tra cứu qua package liên kết nếu có
  const pkg = packages?.find(
    (p) =>
      (stock.packageId && p.id === stock.packageId) ||
      (stock.packageCode && p.code === stock.packageCode) ||
      (p.harvestLotId === stock.harvestLotId && p.sourceStockItemId && p.sourceStockItemId === stock.sourceStockItemId)
  );

  if (pkg) {
    if (pkg.sourceProductState === 'hang_tho') return 'hang_tho';
    if (pkg.sourceProductState === 'da_xu_ly') return 'da_xu_ly';

    if (pkg.sourceStockItemId && allStocks) {
      const source = allStocks.find((s) => s.id === pkg.sourceStockItemId);
      if (source) {
        if (source.state === 'hang_tho') return 'hang_tho';
        if (source.state === 'da_xu_ly') return 'da_xu_ly';
      }
    }

    // 4. Với dữ liệu đóng gói cũ chưa lưu nguồn đầu vào:
    // Chỉ gắn "Từ hàng thô" khi có chứng cứ từ dữ liệu sự kiện đóng gói
    if (pkg.isLiveProduct) {
      return 'hang_tho'; // Gia cầm / cá sống xuất bán không qua sơ chế
    }

    if (pkg.processingSnapshot?.statusText === 'Không sơ chế' || pkg.processingSnapshot?.hasProcessing === false) {
      return 'hang_tho';
    }

    if (
      pkg.processingLotId ||
      (pkg.processingSnapshot?.hasProcessing === true && pkg.processingSnapshot?.statusText === 'Đã sơ chế')
    ) {
      return 'da_xu_ly';
    }
  }

  // 5. Kiểm tra lô thu hoạch nếu là dữ liệu cũ chưa lưu nguồn
  const lot = harvests?.find((h) => h.id === stock.harvestLotId);
  if (lot) {
    // Kiểm tra xem lô này có CẢ hàng thô và hàng sơ chế không
    const hasRaw =
      allStocks?.some((s) => s.harvestLotId === lot.id && s.state === 'hang_tho') ||
      (lot.allocation?.remainingAvailable && lot.allocation.remainingAvailable > 0);
    const hasProc =
      allStocks?.some((s) => s.harvestLotId === lot.id && s.state === 'da_xu_ly') ||
      (lot.allocation?.processedAtFarmQuantity && lot.allocation.processedAtFarmQuantity > 0) ||
      lot.processingStatus === 'da_so_che' ||
      !!lot.processingInfo;

    // Không tự gán nhầm khi một lô có cả hàng thô và hàng sau sơ chế!
    if (hasRaw && hasProc) {
      return 'unknown';
    }

    // Chỉ gắn từ hàng thô khi có chứng cứ rõ ràng từ lô không sơ chế
    if ((lot.processingStatus === 'khong_so_che' || lot.processingStatus === 'chua_so_che') && !hasProc) {
      return 'hang_tho';
    }
  }

  return 'unknown';
}

export function getProductStockBadge(
  stock: ProductStockItem,
  allStocks?: ProductStockItem[],
  packages?: PackagedProduct[],
  harvests?: HarvestLot[]
) {
  if (stock.state === 'da_dong_goi') {
    const origin = resolvePackagedSourceOrigin(stock, allStocks, packages, harvests);
    return getProductStateBadge('da_dong_goi', origin);
  }
  return getProductStateBadge(stock.state);
}

/** A pending slip reserves produce at the household; only confirmed slips count as HTX receipts. */
export function getHarvestBalance(lot: HarvestLot, handovers: ProductHandover[], orders: SalesOrder[]) {
  const slips = handovers.filter((item) => item.harvestLotId === lot.id && item.htxId === lot.htxId);
  const pendingQuantity = slips.filter((item) => item.status === 'cho_kiem_nhan').reduce((sum, item) => sum + item.declaredQuantity, 0);
  const receivedQuantity = slips.filter((item) => item.status === 'da_kiem_nhan').reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
  const directSales = orders.filter((item) => item.harvestLotId === lot.id && item.htxId === lot.htxId && item.sellerType === 'ho_dan' && item.status !== 'Đã hủy' && !item.stockItemId)
    .reduce((sum, item) => sum + item.quantity, 0);
  const processedAtFarm = lot.allocation?.processedAtFarmQuantity || 0;
  const packagedAtFarm = lot.allocation?.packagedAtFarmQuantity || 0;
  const processingInput = (lot.processingHistory?.length ? lot.processingHistory : lot.processingInfo ? [lot.processingInfo] : [])
    .reduce((sum, event) => sum + event.inputQuantity, 0);
  const uncoveredProcessing = Math.max(processedAtFarm, processingInput - receivedQuantity);
  const uncoveredPackaging = Math.max(0, packagedAtFarm - Math.max(0, receivedQuantity - processingInput));
  const unallocated = lot.allocation?.remainingAvailable ?? Math.max(0, lot.yieldQuantity - receivedQuantity - directSales - uncoveredProcessing - uncoveredPackaging);
  return {
    harvestedQuantity: lot.yieldQuantity,
    pendingQuantity,
    receivedQuantity,
    directSales,
    householdQuantity: unallocated,
    availableQuantity: Math.max(0, unallocated - pendingQuantity),
    isOverdrawn: unallocated + EPSILON < pendingQuantity || receivedQuantity + directSales + uncoveredProcessing + uncoveredPackaging > lot.yieldQuantity + EPSILON,
  };
}

export function validateHandoverQuantity(lot: HarvestLot, handovers: ProductHandover[], orders: SalesOrder[], quantity: number, unit: string): string | undefined {
  if (!Number.isFinite(quantity) || quantity <= 0) return 'Số lượng giao phải lớn hơn 0.';
  if (!sameUnit(unit, lot.unit)) return `Đơn vị giao phải là ${lot.unit}.`;
  const available = getHarvestBalance(lot, handovers, orders).availableQuantity;
  if (quantity > available + EPSILON) return `Số lượng giao vượt ${available} ${lot.unit} còn khả dụng tại hộ.`;
  return undefined;
}

export function validateReceiptQuantity(lot: HarvestLot, slip: ProductHandover, handovers: ProductHandover[], orders: SalesOrder[], quantity: number): string | undefined {
  if (!Number.isFinite(quantity) || quantity <= 0) return 'Số lượng thực nhận phải lớn hơn 0.';
  if (!sameUnit(slip.unit, lot.unit)) return 'Đơn vị phiếu không khớp với lô.';
  const balance = getHarvestBalance(lot, handovers, orders);
  const maximum = balance.availableQuantity + slip.declaredQuantity;
  if (quantity > maximum + EPSILON) return `Số lượng thực nhận vượt ${maximum} ${lot.unit} chưa phân bổ.`;
  return undefined;
}

export function allocationAfterReceipt(lot: HarvestLot, handovers: ProductHandover[], orders: SalesOrder[], quantity: number): HarvestAllocation {
  const balance = getHarvestBalance(lot, handovers, orders);
  return {
    directSaleQuantity: lot.allocation?.directSaleQuantity ?? balance.directSales,
    deliveredToHTXQuantity: (lot.allocation?.deliveredToHTXQuantity ?? balance.receivedQuantity) + quantity,
    packagedAtFarmQuantity: lot.allocation?.packagedAtFarmQuantity || 0,
    processedAtFarmQuantity: lot.allocation?.processedAtFarmQuantity || 0,
    remainingAvailable: balance.householdQuantity - quantity,
  };
}

export function stockAfterReceipt(slip: ProductHandover, htx: HTXInfo, quantity: number, quality: string, now: string): ProductStockItem {
  const ownedByHTX = slip.handoverType === 'mua_dut';
  const state: ProductState = slip.productState || 'hang_tho';
  return {
    id: `stock-${slip.id}`, htxId: slip.htxId, harvestLotId: slip.harvestLotId, harvestLotCode: slip.harvestLotCode,
    variety: slip.variety, ownerType: ownedByHTX ? 'htx' : 'ho_dan',
    ownerId: ownedByHTX ? htx.id : slip.senderId, ownerName: ownedByHTX ? htx.name : slip.senderName,
    holderId: htx.id, holderName: htx.name, handoverId: slip.id,
    locationName: `Kho trung tâm ${htx.shortName}`, state, quantity, unit: slip.unit,
    spec: slip.packageSpec || (state === 'da_dong_goi' ? 'Hàng đã đóng bao bì' : state === 'da_xu_ly' ? 'Hàng sơ chế nhận từ hộ' : (slip.transportPackaging ? `Hàng thô (${slip.transportPackaging})` : 'Hàng thô nhận từ hộ')),
    packageId: slip.packageId,
    packageCode: slip.packageCode,
    sourceStockItemId: slip.stockItemId,
    processingLotId: slip.processingLotId,
    netWeightPerPack: slip.netWeightPerPack,
    totalNetWeight: slip.totalNetWeight ? (quantity / slip.declaredQuantity) * slip.totalNetWeight : undefined,
    notes: `Nhận từ phiếu ${slip.code}. Đánh giá: ${quality}`, updatedAt: now,
  };
}

/**
 * Tính lượng khả dụng để bán hoặc giao HTX của một dòng tồn kho sản phẩm cụ thể.
 * - Mỗi dòng tồn lấy từ chính ProductStockItem.quantity.
 * - Trừ các đơn hàng đang giữ chỗ chưa giao của đúng dòng tồn đó (order.stockItemId === stock.id)
 *   hoặc đơn bán của hộ từ lô nguồn nếu là hàng thô chưa gắn stockItemId.
 * - Riêng hàng thô (state === 'hang_tho') tính thêm phiếu giao HTX đang chờ từ chính lượng thô.
 */
export function getStockItemAvailableQuantity(
  stock: ProductStockItem,
  orders: SalesOrder[] = [],
  handovers: ProductHandover[] = []
): { availableQuantity: number; reservedOrdersQuantity: number; pendingHandoverQuantity: number } {
  const reservedOrdersQuantity = orders
    .filter((o) => {
      if (o.status === 'Đã hủy') return false;
      if (o.stockItemId === stock.id) return true;
      if (!o.stockItemId && stock.state === 'hang_tho' && o.harvestLotId === stock.harvestLotId && o.sellerType === 'ho_dan') {
        return true;
      }
      return false;
    })
    .reduce((sum, o) => sum + Math.max(0, o.quantity - (o.deliveredQuantity || 0)), 0);

  const pendingHandoverQuantity = handovers
    .filter((h) => {
      if (h.status !== 'cho_kiem_nhan') return false;
      if (h.stockItemId === stock.id) return true;
      if (!h.stockItemId && stock.state === 'hang_tho' && h.harvestLotId === stock.harvestLotId && h.productState === 'hang_tho') {
        return true;
      }
      return false;
    })
    .reduce((sum, h) => sum + h.declaredQuantity, 0);

  const availableQuantity = Math.max(0, stock.quantity - reservedOrdersQuantity - pendingHandoverQuantity);

  return {
    availableQuantity,
    reservedOrdersQuantity,
    pendingHandoverQuantity,
  };
}

/**
 * Tính lượng khả dụng để bán của một dòng tồn kho thành phẩm
 * (bằng tồn vật lý trừ đi các đơn hàng đang giữ chỗ chưa giao và các phiếu gửi chờ duyệt)
 */
export function getStockAvailableQuantity(
  stock: ProductStockItem,
  orders: SalesOrder[] = [],
  handovers: ProductHandover[] = []
): number {
  return getStockItemAvailableQuantity(stock, orders, handovers).availableQuantity;
}

