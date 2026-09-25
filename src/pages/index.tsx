import React from 'react';
import { useApp } from '../context/AppContext';
import { RoleHTXSwitcher } from '../components/RoleHTXSwitcher';
import { BottomNav } from '../components/BottomNav';
import { VoiceModal } from '../components/VoiceModal';

// Screens
import { Login } from './auth/Login';
import { Register } from './auth/Register';
import { HomePage } from './home/HomePage';
import { DiaryList } from './diary/DiaryList';
import { DiaryAddWizard } from './diary/DiaryAddWizard';
import { DiaryDetail } from './diary/DiaryDetail';
import { FarmList } from './farm/FarmList';
import { FarmAdd } from './farm/FarmAdd';
import { FarmDetail } from './farm/FarmDetail';
import { HarvestList } from './harvest/HarvestList';
import { HarvestAdd } from './harvest/HarvestAdd';
import { HarvestDetail } from './harvest/HarvestDetail';
import { ProcessingList } from './processing/ProcessingList';
import { ProcessingAdd } from './processing/ProcessingAdd';
import { ProcessingDetail } from './processing/ProcessingDetail';
import { PackagingList } from './packaging/PackagingList';
import { PackagingAdd } from './packaging/PackagingAdd';
import { PackagingQRView } from './packaging/PackagingQRView';
import { SalesList } from './sales/SalesList';
import { SalesAdd } from './sales/SalesAdd';
import { SalesDetail } from './sales/SalesDetail';
import { TraceScanner } from './trace/TraceScanner';
import { TraceResult } from './trace/TraceResult';
import { MemberList } from './members/MemberList';
import { MemberApproval } from './members/MemberApproval';
import { MemberDetail } from './members/MemberDetail';
import { MemberAdd } from './members/MemberAdd';
import { InventoryList } from './inventory/InventoryList';
import { InventoryDetail } from './inventory/InventoryDetail';
import { InventoryAdd } from './inventory/InventoryAdd';
import { StockTransactionAdd } from './inventory/StockTransactionAdd';
import { StockTransactionDetail } from './inventory/StockTransactionDetail';
import { DashboardPage } from './dashboard/DashboardPage';
import { NotificationList } from './notifications/NotificationList';
import { NotificationDetail } from './notifications/NotificationDetail';
import { ProfilePage } from './profile/ProfilePage';
import { canAccessScreen } from '../utils/permissions';

export const MainApp: React.FC = () => {
  const { currentScreen, isLoggedIn, currentRole, navigateTo } = useApp();

  const renderScreen = () => {
    // Kiểm tra quyền hạn màn hình theo vai trò (SRS Mục 7)
    if (isLoggedIn && !canAccessScreen(currentRole, currentScreen)) {
      return (
        <div className="p-6 bg-slate-50 min-h-screen flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl shadow-inner border-2 border-red-200">
            🚫
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-slate-900">Không có quyền truy cập</h3>
            <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
              Tài khoản của bạn với vai trò <strong>{currentRole}</strong> chưa được cấp quyền truy cập chức năng này theo quy định phân quyền HTX (SRS Mục 7).
            </p>
          </div>
          <button
            onClick={() => navigateTo('home')}
            className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-md active:scale-95 transition-all"
          >
            Quay về Trang chủ
          </button>
        </div>
      );
    }

    switch (currentScreen) {
      case 'auth_login':
        return <Login />;
      case 'auth_register':
        return <Register />;
      case 'home':
        return <HomePage />;
      case 'diary_list':
        return <DiaryList />;
      case 'diary_add':
        return <DiaryAddWizard />;
      case 'diary_detail':
        return <DiaryDetail />;
      case 'farm_list':
        return <FarmList />;
      case 'farm_add':
        return <FarmAdd />;
      case 'farm_detail':
        return <FarmDetail />;
      case 'harvest_list':
        return <HarvestList />;
      case 'harvest_add':
        return <HarvestAdd />;
      case 'harvest_detail':
        return <HarvestDetail />;
      case 'processing_list':
        return <ProcessingList />;
      case 'processing_add':
        return <ProcessingAdd />;
      case 'processing_detail':
        return <ProcessingDetail />;
      case 'packaging_list':
        return <PackagingList />;
      case 'packaging_add':
        return <PackagingAdd />;
      case 'packaging_qr':
        return <PackagingQRView />;
      case 'sales_list':
        return <SalesList />;
      case 'sales_add':
        return <SalesAdd />;
      case 'sales_detail':
        return <SalesDetail />;
      case 'trace_scan':
        return <TraceScanner />;
      case 'trace_result':
        return <TraceResult />;
      case 'members_list':
        return <MemberList />;
      case 'member_detail':
        return <MemberDetail />;
      case 'member_add':
        return <MemberAdd />;
      case 'members_approval':
        return <MemberApproval />;
      case 'inventory_list':
        return <InventoryList />;
      case 'inventory_detail':
        return <InventoryDetail />;
      case 'inventory_add':
        return <InventoryAdd />;
      case 'inventory_tx':
        return <StockTransactionAdd />;
      case 'inventory_tx_detail':
        return <StockTransactionDetail />;
      case 'dashboard':
        return <DashboardPage />;
      case 'notifications':
        return <NotificationList />;
      case 'notification_detail':
        return <NotificationDetail />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  const isAuthScreen =
    currentScreen === 'auth_login' ||
    currentScreen === 'auth_register';

  return (
    <div className="mobile-viewport">
      {/* Demo Switcher for Sở NN&PTNT and HTX Board */}
      <RoleHTXSwitcher />

      {/* Screen Component */}
      <main className="flex-1">{renderScreen()}</main>

      {/* Bottom Nav Bar (visible when logged in and not on fullscreen scanner or wizard) */}
      {isLoggedIn && !isAuthScreen && currentScreen !== 'trace_scan' && (
        <BottomNav />
      )}

      {/* Voice Assistant Modal */}
      <VoiceModal />
    </div>
  );
};

export default MainApp;
