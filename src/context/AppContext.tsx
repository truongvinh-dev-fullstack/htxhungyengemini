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

  // Mutations
  addFarmZone: (zone: Omit<FarmZone, 'id' | 'farmingDays'>) => FarmZone;
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
  deleteDiary: (id: string) => void;
  addHarvest: (lot: Omit<HarvestLot, 'id' | 'code'>) => void;
  addProcessingLot: (lot: Omit<ProcessingLot, 'id' | 'code'>) => ProcessingLot;
  addPackage: (pkg: Omit<PackagedProduct, 'id' | 'code' | 'qrCodeUrl'>) => PackagedProduct;
  addOrder: (order: Omit<SalesOrder, 'id' | 'code'>) => void;
  approveMemberRequest: (id: string) => void;
  rejectMemberRequest: (id: string, reason: string) => void;
  addMember: (member: Omit<UserProfile, 'id' | 'status'>) => void;
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

  // Resolve current user profile
  const userKey = `${currentRole}_${currentHTXId}`;
  const currentUser: UserProfile = DEMO_USERS[userKey] || {
    id: `u_${currentRole.toLowerCase()}`,
    name:
      currentRole === 'R06'
        ? 'Bác Nguyễn Văn An'
        : currentRole === 'R05'
        ? 'Bác Trần Văn Thắng'
        : currentRole === 'R04'
        ? 'Chị Nguyễn Thị Dung'
        : currentRole === 'R03'
        ? 'Kỹ sư Lê Văn Hoàng'
        : 'Ông Phạm Văn Minh',
    role: currentRole,
    phone: '0978 123 456',
    cccd: '033062001928',
    htxId: currentHTXId,
    team:
      currentRole === 'R05'
        ? 'Tổ trưởng Tổ 1'
        : currentRole === 'R03'
        ? 'Tổ Kỹ thuật Nông nghiệp'
        : currentRole === 'R04'
        ? 'Ban Kế toán & Kho'
        : currentRole === 'R02'
        ? 'Ban Quản trị HTX'
        : 'Tổ 1 - Lúa sạch',
    avatar:
      currentRole === 'R03'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    address: 'Thôn An Xá, xã An Ninh',
    status: 'active',
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
      setCurrentRoleState(matched.role);
      setCurrentHTXId(matched.htxId);
      setIsLoggedIn(true);
      setCurrentScreen('home');
      setActiveTabState('home');
      setHistoryStack([]);
      return { success: true, user: matched };
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
  };

  const setHTX = (htxId: HTXId) => {
    setCurrentHTXId(htxId);
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

  // Check if today has diary
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHasDiary = diaries.some(
    (d) => d.date === todayStr || d.date === '2026-09-24'
  );

  // Mutations
  const addFarmZone = (zone: Omit<FarmZone, 'id' | 'farmingDays'>): FarmZone => {
    const newZone: FarmZone = {
      ...zone,
      id: `fz-${Date.now()}`,
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

  const addDiary = (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'isLocked' | 'createdBy'>) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: `d-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isLocked: false,
      createdBy: currentUser.name,
    };
    setDiaries((prev) => [newEntry, ...prev]);

    if (!API_CONFIG.USE_MOCK) {
      diaryService.createDiary(newEntry).catch((err) => {
        console.error('Lỗi lưu nhật ký qua API:', err);
      });
    }
  };

  const deleteDiary = (id: string) => {
    setDiaries((prev) => prev.filter((d) => d.id !== id));
  };

  const addHarvest = (lot: Omit<HarvestLot, 'id' | 'code'>) => {
    const newLot: HarvestLot = {
      ...lot,
      id: `h-${Date.now()}`,
      code: `TH-${currentHTXId.toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`,
    };
    setHarvests((prev) => [newLot, ...prev]);

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
    const newPkg: PackagedProduct = {
      ...pkg,
      id: `pkg-${Date.now()}`,
      code: randomCode,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TXNG-HY-${randomCode}`,
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
      invoiceNumber: `HDDT-HY-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setOrders((prev) => [newOrder, ...prev]);

    if (!API_CONFIG.USE_MOCK) {
      orderService.createOrder(newOrder).catch((err) => {
        console.error('Lỗi lưu đơn hàng qua API:', err);
      });
    }
  };

  const approveMemberRequest = (id: string) => {
    const req = memberRequests.find((r) => r.id === id);
    if (req) {
      const newMember: UserProfile = {
        id: `m-${Date.now()}`,
        name: req.name,
        role: 'R06',
        phone: req.phone,
        cccd: req.cccd,
        htxId: req.htxId,
        team: 'Tổ 1 - Lúa sạch',
        avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
        address: req.village,
        status: 'active',
      };
      setMembers((prev) => [newMember, ...prev]);
      setMemberRequests((prev) => prev.filter((r) => r.id !== id));

      if (!API_CONFIG.USE_MOCK) {
        memberService.approveRequest(id).catch((err) => {
          console.error('Lỗi duyệt thành viên qua API:', err);
        });
      }
    }
  };

  const rejectMemberRequest = (id: string, reason: string) => {
    setMemberRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected', rejectionReason: reason } : r))
    );

    if (!API_CONFIG.USE_MOCK) {
      memberService.rejectRequest(id, reason).catch((err) => {
        console.error('Lỗi từ chối duyệt qua API:', err);
      });
    }
  };

  const addMember = (member: Omit<UserProfile, 'id' | 'status'>) => {
    const newM: UserProfile = {
      ...member,
      id: `m-${Date.now()}`,
      status: 'active',
    };
    setMembers((prev) => [newM, ...prev]);
  };

  const addStockTransaction = (tx: Omit<StockTransaction, 'id' | 'code'>): boolean => {
    const item = inventory.find((i) => i.name === tx.itemName && i.htxId === tx.htxId);
    if (tx.type === 'export') {
      if (!item || item.stock < tx.quantity) {
        return false; // Xuất vượt tồn kho
      }
      setInventory((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, stock: i.stock - tx.quantity } : i))
      );
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
        notifications,
        addFarmZone,
        updateFarmZoneSeason,
        addDiary,
        deleteDiary,
        addHarvest,
        addProcessingLot,
        addPackage,
        addOrder,
        approveMemberRequest,
        rejectMemberRequest,
        addMember,
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
