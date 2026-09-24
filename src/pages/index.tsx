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
import { InventoryList } from './inventory/InventoryList';
import { StockTransactionAdd } from './inventory/StockTransactionAdd';
import { DashboardPage } from './dashboard/DashboardPage';
import { NotificationList } from './notifications/NotificationList';
import { NotificationDetail } from './notifications/NotificationDetail';
import { ProfilePage } from './profile/ProfilePage';

export const MainApp: React.FC = () => {
  const { currentScreen, isLoggedIn } = useApp();

  const renderScreen = () => {
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
      case 'members_approval':
        return <MemberApproval />;
      case 'inventory_list':
        return <InventoryList />;
      case 'inventory_tx':
        return <StockTransactionAdd />;
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
