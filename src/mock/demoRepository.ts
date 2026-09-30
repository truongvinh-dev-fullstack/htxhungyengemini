import {
  AppNotification, CustomerFeedback, DiaryAdjustmentRequest, DiaryEntry, FarmZone,
  HarvestLot, InventoryItem, MemberRequest, PackagedProduct, ProcessingLot,
  ProductHandover, ProductStockItem, ProductionTask, SalesOrder, StockTransaction, UserProfile,
} from '../types';
import {
  INITIAL_DIARIES, INITIAL_DIARY_ADJUSTMENTS, INITIAL_FARM_ZONES, INITIAL_FEEDBACKS,
  INITIAL_HANDOVERS, INITIAL_HARVESTS, INITIAL_INVENTORY, INITIAL_MEMBERS,
  INITIAL_MEMBER_REQUESTS, INITIAL_NOTIFICATIONS, INITIAL_ORDERS, INITIAL_PACKAGES,
  INITIAL_PROCESSING_LOTS, INITIAL_PRODUCT_STOCKS, INITIAL_TASKS, INITIAL_TRANSACTIONS,
} from './data';

export interface DemoData {
  farmZones: FarmZone[];
  diaries: DiaryEntry[];
  harvests: HarvestLot[];
  processingLots: ProcessingLot[];
  packages: PackagedProduct[];
  inventory: InventoryItem[];
  transactions: StockTransaction[];
  orders: SalesOrder[];
  members: UserProfile[];
  memberRequests: MemberRequest[];
  notifications: AppNotification[];
  handovers: ProductHandover[];
  productStocks: ProductStockItem[];
  diaryAdjustments: DiaryAdjustmentRequest[];
  tasks: ProductionTask[];
  feedbacks: CustomerFeedback[];
}

const KEY = 'hungyen_demo_data_v1';
const LEGACY_KEYS = ['hungyen_farm_zones', 'hungyen_diaries', 'hungyen_harvests'];
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export function createInitialDemoData(): DemoData {
  return clone({
    farmZones: INITIAL_FARM_ZONES, diaries: INITIAL_DIARIES, harvests: INITIAL_HARVESTS,
    processingLots: INITIAL_PROCESSING_LOTS, packages: INITIAL_PACKAGES,
    inventory: INITIAL_INVENTORY, transactions: INITIAL_TRANSACTIONS, orders: INITIAL_ORDERS,
    members: INITIAL_MEMBERS, memberRequests: INITIAL_MEMBER_REQUESTS,
    notifications: INITIAL_NOTIFICATIONS, handovers: INITIAL_HANDOVERS,
    productStocks: INITIAL_PRODUCT_STOCKS, diaryAdjustments: INITIAL_DIARY_ADJUSTMENTS,
    tasks: INITIAL_TASKS, feedbacks: INITIAL_FEEDBACKS,
  });
}

export interface DemoLoadResult { data: DemoData; warning?: string; notice?: string }

export function normalizeDemoOwnerNames(data: DemoData): void {
  const normalize = (name?: string) => {
    if (!name) return name;
    return name
      .replace(/^Bác\s+Nguyễn\s+Văn\s+An$/i, 'Nguyễn Văn An')
      .replace(/^Bác\s+Trần\s+Đình\s+Trọng$/i, 'Trần Đình Trọng')
      .replace(/^Bác\s+Phạm\s+Thị\s+Mai$/i, 'Phạm Thị Mai');
  };

  if (Array.isArray(data.members)) {
    data.members = data.members.map((m) => ({
      ...m,
      name: m.id === 'u_r06_an' ? 'Nguyễn Văn An' : m.id === 'u_r06_trong' ? 'Trần Đình Trọng' : m.id === 'u_r06_mai' ? 'Phạm Thị Mai' : normalize(m.name) || m.name,
    }));
  }

  if (Array.isArray(data.farmZones)) {
    data.farmZones = data.farmZones.map((z) => ({
      ...z,
      ownerName: z.ownerId === 'u_r06_an' ? 'Nguyễn Văn An' : z.ownerId === 'u_r06_trong' ? 'Trần Đình Trọng' : z.ownerId === 'u_r06_mai' ? 'Phạm Thị Mai' : normalize(z.ownerName) || z.ownerName,
      cycles: z.cycles?.map((c) => ({
        ...c,
        ownerName: c.ownerId === 'u_r06_an' ? 'Nguyễn Văn An' : normalize(c.ownerName) || c.ownerName,
      })),
      seasonHistory: z.seasonHistory?.map((c) => ({
        ...c,
        ownerName: c.ownerId === 'u_r06_an' ? 'Nguyễn Văn An' : normalize(c.ownerName) || c.ownerName,
      })),
    }));
  }

  if (Array.isArray(data.harvests)) {
    data.harvests = data.harvests.map((h) => ({
      ...h,
      ownerName: h.ownerId === 'u_r06_an' ? 'Nguyễn Văn An' : h.ownerId === 'u_r06_trong' ? 'Trần Đình Trọng' : h.ownerId === 'u_r06_mai' ? 'Phạm Thị Mai' : normalize(h.ownerName) || h.ownerName,
    }));
  }

  if (Array.isArray(data.handovers)) {
    data.handovers = data.handovers.map((h) => ({
      ...h,
      senderName: h.senderId === 'u_r06_an' ? 'Nguyễn Văn An' : normalize(h.senderName) || h.senderName,
    }));
  }

  if (Array.isArray(data.orders)) {
    data.orders = data.orders.map((o) => ({
      ...o,
      sellerName: o.sellerId === 'u_r06_an' ? 'Nguyễn Văn An' : normalize(o.sellerName) || o.sellerName,
    }));
  }

  if (Array.isArray(data.productStocks)) {
    data.productStocks = data.productStocks.map((s) => ({
      ...s,
      ownerName: s.ownerId === 'u_r06_an' ? 'Nguyễn Văn An' : normalize(s.ownerName) || s.ownerName,
      holderName: s.holderId === 'u_r06_an' ? 'Nguyễn Văn An' : normalize(s.holderName) || s.holderName,
      locationName: s.locationName?.replace('Bác Nguyễn Văn An', 'Nguyễn Văn An').replace('bác An', 'Nguyễn Văn An') || s.locationName,
    }));
  }

  if (Array.isArray(data.diaries)) {
    data.diaries = data.diaries.map((d) => ({
      ...d,
      subjectOwnerName: d.subjectOwnerId === 'u_r06_an' ? 'Nguyễn Văn An' : normalize(d.subjectOwnerName) || d.subjectOwnerName,
      createdBy: d.createdBy === 'Bác Nguyễn Văn An' ? 'Nguyễn Văn An' : d.createdBy,
    }));
  }

  if (Array.isArray(data.tasks)) {
    data.tasks = data.tasks.map((t) => ({
      ...t,
      assigneeName: t.assignedTo === 'u_r06_an' ? 'Nguyễn Văn An' : normalize(t.assigneeName) || t.assigneeName,
    }));
  }
}

