import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  UserRole,
  HTXId,
  HTXInfo,
  UserProfile,
  FarmZone,
  ProductionCycle,
  SeasonHistoryItem,
  DiaryEntry,
  HarvestLot,
  HarvestLotSource,
  HarvestAllocation,
  ProcessingLot,
  ProcessingInfo,
  PackagingProcessingSnapshot,
  PackagedProduct,
  SourceBatchContribution,
  InventoryItem,
  StockTransaction,
  SalesOrder,
  MemberRequest,
  AppNotification,
  ProductStockItem,
  ProductState,
  StockOwnerType,
  ProductHandover,
  DiaryAdjustmentRequest,
  QualityCriteriaConfig,
  ProductionTask,
  CustomerFeedback,
  HTXCoopConfig,
} from '../types';
import {
  HTX_LIST,
  DEMO_USERS,
  INITIAL_FARM_ZONES,
  INITIAL_DIARIES,
  INITIAL_HARVESTS,
  INITIAL_PROCESSING_LOTS,
  INITIAL_PACKAGES,
  INITIAL_INVENTORY,
  INITIAL_TRANSACTIONS,
  INITIAL_ORDERS,
  INITIAL_MEMBERS,
  INITIAL_MEMBER_REQUESTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_HANDOVERS,
  INITIAL_PRODUCT_STOCKS,
  INITIAL_DIARY_ADJUSTMENTS,
  QUALITY_CRITERIA_CONFIG,
  COOP_CONFIGS,
  INITIAL_TASKS,
  INITIAL_FEEDBACKS,
} from '../mock/data';
import { API_CONFIG } from '../config/api';
import {
  isDiaryLocked,
  canModifyDiary,
  canManageProcessing,
  canManagePackaging,
  canCreateHarvest,
  canConfirmHandover,
  canApproveDiaryAdjustment,
} from '../utils/permissions';
import { matchSeasonForZone } from '../utils/seasonMatcher';
import { getActiveCycle, getCycles, getCycleStatusInfo, getUnitStatusInfo, migrateLegacyUnit } from '../utils/productionUtils';
import { getDueTaskReminders, taskReminderId } from '../utils/productionTaskHints';
import { allocationAfterReceipt, getHarvestBalance, getStockItemAvailableQuantity, stockAfterReceipt, validateHandoverQuantity, validateReceiptQuantity, sameUnit } from '../utils/harvestBalance';
import { clearDemoData, DemoData, loadDemoData, normalizeDemoOwnerNames, saveDemoData } from '../mock/demoRepository';
import {
  authService,
  diaryService,
  zoneService,
  harvestService,
  processingService,
  packageService,
  warehouseService,
  orderService,
  memberService,
  notificationService,
} from '../services';

export const getCanonicalMemberName = (
  memberId?: string,
  fallbackName?: string,
  membersList?: UserProfile[]
): string => {
  if (!memberId) return (fallbackName || 'Hộ nông dân').replace(/^Bác\s+/i, '');
  const member = membersList?.find((m) => m.id === memberId);
  if (member?.name) return member.name;
  if (memberId === 'u_r06_an') return 'Nguyễn Văn An';
  if (memberId === 'u_r06_trong') return 'Trần Đình Trọng';
  if (memberId === 'u_r06_mai') return 'Phạm Thị Mai';
  return (fallbackName || 'Hộ nông dân').replace(/^Bác\s+/i, '');
};

interface AppContextType {
  demoWarning?: string;
  demoNotice?: string;
  resetDemoData: () => void;
  // Auth state
  isLoggedIn: boolean;
  currentUser: UserProfile;
  currentHTX: HTXInfo;
  currentRole: UserRole;
  loginWithZaloPhone: (phone: string) => { success: boolean; reason?: string; user?: UserProfile };
  logout: () => void;
  setRole: (role: UserRole) => void;
  setHTX: (htxId: HTXId) => void;

  // Screen navigation
  currentScreen: string;
  screenParams: any;
  navigateTo: (screen: string, params?: any) => void;
  goBack: () => void;
  activeTab: 'home' | 'diary' | 'notifications' | 'profile';
  setActiveTab: (tab: 'home' | 'diary' | 'notifications' | 'profile') => void;

  // Data collections
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
  qualityConfigs: Record<string, QualityCriteriaConfig>;
  tasks: ProductionTask[];
  feedbacks: CustomerFeedback[];
  coopConfigs: Record<string, HTXCoopConfig>;
  currentCoopConfig: HTXCoopConfig;

