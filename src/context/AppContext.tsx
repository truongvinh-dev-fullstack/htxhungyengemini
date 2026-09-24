import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  HTXId,
  HTXInfo,
  UserProfile,
  FarmZone,
  DiaryEntry,
  HarvestLot,
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
  INITIAL_PACKAGES,
  INITIAL_INVENTORY,
  INITIAL_TRANSACTIONS,
  INITIAL_ORDERS,
  INITIAL_MEMBERS,
  INITIAL_MEMBER_REQUESTS,
  INITIAL_NOTIFICATIONS,
} from '../mock/data';

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
  packages: PackagedProduct[];
  inventory: InventoryItem[];
  transactions: StockTransaction[];
  orders: SalesOrder[];
  members: UserProfile[];
  memberRequests: MemberRequest[];
  notifications: AppNotification[];

  // Mutations
  addDiary: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'isLocked' | 'createdBy'>) => void;
  deleteDiary: (id: string) => void;
  addHarvest: (lot: Omit<HarvestLot, 'id' | 'code'>) => void;
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
    name: currentRole === 'R06' ? 'Bác Nguyễn Văn An' : currentRole === 'R05' ? 'Bác Trần Văn Thắng' : currentRole === 'R04' ? 'Chị Nguyễn Thị Dung' : 'Ông Phạm Văn Minh',
    role: currentRole,
    phone: '0978 123 456',
    cccd: '033062001928',
    htxId: currentHTXId,
    team: currentRole === 'R05' ? 'Tổ trưởng Tổ 1' : 'Tổ 1 - Lúa sạch',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
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
    if (tab === 'home') setCurrentScreen('home');
    else if (tab === 'diary') setCurrentScreen('diary_list');
    else if (tab === 'notifications') setCurrentScreen('notifications');
    else if (tab === 'profile') setCurrentScreen('profile');
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

  // Check if today has diary
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHasDiary = diaries.some(
    (d) => d.date === todayStr || d.date === '2026-09-24'
  );

  // Mutations
  const addDiary = (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'isLocked' | 'createdBy'>) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: `d-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isLocked: false,
      createdBy: currentUser.name,
    };
    setDiaries((prev) => [newEntry, ...prev]);
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
    }
  };

  const rejectMemberRequest = (id: string, reason: string) => {
    setMemberRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected', rejectionReason: reason } : r))
    );
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
    return true;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
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
        packages: packages.filter((p) => p.htxId === currentHTXId),
        inventory: inventory.filter((i) => i.htxId === currentHTXId),
        transactions: transactions.filter((t) => t.htxId === currentHTXId),
        orders: orders.filter((o) => o.htxId === currentHTXId),
        members: members.filter((m) => m.htxId === currentHTXId),
        memberRequests: memberRequests.filter((r) => r.htxId === currentHTXId),
        notifications,
        addDiary,
        deleteDiary,
        addHarvest,
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