export function loadDemoData(storage: Pick<Storage, 'getItem'>): DemoLoadResult {
  const defaults = createInitialDemoData();
  try {
    const stored = storage.getItem(KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      const rawData = (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object')
        ? parsed.data
        : (parsed && typeof parsed === 'object' ? parsed : null);

      if (!rawData) {
        return { data: defaults, warning: 'Dữ liệu demo không hợp lệ. Hãy sao lưu dữ liệu trước khi khôi phục demo.' };
      }
      const data: DemoData = { ...defaults };
      for (const key of Object.keys(defaults) as Array<keyof DemoData>) {
        if (Array.isArray(rawData[key])) {
          (data as any)[key] = rawData[key];
        }
      }
      // Bổ sung quyền sở hữu/bên giữ cho lô demo cũ đã lưu trước khi có các trường này.
      const seedPackages = new Map(defaults.packages.map((pkg) => [pkg.id, pkg]));
      data.packages = data.packages.map((pkg) => {
        const seed = seedPackages.get(pkg.id);
        if (!seed) return pkg;
        return {
          ...pkg,
          ownerType: pkg.ownerType ?? seed.ownerType,
          ownerId: pkg.ownerId ?? seed.ownerId,
          ownerName: pkg.ownerName ?? seed.ownerName,
          holderId: pkg.holderId ?? seed.holderId,
          holderName: pkg.holderName ?? seed.holderName,
        };
      });
      normalizeDemoOwnerNames(data);
      return { data };
    }
    const data = defaults;
    let migratedLegacy = false;
    const migrationIssues: string[] = [];
    for (const [index, field] of (['farmZones', 'diaries', 'harvests'] as const).entries()) {
      const legacy = storage.getItem(LEGACY_KEYS[index]);
      if (legacy === null) continue;
      migratedLegacy = true;
      const parsed = JSON.parse(legacy);
      if (!Array.isArray(parsed)) throw new Error(LEGACY_KEYS[index]);
      if (field === 'farmZones') data.farmZones = parsed as FarmZone[];
      if (field === 'diaries') data.diaries = parsed as DiaryEntry[];
      if (field === 'harvests') data.harvests = parsed as HarvestLot[];
    }
    const legacyOwners: Record<string, string> = { 'mem-01': 'u_r06_an', 'mem-03': 'u_r06_trong' };
    data.farmZones = data.farmZones.map((zone) => ({
      ...zone,
      ownerId: legacyOwners[zone.ownerId] || zone.ownerId,
      cycles: zone.cycles?.map((cycle) => ({ ...cycle, ownerId: legacyOwners[cycle.ownerId || ''] || cycle.ownerId })),
      seasonHistory: zone.seasonHistory?.map((cycle) => ({ ...cycle, ownerId: legacyOwners[cycle.ownerId || ''] || cycle.ownerId })),
    }));
    data.diaries = data.diaries.map((entry) => ({ ...entry, subjectOwnerId: legacyOwners[entry.subjectOwnerId || ''] || entry.subjectOwnerId }));
    data.harvests = data.harvests.map((lot) => ({ ...lot, ownerId: legacyOwners[lot.ownerId || ''] || lot.ownerId }));
    for (const lot of data.harvests) {
      const events = lot.processingHistory?.length ? lot.processingHistory : lot.processingInfo ? [lot.processingInfo] : [];
      for (const [index, event] of events.entries()) {
        if (data.processingLots.some((item) => item.harvestLotId === lot.id && item.date === event.date && item.inputQuantity === event.inputQuantity)) continue;
        if (data.productStocks.some((item) => item.harvestLotId === lot.id && item.state === 'da_xu_ly')) continue;
        const atFarm = (lot.allocation?.processedAtFarmQuantity || 0) > 0;
        const sourceStock = data.productStocks.find((stock) => stock.harvestLotId === lot.id && stock.htxId === lot.htxId && stock.state === 'hang_tho' && stock.quantity > 0 && (
          atFarm ? stock.ownerId === lot.ownerId && (!stock.holderId || stock.holderId === lot.ownerId) : stock.holderId === lot.htxId || (!stock.holderId && stock.ownerType === 'htx')
        ));
        if (!sourceStock || sourceStock.quantity < event.inputQuantity) {
          migrationIssues.push(`${lot.code}: không xác định đủ tồn thô cho lần sơ chế ${event.date}`);
          continue;
        }
        const ownerId = sourceStock?.ownerId || (atFarm ? (lot.ownerId || '') : lot.htxId);
        const ownerName = sourceStock?.ownerName || (atFarm ? (lot.ownerName || '') : `HTX ${lot.htxId}`);
        const holderId = atFarm ? ownerId : lot.htxId;
        const holderName = atFarm ? ownerName : `HTX ${lot.htxId}`;
        const eventId = `legacy-${lot.id}-${index}`;
        data.processingLots.unshift({
          id: `sc-${eventId}`, code: `SC-${eventId}`, htxId: lot.htxId, harvestLotId: lot.id,
          harvestLotCode: lot.code, farmZoneName: lot.farmZoneName, productName: lot.variety || lot.farmZoneName,
          date: event.date, method: event.method, inputQuantity: event.inputQuantity, outputQuantity: event.outputQuantity,
          unit: lot.unit, lossQuantity: event.lossQuantity, lossRatePercent: event.lossRatePercent || 0,
          operatorName: event.operatorName || '', photoUrl: lot.photoUrl, notes: event.notes || '', status: 'Đã sơ chế',
        });
        let toDeduct = event.inputQuantity;
        data.productStocks = data.productStocks.map((stock) => {
          if (stock.harvestLotId !== lot.id || stock.htxId !== lot.htxId || stock.state !== 'hang_tho' || stock.ownerId !== ownerId || stock.id !== sourceStock?.id || toDeduct <= 0) return stock;
          const taken = Math.min(stock.quantity, toDeduct);
          toDeduct -= taken;
          return { ...stock, quantity: stock.quantity - taken };
        });
        data.productStocks.unshift({
          id: `stock-${eventId}`, htxId: lot.htxId, harvestLotId: lot.id, harvestLotCode: lot.code,
          variety: `${lot.variety || lot.code} (sau sơ chế)`, ownerType: sourceStock?.ownerType || (atFarm ? 'ho_dan' : 'htx'), ownerId, ownerName,
          holderId, holderName, handoverId: sourceStock?.handoverId, locationName: atFarm ? `Kho hộ ${ownerName}` : `Kho HTX ${lot.htxId}`,
          state: 'da_xu_ly', quantity: event.outputQuantity, unit: lot.unit, updatedAt: event.updatedAt || `${event.date}T12:00:00`,
          notes: `Khôi phục từ sự kiện sơ chế ${event.date}`,
        });
      }
    }
    const notice = migratedLegacy ? 'Đã nhập dữ liệu lô/nhật ký cũ vào kho demo có phiên bản. Phiếu giao nhận và đơn bán từ bản cũ vốn không được lưu nên không thể khôi phục; hãy đối chiếu trước khi tiếp tục.' : undefined;
    return { data, notice: [notice, migrationIssues.length ? `Cần đối chiếu sơ chế cũ: ${migrationIssues.join('; ')}.` : undefined].filter(Boolean).join(' ') || undefined };
  } catch {
    return { data: defaults, warning: 'Không đọc được dữ liệu demo cũ. Dữ liệu trong trình duyệt được giữ nguyên; hãy sao lưu rồi dùng nút Khôi phục dữ liệu demo nếu muốn bắt đầu lại.' };
  }
}

export function saveDemoData(storage: Pick<Storage, 'setItem'>, data: DemoData): void {
  storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, data }));
}

export function clearDemoData(storage: Pick<Storage, 'removeItem'>): void {
  storage.removeItem(KEY);
  for (const key of LEGACY_KEYS) storage.removeItem(key);
  storage.removeItem('hungyen_read_task_reminders');
}