  updateProfile: (updatedData: Partial<UserProfile>) => void;
  addFarmZone: (zone: Omit<FarmZone, 'id' | 'farmingDays'>) => { success: boolean; message?: string; zone?: FarmZone };
  createProductionCycle: (unitId: string, data: Pick<ProductionCycle, 'seasonName' | 'year' | 'variety' | 'seasonStartDate' | 'seasonEndDate'> & Partial<ProductionCycle>) => { success: boolean; message?: string; cycle?: ProductionCycle };
  startProductionCycle: (unitId: string, cycleId: string) => { success: boolean; message?: string };
  finishProductionCycle: (unitId: string, cycleId: string) => { success: boolean; message?: string };
  updateFarmZone: (zoneId: string, updatedData: Partial<FarmZone>) => { success: boolean; message?: string };
  deleteFarmZone: (zoneId: string) => { success: boolean; message: string };
  addDiary: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'isLocked' | 'createdBy' | 'createdById'>) => { success: boolean; message?: string; entry?: DiaryEntry };
  updateDiary: (id: string, updatedData: Partial<DiaryEntry>) => { success: boolean; message?: string };
  deleteDiary: (id: string) => { success: boolean; message?: string };
  createDiaryAdjustmentRequest: (data: {
    diaryId: string;
    reason: string;
    proposedNotes: string;
    proposedWorkTypeName?: string;
    proposedSuppliesUsed?: string;
  }) => { success: boolean; message?: string };
  approveDiaryAdjustmentRequest: (requestId: string, reviewNotes?: string) => { success: boolean; message?: string };
  rejectDiaryAdjustmentRequest: (requestId: string, reviewNotes: string) => { success: boolean; message?: string };

  addHarvest: (lot: Omit<HarvestLot, 'id' | 'code'> & { code?: string }) => Promise<{ success: boolean; message?: string; lot?: HarvestLot }>;
  updateHarvest: (lotId: string, updatedData: Partial<HarvestLot>) => { success: boolean; message?: string };
  allocateHarvestLot: (lotId: string, allocationData: Partial<HarvestAllocation>) => { success: boolean; message?: string };
  saveHarvestProcessing: (
    harvestLotId: string,
    processingData: {
      date: string;
      method: string;
      inputQuantity: number;
      outputQuantity: number;
      notes?: string;
      operatorName?: string;
      status?: 'da_so_che' | 'khong_so_che';
    }
  ) => { success: boolean; message?: string };
  addHarvestProcessingSession: (
    harvestLotId: string,
    processingData: {
      date: string;
      method: string;
      inputQuantity: number;
      outputQuantity: number;
      notes?: string;
      operatorName?: string;
    }
  ) => { success: boolean; message?: string };

  addProductHandover: (
    data: Omit<ProductHandover, 'id' | 'code' | 'createdAt' | 'status'>
  ) => { success: boolean; message?: string; handover?: ProductHandover };
  confirmProductHandover: (
    handoverId: string,
    receivedQuantity: number,
    qualityAssessment: string,
    notes?: string
  ) => { success: boolean; message?: string };
  rejectProductHandover: (handoverId: string, reason: string) => { success: boolean; message?: string };
  disputeProductHandover: (handoverId: string, disputeNote: string) => { success: boolean; message?: string };
  confirmDoiSoatHandover: (handoverId: string, notes?: string) => { success: boolean; message?: string };

  generateLotQRCode: (lotId: string) => { success: boolean; qrCodeUrl: string; message?: string };

  addProcessingLot: (lot: Omit<ProcessingLot, 'id' | 'code'>) => ProcessingLot;
  addPackage: (pkg: Omit<PackagedProduct, 'id' | 'code' | 'qrCodeUrl'>) => PackagedProduct;
  addOrder: (order: Omit<SalesOrder, 'id' | 'code'>) => { success: boolean; message?: string; order?: SalesOrder };
  updateOrderStatus: (orderId: string, status: 'Mới' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy', cancelReason?: string) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  updateDeliveryProgress: (orderId: string, data: { deliveredQuantity: number; deliveryProofPhoto?: string; deliveryNotes?: string; deliveryStatus?: 'dang_giao' | 'da_giao' }) => { success: boolean; message?: string };

  updateProductionTask: (taskId: string, data: Partial<ProductionTask>) => { success: boolean; message?: string };
  createServiceRequestTask: (data: { farmZoneId: string; cycleId: string; serviceType: 'gat' | 'cay' | 'say' | 'vat_tu' | 'khac'; requestedDate: string; description?: string; quantity?: number; unit?: string }) => { success: boolean; message?: string; task?: ProductionTask };
  requestLivestockSale: (taskId: string, birdCount: number, sampleWeightKg: number, notes?: string) => { success: boolean; message?: string };

  addCustomerFeedback: (feedback: Omit<CustomerFeedback, 'id' | 'feedbackDate' | 'status'>) => { success: boolean; message?: string; feedback?: CustomerFeedback };
  resolveCustomerFeedback: (feedbackId: string, resolutionNotes: string, status?: 'dang_xu_ly' | 'da_giai_quyet') => { success: boolean; message?: string };

  getMobileQuickSummary: () => {
    overdueTasksCount: number;
    pendingTasksCount: number;
    pendingHandoversCount: number;
    pendingDeliveryOrdersCount: number;
    pendingFeedbacksCount: number;
    totalEstimatedYield: number;
    totalActualYield: number;
    yieldUnit: string;
  };

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => InventoryItem;
  addStockTransaction: (tx: Omit<StockTransaction, 'id' | 'code'>) => boolean;
  markNotificationAsRead: (id: string) => void;
  todayHasDiary: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start at Login per user instruction:
  // "Bắt đầu từ Màn hình Đăng nhập (chọn Đăng nhập 1-chạm Zalo hoặc SĐT/Mật khẩu) rồi mới vào Trang chủ"
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentRole, setCurrentRoleState] = useState<UserRole>('R06');
  const [currentHTXId, setCurrentHTXId] = useState<HTXId>('anninh');

  // Navigation
  const [currentScreen, setCurrentScreen] = useState<string>('auth_login');
  const [screenParams, setScreenParams] = useState<any>(null);
  const [historyStack, setHistoryStack] = useState<{ screen: string; params: any }[]>([]);
  const [activeTab, setActiveTabState] = useState<'home' | 'diary' | 'notifications' | 'profile'>('home');

  // Voice Assistant



  // Một snapshot có phiên bản cho toàn bộ dữ liệu demo; các key cũ chỉ được đọc khi di trú.
  const [loadedDemo] = useState(() => loadDemoData(localStorage));
  const demoWarning = loadedDemo.warning;
  const demoNotice = loadedDemo.notice;
  const [farmZones, setFarmZones] = useState<FarmZone[]>(loadedDemo.data.farmZones.map(migrateLegacyUnit));
  const [diaries, setDiaries] = useState<DiaryEntry[]>(loadedDemo.data.diaries.map((entry) => ({ ...entry, cycleId: entry.cycleId || entry.seasonId })));
  const [harvests, setHarvests] = useState<HarvestLot[]>(loadedDemo.data.harvests.map((lot) => ({ ...lot, cycleId: lot.cycleId || lot.seasonId })));
  const [processingLots, setProcessingLots] = useState<ProcessingLot[]>(loadedDemo.data.processingLots);
  const [packages, setPackages] = useState<PackagedProduct[]>(loadedDemo.data.packages);
  const [inventory, setInventory] = useState<InventoryItem[]>(loadedDemo.data.inventory);
  const [transactions, setTransactions] = useState<StockTransaction[]>(loadedDemo.data.transactions);
  const [orders, setOrders] = useState<SalesOrder[]>(loadedDemo.data.orders);
  const [members, setMembers] = useState<UserProfile[]>(loadedDemo.data.members);
  const [memberRequests, setMemberRequests] = useState<MemberRequest[]>(loadedDemo.data.memberRequests);
  const [notifications, setNotifications] = useState<AppNotification[]>(loadedDemo.data.notifications);
  const [handovers, setHandovers] = useState<ProductHandover[]>(loadedDemo.data.handovers);
  const [productStocks, setProductStocks] = useState<ProductStockItem[]>(loadedDemo.data.productStocks);
  const [diaryAdjustments, setDiaryAdjustments] = useState<DiaryAdjustmentRequest[]>(loadedDemo.data.diaryAdjustments);
  const [tasks, setTasks] = useState<ProductionTask[]>(loadedDemo.data.tasks);
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>(loadedDemo.data.feedbacks);
  const [coopConfigs] = useState<Record<string, HTXCoopConfig>>(COOP_CONFIGS);

  // Đồng bộ đa tab / focus trên cùng origin
  const lastSavedJsonRef = useRef<string>('');

  const reloadFromStorage = useCallback(() => {
    try {
      if (typeof localStorage === 'undefined') return;
      const stored = localStorage.getItem('hungyen_demo_data_v1');
      if (!stored) return;
      if (stored === lastSavedJsonRef.current) return;
      lastSavedJsonRef.current = stored;

      const reloaded = loadDemoData(localStorage);
      if (!reloaded.data) return;
      const d = reloaded.data;
      setFarmZones((prev) => {
        const storedItems = d.farmZones.map(migrateLegacyUnit);
        const map = new Map(storedItems.map((z) => [z.id, z]));
        prev.forEach((z) => { if (!map.has(z.id)) map.set(z.id, z); });
        return [...map.values()];
      });
      setDiaries((prev) => {
        const storedItems = d.diaries.map((entry) => ({ ...entry, cycleId: entry.cycleId || entry.seasonId }));
        const map = new Map(storedItems.map((entry) => [entry.id, entry]));
        prev.forEach((entry) => { if (!map.has(entry.id)) map.set(entry.id, entry); });
        return [...map.values()];
      });
      setHarvests((prev) => {
        const storedLots = d.harvests.map((lot) => ({ ...lot, cycleId: lot.cycleId || lot.seasonId }));
        const map = new Map<string, HarvestLot>();
        storedLots.forEach((lot) => map.set(lot.id, lot));
        prev.forEach((lot) => {
          if (!map.has(lot.id)) {
            map.set(lot.id, lot);
          }
        });
        return [...map.values()];
      });
      setProcessingLots(d.processingLots);
      setPackages(d.packages);
      setInventory(d.inventory);
      setTransactions(d.transactions);
      setOrders(d.orders);
      setMembers(d.members);
      setMemberRequests(d.memberRequests);
      setNotifications(d.notifications);
      setHandovers((prev) => {
        const map = new Map(d.handovers.map((h) => [h.id, h]));
        prev.forEach((h) => { if (!map.has(h.id)) map.set(h.id, h); });
        return [...map.values()];
      });
      setProductStocks((prev) => {
        const map = new Map<string, ProductStockItem>(d.productStocks.map((s) => [s.id, s]));
        prev.forEach((s) => {
          if (!map.has(s.id)) {
            map.set(s.id, s);
          }
        });
        return [...map.values()];
      });
      setDiaryAdjustments(d.diaryAdjustments);
      setTasks(d.tasks);
      setFeedbacks(d.feedbacks);
    } catch (e) {
      console.error('Lỗi đồng bộ dữ liệu từ localStorage:', e);
    }
  }, []);

  const persistDemoDataImmediate = useCallback((partialData?: Partial<DemoData>) => {
    try {
      if (typeof localStorage === 'undefined') return;
      const base = loadDemoData(localStorage).data;
      const data: DemoData = {
        farmZones,
        diaries,
        harvests,
        processingLots,
        packages,
        inventory,
        transactions,
        orders,
        members,
        memberRequests,
        notifications,
        handovers,
        productStocks,
        diaryAdjustments,
        tasks,
        feedbacks,
        ...partialData,
      };
      if (base?.harvests?.length) {
        const hMap = new Map<string, HarvestLot>();
        base.harvests.forEach((h) => hMap.set(h.id, h));
        data.harvests.forEach((h) => hMap.set(h.id, h));
        data.harvests = [...hMap.values()];
      }
      normalizeDemoOwnerNames(data);
      const serialized = JSON.stringify({ schemaVersion: 1, data });
      lastSavedJsonRef.current = serialized;
      saveDemoData(localStorage, data);
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('hungyen_demo_sync');
          bc.postMessage({ type: 'SYNC_DATA', timestamp: Date.now() });
          bc.close();
        }
      } catch { /* ignored */ }
    } catch (err) {
      console.error('Lỗi persistDemoDataImmediate:', err);
    }
  }, [farmZones, diaries, harvests, processingLots, packages, inventory, transactions, orders, members, memberRequests, notifications, handovers, productStocks, diaryAdjustments, tasks, feedbacks]);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('hungyen_demo_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'SYNC_DATA') {
            reloadFromStorage();
          }
        };
      }
    } catch { /* ignored */ }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hungyen_demo_data_v1') {
        reloadFromStorage();
      }
    };

    const handleFocus = () => {
      reloadFromStorage();
    };

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        reloadFromStorage();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      bc?.close();
    };
  }, [reloadFromStorage]);

  useEffect(() => {
    const data: DemoData = { farmZones, diaries, harvests, processingLots, packages, inventory, transactions,
      orders, members, memberRequests, notifications, handovers, productStocks, diaryAdjustments, tasks, feedbacks };
    try {
      const serialized = JSON.stringify({ schemaVersion: 1, data });
      if (serialized !== lastSavedJsonRef.current) {
        lastSavedJsonRef.current = serialized;
        saveDemoData(localStorage, data);
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('hungyen_demo_sync');
            bc.postMessage({ type: 'SYNC_DATA', timestamp: Date.now() });
            bc.close();
          }
        } catch { /* ignored */ }
      }
    } catch (error) { console.error('Không thể lưu dữ liệu demo:', error); }
  }, [farmZones, diaries, harvests, processingLots, packages, inventory, transactions, orders, members,
    memberRequests, notifications, handovers, productStocks, diaryAdjustments, tasks, feedbacks]);

  const resetDemoData = () => { clearDemoData(localStorage); window.location.reload(); };

  // Kế hoạch vụ/lứa chỉ tạo nhắc nhở trong ứng dụng; không buộc hộ quản lý một sổ công việc riêng.
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const due = getDueTaskReminders(tasks, farmZones, [...members, ...Object.values(DEMO_USERS)], today);
    let readIds: string[] = [];
    try {
      const saved = JSON.parse(localStorage.getItem('hungyen_read_task_reminders') || '[]');
      if (Array.isArray(saved)) readIds = saved.filter((id): id is string => typeof id === 'string');
    } catch { /* dữ liệu cũ không hợp lệ */ }
    const readSet = new Set(readIds);
    setNotifications((previous) => {
      const existing = new Map<string, AppNotification>(previous.filter((notice) => notice.reminderTaskId).map((notice): [string, AppNotification] => [notice.id, notice]));
      const reminders: AppNotification[] = due.map(({ task, ownerId }) => ({
        id: taskReminderId(task.id),
        reminderTaskId: task.id,
        htxId: task.htxId,
        userId: ownerId,
        title: `Nhắc ghi nhật ký: ${task.title}`,
        summary: `${task.farmZoneName} • hạn ${task.dueDate}. Chỉ ghi khi bác đã làm việc này.`,
        content: `Việc dự kiến trong ${task.cycleName || 'vụ/lứa'}: ${task.description || task.title}. Sau khi thực hiện, bác mở nhật ký để ghi lại kết quả thực tế.`,
        date: task.dueDate,
        type: 'reminder',
        isRead: existing.get(taskReminderId(task.id))?.isRead || readSet.has(taskReminderId(task.id)),
        actionScreen: 'diary_add',
        actionLabel: 'Ghi nhật ký cho việc này',
        actionParams: { zoneId: task.farmZoneId, cycleId: task.cycleId!, taskId: task.id, taskTitle: task.title },
      }));
      return [...reminders, ...previous.filter((notice) => !notice.reminderTaskId)];
    });
  }, [tasks, farmZones, members]);

  const currentHTX = HTX_LIST[currentHTXId] || HTX_LIST.anninh;
  const currentCoopConfig = coopConfigs[currentHTXId] || coopConfigs.anninh;

  // Resolve initial user profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    return DEMO_USERS['R06_anninh'] || INITIAL_MEMBERS[0];
  });

  const updateProfile = (updatedData: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const next = { ...prev, ...updatedData };
      setMembers((prevMembers) =>
        prevMembers.map((m) => (m.id === next.id || m.phone === next.phone ? next : m))
      );
      return next;
    });
  };

  const navigateTo = (screen: string, params?: any) => {

    setHistoryStack((prev) => [...prev, { screen: currentScreen, params: screenParams }]);
    setCurrentScreen(screen);
    setScreenParams(params || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {

    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack((h) => h.slice(0, -1));
      setCurrentScreen(prev.screen);
      setScreenParams(prev.params);
    } else {
      setCurrentScreen('home');
      setActiveTabState('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setActiveTab = (tab: 'home' | 'diary' | 'notifications' | 'profile') => {
    setActiveTabState(tab);
    setHistoryStack([]);
    if (tab === 'home') {
      setCurrentScreen('home');
    } else if (tab === 'diary') {
      // Điều hướng thông minh theo vai trò
      if (currentRole === 'R04') setCurrentScreen('product_stock_list');
      else if (currentRole === 'R02') setCurrentScreen('dashboard');
      else if (currentRole === 'R03') setCurrentScreen('farm_list');
      else setCurrentScreen('diary_list');
    } else if (tab === 'notifications') {
      setCurrentScreen('notifications');
    } else if (tab === 'profile') {
      setCurrentScreen('profile');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loginWithZaloPhone = (phone: string): { success: boolean; reason?: string; user?: UserProfile } => {
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    
    // Check in DEMO_USERS and members
    const allUsers = [...Object.values(DEMO_USERS), ...members];
    const matched = allUsers.find(
      (u) => u.phone.replace(/[\s.-]/g, '') === cleanPhone
    );

    if (matched) {
      if (matched.status === 'pending') {
        return { success: false, reason: 'PENDING', user: matched };
      }
      if (matched.status === 'rejected') {
        return { success: false, reason: 'REJECTED', user: matched };
      }
      if (matched.status === 'inactive') {
        return { success: false, reason: 'INACTIVE', user: matched };
      }

      setCurrentUser(matched);
      setCurrentRoleState(matched.role);
      setCurrentHTXId(matched.htxId);
      setIsLoggedIn(true);
      setCurrentScreen('home');
      setActiveTabState('home');
      setHistoryStack([]);
      return { success: true, user: matched };
    }

    // Check if phone has a pending registration request
    const matchedReq = memberRequests.find(
      (r) => r.phone.replace(/[\s.-]/g, '') === cleanPhone
    );
    if (matchedReq) {
      if (matchedReq.status === 'pending') {
        return {
          success: false,
          reason: 'PENDING',
          user: { name: matchedReq.name, phone: matchedReq.phone, status: 'pending' } as any,
        };
      }
      if (matchedReq.status === 'rejected') {
        return {
          success: false,
          reason: 'REJECTED',
          user: { name: matchedReq.name, phone: matchedReq.phone, status: 'rejected' } as any,
        };
      }
    }

    return {
      success: false,
      reason: 'NOT_REGISTERED',
    };
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('auth_login');
    setHistoryStack([]);
  };

  const setRole = (role: UserRole) => {
    reloadFromStorage();
    setCurrentRoleState(role);
    const userKey = `${role}_${currentHTXId}`;
    if (DEMO_USERS[userKey]) {
      setCurrentUser(DEMO_USERS[userKey]);
    } else {
      setCurrentUser((prev) => ({
        ...prev,
        id: `u_${role.toLowerCase()}_${currentHTXId}`,
        name:
          role === 'R06'
            ? 'Nguyễn Văn An'
            : role === 'R04'
            ? 'Chị Nguyễn Thị Dung'
            : role === 'R03'
            ? 'Kỹ sư Lê Văn Hoàng'
            : 'Ông Phạm Văn Minh',
        role,
        htxId: currentHTXId,
      }));
    }
  };

  const setHTX = (htxId: HTXId) => {
    setCurrentHTXId(htxId);
    const userKey = `${currentRole}_${htxId}`;
    if (DEMO_USERS[userKey]) {
      setCurrentUser(DEMO_USERS[userKey]);
    } else {
      setCurrentUser((prev) => ({
        ...prev,
        htxId,
      }));
    }
  };

  // Nạp dữ liệu từ Backend API khi VITE_USE_MOCK=false
  useEffect(() => {
    if (!API_CONFIG.USE_MOCK) {
      zoneService.getFarmZones(currentHTXId).then((remote) => setFarmZones((previous) => {
        const ids = new Set(previous.map((unit) => unit.id));
        return [...previous, ...remote.filter((unit) => !ids.has(unit.id)).map(migrateLegacyUnit)];
      })).catch(console.error);
      diaryService.getDiaries(currentHTXId).then((remote) => setDiaries((previous) => {
        const ids = new Set(previous.map((entry) => entry.id));
        return [...previous, ...remote.filter((entry) => !ids.has(entry.id)).map((entry) => ({ ...entry, cycleId: entry.cycleId || entry.seasonId }))];
      })).catch(console.error);
      harvestService.getHarvests(currentHTXId).then((remote) => setHarvests((previous) => {
        const ids = new Set(previous.map((lot) => lot.id));
        return [...previous, ...remote.filter((lot) => !ids.has(lot.id)).map((lot) => ({ ...lot, cycleId: lot.cycleId || lot.seasonId }))];
      })).catch(console.error);
      processingService.getProcessingLots(currentHTXId).then(setProcessingLots).catch(console.error);
      packageService.getPackages(currentHTXId).then(setPackages).catch(console.error);
      warehouseService.getInventory(currentHTXId).then(setInventory).catch(console.error);
      warehouseService.getTransactions(currentHTXId).then(setTransactions).catch(console.error);
      orderService.getOrders(currentHTXId).then(setOrders).catch(console.error);
      memberService.getMembers(currentHTXId).then(setMembers).catch(console.error);
      memberService.getRequests(currentHTXId).then(setMemberRequests).catch(console.error);
      notificationService.getNotifications(currentHTXId).then(setNotifications).catch(console.error);
    }
  }, [currentHTXId]);

  // Check if today has diary (scoped by HTX and current user)
  const now = new Date();
  const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const todayHasDiary = diaries.some(
    (d) =>
      d.htxId === currentHTXId &&
      (d.date === todayStr || d.createdAt?.startsWith(todayStr)) &&
      (currentRole === 'R06' ? farmZones.some((zone) => zone.id === d.farmZoneId && zone.ownerId === currentUser.id) : true)
  );

  // Mutations
  const addFarmZone = (
    zone: Omit<FarmZone, 'id' | 'farmingDays'>
  ): { success: boolean; message?: string; zone?: FarmZone } => {
    // 1. Phân quyền: Chỉ Cán bộ Kỹ thuật R03 được tạo vùng sản xuất mới
    if (currentRole !== 'R03') {
      return {
        success: false,
        message: 'Chỉ Cán bộ Kỹ thuật (R03) mới có quyền khảo sát và cấp mã vùng sản xuất mới cho thành viên HTX.',
      };
    }

    // 2. Kiểm tra trùng lặp mã số vùng trồng (MSVT)
    if (
      farmZones.some(
        (z) => z.zoneCode?.trim().toLowerCase() === zone.zoneCode?.trim().toLowerCase()
      )
    ) {
      return {
        success: false,
        message: `Mã số vùng trồng/sản xuất "${zone.zoneCode}" đã tồn tại trong hệ thống. Vui lòng chọn mã khác.`,
      };
    }
    if (zone.htxId !== currentHTXId || !members.some((m) => m.id === zone.ownerId && m.htxId === currentHTXId && m.status === 'active')) {
      return { success: false, message: 'Chủ hộ phải là thành viên đang hoạt động của HTX hiện tại.' };
    }
    if (!zone.name.trim() || !zone.zoneCode.trim() || !Number.isFinite(zone.areaValue) || zone.areaValue <= 0) {
      return { success: false, message: 'Cần nhập tên, mã và quy mô hợp lệ của nơi sản xuất.' };
    }

    const newZone: FarmZone = {
      htxId: currentHTXId,
      zoneCode: zone.zoneCode,
      unitCode: zone.zoneCode,
      ownerId: zone.ownerId,
      ownerName: zone.ownerName,
      name: zone.name,
      productionType: zone.productionType,
      facilityType: zone.facilityType,
      location: zone.location,
      areaValue: zone.areaValue,
      areaUnit: zone.areaUnit,
      areaOrQuantity: zone.areaOrQuantity || `${zone.areaValue} ${zone.areaUnit}`,
      soilOrWaterCondition: zone.soilOrWaterCondition,
      imageUrl: zone.imageUrl,
      notes: zone.notes,
      status: 'dang_su_dung',
      unitStatus: 'dang_su_dung',
      id: `fz-${Date.now()}`,
      seasonHistory: [],
      cycles: [],
    };
    setFarmZones((prev) => [newZone, ...prev]);
    return { success: true, zone: newZone };
  };

  const deleteFarmZone = (zoneId: string): { success: boolean; message: string } => {
    const targetZone = farmZones.find((z) => z.id === zoneId);
    if (!targetZone || targetZone.htxId !== currentHTXId) {
      return {
        success: false,
        message: 'Vùng sản xuất không tồn tại hoặc không thuộc HTX hiện tại.',
      };
    }
    if (currentRole === 'R06' || currentRole !== 'R03') {
      return {
        success: false,
        message: 'Bạn không có quyền xóa vùng sản xuất. Chỉ Cán bộ Kỹ thuật (R03) mới có quyền thực hiện.',
      };
    }
    const hasDiaries = diaries.some((d) => d.farmZoneId === zoneId);
    const hasHarvests = harvests.some((h) => h.farmZoneId === zoneId);

    if (getCycles(targetZone).length || hasDiaries || hasHarvests) {
      return {
        success: false,
        message:
          'Không thể xóa nơi sản xuất đã có vụ/lứa, nhật ký hoặc lô thu hoạch liên kết. Hãy chuyển trạng thái sử dụng để bảo toàn lịch sử.',
      };
    }

    setFarmZones((prev) => prev.filter((z) => z.id !== zoneId));
    return {
      success: true,
      message: 'Đã xóa thửa ruộng thành công!',
    };
  };

  const createProductionCycle = (unitId: string, data: Pick<ProductionCycle, 'seasonName' | 'year' | 'variety' | 'seasonStartDate' | 'seasonEndDate'> & Partial<ProductionCycle>) => {
    if (currentRole !== 'R03') return { success: false, message: 'Chỉ cán bộ kỹ thuật R03 được lập vụ/lứa.' };
    const unit = farmZones.find((z) => z.id === unitId && z.htxId === currentHTXId);
    if (!unit || !getUnitStatusInfo(unit.unitStatus || unit.status).isAvailable) {
      return { success: false, message: 'Nơi sản xuất không thuộc HTX hiện tại hoặc đã ngừng sử dụng.' };
    }
    if (!data.seasonName?.trim() || !data.variety?.trim() || !data.seasonStartDate || !data.seasonEndDate || data.seasonStartDate > data.seasonEndDate) {
      return { success: false, message: 'Cần nhập tên, giống/sản phẩm và khoảng thời gian hợp lệ.' };
    }
    if (data.stockedQuantity !== undefined && (!Number.isInteger(data.stockedQuantity) || data.stockedQuantity <= 0 || (unit.areaUnit === 'con' && data.stockedQuantity > unit.areaValue))) {
      return { success: false, message: 'Số con nhập lứa này phải là số nguyên dương và không vượt sức chứa.' };
    }
    const id = `cycle-${unitId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const cycle: ProductionCycle = {
      ...data,
      unitId,
      cycleId: id,
      seasonId: id,
      cycleName: data.seasonName.trim(),
      seasonName: data.seasonName.trim(),
      variety: data.variety.trim(),
      year: Number(data.year),
      status: 'du_kien',
      ownerId: unit.ownerId,
      ownerName: unit.ownerName,
    };
    if (!Number.isInteger(cycle.year)) return { success: false, message: 'Năm sản xuất không hợp lệ.' };
    setFarmZones((prev) => prev.map((z) => z.id === unitId ? {
      ...z, cycles: [cycle, ...getCycles(z)], seasonHistory: [cycle, ...getCycles(z)],
    } : z));
    return { success: true, cycle };
  };

  const startProductionCycle = (unitId: string, cycleId: string) => {
    if (currentRole !== 'R03') return { success: false, message: 'Chỉ cán bộ kỹ thuật R03 được bắt đầu vụ/lứa.' };
    const unit = farmZones.find((z) => z.id === unitId && z.htxId === currentHTXId);
    if (!unit || !getUnitStatusInfo(unit.unitStatus || unit.status).isAvailable) return { success: false, message: 'Nơi sản xuất không hợp lệ hoặc đã ngừng sử dụng.' };
    const cycles = getCycles(unit);
    const target = cycles.find((c) => (c.cycleId || c.seasonId) === cycleId);
    if (!target || getCycleStatusInfo(target.status).code !== 'du_kien') return { success: false, message: 'Chỉ có thể bắt đầu vụ/lứa đang dự kiến.' };
    if (cycles.some((c) => (c.cycleId || c.seasonId) !== cycleId && getCycleStatusInfo(c.status).isActive)) {
      return { success: false, message: 'Nơi sản xuất đang có vụ/lứa thực hiện. Hãy kết thúc vụ/lứa đó trước.' };
    }
    setFarmZones((prev) => prev.map((z) => z.id === unitId ? {
      ...z, currentSeasonId: cycleId,
      cycles: getCycles(z).map((c) => (c.cycleId || c.seasonId) === cycleId ? { ...c, status: 'dang_thuc_hien' } : c),
      seasonHistory: getCycles(z).map((c) => (c.cycleId || c.seasonId) === cycleId ? { ...c, status: 'dang_thuc_hien' } : c),
    } : z));
    return { success: true };
  };

  const finishProductionCycle = (unitId: string, cycleId: string) => {
    if (currentRole !== 'R03') return { success: false, message: 'Chỉ cán bộ kỹ thuật R03 được kết thúc vụ/lứa.' };
    const unit = farmZones.find((z) => z.id === unitId && z.htxId === currentHTXId);
    if (!unit || !getCycles(unit).some((c) => (c.cycleId || c.seasonId) === cycleId && getCycleStatusInfo(c.status).isActive)) {
      return { success: false, message: 'Không tìm thấy vụ/lứa đang thực hiện thuộc HTX hiện tại.' };
    }
    setFarmZones((prev) => prev.map((z) => z.id === unitId ? {
      ...z, currentSeasonId: undefined,
      cycles: getCycles(z).map((c) => (c.cycleId || c.seasonId) === cycleId ? { ...c, status: 'da_ket_thuc' } : c),
      seasonHistory: getCycles(z).map((c) => (c.cycleId || c.seasonId) === cycleId ? { ...c, status: 'da_ket_thuc' } : c),
    } : z));
    return { success: true };
  };

  const updateFarmZone = (
    zoneId: string,
    updatedData: Partial<FarmZone>
  ): { success: boolean; message?: string } => {
    const targetZone = farmZones.find((z) => z.id === zoneId);
    if (!targetZone || targetZone.htxId !== currentHTXId) {
      return {
        success: false,
        message: 'Vùng sản xuất không tồn tại hoặc không thuộc HTX hiện tại.',
      };
    }
    if (currentRole === 'R06' || currentRole !== 'R03') {
      return {
        success: false,
        message: 'Bạn không có quyền chỉnh sửa thông tin vùng sản xuất. Chỉ Cán bộ Kỹ thuật (R03) mới có quyền thực hiện.',
      };
    }
    const { name, areaOrQuantity, areaValue, areaUnit, soilOrWaterCondition, location, notes, status, unitStatus, statusNote, imageUrl, facilityType } = updatedData;
    const stableChanges: Partial<FarmZone> = {};
    const submitted = { name, areaOrQuantity, areaValue, areaUnit, soilOrWaterCondition, location, notes, status, unitStatus, statusNote, imageUrl, facilityType };
    (Object.keys(submitted) as (keyof typeof submitted)[]).forEach((key) => {
      if (submitted[key] !== undefined) (stableChanges as Record<string, unknown>)[key] = submitted[key];
    });
    setFarmZones((prev) => prev.map((z) => z.id === zoneId ? { ...z, ...stableChanges } : z));
    return { success: true };
  };

  const addDiary = (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'isLocked' | 'createdBy' | 'createdById'>): { success: boolean; message?: string; entry?: DiaryEntry } => {
    const zone = farmZones.find((z) => z.id === entry.farmZoneId && z.htxId === currentHTXId);
    if (!zone) return { success: false, message: 'Vùng sản xuất không thuộc HTX hiện tại.' };
    if (!['R03', 'R06'].includes(currentRole)) return { success: false, message: 'Vai trò này không được ghi nhật ký.' };
    if (currentRole === 'R06' && zone.ownerId !== currentUser.id) {
      return { success: false, message: 'Hộ chỉ được ghi nhật ký cho vùng mình phụ trách.' };
    }
    if (!entry.date || !entry.workTypes?.length) {
      return { success: false, message: 'Cần chọn ngày thực hiện và ít nhất một công việc.' };
    }
    if (entry.performedAt?.slice(0, 10) !== entry.date) {
      return { success: false, message: 'Ngày và giờ thực hiện không khớp.' };
    }
    if (entry.materialId) {
      const material = inventory.find((item) => item.id === entry.materialId && item.htxId === currentHTXId);
      if (!material || !entry.materialQuantity || entry.materialQuantity <= 0) {
        return { success: false, message: 'Vật tư hoặc số lượng vật tư không hợp lệ.' };
      }
    }
    if (entry.phiDays !== undefined && (!Number.isInteger(entry.phiDays) || entry.phiDays < 0)) {
      return { success: false, message: 'Thời gian cách ly PHI không hợp lệ.' };
    }

    if (zone.unitStatus === 'tam_ngung' || zone.unitStatus === 'ngung_su_dung' || zone.status === 'tam_ngung') {
      return { success: false, message: `Nơi sản xuất đang ${zone.unitStatus === 'tam_ngung' ? 'tạm ngừng' : 'ngừng'} sử dụng. Không thể ghi nhật ký mới.` };
    }

    if (!entry.cycleId) return { success: false, message: 'Vui lòng chọn vụ/lứa cụ thể trước khi ghi nhật ký.' };
    const seasonMatch = matchSeasonForZone(zone, entry.performedAt || entry.date, false, entry.cycleId);
    if (seasonMatch.status === 'no_season') {
      return { success: false, message: seasonMatch.message || 'Thời điểm này chưa thuộc mùa vụ nào của thửa.' };
    }
    if (seasonMatch.status === 'overlap') {
      return { success: false, message: seasonMatch.message || 'Dữ liệu mùa vụ của thửa bị chồng thời gian tại thời điểm này.' };
    }
    const verifiedSeasonId = seasonMatch.season!.seasonId;
    const verifiedSeasonName = seasonMatch.season!.seasonName;
    if (entry.taskId) {
      const task = tasks.find((item) => item.id === entry.taskId);
      const sameOwner = task && (task.assignedTo === currentUser.id || task.assignedTo.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, ''));
      if (!task || task.htxId !== currentHTXId || task.farmZoneId !== zone.id || task.cycleId !== (seasonMatch.season!.cycleId || verifiedSeasonId) || !['chua_lam', 'tre'].includes(task.status) || task.diaryId || (currentRole === 'R06' && !sameOwner)) {
        return { success: false, message: 'Việc gợi ý không thuộc vụ/lứa hoặc hộ đang ghi nhật ký.' };
      }
    }
    const newEntry: DiaryEntry = {
      ...entry,
      htxId: currentHTXId,
      farmZoneName: zone.name,
      seasonId: verifiedSeasonId,
      cycleId: seasonMatch.season!.cycleId || verifiedSeasonId,
      seasonName: verifiedSeasonName,
      subjectOwnerId: zone.ownerId,
      subjectOwnerName: zone.ownerName,
      id: `d-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isLocked: false,
      createdBy: currentUser.name,
      createdById: currentUser.id,
    };
    setDiaries((prev) => [newEntry, ...prev]);

    // Nếu nhật ký được ghi từ công việc được giao trước (taskId), tự động cập nhật công việc sang "Đã làm"
    if (entry.taskId) {
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === entry.taskId
            ? {
                ...t,
                status: 'da_lam' as const,
                diaryId: newEntry.id,
                completedAt: newEntry.performedAt || newEntry.createdAt,
                resultNotes: newEntry.notes || t.resultNotes || `Đã ghi kết quả nhật ký: ${newEntry.workTypeName}`,
                resultPhoto: newEntry.photoUrl || t.resultPhoto,
              }
            : t
        )
      );
    }

    // CN-3.5.5 / CN-2.5.9: Tự động gửi thông báo tới cán bộ kỹ thuật khi có nhật ký mới
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      htxId: currentHTXId,
      title: `Nhật ký mới: ${newEntry.workTypeName}`,
      summary: `${currentUser.name} vừa ghi nhật ký cho vùng của ${zone.ownerName}`,
      content: `${currentUser.name} vừa cập nhật công việc "${newEntry.workTypeName}" tại ${newEntry.farmZoneName} (hộ phụ trách: ${zone.ownerName}). Ngày thực hiện: ${newEntry.date}. ${newEntry.suppliesUsed ? `Vật tư: ${newEntry.suppliesUsed}. ` : ''}Ghi chú: ${newEntry.notes || 'Không có.'}`,
      date: new Date().toISOString().split('T')[0],
      type: 'system',
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    if (!API_CONFIG.USE_MOCK) {
      diaryService.createDiary(newEntry).catch((err) => {
        console.error('Lỗi lưu nhật ký qua API:', err);
      });
    }
    return { success: true, entry: newEntry };
  };

  const updateDiary = (id: string, updatedData: Partial<DiaryEntry>): { success: boolean; message?: string } => {
    const entry = diaries.find((d) => d.id === id);
    if (!entry || entry.htxId !== currentHTXId) return { success: false, message: 'Không tìm thấy nhật ký.' };
    if (currentRole === 'R06' && !farmZones.some((zone) => zone.id === entry.farmZoneId && zone.ownerId === currentUser.id)) {
      return { success: false, message: 'Hộ không phụ trách vùng của nhật ký này.' };
    }

    const check = canModifyDiary(currentRole, entry, currentUser.name, currentUser.id);
    if (!check.canEdit) {
      return { success: false, message: check.reason || 'Không có quyền chỉnh sửa nhật ký này.' };
    }
    if (updatedData.performedAt && updatedData.date !== updatedData.performedAt.slice(0, 10)) {
      return { success: false, message: 'Ngày và giờ thực hiện không khớp.' };
    }

    const editableFields: (keyof DiaryEntry)[] = [
      'workTypeName', 'workType', 'workTypes', 'workTypeIcon', 'date', 'performedAt', 'photoUrl', 'workDescription',
      'suppliesUsed', 'materialId', 'materialQuantity', 'materialUnit', 'phiDays',
      'weatherCondition', 'weatherSuggestedAt', 'notes',
    ];
    const changes: Partial<DiaryEntry> = {};
    editableFields.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(updatedData, key)) {
        (changes as Record<string, unknown>)[key] = updatedData[key];
      }
    });

    const targetZone = farmZones.find((zone) => zone.id === entry.farmZoneId);
    if (targetZone && (updatedData.performedAt || updatedData.date)) {
      const newTime = updatedData.performedAt || updatedData.date || entry.performedAt || entry.date;
      const seasonMatch = matchSeasonForZone(targetZone, newTime, false, entry.cycleId || entry.seasonId);
      if (seasonMatch.status === 'no_season') {
        return { success: false, message: 'Thời điểm thực hiện mới không thuộc mùa vụ nào của thửa ruộng.' };
      }
      if (seasonMatch.status === 'overlap') {
        return { success: false, message: 'Dữ liệu mùa vụ của thửa bị chồng thời gian tại thời điểm mới này.' };
      }
      if (seasonMatch.season) {
        changes.seasonId = seasonMatch.season.seasonId;
        changes.cycleId = seasonMatch.season.cycleId || seasonMatch.season.seasonId;
        changes.seasonName = seasonMatch.season.seasonName;
      }
    }
    setDiaries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...changes } : d))
    );
    return { success: true };
  };

  const deleteDiary = (id: string): { success: boolean; message?: string } => {
    const entry = diaries.find((d) => d.id === id);
    if (!entry || entry.htxId !== currentHTXId) return { success: false, message: 'Không tìm thấy nhật ký.' };
    if (currentRole === 'R06' && !farmZones.some((zone) => zone.id === entry.farmZoneId && zone.ownerId === currentUser.id)) {
      return { success: false, message: 'Hộ không phụ trách vùng của nhật ký này.' };
    }

    const check = canModifyDiary(currentRole, entry, currentUser.name, currentUser.id);
    if (!check.canDelete) {
      return { success: false, message: check.reason || 'Không có quyền xóa nhật ký này.' };
    }

    setDiaries((prev) => prev.filter((d) => d.id !== id));
    return { success: true };
  };

  const addHarvest = async (
    lot: Omit<HarvestLot, 'id' | 'code'> & { code?: string }
  ): Promise<{ success: boolean; message?: string; lot?: HarvestLot }> => {
    // 1. Kiểm tra sản lượng tổng và phân loại
    if (!lot.yieldQuantity || lot.yieldQuantity <= 0) {
      return { success: false, message: 'Tổng sản lượng thu hoạch phải lớn hơn 0.' };
    }

    if (lot.grade1Quantity !== undefined && lot.grade1Quantity < 0) {
      return { success: false, message: 'Khối lượng Loại 1 không được là số âm.' };
    }

    if (lot.grade2Quantity !== undefined && lot.grade2Quantity < 0) {
      return { success: false, message: 'Khối lượng Loại 2 không được là số âm.' };
    }

    const g1 = lot.grade1Quantity || 0;
    const g2 = lot.grade2Quantity || 0;
    if (g1 + g2 > lot.yieldQuantity) {
      return {
        success: false,
        message: 'Tổng khối lượng Loại 1 và Loại 2 không được vượt quá tổng sản lượng thu hoạch.',
      };
    }

    // 2. Xử lý nguồn thu hoạch: Nhiều vùng/thửa hoặc một vùng kế thừa
    let resolvedSources: HarvestLotSource[] = [];
    let primaryZone: FarmZone;
    let assignedSeasonId: string;
    let assignedSeasonName: string;
    let assignedVariety: string;

    if (lot.sources && lot.sources.length > 0) {
      // A. Lô có nhiều vùng/thửa nguồn
      // Kiểm tra trùng lặp vùng nguồn
      const zoneIds = lot.sources.map((s) => s.farmZoneId);
      if (new Set(zoneIds).size !== zoneIds.length) {
        return { success: false, message: 'Danh sách thửa ruộng nguồn không được trùng lặp.' };
      }

      // Kiểm tra từng thửa ruộng
      let commonOwnerId: string | undefined;
      let commonOwnerName: string | undefined;
      let totalSourceQty = 0;

      for (let i = 0; i < lot.sources.length; i++) {
        const src = lot.sources[i];
        if (!src.quantity || src.quantity <= 0) {
          return { success: false, message: `Sản lượng đóng góp của thửa "${src.farmZoneName || src.farmZoneId}" phải lớn hơn 0.` };
        }
        totalSourceQty += src.quantity;

        const zone = farmZones.find((z) => z.id === src.farmZoneId && z.htxId === currentHTXId);
        if (!zone) {
          return { success: false, message: `Thửa ruộng "${src.farmZoneName || src.farmZoneId}" không tồn tại hoặc không thuộc HTX hiện tại.` };
        }

        if (zone.unitStatus === 'tam_ngung' || zone.unitStatus === 'ngung_su_dung' || zone.status === 'tam_ngung') {
          return { success: false, message: `Thửa ruộng "${zone.name}" đang ${zone.unitStatus === 'tam_ngung' ? 'tạm ngừng' : 'ngừng'} sử dụng. Không thể khai báo thu hoạch.` };
        }

        // Kiểm tra cùng chủ sở hữu
        if (!commonOwnerId) {
          commonOwnerId = zone.ownerId;
          commonOwnerName = getCanonicalMemberName(zone.ownerId, zone.ownerName, members);
        } else if (zone.ownerId !== commonOwnerId) {
          return {
            success: false,
            message: `Tất cả các thửa ruộng trong một lô phải cùng thuộc một hộ sở hữu (${commonOwnerName}). Không thể gộp thửa của hộ "${zone.ownerName}" vào lô này. Vui lòng tạo lô riêng cho từng hộ.`,
          };
        }

        // Kiểm tra đơn vị tính tương thích
        if (!sameUnit(src.unit, lot.unit)) {
          return {
            success: false,
            message: `Đơn vị tính của thửa "${zone.name}" (${src.unit}) không tương thích với đơn vị của lô (${lot.unit}). Vui lòng tạo lô riêng cho từng đơn vị.`,
          };
        }

        // Kiểm tra vụ/lứa hợp lệ tại ngày thu hoạch
        const harvestDateForZone = src.harvestDate || lot.date;
        if (!src.cycleId) {
          return { success: false, message: `Vui lòng chọn vụ/lứa cho thửa "${zone.name}".` };
        }
        const seasonMatch = matchSeasonForZone(zone, harvestDateForZone, false, src.cycleId);
        if (seasonMatch.status === 'no_season') {
          return { success: false, message: `Ngày thu hoạch của thửa "${zone.name}" không thuộc vụ/lứa hợp lệ.` };
        }
        if (seasonMatch.status === 'overlap') {
          return { success: false, message: `Dữ liệu vụ/lứa của thửa "${zone.name}" bị chồng thời gian tại ngày thu hoạch.` };
        }

        const validCycleId = seasonMatch.season?.cycleId || seasonMatch.season?.seasonId || src.cycleId;
        const validCycleName = seasonMatch.season?.seasonName || src.cycleName || 'Vụ thu hoạch';

        resolvedSources.push({
          farmZoneId: zone.id,
          farmZoneName: zone.name,
          zoneCode: zone.zoneCode,
          cycleId: validCycleId,
          cycleName: validCycleName,
          quantity: src.quantity,
          unit: src.unit || lot.unit,
          harvestDate: harvestDateForZone,
        });
      }

      // Kiểm tra tổng sản lượng khớp
      if (Math.abs(totalSourceQty - lot.yieldQuantity) > 0.001) {
        return {
          success: false,
          message: `Tổng sản lượng lô (${lot.yieldQuantity} ${lot.unit}) không khớp với tổng sản lượng đóng góp của các thửa (${totalSourceQty} ${lot.unit}).`,
        };
      }

      // Kiểm tra quyền tạo lô thu hoạch
      if (!canCreateHarvest(currentRole, commonOwnerId, currentUser.id)) {
        return {
          success: false,
          message: 'Bạn không có quyền khai báo thu hoạch cho hộ nông dân này.',
        };
      }

      primaryZone = farmZones.find((z) => z.id === resolvedSources[0].farmZoneId)!;
      assignedSeasonId = resolvedSources[0].cycleId!;
      assignedSeasonName = resolvedSources[0].cycleName!;
      assignedVariety = lot.variety || primaryZone.variety || 'Nông sản VietGAP';
    } else {
      // B. Kế thừa một vùng đơn lẻ (tương thích ngược)
      const zone = farmZones.find((z) => z.id === lot.farmZoneId && z.htxId === currentHTXId);
      if (!zone) {
        return { success: false, message: 'Vùng sản xuất không tồn tại hoặc không thuộc HTX hiện tại.' };
      }

      if (!canCreateHarvest(currentRole, zone.ownerId, currentUser.id)) {
        return {
          success: false,
          message: 'Bạn không có quyền khai báo thu hoạch cho vùng sản xuất này.',
        };
      }

      if (zone.unitStatus === 'tam_ngung' || zone.unitStatus === 'ngung_su_dung' || zone.status === 'tam_ngung') {
        return { success: false, message: `Nơi sản xuất đang ${zone.unitStatus === 'tam_ngung' ? 'tạm ngừng' : 'ngừng'} sử dụng. Không thể khai báo thu hoạch mới.` };
      }

      if (!lot.cycleId) return { success: false, message: 'Vui lòng chọn vụ/lứa cụ thể trước khi khai báo thu hoạch.' };
      const seasonMatch = matchSeasonForZone(zone, lot.date, false, lot.cycleId);
      if (seasonMatch.status === 'no_season') {
        return { success: false, message: seasonMatch.message || 'Ngày thu hoạch không thuộc vụ/lứa đang thực hiện nào của nơi sản xuất.' };
      }
      if (seasonMatch.status === 'overlap') {
        return { success: false, message: seasonMatch.message || 'Dữ liệu vụ/lứa bị chồng thời gian tại ngày thu hoạch này.' };
      }

      assignedSeasonId = seasonMatch.season!.seasonId;
      assignedSeasonName = seasonMatch.season!.seasonName;
      assignedVariety = seasonMatch.season!.variety || lot.variety;
      primaryZone = zone;

      resolvedSources = [
        {
          farmZoneId: zone.id,
          farmZoneName: zone.name,
          zoneCode: zone.zoneCode,
          cycleId: assignedSeasonId,
          cycleName: assignedSeasonName,
          quantity: lot.yieldQuantity,
          unit: lot.unit,
          harvestDate: lot.date,
        },
      ];
    }

    const generatedCode = lot.code || `TH-${currentHTXId.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const initialAllocation: HarvestAllocation = lot.allocation || {
      directSaleQuantity: 0,
      deliveredToHTXQuantity: 0,
      packagedAtFarmQuantity: 0,
      processedAtFarmQuantity: 0,
      remainingAvailable: lot.yieldQuantity,
    };

    const resolvedOwnerId = primaryZone.ownerId || lot.ownerId || currentUser.id;
    const resolvedOwnerName = getCanonicalMemberName(resolvedOwnerId, lot.ownerName || primaryZone.ownerName, members);

    const newLot: HarvestLot = {
      ...lot,
      id: `h-${Date.now()}`,
      code: generatedCode,
      htxId: currentHTXId,
      farmZoneId: primaryZone.id,
      farmZoneName: resolvedSources.length > 1 ? `${primaryZone.name} (+${resolvedSources.length - 1} thửa)` : primaryZone.name,
      zoneCode: primaryZone.zoneCode,
      variety: assignedVariety,
      ownerId: resolvedOwnerId,
      ownerName: resolvedOwnerName,
      seasonId: assignedSeasonId,
      cycleId: assignedSeasonId,
      seasonName: assignedSeasonName,
      sources: resolvedSources,
      processingStatus: lot.processingStatus || 'chua_so_che',
      processingInfo: lot.processingInfo,
      allocation: initialAllocation,
      processingHistory: lot.processingHistory || (lot.processingInfo ? [lot.processingInfo] : []),
    };

    if (!API_CONFIG.USE_MOCK) {
      try {
        const createdOnServer = await harvestService.createHarvest(newLot);
        if (createdOnServer && createdOnServer.id) {
          newLot.id = createdOnServer.id;
        }
      } catch (err: any) {
        console.error('Lỗi lưu lô thu hoạch qua API:', err);
        return {
          success: false,
          message: err?.message || 'Không thể lưu lô thu hoạch lên máy chủ API. Vui lòng thử lại.',
        };
      }
    }

    const updatedHarvests = [newLot, ...harvests];
    setHarvests(updatedHarvests);

    // Tạo bản ghi tồn sản phẩm tại hộ
    const initialStock: ProductStockItem = {
      id: `stock-${Date.now()}`,
      htxId: currentHTXId,
      harvestLotId: newLot.id,
      harvestLotCode: newLot.code,
      variety: newLot.variety || 'Nông sản an toàn',
      ownerType: 'ho_dan',
      ownerId: newLot.ownerId || currentUser.id,
      ownerName: newLot.ownerName || currentUser.name,
      locationName: `Kho tại hộ ${newLot.ownerName || currentUser.name}`,
      state: 'hang_tho',
      quantity: newLot.yieldQuantity,
      unit: newLot.unit,
      spec: 'Nông sản thô mới thu hoạch',
      notes: newLot.notes,
      updatedAt: new Date().toISOString(),
    };
    const updatedStocks = [initialStock, ...productStocks];
    setProductStocks(updatedStocks);
    persistDemoDataImmediate({ harvests: updatedHarvests, productStocks: updatedStocks });

    // Bắn thông báo lô thu hoạch mới
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: '🌾 Lô thu hoạch nông sản mới',
        summary: `Đã ghi nhận lô ${newLot.code} sản lượng ${newLot.yieldQuantity} ${newLot.unit} tại ${newLot.farmZoneName}.`,
        content: `Lô thu hoạch mã số ${newLot.code} đã được cập nhật thành công từ ${newLot.farmZoneName}. Nông sản đã sẵn sàng chuyển sang khâu phân bổ, sơ chế, đóng gói hoặc giao nhận HTX.`,
        date: 'Vừa xong',
        type: 'system',
        isRead: false,
        actionScreen: 'harvest_list',
        actionLabel: 'Xem lô thu hoạch',
      },
      ...prev,
    ]);

    return { success: true, lot: newLot };
  };

  const updateHarvest = (
    lotId: string,
    updatedData: Partial<HarvestLot>
  ): { success: boolean; message?: string } => {
    const lot = harvests.find((h) => h.id === lotId && h.htxId === currentHTXId);
    if (!lot) return { success: false, message: 'Không tìm thấy lô thu hoạch.' };

    setHarvests((prev) =>
      prev.map((h) => (h.id === lotId ? { ...h, ...updatedData } : h))
    );
    return { success: true };
  };

  const allocateHarvestLot = (
    lotId: string,
    allocationData: Partial<HarvestAllocation>
  ): { success: boolean; message?: string } => {
    const lot = harvests.find((h) => h.id === lotId);
    if (!lot) return { success: false, message: 'Không tìm thấy lô thu hoạch.' };

    const currentAlloc = lot.allocation || {
      directSaleQuantity: 0,
      deliveredToHTXQuantity: 0,
      packagedAtFarmQuantity: 0,
      processedAtFarmQuantity: 0,
      remainingAvailable: lot.yieldQuantity,
    };

    const newAlloc = { ...currentAlloc, ...allocationData };
    const totalAllocated =
      (newAlloc.directSaleQuantity || 0) +
      (newAlloc.deliveredToHTXQuantity || 0) +
      (newAlloc.packagedAtFarmQuantity || 0) +
      (newAlloc.processedAtFarmQuantity || 0);

    if (totalAllocated > lot.yieldQuantity) {
      return {
        success: false,
        message: `Tổng sản lượng phân bổ (${totalAllocated.toLocaleString()} ${lot.unit}) vượt quá tổng sản lượng thu hoạch (${lot.yieldQuantity.toLocaleString()} ${lot.unit}).`,
      };
    }

    newAlloc.remainingAvailable = Math.max(0, lot.yieldQuantity - totalAllocated);

    setHarvests((prev) =>
      prev.map((h) => (h.id === lotId ? { ...h, allocation: newAlloc } : h))
    );

    // Đồng bộ số lượng tồn kho hàng thô tại hộ
    setProductStocks((prev) => {
      const existing = prev.find(
        (s) => s.harvestLotId === lotId && s.ownerType === 'ho_dan' && s.state === 'hang_tho'
      );
      if (existing) {
        return prev.map((s) =>
          s.id === existing.id
            ? { ...s, quantity: newAlloc.remainingAvailable, updatedAt: new Date().toISOString() }
            : s
        );
      }
      return prev;
    });

    return { success: true };
  };

  const addHarvestProcessingSession = (
    harvestLotId: string,
    processingData: {
      date: string;
      method: string;
      inputQuantity: number;
      outputQuantity: number;
      notes?: string;
      operatorName?: string;
    }
  ): { success: boolean; message?: string } => {
    const lot = harvests.find((h) => h.id === harvestLotId && h.htxId === currentHTXId);
    if (!lot) return { success: false, message: 'Không tìm thấy lô thu hoạch.' };

    if (!canManageProcessing(currentRole, lot.ownerId, currentUser.id)) {
      return { success: false, message: 'Bác không có quyền ghi nhận sơ chế cho lô này.' };
    }

    const input = processingData.inputQuantity;
    const output = processingData.outputQuantity;

    if (!input || input <= 0) return { success: false, message: 'Lượng đầu vào sơ chế phải lớn hơn 0.' };
    if (!output || output <= 0) return { success: false, message: 'Lượng đầu ra sau sơ chế phải lớn hơn 0.' };
    if (output > input) return { success: false, message: 'Đầu ra không được lớn hơn đầu vào.' };

    const isHTX = currentRole === 'R03' || currentRole === 'R02' || currentRole === 'R04';

    // Tìm tồn thô tương ứng
    const stockTho = productStocks.find((s) => s.htxId === currentHTXId && s.harvestLotId === harvestLotId && s.state === 'hang_tho' && s.quantity > 0 &&
      (isHTX ? (s.holderId === currentHTXId || (!s.holderId && s.ownerType === 'htx')) : (s.ownerId === currentUser.id && (!s.holderId || s.holderId === currentUser.id))));
    const balance = getHarvestBalance(lot, handovers, orders);
    const availableTho = stockTho
      ? isHTX ? stockTho.quantity : Math.min(stockTho.quantity, balance.availableQuantity)
      : isHTX
      ? 0
      : balance.availableQuantity;

    if (input > availableTho + 0.001) {
      return {
        success: false,
        message: `Khối lượng đưa vào sơ chế (${input.toLocaleString()} ${lot.unit}) vượt quá tồn hàng thô khả dụng (${availableTho.toLocaleString()} ${lot.unit}).`,
      };
    }

    const lossQuantity = Math.max(0, input - output);
    const lossRatePercent = Number(((lossQuantity / input) * 100).toFixed(2));
    const recoveryRatePercent = Number(((output / input) * 100).toFixed(2));
    const now = new Date().toISOString();

    const newProcInfo: ProcessingInfo = {
      id: `proc-${Date.now()}`,
      date: processingData.date,
      method: processingData.method,
      inputQuantity: input,
      outputQuantity: output,
      unit: lot.unit,
      lossQuantity,
      lossRatePercent,
      recoveryRatePercent,
      notes: processingData.notes || '',
      operatorName: processingData.operatorName || currentUser.name,
      updatedAt: now,
      updatedBy: currentUser.name,
    };

    // 1. Cập nhật HarvestLot
    setHarvests((prev) =>
      prev.map((h) => {
        if (h.id === harvestLotId) {
          const history = h.processingHistory || (h.processingInfo ? [h.processingInfo] : []);
          const currentAlloc = h.allocation || {
            directSaleQuantity: 0,
            deliveredToHTXQuantity: 0,
            packagedAtFarmQuantity: 0,
            processedAtFarmQuantity: 0,
            remainingAvailable: balance.householdQuantity,
          };
          return {
            ...h,
            processingStatus: 'da_so_che',
            processingInfo: newProcInfo,
            processingHistory: [newProcInfo, ...history],
            allocation: isHTX
              ? currentAlloc
              : {
                  ...currentAlloc,
                  processedAtFarmQuantity: currentAlloc.processedAtFarmQuantity + input,
                  remainingAvailable: balance.householdQuantity - input,
                },
          };
        }
        return h;
      })
    );

    // 2. Trừ tồn hàng thô
    setProductStocks((prev) => {
      let updated = prev.map((s) => {
        if (s.id === stockTho?.id) {
          return { ...s, quantity: s.quantity - input, updatedAt: now };
        }
        return s;
      });

      // 3. Tăng tồn sau sơ chế
      const newStockProcessed: ProductStockItem = {
        id: `stock-proc-${Date.now()}`,
        htxId: lot.htxId,
        harvestLotId: lot.id,
        harvestLotCode: lot.code,
        variety: `${lot.variety} (sau sơ chế)`,
        ownerType: isHTX ? (stockTho?.ownerType || 'htx') : 'ho_dan',
        ownerId: isHTX ? (stockTho?.ownerId || currentHTXId) : (lot.ownerId || currentUser.id),
        ownerName: isHTX ? (stockTho?.ownerName || currentHTX.name) : (lot.ownerName || currentUser.name),
        holderId: isHTX ? currentHTXId : (lot.ownerId || currentUser.id),
        holderName: isHTX ? currentHTX.name : (lot.ownerName || currentUser.name),
        handoverId: stockTho?.handoverId,
        locationName: isHTX
          ? `Kho lạnh ${currentHTX.shortName}`
          : `Kho bảo quản hộ ${lot.ownerName || currentUser.name}`,
        state: 'da_xu_ly',
        quantity: output,
        unit: lot.unit,
        spec: `${processingData.method} (thu hồi ${recoveryRatePercent}%)`,
        notes: processingData.notes || '',
        updatedAt: now,
      };

      return [newStockProcessed, ...updated];
    });

    // 4. Tạo bản ghi ProcessingLot
    const newProcLot: ProcessingLot = {
      id: `sc-${Date.now()}`,
      code: `SC-${currentHTXId.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`,
      htxId: currentHTXId,
      harvestLotId: lot.id,
      harvestLotCode: lot.code,
      farmZoneName: lot.farmZoneName,
      productName: lot.variety || lot.farmZoneName,
      date: processingData.date,
      method: processingData.method,
      inputQuantity: input,
      outputQuantity: output,
      unit: lot.unit,
      lossQuantity,
      lossRatePercent,
      operatorName: processingData.operatorName || currentUser.name,
      photoUrl: lot.photoUrl,
      notes: processingData.notes || '',
      status: 'Đã sơ chế',
    };
    setProcessingLots((prev) => [newProcLot, ...prev]);

    return { success: true };
  };

  const saveHarvestProcessing = (
    harvestLotId: string,
    processingData: {
      date: string;
      method: string;
      inputQuantity: number;
      outputQuantity: number;
      notes?: string;
      operatorName?: string;
      status?: 'da_so_che' | 'khong_so_che';
    }
  ): { success: boolean; message?: string } => {
    if (processingData.status === 'khong_so_che') {
      setHarvests((prev) =>
        prev.map((h) =>
          h.id === harvestLotId
            ? { ...h, processingStatus: 'khong_so_che', processingInfo: undefined }
            : h
        )
      );
      return { success: true };
    }

    return addHarvestProcessingSession(harvestLotId, {
      date: processingData.date,
      method: processingData.method,
      inputQuantity: processingData.inputQuantity,
      outputQuantity: processingData.outputQuantity,
      notes: processingData.notes,
      operatorName: processingData.operatorName,
    });
  };

  const addProductHandover = (
    data: Omit<ProductHandover, 'id' | 'code' | 'createdAt' | 'status'>
  ): { success: boolean; message?: string; handover?: ProductHandover } => {
    const lot = harvests.find((h) => h.id === data.harvestLotId && h.htxId === currentHTXId);
    if (!lot || data.htxId !== currentHTXId) {
      return { success: false, message: 'Lô thu hoạch không tồn tại hoặc không thuộc HTX hiện tại.' };
    }

    // Phân quyền: R06 tạo cho lô của mình; R03 tạo thay hộ (khi có uỷ quyền/xác nhận từ hộ)
    const isOwnerR06 = currentRole === 'R06' && lot.ownerId === currentUser.id && data.senderId === currentUser.id;
    const isActingR03 = currentRole === 'R03' && data.onBehalfOfFarmer === true && lot.ownerId === data.senderId;

    if (!isOwnerR06 && !isActingR03) {
      return {
        success: false,
        message: 'Bạn không có quyền lập phiếu giao HTX cho lô thu hoạch này.',
      };
    }

    // Nếu R03 thao tác thay hộ: Bắt buộc phải có phương thức xác nhận, trừ khi chọn lưu nháp
    if (isActingR03 && !data.isDraft && !data.confirmationMethod) {
      return {
        success: false,
        message: 'Cần có phương thức xác nhận của hộ nông dân (trực tiếp, điện thoại hoặc giấy ủy quyền) trước khi gửi phiếu giao HTX.',
      };
    }

    const targetStock = data.stockItemId
      ? productStocks.find((s) => s.id === data.stockItemId && s.htxId === currentHTXId)
      : undefined;

    if (targetStock) {
      if (targetStock.ownerId !== lot.ownerId) {
        return { success: false, message: 'Dòng tồn này không thuộc quyền sở hữu của hộ.' };
      }
      if (!sameUnit(data.unit, targetStock.unit)) {
        return { success: false, message: `Đơn vị giao phải là ${targetStock.unit}.` };
      }
      const available = getStockItemAvailableQuantity(targetStock, orders, handovers).availableQuantity;
      if (data.declaredQuantity > available + 0.001) {
        return { success: false, message: `Số lượng giao (${data.declaredQuantity} ${data.unit}) vượt quá tồn khả dụng (${available} ${data.unit}) của dòng tồn này.` };
      }
    } else {
      if (data.productState === 'da_dong_goi') {
        return { success: false, message: 'Không thể lập phiếu giao hàng đóng gói khi chưa chọn dòng tồn đóng gói cụ thể.' };
      }
      const quantityError = validateHandoverQuantity(lot, handovers, orders, data.declaredQuantity, data.unit);
      if (quantityError) return { success: false, message: quantityError };
    }

    // Chặn gửi trùng phiếu liên tiếp
    const isDuplicate = handovers.some(
      (h) =>
        h.status === 'cho_kiem_nhan' &&
        h.harvestLotId === data.harvestLotId &&
        h.stockItemId === data.stockItemId &&
        h.senderId === data.senderId &&
        h.declaredQuantity === data.declaredQuantity &&
        Math.abs(Date.now() - new Date(h.createdAt).getTime()) < 3000
    );
    if (isDuplicate) {
      return { success: false, message: 'Phiếu giao hàng này vừa được gửi, vui lòng không bấm liên tiếp.' };
    }

    const newCode = `GN-${currentHTXId.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`;
    const resolvedProductState = targetStock ? targetStock.state : (data.productState || 'hang_tho');
    const newHandover: ProductHandover = {
      ...data,
      id: `gn-${Date.now()}`,
      code: newCode,
      createdAt: new Date().toISOString(),
      status: 'cho_kiem_nhan',
      isDraft: data.isDraft || false,
      productState: resolvedProductState,
      packageId: data.packageId || targetStock?.packageId,
      packageCode: data.packageCode || targetStock?.packageCode,
      processingLotId: data.processingLotId || targetStock?.processingLotId,
      netWeightPerPack: data.netWeightPerPack || targetStock?.netWeightPerPack,
      totalNetWeight: data.totalNetWeight || (targetStock?.netWeightPerPack ? data.declaredQuantity * targetStock.netWeightPerPack : undefined),
      packageSpec: data.packageSpec || targetStock?.spec,
      transportPackaging: data.transportPackaging,
      createdBy: currentUser.name,
      actorId: currentUser.id,
      actorName: currentUser.name,
      onBehalfOfFarmer: isActingR03,
      confirmationMethod: data.confirmationMethod,
      confirmationTime: data.confirmationTime || (data.confirmationMethod ? new Date().toISOString() : undefined),
      confirmationNote: data.confirmationNote,
      receivedQuantity: undefined,
      totalAmount: undefined,
      paidAmount: undefined,
    };
    // Phiếu chờ chỉ giữ chỗ qua ledger; hàng vẫn ở hộ và chưa được tính là HTX thực nhận.
    setHandovers((prev) => [newHandover, ...prev]);

    // Bắn thông báo nếu không phải bản nháp
    if (!newHandover.isDraft) {
      setNotifications((prev) => [
        ...Object.values(DEMO_USERS).filter((recipient) => recipient.htxId === currentHTXId && canConfirmHandover(recipient.role)).map((recipient) => ({
          id: `notif-${newHandover.id}-${recipient.id}`,
          htxId: currentHTXId,
          userId: recipient.id,
          title: '📥 Yêu cầu giao nông sản mới từ hộ',
          summary: `Hộ ${data.senderName}${isActingR03 ? ` (Cán bộ ${currentUser.name} ghi thay)` : ''} tạo phiếu ${newCode}: giao ${data.declaredQuantity} ${data.unit} ${data.variety}.`,
          content: `Hộ ${data.senderName} ${isActingR03 ? `(do Cán bộ kỹ thuật ${currentUser.name} lập thay)` : ''} đã gửi phiếu giao nông sản mã ${newCode} với sản lượng ${data.declaredQuantity} ${data.unit} (${data.handoverType === 'mua_dut' ? 'Bán đứt cho HTX' : 'Ký gửi HTX'}). Thủ kho/Kế toán vui lòng kiểm nhận thực tế.`,
          date: 'Vừa xong',
          type: 'approval',
          isRead: false,
          actionScreen: 'handover_detail',
          actionParams: { handoverId: newHandover.id },
          actionLabel: 'Kiểm nhận giao hàng',
        } as AppNotification)),
        ...(isActingR03 ? [{
          id: `notif-${newHandover.id}-farmer`,
          htxId: currentHTXId,
          userId: data.senderId,
          title: '📋 Cán bộ HTX đã lập phiếu giao thay cho hộ',
          summary: `Cán bộ ${currentUser.name} đã ghi nhận phiếu giao ${newCode} (${data.declaredQuantity} ${data.unit}) thay cho hộ bác.`,
          content: `Phiếu giao nông sản ${newCode} đã được lập thay hộ qua hình thức xác nhận: ${data.confirmationMethod === 'truc_tiep' ? 'Trực tiếp' : data.confirmationMethod === 'dien_thoai' ? 'Điện thoại' : 'Giấy ủy quyền'}.`,
          date: 'Vừa xong',
          type: 'system',
          isRead: false,
          actionScreen: 'handover_detail',
          actionParams: { handoverId: newHandover.id },
        } as AppNotification] : []),
        ...prev,
      ]);
    }

    return { success: true, handover: newHandover };
  };

  const confirmProductHandover = (
    handoverId: string,
    receivedQuantity: number,
    qualityAssessment: string,
    notes?: string
  ): { success: boolean; message?: string } => {
    if (!canConfirmHandover(currentRole)) {
      return { success: false, message: 'Chỉ Kế toán/Thủ kho (R04) hoặc Ban Quản trị (R02) mới có quyền kiểm nhận đối soát.' };
    }

    const handover = handovers.find((h) => h.id === handoverId && h.htxId === currentHTXId);
    if (!handover) {
      return { success: false, message: 'Không tìm thấy phiếu giao nhận.' };
    }
    if (handover.status !== 'cho_kiem_nhan') {
      return { success: false, message: 'Phiếu này đã được xử lý kiểm nhận trước đó.' };
    }
    const lot = harvests.find((item) => item.id === handover.harvestLotId && item.htxId === currentHTXId);
    if (!lot || lot.ownerId !== handover.senderId) return { success: false, message: 'Lô và hộ giao trên phiếu không khớp.' };

    const targetStock = handover.stockItemId
      ? productStocks.find((s) => s.id === handover.stockItemId && s.htxId === currentHTXId)
      : undefined;

    if (targetStock) {
      if (!sameUnit(handover.unit, targetStock.unit)) {
        return { success: false, message: 'Đơn vị phiếu không khớp với dòng tồn.' };
      }
      const availableWithDeclared = getStockItemAvailableQuantity(targetStock, orders, handovers).availableQuantity + handover.declaredQuantity;
      if (receivedQuantity > availableWithDeclared + 0.001) {
        return { success: false, message: `Số lượng thực nhận (${receivedQuantity} ${handover.unit}) vượt quá số lượng của dòng tồn (${availableWithDeclared} ${handover.unit}).` };
      }
    } else {
      const quantityError = validateReceiptQuantity(lot, handover, handovers, orders, receivedQuantity);
      if (quantityError) return { success: false, message: quantityError };
    }

    const diff = receivedQuantity - handover.declaredQuantity;
    const now = new Date().toISOString();

    // 1. Cập nhật phiếu giao nhận
    setHandovers((prev) =>
      prev.map((h) =>
        h.id === handoverId
          ? {
              ...h,
              receivedQuantity,
              differenceQuantity: diff,
              qualityAssessment,
              status: 'da_kiem_nhan',
              receiverId: currentUser.id,
              receiverName: currentUser.name,
              confirmedAt: now,
              notes: notes || h.notes,
              totalAmount: h.handoverType === 'mua_dut' ? receivedQuantity * (h.agreedUnitPrice || h.unitPrice || 0) : undefined,
              estimatedTotalAmount: h.handoverType === 'mua_dut' ? h.declaredQuantity * (h.agreedUnitPrice || h.unitPrice || 0) : undefined,
              paidAmount: h.handoverType === 'mua_dut' ? (h.paidAmount || 0) : undefined,
              paymentStatus: h.handoverType === 'mua_dut' ? (h.paymentStatus || 'chua_thanh_toan') : undefined,
              doiSoatStatus: diff === 0 ? 'da_khop' : 'cho_doi_soat',
            }
          : h
      )
    );

    // Chỉ khi kiểm nhận mới chuyển nơi giữ hàng; ký gửi không chuyển quyền sở hữu.
    const newStockItem = stockAfterReceipt(handover, currentHTX, receivedQuantity, qualityAssessment, now);
    if (!targetStock || targetStock.state === 'hang_tho') {
      setHarvests((prev) => prev.map((item) => item.id === lot.id ? {
        ...item,
        allocation: allocationAfterReceipt(item, handovers, orders, receivedQuantity),
      } : item));
    } else {
      // Hàng đã qua sơ chế hoặc đóng gói: không trừ lại remainingAvailable của lô thô nguồn
      setHarvests((prev) => prev.map((item) => item.id === lot.id ? {
        ...item,
        allocation: item.allocation ? {
          ...item.allocation,
          deliveredToHTXQuantity: (item.allocation.deliveredToHTXQuantity || 0) + receivedQuantity,
        } : undefined,
      } : item));
    }

    setProductStocks((prev) => {
      let needed = receivedQuantity;
      const updated = prev.map((stock) => {
        if (targetStock && stock.id === targetStock.id) {
          return { ...stock, quantity: Math.max(0, stock.quantity - receivedQuantity), updatedAt: now };
        }
        if (!targetStock) {
          if (stock.harvestLotId !== lot.id || stock.htxId !== currentHTXId || stock.ownerId !== lot.ownerId || (stock.holderId && stock.holderId !== lot.ownerId) || stock.state !== 'hang_tho' || needed <= 0) return stock;
          const take = Math.min(stock.quantity, needed);
          needed -= take;
          return { ...stock, quantity: stock.quantity - take, updatedAt: now };
        }
        return stock;
      });
      return [newStockItem, ...updated];
    });

    // 4. Bắn thông báo kết quả đối soát cho hộ
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        htxId: handover.htxId,
        userId: handover.senderId,
        title: '✅ Kết quả kiểm nhận nông sản giao HTX',
        summary: `Phiếu ${handover.code}: HTX đã nhận ${receivedQuantity} ${handover.unit} (khai báo ${handover.declaredQuantity} ${handover.unit}).`,
        content: `Thủ kho HTX đã hoàn tất kiểm nhận phiếu ${handover.code}. Số lượng thực nhận: ${receivedQuantity} ${handover.unit}${diff !== 0 ? ` (Chênh lệch: ${diff > 0 ? `thừa ${diff}` : `thiếu ${-diff}`} ${handover.unit})` : ''}. Đánh giá chất lượng: ${qualityAssessment}.`,
        date: 'Vừa xong',
        type: 'system',
        isRead: false,
        actionScreen: 'handover_detail',
        actionParams: { handoverId },
      },
      ...prev,
    ]);

    return { success: true };
  };

  const rejectProductHandover = (handoverId: string, reason: string): { success: boolean; message?: string } => {
    if (!canConfirmHandover(currentRole)) {
      return { success: false, message: 'Chỉ Kế toán/Thủ kho (R04) hoặc Ban Quản trị (R02) mới có quyền từ chối.' };
    }

    const handover = handovers.find((h) => h.id === handoverId && h.htxId === currentHTXId);
    if (!handover || handover.status !== 'cho_kiem_nhan') {
      return { success: false, message: 'Phiếu giao nhận không hợp lệ hoặc đã xử lý.' };
    }

    setHandovers((prev) =>
      prev.map((h) => (h.id === handoverId ? { ...h, status: 'tu_choi', notes: reason, confirmedAt: new Date().toISOString() } : h))
    );

    // Phiếu chờ chỉ giữ chỗ, nên từ chối tự giải phóng lượng giữ mà không hoàn kho hai lần.
    setNotifications((prev) => [{
      id: `notif-${Date.now()}`, htxId: handover.htxId, userId: handover.senderId,
      title: 'Phiếu giao HTX bị từ chối', summary: `Phiếu ${handover.code}: ${reason}`,
      content: `HTX chưa nhận hàng từ phiếu ${handover.code}. Lượng ${handover.declaredQuantity} ${handover.unit} đã được mở lại để hộ sử dụng.`,
      date: 'Vừa xong', type: 'system', isRead: false,
      actionScreen: 'handover_detail', actionParams: { handoverId },
    }, ...prev]);

    return { success: true };
  };

  const disputeProductHandover = (
    handoverId: string,
    disputeNote: string
  ): { success: boolean; message?: string } => {
    const handover = handovers.find((h) => h.id === handoverId && h.htxId === currentHTXId);
    if (!handover || handover.status !== 'da_kiem_nhan' || currentRole !== 'R06' || handover.senderId !== currentUser.id || !disputeNote.trim()) return { success: false, message: 'Không có quyền gửi ý kiến cho phiếu này.' };

    setHandovers((prev) =>
      prev.map((h) =>
        h.id === handoverId
          ? { ...h, disputeNote, doiSoatStatus: 'khieu_nai' }
          : h
      )
    );

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        htxId: handover.htxId,
        title: '⚠️ Ý kiến đối soát cân đo từ hộ xã viên',
        summary: `Hộ ${handover.senderName} gửi phản hồi phiếu ${handover.code}: "${disputeNote}"`,
        content: `Hộ ${handover.senderName} có ý kiến về số liệu cân thực nhận trên phiếu ${handover.code}. Nội dung: "${disputeNote}". Vui lòng kiểm tra lại cân đối soát.`,
        date: 'Vừa xong',
        type: 'alert',
        isRead: false,
        actionScreen: 'handover_detail',
        actionParams: { handoverId },
      },
      ...prev,
    ]);

    return { success: true };
  };

  const confirmDoiSoatHandover = (
    handoverId: string,
    notes?: string
  ): { success: boolean; message?: string } => {
    const handover = handovers.find((h) => h.id === handoverId && h.htxId === currentHTXId);
    if (!handover || handover.status !== 'da_kiem_nhan' || !canConfirmHandover(currentRole)) return { success: false, message: 'Không có quyền chốt đối soát phiếu này.' };

    const isLech = (handover.differenceQuantity || 0) !== 0;
    setHandovers((prev) =>
      prev.map((h) =>
        h.id === handoverId
          ? {
              ...h,
              doiSoatStatus: isLech ? 'lech_da_xac_nhan' : 'da_khop',
              notes: notes ? `${h.notes || ''} | Đã chốt đối soát: ${notes}` : h.notes,
            }
          : h
      )
    );

    return { success: true };
  };

  const generateLotQRCode = (lotId: string): { success: boolean; qrCodeUrl: string; message?: string } => {
    const lot = harvests.find((h) => h.id === lotId);
    if (!lot) return { success: false, qrCodeUrl: '', message: 'Không tìm thấy lô thu hoạch.' };

    const qrUrl = `https://hungyen-htx.vn/trace/lot/${lot.code}`;
    setHarvests((prev) => prev.map((h) => (h.id === lotId ? { ...h, qrCodeUrl: qrUrl } : h)));
    return { success: true, qrCodeUrl: qrUrl };
  };

  const updateDeliveryProgress = (
    orderId: string,
    data: {
      deliveredQuantity: number;
      deliveryProofPhoto?: string;
      deliveryNotes?: string;
      deliveryStatus?: 'dang_giao' | 'da_giao';
    }
  ): { success: boolean; message?: string } => {
    const order = orders.find((o) => o.id === orderId && o.htxId === currentHTXId);
    if (!order || !(['R02', 'R04'].includes(currentRole) || (currentRole === 'R06' && order.sellerType === 'ho_dan' && order.sellerId === currentUser.id))) return { success: false, message: 'Không có quyền cập nhật giao hàng của đơn này.' };

    if (!Number.isFinite(data.deliveredQuantity) || data.deliveredQuantity < (order.deliveredQuantity || 0) || data.deliveredQuantity > order.quantity) {
      return {
        success: false,
        message: `Số lượng giao (${data.deliveredQuantity} ${order.unit}) vượt quá số lượng đặt (${order.quantity} ${order.unit}).`,
      };
    }

    const prevDelivered = order.deliveredQuantity || 0;
    const delta = data.deliveredQuantity - prevDelivered;
    const isDone = data.deliveredQuantity >= order.quantity;

    if (delta > 0) {
      const now = new Date().toISOString();
      setProductStocks((prev) => {
        let needed = order.sellerType === 'ho_dan' ? delta : 0;
        return prev.map((st) => {
          if (order.stockItemId && st.id === order.stockItemId) {
            return { ...st, quantity: Math.max(0, st.quantity - delta), updatedAt: now };
          }
          if (
            needed > 0 &&
            st.htxId === currentHTXId &&
            st.harvestLotId === order.harvestLotId &&
            st.ownerId === order.sellerId &&
            (!st.holderId || st.holderId === order.sellerId)
          ) {
            const deduct = Math.min(st.quantity, needed);
            needed -= deduct;
            return { ...st, quantity: Math.max(0, st.quantity - deduct), updatedAt: now };
          }
          return st;
        });
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              deliveredQuantity: data.deliveredQuantity,
              deliveryStatus: isDone ? 'da_giao' : (data.deliveryStatus || 'dang_giao'),
              status: isDone ? 'Hoàn thành' : 'Đang giao',
              deliveryDate: new Date().toISOString(),
              deliveryProofPhoto: data.deliveryProofPhoto || o.deliveryProofPhoto,
              deliveryNotes: data.deliveryNotes || o.deliveryNotes,
            }
          : o
      )
    );

    return { success: true };
  };

  const updateProductionTask = (
    taskId: string,
    data: Partial<ProductionTask>
  ): { success: boolean; message?: string } => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: 'Không tìm thấy việc cần làm.' };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              ...data,
              completedAt: data.status === 'da_lam' ? new Date().toISOString() : t.completedAt,
            }
          : t
      )
    );

    return { success: true };
  };

  const createServiceRequestTask = (data: {
    farmZoneId: string;
    cycleId: string;
    serviceType: 'gat' | 'cay' | 'say' | 'vat_tu' | 'khac';
    requestedDate: string;
    description?: string;
    quantity?: number;
    unit?: string;
  }): { success: boolean; message?: string; task?: ProductionTask } => {
    if (!['R03', 'R06'].includes(currentRole)) return { success: false, message: 'Vai trò này không được đăng ký dịch vụ sản xuất.' };
    const zone = farmZones.find((z) => z.id === data.farmZoneId && z.htxId === currentHTXId);
    if (!zone || (currentRole === 'R06' && zone.ownerId !== currentUser.id)) return { success: false, message: 'Không tìm thấy nơi sản xuất được phân công trong HTX hiện tại.' };
    const cycle = getCycles(zone).find((item) => (item.cycleId || item.seasonId) === data.cycleId);
    if (!cycle || !getCycleStatusInfo(cycle.status).isActive) return { success: false, message: 'Hãy chọn vụ/lứa đang thực hiện của nơi sản xuất.' };

    const typeLabels = {
      gat: 'Dịch vụ gặt đập liên hợp',
      cay: 'Dịch vụ cấy máy',
      say: 'Dịch vụ sấy thóc tập trung',
      vat_tu: 'Đăng ký cấp phát vật tư',
      khac: 'Dịch vụ nông nghiệp',
    };

    const newTask: ProductionTask = {
      id: `task-${Date.now()}`,
      htxId: zone.htxId,
      title: `${typeLabels[data.serviceType]} - ${zone.name}`,
      description: data.description || `Hộ đề nghị hỗ trợ dịch vụ ${typeLabels[data.serviceType]} cho diện tích ${zone.areaOrQuantity}`,
      farmZoneId: zone.id,
      farmZoneName: zone.name,
      cycleId: cycle.cycleId || cycle.seasonId,
      cycleName: cycle.seasonName,
      assignedTo: currentUser.phone || currentUser.id,
      assigneeName: currentUser.name,
      dueDate: data.requestedDate,
      status: 'chua_lam',
      taskCategory: 'dich_vu_htx',
      actualQuantity: data.quantity,
      actualUnit: data.unit || 'sào',
      serviceRequest: {
        serviceType: data.serviceType,
        requestedDate: data.requestedDate,
        actualQuantity: data.quantity,
        unit: data.unit,
        status: 'cho_xep_lich',
      },
    };

    setTasks((prev) => [newTask, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        htxId: zone.htxId,
        title: '🚜 Đăng ký dịch vụ cơ giới / sấy mới',
        summary: `Hộ ${currentUser.name} gửi yêu cầu ${typeLabels[data.serviceType]} ngày ${data.requestedDate}.`,
        content: `Hộ ${currentUser.name} đã đăng ký ${typeLabels[data.serviceType]} cho thửa ${zone.name}. Ban quản lý dịch vụ HTX vui lòng bố trí lịch máy.`,
        date: 'Vừa xong',
        type: 'reminder',
        isRead: false,
      },
      ...prev,
    ]);

    return { success: true, task: newTask };
  };

  const requestLivestockSale = (
    taskId: string,
    birdCount: number,
    sampleWeightKg: number,
    notes?: string
  ): { success: boolean; message?: string } => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: 'Không tìm thấy lứa nuôi.' };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              livestockLog: {
                ...t.livestockLog,
                salesRequestStatus: 'cho_duyet',
                salesRequestNotes: notes || `Đề nghị xuất bán ${birdCount} con, cân nặng mẫu ${sampleWeightKg} kg/con.`,
              },
            }
          : t
      )
    );

    return { success: true };
  };

  const addCustomerFeedback = (
    feedback: Omit<CustomerFeedback, 'id' | 'feedbackDate' | 'status'>
  ): { success: boolean; message?: string; feedback?: CustomerFeedback } => {
    const newFeedback: CustomerFeedback = {
      ...feedback,
      id: `fb-${Date.now()}`,
      feedbackDate: new Date().toISOString().split('T')[0],
      status: 'cho_xu_ly',
    };

    setFeedbacks((prev) => [newFeedback, ...prev]);
    return { success: true, feedback: newFeedback };
  };

  const resolveCustomerFeedback = (
    feedbackId: string,
    resolutionNotes: string,
    status: 'dang_xu_ly' | 'da_giai_quyet' = 'da_giai_quyet'
  ): { success: boolean; message?: string } => {
    const fb = feedbacks.find((f) => f.id === feedbackId);
    if (!fb) return { success: false, message: 'Không tìm thấy phản hồi.' };

    setFeedbacks((prev) =>
      prev.map((f) =>
        f.id === feedbackId
          ? {
              ...f,
              status,
              resolutionNotes,
              resolvedBy: currentUser.name,
              resolvedDate: new Date().toISOString().split('T')[0],
            }
          : f
      )
    );

    return { success: true };
  };

  const getMobileQuickSummary = () => {
    const todayStr = new Date().toISOString().split('T')[0];

    const htxTasks = tasks.filter((t) => {
      if (t.htxId !== currentHTXId) return false;
      if (currentRole === 'R06' && currentUser.phone && t.assignedTo !== currentUser.phone) return false;
      return true;
    });

    const overdueTasksCount = htxTasks.filter(
      (t) => t.status === 'tre' || (t.status === 'chua_lam' && t.dueDate < todayStr)
    ).length;

    const pendingTasksCount = htxTasks.filter((t) => t.status === 'chua_lam').length;

    const htxHandovers = handovers.filter((h) => {
      if (h.htxId !== currentHTXId) return false;
      if (currentRole === 'R06' && h.senderId !== currentUser.id) return false;
      return true;
    });

    const pendingHandoversCount = htxHandovers.filter((h) => h.status === 'cho_kiem_nhan').length;

    const htxOrders = orders.filter((o) => {
      if (o.htxId !== currentHTXId) return false;
      if (currentRole === 'R06' && o.sellerId !== currentUser.id && o.sourceOwnerId !== currentUser.id) return false;
      return true;
    });

    const pendingDeliveryOrdersCount = htxOrders.filter(
      (o) => o.status === 'Đang giao' || o.deliveryStatus === 'dang_giao' || o.deliveryStatus === 'chua_giao'
    ).length;

    const htxFeedbacks = feedbacks.filter((f) => f.htxId === currentHTXId);
    const pendingFeedbacksCount = htxFeedbacks.filter((f) => f.status === 'cho_xu_ly' || f.status === 'dang_xu_ly').length;

    const htxZones = farmZones.filter((z) => {
      if (z.htxId !== currentHTXId) return false;
      if (currentRole === 'R06' && z.ownerId !== currentUser.id && z.ownerName !== currentUser.name) return false;
      return true;
    });

    const isLivestock = currentHTXId === 'dongtao';
    const yieldUnit = isLivestock ? 'con' : 'kg';

    // Chuẩn hóa sản lượng dự kiến và thực tế về cùng đơn vị (kg hoặc con)
    // Chỉ tính từ các đơn vị đang sử dụng VÀ có vụ/lứa đang thực hiện
    const totalEstimatedYield = htxZones.reduce((sum, z) => {
      if (z.unitStatus === 'tam_ngung' || z.unitStatus === 'ngung_su_dung' || z.status === 'tam_ngung') {
        return sum;
      }
      const activeCycle = getActiveCycle(z);
      if (!activeCycle) {
        return sum;
      }
      const val = activeCycle.expectedYieldValue ?? z.expectedYieldValue ?? 0;
      const unit = activeCycle.expectedYieldUnit || z.expectedYieldUnit;
      if (isLivestock || unit === 'con') {
        return sum + val;
      }
      if (unit === 'tấn') {
        return sum + val * 1000;
      }
      if (unit === 'tạ') {
        return sum + val * 100;
      }
      return sum + val;
    }, 0);

    const htxHarvests = harvests.filter((h) => {
      if (h.htxId !== currentHTXId) return false;
      if (currentRole === 'R06' && h.ownerId !== currentUser.id && h.ownerName !== currentUser.name) return false;
      return true;
    });

    const totalActualYield = htxHarvests.reduce((sum, h) => {
      const val = h.yieldQuantity || 0;
      if (isLivestock || h.unit === 'con') {
        return sum + val;
      }
      if (h.unit === 'tấn') {
        return sum + val * 1000;
      }
      if (h.unit === 'tạ') {
        return sum + val * 100;
      }
      return sum + val;
    }, 0);

    return {
      overdueTasksCount,
      pendingTasksCount,
      pendingHandoversCount,
      pendingDeliveryOrdersCount,
      pendingFeedbacksCount,
      totalEstimatedYield,
      totalActualYield,
      yieldUnit,
    };
  };

  const createDiaryAdjustmentRequest = (data: {
    diaryId: string;
    reason: string;
    proposedNotes: string;
    proposedWorkTypeName?: string;
    proposedSuppliesUsed?: string;
  }): { success: boolean; message?: string } => {
    const entry = diaries.find((d) => d.id === data.diaryId);
    if (!entry) return { success: false, message: 'Không tìm thấy nhật ký.' };

    const newReq: DiaryAdjustmentRequest = {
      id: `adj-${Date.now()}`,
      htxId: entry.htxId,
      diaryId: entry.id,
      farmZoneId: entry.farmZoneId,
      farmZoneName: entry.farmZoneName,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      reason: data.reason,
      originalNotes: entry.notes,
      originalWorkTypeName: entry.workTypeName,
      proposedNotes: data.proposedNotes,
      proposedWorkTypeName: data.proposedWorkTypeName,
      proposedSuppliesUsed: data.proposedSuppliesUsed,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setDiaryAdjustments((prev) => [newReq, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        htxId: entry.htxId,
        title: '📋 Đề nghị điều chỉnh nhật ký sản xuất',
        summary: `Hộ ${currentUser.name} gửi phiếu điều chỉnh cho nhật ký ngày ${entry.date}.`,
        content: `Lý do: ${data.reason}. Ban Quản trị HTX vui lòng xem xét và phê duyệt theo đúng quy trình kiểm toán VietGAP.`,
        date: 'Vừa xong',
        type: 'approval',
        isRead: false,
        actionScreen: 'diary_detail',
      },
      ...prev,
    ]);

    return { success: true };
  };

  const approveDiaryAdjustmentRequest = (
    requestId: string,
    reviewNotes?: string
  ): { success: boolean; message?: string } => {
    if (!canApproveDiaryAdjustment(currentRole)) {
      return { success: false, message: 'Chỉ Ban Quản trị HTX (R02) mới có quyền duyệt phiếu điều chỉnh nhật ký.' };
    }

    const req = diaryAdjustments.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'Không tìm thấy phiếu yêu cầu.' };

    const now = new Date().toISOString();
    setDiaryAdjustments((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              reviewerId: currentUser.id,
              reviewerName: currentUser.name,
              reviewedAt: now,
              reviewNotes,
            }
          : r
      )
    );

    setDiaries((prev) =>
      prev.map((d) => {
        if (d.id === req.diaryId) {
          const history = d.adjustmentHistory || [];
          return {
            ...d,
            notes: req.proposedNotes || d.notes,
            workTypeName: req.proposedWorkTypeName || d.workTypeName,
            suppliesUsed: req.proposedSuppliesUsed || d.suppliesUsed,
            adjustmentHistory: [
              {
                date: now.slice(0, 10),
                reviewer: currentUser.name,
                reason: req.reason,
                changeSummary: `Đổi ghi chú thành: "${req.proposedNotes}". ${req.proposedSuppliesUsed ? `Vật tư: "${req.proposedSuppliesUsed}".` : ''}`,
              },
              ...history,
            ],
          };
        }
        return d;
      })
    );

    return { success: true };
  };

  const rejectDiaryAdjustmentRequest = (
    requestId: string,
    reviewNotes: string
  ): { success: boolean; message?: string } => {
    if (!canApproveDiaryAdjustment(currentRole)) {
      return { success: false, message: 'Chỉ Ban Quản trị HTX (R02) mới có quyền từ chối.' };
    }

    setDiaryAdjustments((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              reviewerId: currentUser.id,
              reviewerName: currentUser.name,
              reviewedAt: new Date().toISOString(),
              reviewNotes,
            }
          : r
      )
    );

    return { success: true };
  };

  const addProcessingLot = (lot: Omit<ProcessingLot, 'id' | 'code'>): ProcessingLot => {
    const randomCode = `SC-${currentHTXId.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newLot: ProcessingLot = {
      ...lot,
      id: `sc-${Date.now()}`,
      code: randomCode,
    };
    setProcessingLots((prev) => [newLot, ...prev]);

    if (!API_CONFIG.USE_MOCK) {
      processingService.createProcessingLot(newLot).catch((err) => {
        console.error('Lỗi lưu lô sơ chế qua API:', err);
      });
    }

    return newLot;
  };

  const addPackage = (pkg: Omit<PackagedProduct, 'id' | 'code' | 'qrCodeUrl'>): PackagedProduct => {
    const harvestLot = harvests.find((h) => h.id === pkg.harvestLotId);
    if (!harvestLot) {
      throw new Error('Không tìm thấy lô thu hoạch được gắn tem đóng gói.');
    }

    const targetStock = pkg.sourceStockItemId
      ? productStocks.find((s) => s.id === pkg.sourceStockItemId)
      : undefined;

    const ownerIdToCheck = targetStock ? targetStock.ownerId : harvestLot.ownerId;
    if (!canManagePackaging(currentRole, ownerIdToCheck, currentUser.id)) {
      throw new Error('Bạn không có quyền thực hiện đóng gói và phát hành tem QR cho lô này.');
    }

    const ownerType: StockOwnerType = targetStock?.ownerType ||
      (harvestLot.ownerId && harvestLot.ownerId !== 'htx' && harvestLot.ownerId !== currentHTXId ? 'ho_dan' : 'htx');
    const isHTX = ownerType === 'htx';

    const weightPerPack = pkg.netWeightPerPack || 1;
    const neededWeight = pkg.packQuantity * weightPerPack;

    if (pkg.packQuantity <= 0) {
      throw new Error('Số lượng bao gói phải lớn hơn 0.');
    }

    // Kiểm tra tồn kho khả dụng
    if (targetStock) {
      const stockBalance = getStockItemAvailableQuantity(targetStock, orders, handovers);
      if (neededWeight > stockBalance.availableQuantity + 0.001) {
        throw new Error(
          `Khối lượng đóng gói (${neededWeight} ${targetStock.unit}) vượt quá lượng khả dụng của dòng tồn (${stockBalance.availableQuantity} ${targetStock.unit}).`
        );
      }
    } else {
      const sourceBatches: SourceBatchContribution[] = pkg.sourceBatches && pkg.sourceBatches.length > 0
        ? pkg.sourceBatches
        : [{
            harvestLotId: harvestLot.id,
            harvestLotCode: harvestLot.code,
            ownerId: harvestLot.ownerId,
            ownerName: harvestLot.ownerName,
            quantity: neededWeight,
            unit: pkg.netWeightUnit || harvestLot.unit,
          }];

      for (const b of sourceBatches) {
        const matchingStocks = productStocks.filter(
          (s) => s.harvestLotId === b.harvestLotId && s.ownerType === ownerType && (s.state === 'hang_tho' || s.state === 'da_xu_ly')
        );
        const totalAvailable = matchingStocks.reduce((sum, s) => sum + s.quantity, 0);

        const hLot = harvests.find((h) => h.id === b.harvestLotId);
        const fallbackAvailable = isHTX
          ? (hLot?.allocation?.deliveredToHTXQuantity || 0)
          : (hLot?.allocation?.remainingAvailable ?? hLot?.yieldQuantity ?? 0);

        const effectiveAvailable = matchingStocks.length > 0 ? totalAvailable : fallbackAvailable;

        if (b.quantity > effectiveAvailable + 0.001) {
          throw new Error(
            `Khối lượng đóng gói từ lô ${b.harvestLotCode} (${b.quantity} ${b.unit}) vượt quá tồn kho khả dụng (${effectiveAvailable} ${b.unit}).`
          );
        }
      }
    }

    // Kiểm tra ngày đóng gói & hạn sử dụng
    if (pkg.createdDate < harvestLot.date) {
      throw new Error(`Ngày đóng gói (${pkg.createdDate}) không được trước ngày thu hoạch (${harvestLot.date}).`);
    }

    const procLot = processingLots.find((p) => p.id === (targetStock?.processingLotId || pkg.processingLotId) || p.harvestLotId === harvestLot.id);
    const procDate = procLot?.date || harvestLot.processingInfo?.date || (targetStock?.state === 'da_xu_ly' ? targetStock?.updatedAt.slice(0, 10) : undefined);
    if ((targetStock?.state === 'da_xu_ly' || harvestLot.processingStatus === 'da_so_che') && procDate && pkg.createdDate < procDate) {
      throw new Error(`Ngày đóng gói (${pkg.createdDate}) không được trước ngày sơ chế (${procDate}).`);
    }

    if (!pkg.isLiveProduct && pkg.expiryDate && pkg.expiryDate <= pkg.createdDate) {
      throw new Error('Hạn sử dụng khuyến nghị phải sau ngày đóng gói.');
    }

    const now = new Date().toISOString();
    const randomCode = `SP-${(targetStock?.htxId || pkg.htxId || currentHTXId).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newPkgId = `pkg-${Date.now()}`;
    const fullTraceCode = `TXNG-HY-${randomCode}`;
    const resolvedSourceProductState: 'hang_tho' | 'da_xu_ly' | undefined = targetStock
      ? (targetStock.state === 'da_xu_ly' ? 'da_xu_ly' : 'hang_tho')
      : pkg.sourceProductState;

    // Cập nhật tồn kho sản phẩm
    setProductStocks((prev) => {
      let updated: ProductStockItem[];
      let newPackStock: ProductStockItem;

      if (targetStock) {
        // Trừ CHÍNH XÁC từ đúng dòng targetStock.id, KHÔNG trừ dòng khác
        updated = prev.map((st) => {
          if (st.id === targetStock.id) {
            return {
              ...st,
              quantity: Math.max(0, st.quantity - neededWeight),
              updatedAt: now,
            };
          }
          return st;
        });

        newPackStock = {
          id: `stock-pkg-${Date.now()}`,
          htxId: targetStock.htxId,
          harvestLotId: targetStock.harvestLotId,
          harvestLotCode: targetStock.harvestLotCode,
          variety: targetStock.variety || pkg.productName,
          // Kế thừa chính xác quyền sở hữu, bên giữ và vị trí lưu kho từ dòng nguồn (Req 4 & 6)
          ownerType: targetStock.ownerType,
          ownerId: targetStock.ownerId,
          ownerName: targetStock.ownerName,
          holderId: targetStock.holderId || (targetStock.ownerType === 'htx' ? currentHTXId : undefined),
          holderName: targetStock.holderName || (targetStock.ownerType === 'htx' ? currentHTX.name : targetStock.ownerName),
          locationName: targetStock.locationName || (targetStock.ownerType === 'htx' ? `Kho bao bì ${currentHTX.shortName}` : `Kho hộ ${targetStock.ownerName}`),
          state: 'da_dong_goi',
          quantity: pkg.packQuantity,
          unit: pkg.unit || 'gói',
          spec: pkg.packagingSpec || `${pkg.packQuantity} ${pkg.unit} x ${weightPerPack} ${pkg.netWeightUnit || targetStock.unit}`,
          sourceStockItemId: targetStock.id,
          sourceProductState: resolvedSourceProductState,
          processingLotId: targetStock.processingLotId || (harvestLot.processingInfo ? `sc-${harvestLot.id}` : undefined),
          packageId: newPkgId,
          packageCode: randomCode,
          netWeightPerPack: weightPerPack,
          totalNetWeight: neededWeight,
          notes: `Đóng gói ${pkg.packQuantity} ${pkg.unit} (${neededWeight} ${targetStock.unit}) từ dòng tồn ${targetStock.id} (${resolvedSourceProductState === 'da_xu_ly' ? 'Đã sơ chế' : 'Hàng thô'})`,
          updatedAt: now,
        };
      } else {
        const sourceBatches: SourceBatchContribution[] = pkg.sourceBatches && pkg.sourceBatches.length > 0
          ? pkg.sourceBatches
          : [{
              harvestLotId: harvestLot.id,
              harvestLotCode: harvestLot.code,
              ownerId: harvestLot.ownerId,
              ownerName: harvestLot.ownerName,
              quantity: neededWeight,
              unit: pkg.netWeightUnit || harvestLot.unit,
            }];

        updated = [...prev];
        for (const b of sourceBatches) {
          let needed = b.quantity;
          updated = updated.map((st) => {
            if (st.harvestLotId === b.harvestLotId && st.ownerType === ownerType && needed > 0) {
              if (st.state === 'da_xu_ly' || st.state === 'hang_tho') {
                const deduct = Math.min(st.quantity, needed);
                needed -= deduct;
                return { ...st, quantity: Math.max(0, st.quantity - deduct), updatedAt: now };
              }
            }
            return st;
          });
        }

        newPackStock = {
          id: `stock-pkg-${Date.now()}`,
          htxId: harvestLot.htxId,
          harvestLotId: harvestLot.id,
          harvestLotCode: harvestLot.code,
          variety: harvestLot.variety || pkg.productName,
          ownerType,
          ownerId: isHTX ? currentHTXId : (harvestLot.ownerId || currentUser.id || 'unknown'),
          ownerName: isHTX ? currentHTX.name : (harvestLot.ownerName || currentUser.name),
          locationName: isHTX ? `Kho bao bì ${currentHTX.shortName}` : `Kho hộ ${harvestLot.ownerName || currentUser.name}`,
          state: 'da_dong_goi',
          quantity: pkg.packQuantity,
          unit: pkg.unit || 'gói',
          spec: pkg.packagingSpec || `${pkg.packQuantity} bao gói x ${weightPerPack} ${pkg.netWeightUnit || harvestLot.unit}`,
          sourceProductState: resolvedSourceProductState,
          packageId: newPkgId,
          packageCode: randomCode,
          netWeightPerPack: weightPerPack,
          totalNetWeight: neededWeight,
          notes: `Đóng gói từ lô ${harvestLot.code}`,
          updatedAt: now,
        };
      }

      return [newPackStock, ...updated];
    });

    // Cập nhật allocation của lô gốc (Req 5: Không trừ allocation khi đóng gói từ hàng đã sơ chế!)
    if (targetStock) {
      if (targetStock.state === 'hang_tho' && targetStock.ownerType === 'ho_dan') {
        setHarvests((prev) =>
          prev.map((h) => {
            if (h.id === targetStock.harvestLotId && h.allocation) {
              return {
                ...h,
                allocation: {
                  ...h.allocation,
                  packagedAtFarmQuantity: (h.allocation.packagedAtFarmQuantity || 0) + neededWeight,
                  remainingAvailable: Math.max(0, h.allocation.remainingAvailable - neededWeight),
                },
              };
            }
            return h;
          })
        );
      }
    } else {
      const isProcessedFallback = harvestLot.processingStatus === 'da_so_che' && !!harvestLot.processingInfo?.outputQuantity;
      if (!isProcessedFallback && !isHTX) {
        setHarvests((prev) =>
          prev.map((h) => {
            const contrib = (pkg.sourceBatches || []).find((b) => b.harvestLotId === h.id);
            const qty = contrib ? contrib.quantity : neededWeight;
            if (h.id === harvestLot.id && h.allocation) {
              return {
                ...h,
                allocation: {
                  ...h.allocation,
                  packagedAtFarmQuantity: (h.allocation.packagedAtFarmQuantity || 0) + qty,
                  remainingAvailable: Math.max(0, h.allocation.remainingAvailable - qty),
                },
              };
            }
            return h;
          })
        );
      }
    }

    const matchingProc = processingLots.find((p) => p.harvestLotId === harvestLot.id);
    const newPkg: PackagedProduct = {
      ...pkg,
      id: newPkgId,
      code: randomCode,
      harvestLotCode: harvestLot.code,
      sourceStockItemId: targetStock?.id,
      sourceProductState: resolvedSourceProductState,
      processingLotId: targetStock?.processingLotId || matchingProc?.id,
      processingLotCode: targetStock?.processingLotId || matchingProc?.code,
      netWeightPerPack: weightPerPack,
      netWeightUnit: pkg.netWeightUnit || (targetStock ? targetStock.unit : harvestLot.unit),
      packQuantity: pkg.packQuantity,
      unit: pkg.unit,
      qrCodeUrl: pkg.qrStatus === 'chua_phat_hanh'
        ? undefined
        : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://hungyen-htx.vn/truy-xuat?code=${fullTraceCode}`,
      qrStatus: pkg.qrStatus || 'da_phat_hanh',
      // Giữ đúng quyền sở hữu khi đóng gói (Req 6)
      ownerType: targetStock ? targetStock.ownerType : ownerType,
      ownerId: targetStock ? targetStock.ownerId : (isHTX ? currentHTXId : (harvestLot.ownerId || currentUser.id)),
      ownerName: targetStock ? targetStock.ownerName : (isHTX ? currentHTX.name : (harvestLot.ownerName || currentUser.name)),
      holderId: targetStock?.holderId,
      holderName: targetStock?.holderName,
      actorId: currentUser.id,
      actorName: currentUser.name,
      onBehalfOfFarmer: currentRole === 'R03' && ownerType === 'ho_dan',
      processingSnapshot: harvestLot.processingInfo ? {
        hasProcessing: true,
        statusText: 'Đã sơ chế',
        date: harvestLot.processingInfo.date,
        method: harvestLot.processingInfo.method,
        inputQuantity: harvestLot.processingInfo.inputQuantity,
        outputQuantity: harvestLot.processingInfo.outputQuantity,
        unit: harvestLot.processingInfo.unit || harvestLot.unit,
        lossQuantity: harvestLot.processingInfo.lossQuantity,
        lossRatePercent: harvestLot.processingInfo.lossRatePercent,
        recoveryRatePercent: harvestLot.processingInfo.recoveryRatePercent,
        notes: harvestLot.processingInfo.notes,
        operatorName: harvestLot.processingInfo.operatorName,
      } : {
        hasProcessing: false,
        statusText: harvestLot.processingStatus === 'khong_so_che' ? 'Không sơ chế' : 'Chưa sơ chế',
      },
      harvestSnapshot: {
        harvestDate: harvestLot.date,
        farmZoneName: harvestLot.farmZoneName,
        zoneCode: harvestLot.zoneCode,
        variety: harvestLot.variety,
        ownerName: harvestLot.ownerName,
        yieldQuantity: harvestLot.yieldQuantity,
        unit: harvestLot.unit,
        sources: harvestLot.sources,
      },
    };

    setPackages((prev) => [newPkg, ...prev]);

    if (!API_CONFIG.USE_MOCK) {
      packageService.createPackage(newPkg).catch((err) => {
        console.error('Lỗi lưu mã sản phẩm đóng gói qua API:', err);
      });
    }

    return newPkg;
  };

  const addOrder = (order: Omit<SalesOrder, 'id' | 'code'>): { success: boolean; message?: string; order?: SalesOrder } => {
    if (order.htxId !== currentHTXId || !Number.isFinite(order.quantity) || order.quantity <= 0 || !Number.isFinite(order.pricePerUnit) || order.pricePerUnit < 0 || order.totalAmount !== order.quantity * order.pricePerUnit) {
      return { success: false, message: 'Số lượng, đơn giá hoặc HTX của đơn bán không hợp lệ.' };
    }

    const lot = harvests.find((item) => item.id === order.harvestLotId && item.htxId === currentHTXId);
    if (!lot) {
      return { success: false, message: 'Lô nông sản không tồn tại hoặc không thuộc HTX hiện tại.' };
    }

    // Xác định vai trò bán và loại người bán
    let sellerType: StockOwnerType;
    let sellerId: string;
    let sellerName: string;
    let isActingR03 = false;

    if (currentRole === 'R06') {
      sellerType = 'ho_dan';
      sellerId = currentUser.id;
      sellerName = currentUser.name;
    } else if (currentRole === 'R03') {
      // R03 bán thay hộ: Bắt buộc sellerType là ho_dan, sellerId là ownerId của lô
      if (!order.onBehalfOfFarmer || order.sellerType !== 'ho_dan') {
        return { success: false, message: 'Cán bộ kỹ thuật R03 chỉ được tạo đơn bán trực tiếp khi thao tác thay cho hộ nông dân.' };
      }
      sellerType = 'ho_dan';
      sellerId = lot.ownerId || order.sellerId;
      sellerName = lot.ownerName || order.sellerName || 'Hộ nông dân';
      isActingR03 = true;

      // Kiểm tra xác nhận từ hộ nông dân
      if (!order.isDraft && !order.confirmationMethod) {
        return { success: false, message: 'Cần có phương thức xác nhận của hộ nông dân (trực tiếp, điện thoại hoặc giấy ủy quyền) trước khi chốt đơn bán hàng.' };
      }
    } else if (['R04', 'R02'].includes(currentRole)) {
      sellerType = 'htx';
      sellerId = currentHTXId;
      sellerName = currentHTX.name;
    } else {
      return { success: false, message: 'Vai trò hiện tại không được tạo đơn bán hàng.' };
    }

    const targetStock = order.stockItemId
      ? productStocks.find((item) => item.id === order.stockItemId && item.htxId === currentHTXId)
      : undefined;

    const balance = getHarvestBalance(lot, handovers, orders);

    if (sellerType === 'ho_dan') {
      if (lot.ownerId !== sellerId) {
        return { success: false, message: 'Chỉ được bán từ lô nông sản thuộc sở hữu của hộ.' };
      }
      if (targetStock) {
        if (targetStock.ownerId !== sellerId) {
          return { success: false, message: 'Dòng tồn này không thuộc quyền sở hữu của hộ.' };
        }
        if (!sameUnit(order.unit, targetStock.unit)) {
          return { success: false, message: `Đơn vị bán phải khớp với dòng tồn (${targetStock.unit}).` };
        }
        const available = getStockItemAvailableQuantity(targetStock, orders, handovers).availableQuantity;
        if (order.quantity > available + 0.001) {
          return { success: false, message: `Số lượng bán (${order.quantity} ${order.unit}) vượt quá tồn khả dụng (${available} ${order.unit}) của dòng tồn này.` };
        }
      } else {
        if (!sameUnit(order.unit, lot.unit)) {
          return { success: false, message: `Đơn vị bán phải khớp với lô nguồn (${lot.unit}).` };
        }
        if (order.quantity > balance.availableQuantity + 0.001) {
          return { success: false, message: `Hộ chỉ được bán tối đa ${balance.availableQuantity} ${lot.unit} còn khả dụng của mình.` };
        }
      }
    } else {
      if (!targetStock || !sameUnit(targetStock.unit, order.unit) || order.quantity > targetStock.quantity + 0.001) {
        return { success: false, message: 'Hàng HTX giữ không đủ hoặc chưa chọn đúng dòng tồn.' };
      }
    }

    // Chống gửi trùng đơn bán
    const isDuplicate = orders.some(
      (o) =>
        o.htxId === currentHTXId &&
        o.harvestLotId === order.harvestLotId &&
        o.stockItemId === order.stockItemId &&
        o.sellerId === sellerId &&
        o.quantity === order.quantity &&
        o.customerPhone === order.customerPhone &&
        Math.abs(Date.now() - new Date(o.createdAt || o.date).getTime()) < 3000
    );
    if (isDuplicate) {
      return { success: false, message: 'Đơn bán hàng này vừa được gửi, vui lòng không bấm liên tiếp.' };
    }

    if (sellerType === 'ho_dan' && !order.isDraft) {
      // Chỉ trừ allocation.remainingAvailable nếu bán hàng thô
      if (!targetStock || targetStock.state === 'hang_tho') {
        setHarvests((prev) => prev.map((item) => item.id === lot.id ? {
          ...item, allocation: {
            directSaleQuantity: (item.allocation?.directSaleQuantity ?? balance.directSales) + order.quantity,
            deliveredToHTXQuantity: item.allocation?.deliveredToHTXQuantity ?? balance.receivedQuantity,
            packagedAtFarmQuantity: item.allocation?.packagedAtFarmQuantity || 0,
            processedAtFarmQuantity: item.allocation?.processedAtFarmQuantity || 0,
            remainingAvailable: Math.max(0, balance.householdQuantity - order.quantity),
          },
        } : item));
      }
    }

    const initialDelivered = order.isDraft ? 0 : (order.deliveredQuantity ?? (order.status === 'Hoàn thành' ? order.quantity : 0));
    const now = new Date().toISOString();
    if (initialDelivered > 0 && !order.isDraft) {
      setProductStocks((prev) => {
        let needed = sellerType === 'ho_dan' ? initialDelivered : 0;
        return prev.map((st) => {
          if (targetStock && st.id === targetStock.id) {
            return { ...st, quantity: Math.max(0, st.quantity - initialDelivered), updatedAt: now };
          }
          if (!targetStock && needed > 0 && st.htxId === currentHTXId && st.harvestLotId === lot.id && st.ownerId === sellerId && (!st.holderId || st.holderId === sellerId)) {
            const deduct = Math.min(st.quantity, needed);
            needed -= deduct;
            return { ...st, quantity: Math.max(0, st.quantity - deduct), updatedAt: now };
          }
          return st;
        });
      });
    }

    const newOrder: SalesOrder = {
      ...order,
      id: `ord-${Date.now()}`,
      code: `DH-${currentHTXId.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`,
      sellerType,
      sellerId,
      sellerName,
      harvestLotCode: lot.code,
      stockItemId: targetStock?.id,
      sourceHandoverId: targetStock?.handoverId,
      sourceOwnerId: sellerType === 'ho_dan' ? sellerId : (targetStock?.ownerId || lot.ownerId),
      deliveredQuantity: initialDelivered,
      deliveryStatus: order.isDraft ? 'chua_giao' : (initialDelivered >= order.quantity ? 'da_giao' : (initialDelivered > 0 ? 'dang_giao' : (order.deliveryStatus || 'chua_giao'))),
      status: order.isDraft ? 'Mới' : (order.status || (initialDelivered >= order.quantity ? 'Hoàn thành' : 'Mới')),
      createdBy: currentUser.name,
      actorId: currentUser.id,
      actorName: currentUser.name,
      onBehalfOfFarmer: isActingR03,
      confirmationMethod: order.confirmationMethod,
      confirmationTime: order.confirmationTime || (order.confirmationMethod ? new Date().toISOString() : undefined),
      confirmationNote: order.confirmationNote,
      isDraft: order.isDraft || false,
    };
    setOrders((prev) => [newOrder, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        htxId: currentHTXId,
        title: isActingR03 ? '🛒 Đơn bán trực tiếp thay hộ nông dân' : '🛒 Đơn bán nông sản mới',
        summary: `Đơn ${newOrder.code}: ${newOrder.customerName}, ${newOrder.quantity} ${newOrder.unit} (${newOrder.totalAmount.toLocaleString()} đ).`,
        content: `Người bán: ${sellerName} (${sellerType === 'ho_dan' ? 'Hộ dân' : 'HTX'})${isActingR03 ? ` - Cán bộ ${currentUser.name} ghi thay` : ''}. Khách hàng: ${newOrder.customerName}. Kênh: ${newOrder.salesChannel || 'Trực tiếp'}.`,
        date: 'Vừa xong',
        type: 'order',
        isRead: false,
        actionScreen: 'sales_list',
        actionLabel: 'Xem đơn hàng',
      },
      ...prev,
    ]);

    if (!API_CONFIG.USE_MOCK) {
      orderService.createOrder(newOrder).catch((err) => {
        console.error('Lỗi lưu đơn hàng qua API:', err);
      });
    }

    return { success: true, order: newOrder };
  };

  const updateOrderStatus = (
    orderId: string,
    status: 'Mới' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy',
    cancelReason?: string
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId && o.htxId === currentHTXId);
    if (!targetOrder || !['R02', 'R04', 'R06', 'R03'].includes(currentRole) ||
      (currentRole === 'R06' && (targetOrder.sellerType !== 'ho_dan' || targetOrder.sellerId !== currentUser.id)) ||
      (currentRole === 'R03' && (!targetOrder.onBehalfOfFarmer || targetOrder.actorId !== currentUser.id))) return;
    if (status === 'Đã hủy' && (targetOrder.deliveredQuantity || 0) > 0) return;

    if (status === 'Hoàn thành' && (targetOrder.deliveredQuantity || 0) < targetOrder.quantity) {
      const delta = targetOrder.quantity - (targetOrder.deliveredQuantity || 0);
      const now = new Date().toISOString();
      setProductStocks((prev) => {
        let needed = targetOrder.sellerType === 'ho_dan' ? delta : 0;
        return prev.map((st) => {
          if (targetOrder.stockItemId && st.id === targetOrder.stockItemId) {
            return { ...st, quantity: Math.max(0, st.quantity - delta), updatedAt: now };
          }
          if (
            needed > 0 &&
            st.htxId === currentHTXId &&
            st.harvestLotId === targetOrder.harvestLotId &&
            st.ownerId === targetOrder.sellerId &&
            (!st.holderId || st.holderId === targetOrder.sellerId)
          ) {
            const deduct = Math.min(st.quantity, needed);
            needed -= deduct;
            return { ...st, quantity: Math.max(0, st.quantity - deduct), updatedAt: now };
          }
          return st;
        });
      });
    }

    if (status === 'Đã hủy' && targetOrder.status !== 'Đã hủy') {
      const returnQty = targetOrder.deliveredQuantity || 0;
      const now = new Date().toISOString();

      if (targetOrder.harvestLotId && targetOrder.sellerType === 'ho_dan') {
        const orderStock = targetOrder.stockItemId ? productStocks.find((s) => s.id === targetOrder.stockItemId) : undefined;
        if (!orderStock || orderStock.state === 'hang_tho') {
          setHarvests((prev) =>
            prev.map((h) => {
              if (h.id === targetOrder.harvestLotId && h.allocation) {
                return {
                  ...h,
                  allocation: {
                    ...h.allocation,
                    directSaleQuantity: Math.max(0, (h.allocation.directSaleQuantity || 0) - targetOrder.quantity),
                    remainingAvailable: h.allocation.remainingAvailable + targetOrder.quantity,
                  },
                };
              }
              return h;
            })
          );
        }
      }

      if (returnQty > 0) {
        setProductStocks((prev) => {
          let restored = false;
          return prev.map((st) => {
            if (
              !restored &&
              st.htxId === currentHTXId &&
              (targetOrder.stockItemId
                ? st.id === targetOrder.stockItemId
                : st.harvestLotId === targetOrder.harvestLotId &&
                  st.ownerId === targetOrder.sellerId &&
                  (!st.holderId || st.holderId === targetOrder.sellerId))
            ) {
              restored = true;
              return {
                ...st,
                quantity: st.quantity + returnQty,
                updatedAt: now,
              };
            }
            return st;
          });
        });
      }
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = {
            ...o,
            status,
            deliveredQuantity: status === 'Hoàn thành' ? o.quantity : o.deliveredQuantity,
            deliveryStatus: status === 'Hoàn thành' ? ('da_giao' as const) : o.deliveryStatus,
            cancelReason: cancelReason || o.cancelReason,
          };
          if (status === 'Hoàn thành' && !updated.invoiceNumber) {
            updated.invoiceNumber = `HDDT-HY-${Math.floor(10000 + Math.random() * 90000)}`;
          }
          return updated;
        }
        return o;
      })
    );
  };

  const cancelOrder = (orderId: string, reason: string) => {
    updateOrderStatus(orderId, 'Đã hủy', reason);
  };



  const addInventoryItem = (item: Omit<InventoryItem, 'id'>): InventoryItem => {
    const newItem: InventoryItem = {
      ...item,
      id: `vattu-${Date.now()}`,
    };
    setInventory((prev) => [newItem, ...prev]);
    return newItem;
  };

  const addStockTransaction = (tx: Omit<StockTransaction, 'id' | 'code'>): boolean => {
    if (currentRole !== 'R04') {
      return false; // Chỉ Kế toán/Thủ kho R04 được lập phiếu kho
    }

    const item = inventory.find((i) => i.name === tx.itemName && i.htxId === tx.htxId);
    const unitPrice = tx.unitPrice || item?.unitPrice || 0;
    const totalAmount = unitPrice * tx.quantity;

    if (tx.type === 'export') {
      if (!item || item.stock < tx.quantity) {
        return false; // Xuất vượt tồn kho
      }
      const remainingStock = item.stock - tx.quantity;
      setInventory((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, stock: remainingStock } : i))
      );

      // Cảnh báo tồn kho an toàn nếu số lượng còn lại < minStockAlert
      if (remainingStock <= item.minStockAlert) {
        setNotifications((prev) => [
          {
            id: `notif-${Date.now()}`,
            htxId: tx.htxId,
            title: '⚠️ Cảnh báo tồn kho an toàn',
            summary: `Vật tư "${item.name}" sắp hết, hiện chỉ còn ${remainingStock} ${item.unit}.`,
            content: `Sau khi xuất cấp phát, mặt hàng "${item.name}" trong kho chỉ còn ${remainingStock} ${item.unit}, đã chạm hoặc dưới ngưỡng cảnh báo tối thiểu (${item.minStockAlert} ${item.unit}). Kế toán kho vui lòng liên hệ nhà cung ứng để nhập bổ sung.`,
            date: 'Vừa xong',
            type: 'alert',
            isRead: false,
            actionScreen: 'inventory_list',
            actionLabel: 'Kiểm tra kho vật tư',
          },
          ...prev,
        ]);
      }
    } else {
      if (item) {
        setInventory((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, stock: i.stock + tx.quantity } : i))
        );
      }
    }

    const newTx: StockTransaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      code: `${tx.type === 'import' ? 'NK' : 'XK'}-2026-${Math.floor(100 + Math.random() * 900)}`,
      itemId: item?.id,
      unitPrice,
      totalAmount,
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (!API_CONFIG.USE_MOCK) {
      warehouseService.createTransaction(newTx).catch((err) => {
        console.error('Lỗi lưu giao dịch kho qua API:', err);
      });
    }

    return true;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    if (id.startsWith('reminder-task-')) {
      try {
        const saved = JSON.parse(localStorage.getItem('hungyen_read_task_reminders') || '[]');
        const readIds = Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : [];
        localStorage.setItem('hungyen_read_task_reminders', JSON.stringify([...new Set([...readIds, id])]));
      } catch (error) { console.error('Không thể lưu trạng thái nhắc việc:', error); }
      return;
    }

    if (!API_CONFIG.USE_MOCK) {
      notificationService.markAsRead(id).catch((err) => {
        console.error('Lỗi đánh dấu đã đọc qua API:', err);
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        demoWarning,
        demoNotice,
        resetDemoData,
        isLoggedIn,
        currentUser,
        currentHTX,
        currentRole,
        loginWithZaloPhone,
        logout,
        setRole,
        setHTX,
        updateProfile,
        currentScreen,
        screenParams,
        navigateTo,
        goBack,
        activeTab,
        setActiveTab,




        farmZones: farmZones.filter((f) => f.htxId === currentHTXId),
        diaries: diaries.filter((d) => d.htxId === currentHTXId),
        harvests: harvests.filter((h) => h.htxId === currentHTXId),
        processingLots: processingLots.filter((p) => p.htxId === currentHTXId),
        packages: packages.filter((p) => p.htxId === currentHTXId),
        inventory: inventory.filter((i) => i.htxId === currentHTXId),
        transactions: transactions.filter((t) => t.htxId === currentHTXId),
        orders: orders.filter((o) => o.htxId === currentHTXId),
        members: members.filter((m) => m.htxId === currentHTXId),
        memberRequests: memberRequests.filter((r) => r.htxId === currentHTXId),
        notifications: notifications.filter((n) => (!n.htxId || n.htxId === currentHTXId) && (!n.userId || n.userId === currentUser.id)),
        handovers: handovers.filter((h) => h.htxId === currentHTXId),
        productStocks: productStocks.filter((s) => s.htxId === currentHTXId),
        diaryAdjustments: diaryAdjustments.filter((d) => d.htxId === currentHTXId),
        qualityConfigs: QUALITY_CRITERIA_CONFIG,
        tasks: tasks.filter((t) => t.htxId === currentHTXId),
        feedbacks: feedbacks.filter((f) => f.htxId === currentHTXId),
        coopConfigs,
        currentCoopConfig,
        addFarmZone,
        updateFarmZone,
        deleteFarmZone,
        createProductionCycle,
        startProductionCycle,
        finishProductionCycle,
        addDiary,
        updateDiary,
        deleteDiary,
        createDiaryAdjustmentRequest,
        approveDiaryAdjustmentRequest,
        rejectDiaryAdjustmentRequest,
        addHarvest,
        updateHarvest,
        allocateHarvestLot,
        saveHarvestProcessing,
        addHarvestProcessingSession,
        addProductHandover,
        confirmProductHandover,
        rejectProductHandover,
        disputeProductHandover,
        confirmDoiSoatHandover,
        generateLotQRCode,
        addProcessingLot,
        addPackage,
        addOrder,
        updateOrderStatus,
        cancelOrder,
        updateDeliveryProgress,

        updateProductionTask,
        createServiceRequestTask,
        requestLivestockSale,
        addCustomerFeedback,
        resolveCustomerFeedback,
        getMobileQuickSummary,

        addInventoryItem,
        addStockTransaction,
        markNotificationAsRead,
        todayHasDiary,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
