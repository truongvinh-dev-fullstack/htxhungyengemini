import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  HTXId,
  HTXInfo,
  UserProfile,
  FarmZone,
  DiaryEntry,
  HarvestLot,
  ProcessingLot,
  PackagedProduct,
  InventoryItem,
  StockTransaction,
  SalesOrder,
  MemberRequest,
  AppNotification,
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
} from '../mock/data';
import { API_CONFIG } from '../config/api';
import { isDiaryLocked, canModifyDiary, canApproveMember } from '../utils/permissions';
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

interface AppContextType {
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

  // Voice Assistant
  voiceMessage: string | null;
  isSpeaking: boolean;
  speakText: (text: string) => void;
  stopSpeaking: () => void;

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

  updateProfile: (updatedData: Partial<UserProfile>) => void;
  addFarmZone: (zone: Omit<FarmZone, 'id' | 'farmingDays'>) => FarmZone;
  updateFarmZone: (zoneId: string, updatedData: Partial<FarmZone>) => void;
  deleteFarmZone: (zoneId: string) => { success: boolean; message: string };
  updateFarmZoneSeason: (
    zoneId: string,
    newSeasonData: {
      season: string;
      variety: string;
      seasonStartDate: string;
      seasonEndDate: string;
      forecastYield: string;
      notes?: string;
    }
  ) => void;
  addDiary: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'isLocked' | 'createdBy'>) => void;
  updateDiary: (id: string, updatedData: Partial<DiaryEntry>) => { success: boolean; message?: string };
  deleteDiary: (id: string) => { success: boolean; message?: string };
  addHarvest: (lot: Omit<HarvestLot, 'id' | 'code'>) => void;
  addProcessingLot: (lot: Omit<ProcessingLot, 'id' | 'code'>) => ProcessingLot;
  addPackage: (pkg: Omit<PackagedProduct, 'id' | 'code' | 'qrCodeUrl'>) => PackagedProduct;
  addOrder: (order: Omit<SalesOrder, 'id' | 'code'>) => void;
  updateOrderStatus: (orderId: string, status: 'Mới' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy', cancelReason?: string) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  addMemberRequest: (req: Omit<MemberRequest, 'id' | 'applyDate' | 'status'>) => MemberRequest;
  approveMemberRequest: (id: string) => { success: boolean; message?: string };
  rejectMemberRequest: (id: string, reason: string) => { success: boolean; message?: string };
  addMember: (member: Omit<UserProfile, 'id' | 'status'>) => void;
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
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Data collections
  const [farmZones, setFarmZones] = useState<FarmZone[]>(INITIAL_FARM_ZONES);
  const [diaries, setDiaries] = useState<DiaryEntry[]>(INITIAL_DIARIES);
  const [harvests, setHarvests] = useState<HarvestLot[]>(INITIAL_HARVESTS);
  const [processingLots, setProcessingLots] = useState<ProcessingLot[]>(INITIAL_PROCESSING_LOTS);
  const [packages, setPackages] = useState<PackagedProduct[]>(INITIAL_PACKAGES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [transactions, setTransactions] = useState<StockTransaction[]>(INITIAL_TRANSACTIONS);
  const [orders, setOrders] = useState<SalesOrder[]>(INITIAL_ORDERS);
  const [members, setMembers] = useState<UserProfile[]>(INITIAL_MEMBERS);
  const [memberRequests, setMemberRequests] = useState<MemberRequest[]>(INITIAL_MEMBER_REQUESTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const currentHTX = HTX_LIST[currentHTXId] || HTX_LIST.anninh;

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

  // Voice assistance function with real browser Web Speech API & modal bubble
  const speakText = (text: string) => {
    setVoiceMessage(text);
    setIsSpeaking(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9; // Speak a bit slower for elderly users
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsSpeaking(false), 4500);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setVoiceMessage(null);
  };

  const navigateTo = (screen: string, params?: any) => {
    stopSpeaking();
    setHistoryStack((prev) => [...prev, { screen: currentScreen, params: screenParams }]);
    setCurrentScreen(screen);
    setScreenParams(params || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    stopSpeaking();
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
      if (currentRole === 'R04') setCurrentScreen('inventory_list');
      else if (currentRole === 'R02') setCurrentScreen('dashboard');
      else if (currentRole === 'R03') setCurrentScreen('farm_list');
      else if (currentRole === 'R05') setCurrentScreen('members_list');
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
            ? 'Bác Nguyễn Văn An'
            : role === 'R05'
            ? 'Bác Trần Văn Thắng'
            : role === 'R04'
            ? 'Chị Nguyễn Thị Dung'
            : role === 'R03'
            ? 'Kỹ sư Lê Văn Hoàng'
            : 'Ông Phạm Văn Minh',
        role,
        htxId: currentHTXId,
        team:
          role === 'R05'
            ? 'Tổ trưởng Tổ 1'
            : role === 'R03'
            ? 'Tổ Kỹ thuật Nông nghiệp'
            : role === 'R04'
            ? 'Ban Kế toán & Kho'
            : role === 'R02'
            ? 'Ban Quản trị HTX'
            : 'Tổ 1 - Sản xuất',
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
      zoneService.getFarmZones(currentHTXId).then(setFarmZones).catch(console.error);
      diaryService.getDiaries(currentHTXId).then(setDiaries).catch(console.error);
      harvestService.getHarvests(currentHTXId).then(setHarvests).catch(console.error);
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
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHasDiary = diaries.some(
    (d) =>
      d.htxId === currentHTXId &&
      (d.date === todayStr || d.createdAt?.startsWith(todayStr)) &&
      (currentRole === 'R06' ? d.createdBy === currentUser.name : true)
  );

  // Mutations
  const addFarmZone = (zone: Omit<FarmZone, 'id' | 'farmingDays'>): FarmZone => {
    const newZone: FarmZone = {
      ...zone,
      id: `fz-${Date.now()}`,
      ownerId: zone.ownerId || currentUser.id,
      farmingDays: 1,
      seasonHistory: [
        {
          seasonName: zone.season,
          year: new Date().getFullYear(),
          yieldResult: zone.forecastYield,
          status: 'Đang canh tác',
          quality: 'Chuẩn HTX',
        },
      ],
    };
    setFarmZones((prev) => [newZone, ...prev]);
    return newZone;
  };

  const deleteFarmZone = (zoneId: string): { success: boolean; message: string } => {
    const hasDiaries = diaries.some((d) => d.farmZoneId === zoneId);
    const hasHarvests = harvests.some((h) => h.farmZoneId === zoneId);

    if (hasDiaries || hasHarvests) {
      return {
        success: false,
        message:
          'Không thể xóa vùng sản xuất đã có nhật ký canh tác hoặc lô thu hoạch liên kết. Bác vui lòng chuyển trạng thái sang "Nghỉ vụ" hoặc "Ẩn" để bảo toàn hồ sơ VietGAP.',
      };
    }

    setFarmZones((prev) => prev.filter((z) => z.id !== zoneId));
    return {
      success: true,
      message: 'Đã xóa thửa ruộng thành công!',
    };
  };

  const updateFarmZoneSeason = (
    zoneId: string,
    newSeasonData: {
      season: string;
      variety: string;
      seasonStartDate: string;
      seasonEndDate: string;
      forecastYield: string;
      notes?: string;
    }
  ) => {
    setFarmZones((prev) =>
      prev.map((z) => {
        if (z.id !== zoneId) return z;

        const previousHistory = z.seasonHistory || [];
        const closedSeasonHistory = [
          {
            seasonName: z.season,
            year: new Date().getFullYear(),
            yieldResult: `Đã kết thúc vụ • ${z.forecastYield}`,
            status: 'Đã thu hoạch' as const,
            quality: 'Đạt chuẩn HTX',
            harvestDate: new Date().toLocaleDateString('vi-VN'),
          },
          ...previousHistory.filter((h) => h.seasonName !== z.season),
        ];

        return {
          ...z,
          season: newSeasonData.season,
          variety: newSeasonData.variety,
          seasonStartDate: newSeasonData.seasonStartDate,
          seasonEndDate: newSeasonData.seasonEndDate,
          seasonStage: 'Mới xuống giống (Ngày 1)',
          forecastYield: newSeasonData.forecastYield,
          farmingDays: 1,
          status: 'Đang canh tác',
          notes: newSeasonData.notes || z.notes,
          seasonHistory: [
            {
              seasonName: newSeasonData.season,
              year: new Date().getFullYear(),
              yieldResult: newSeasonData.forecastYield,
              status: 'Đang canh tác' as const,
              quality: 'Chuẩn HTX',
            },
            ...closedSeasonHistory,
          ],
        };
      })
    );
  };

  const updateFarmZone = (zoneId: string, updatedData: Partial<FarmZone>) => {
    setFarmZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, ...updatedData } : z))
    );
  };

  const addDiary = (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'isLocked' | 'createdBy'>) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: `d-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isLocked: false,
      createdBy: currentUser.name,
    };
    setDiaries((prev) => [newEntry, ...prev]);

    // CN-3.5.5 / CN-2.5.9: Tự động gửi thông báo tới cán bộ kỹ thuật và tổ trưởng khi có nhật ký mới
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      htxId: currentHTXId,
      title: `Nhật ký mới: ${newEntry.workTypeName}`,
      summary: `${currentUser.name} vừa ghi nhật ký tại ${newEntry.farmZoneName}`,
      content: `Bác ${currentUser.name} vừa cập nhật công việc "${newEntry.workTypeName}" tại ${newEntry.farmZoneName}. Ngày thực hiện: ${newEntry.date}. ${newEntry.suppliesUsed ? `Vật tư: ${newEntry.suppliesUsed}. ` : ''}Ghi chú: ${newEntry.notes || 'Không có.'}`,
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
  };

  const updateDiary = (id: string, updatedData: Partial<DiaryEntry>): { success: boolean; message?: string } => {
    const entry = diaries.find((d) => d.id === id);
    if (!entry) return { success: false, message: 'Không tìm thấy nhật ký.' };

    const check = canModifyDiary(currentRole, entry, currentUser.name);
    if (!check.canEdit) {
      return { success: false, message: check.reason || 'Không có quyền chỉnh sửa nhật ký này.' };
    }

    setDiaries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updatedData } : d))
    );
    return { success: true };
  };

  const deleteDiary = (id: string): { success: boolean; message?: string } => {
    const entry = diaries.find((d) => d.id === id);
    if (!entry) return { success: false, message: 'Không tìm thấy nhật ký.' };

    const check = canModifyDiary(currentRole, entry, currentUser.name);
    if (!check.canDelete) {
      return { success: false, message: check.reason || 'Không có quyền xóa nhật ký này.' };
    }

    setDiaries((prev) => prev.filter((d) => d.id !== id));
    return { success: true };
  };

  const addHarvest = (lot: Omit<HarvestLot, 'id' | 'code'>) => {
    const newLot: HarvestLot = {
      ...lot,
      id: `h-${Date.now()}`,
      code: `TH-${currentHTXId.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`,
    };
    setHarvests((prev) => [newLot, ...prev]);

    // Bắn thông báo lô thu hoạch mới
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: '🌾 Lô thu hoạch nông sản mới',
        summary: `Đã ghi nhận lô ${newLot.code} sản lượng ${newLot.yieldQuantity} ${newLot.unit} tại ${newLot.farmZoneName}.`,
        content: `Lô thu hoạch mã số ${newLot.code} đã được cập nhật thành công từ ${newLot.farmZoneName}. Nông sản đã sẵn sàng chuyển sang khâu làm sạch, sơ chế và đóng gói cấp tem mã QR truy xuất.`,
        date: 'Vừa xong',
        type: 'system',
        isRead: false,
        actionScreen: 'harvest_list',
        actionLabel: 'Xem lô thu hoạch',
      },
      ...prev,
    ]);

    if (!API_CONFIG.USE_MOCK) {
      harvestService.createHarvest(newLot).catch((err) => {
        console.error('Lỗi lưu lô thu hoạch qua API:', err);
      });
    }
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
    const randomCode = `SP-${currentHTXId.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const fullTraceCode = `TXNG-HY-${randomCode}`;
    const newPkg: PackagedProduct = {
      ...pkg,
      id: `pkg-${Date.now()}`,
      code: randomCode,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://hungyen-htx.vn/truy-xuat?code=${fullTraceCode}`,
    };
    setPackages((prev) => [newPkg, ...prev]);

    if (!API_CONFIG.USE_MOCK) {
      packageService.createPackage(newPkg).catch((err) => {
        console.error('Lỗi lưu mã sản phẩm đóng gói qua API:', err);
      });
    }

    return newPkg;
  };

  const addOrder = (order: Omit<SalesOrder, 'id' | 'code'>) => {
    const newOrder: SalesOrder = {
      ...order,
      id: `ord-${Date.now()}`,
      code: `DH-${currentHTXId.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`,
      sellerId: order.sellerId || (currentRole === 'R06' ? currentUser.id : undefined),
      sellerName: order.sellerName || (currentRole === 'R06' ? currentUser.name : undefined),
    };
    setOrders((prev) => [newOrder, ...prev]);

    // Bắn thông báo có đơn hàng mới
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        htxId: currentHTXId,
        title: '🛒 Đơn đặt hàng nông sản mới',
        summary: `Đơn hàng ${newOrder.code} của ${newOrder.customerName}, giá trị ${newOrder.totalAmount.toLocaleString()} đ.`,
        content: `Khách hàng ${newOrder.customerName} (${newOrder.customerPhone}) đã đặt mua ${newOrder.quantity} ${newOrder.unit} ${newOrder.productName} với tổng giá trị ${newOrder.totalAmount.toLocaleString()} đồng. Kế toán kho vui lòng kiểm tra xuất bán.`,
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
  };

  const updateOrderStatus = (
    orderId: string,
    status: 'Mới' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy',
    cancelReason?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = { ...o, status, cancelReason: cancelReason || o.cancelReason };
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

  const addMemberRequest = (req: Omit<MemberRequest, 'id' | 'applyDate' | 'status'>): MemberRequest => {
    const newReq: MemberRequest = {
      ...req,
      id: `req-${Date.now()}`,
      applyDate: new Date().toLocaleDateString('vi-VN'),
      status: 'pending',
    };
    setMemberRequests((prev) => [newReq, ...prev]);

    // Bắn thông báo cho Ban Quản trị
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        htxId: newReq.htxId,
        title: '📝 Yêu cầu gia nhập HTX mới',
        summary: `Hộ bác ${newReq.name} (${newReq.village}) vừa gửi hồ sơ xin tham gia HTX.`,
        content: `Bác ${newReq.name}, SĐT: ${newReq.phone}, CCCD: ${newReq.cccd}, cư trú tại ${newReq.village} vừa gửi đơn đăng ký thành viên HTX. Kính mời Ban Quản trị xem xét phê duyệt.`,
        date: 'Vừa xong',
        type: 'approval',
        isRead: false,
        actionScreen: 'members_approval',
        actionLabel: 'Xem duyệt hồ sơ',
      },
      ...prev,
    ]);

    return newReq;
  };

  const approveMemberRequest = (id: string): { success: boolean; message?: string } => {
    if (currentRole !== 'R02' && currentRole !== 'R05') {
      return { success: false, message: 'Chỉ Ban Quản trị (R02) hoặc Tổ trưởng (R05) mới có quyền phê duyệt thành viên.' };
    }

    const req = memberRequests.find((r) => r.id === id);
    if (!req) return { success: false, message: 'Không tìm thấy hồ sơ yêu cầu.' };

    if (!canApproveMember(currentRole, currentUser.team, req.team)) {
      return { success: false, message: 'Bác là Tổ trưởng chỉ có quyền phê duyệt thành viên đăng ký vào tổ của mình.' };
    }

    const defaultTeam = req.team || (
      req.htxId === 'dongtao'
        ? 'Tổ 1 - Chăn nuôi Gà Đông Tảo'
        : req.htxId === 'quyetthang'
        ? 'Tổ 1 - Nhãn lồng & Thủy sản'
        : 'Tổ 1 - Lúa sạch'
    );

    const newMemberId = `m-${Date.now()}`;
    const newMember: UserProfile = {
      id: newMemberId,
      name: req.name,
      role: 'R06',
      phone: req.phone,
      cccd: req.cccd,
      htxId: req.htxId,
      team: defaultTeam,
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
      address: req.village,
      status: 'active',
    };

    setMembers((prev) => [newMember, ...prev]);
    // Giữ lại trong danh sách với status 'approved' thay vì xóa khỏi lịch sử
    setMemberRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved',
              approvedBy: currentUser.name,
              approvedAt: new Date().toISOString().split('T')[0],
            }
          : r
      )
    );

    // Bắn thông báo phê duyệt
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        htxId: req.htxId,
        userId: newMemberId,
        title: '✅ Đã phê duyệt thành viên mới',
        summary: `Thành viên ${req.name} đã được kết nạp chính thức vào ${defaultTeam}.`,
        content: `Hồ sơ đăng ký của bác ${req.name} đã được ${currentUser.name} (${currentRole}) phê duyệt chính thức. Tài khoản thành viên đã kích hoạt đầy đủ quyền hạn tham gia chuỗi sản xuất VietGAP của HTX.`,
        date: 'Vừa xong',
        type: 'approval',
        isRead: false,
        actionScreen: 'members_list',
        actionLabel: 'Danh sách thành viên',
      },
      ...prev,
    ]);

    if (!API_CONFIG.USE_MOCK) {
      memberService.approveRequest(id).catch((err) => {
        console.error('Lỗi duyệt thành viên qua API:', err);
      });
    }

    return { success: true };
  };

  const rejectMemberRequest = (id: string, reason: string): { success: boolean; message?: string } => {
    if (currentRole !== 'R02' && currentRole !== 'R05') {
      return { success: false, message: 'Chỉ Ban Quản trị (R02) hoặc Tổ trưởng (R05) mới có quyền từ chối thành viên.' };
    }

    const req = memberRequests.find((r) => r.id === id);
    if (!req) return { success: false, message: 'Không tìm thấy hồ sơ.' };

    setMemberRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected',
              rejectionReason: reason,
              approvedBy: currentUser.name,
              approvedAt: new Date().toISOString().split('T')[0],
            }
          : r
      )
    );

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        htxId: req.htxId,
        title: '❌ Hồ sơ đăng ký chưa được duyệt',
        summary: `Hồ sơ của bác ${req.name} chưa đủ điều kiện: ${reason}`,
        content: `Ban Quản trị HTX thông báo hồ sơ của bác ${req.name} chưa được phê duyệt với lý do: "${reason}". Bác vui lòng liên hệ Ban Quản trị để được hỗ trợ hoàn thiện hồ sơ.`,
        date: 'Vừa xong',
        type: 'approval',
        isRead: false,
      },
      ...prev,
    ]);

    if (!API_CONFIG.USE_MOCK) {
      memberService.rejectRequest(id, reason).catch((err) => {
        console.error('Lỗi từ chối duyệt qua API:', err);
      });
    }

    return { success: true };
  };

  const addMember = (member: Omit<UserProfile, 'id' | 'status'>) => {
    const newM: UserProfile = {
      ...member,
      id: `m-${Date.now()}`,
      status: 'active',
    };
    setMembers((prev) => [newM, ...prev]);
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

    if (!API_CONFIG.USE_MOCK) {
      notificationService.markAsRead(id).catch((err) => {
        console.error('Lỗi đánh dấu đã đọc qua API:', err);
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
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
        voiceMessage,
        isSpeaking,
        speakText,
        stopSpeaking,
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
        notifications: notifications.filter((n) => !n.htxId || n.htxId === currentHTXId),
        addFarmZone,
        updateFarmZone,
        deleteFarmZone,
        updateFarmZoneSeason,
        addDiary,
        updateDiary,
        deleteDiary,
        addHarvest,
        addProcessingLot,
        addPackage,
        addOrder,
        updateOrderStatus,
        cancelOrder,
        addMemberRequest,
        approveMemberRequest,
        rejectMemberRequest,
        addMember,
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
