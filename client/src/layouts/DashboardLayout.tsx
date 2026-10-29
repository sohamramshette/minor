import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { NavigationTab, BackendHealth } from '../types';

interface DashboardLayoutProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  backendHealth: BackendHealth | null;
  isBackendLoading: boolean;
  onRefreshHealth: () => void;
  activeRepo: string;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onTabChange,
  backendHealth,
  isBackendLoading,
  onRefreshHealth,
  activeRepo,
  children,
}) => {
  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100 font-sans antialiased">
      {/* Fixed Sticky Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={onTabChange}
        backendHealth={backendHealth}
        isBackendLoading={isBackendLoading}
        onRefreshHealth={onRefreshHealth}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentTab={currentTab}
          backendHealth={backendHealth}
          activeRepo={activeRepo}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
