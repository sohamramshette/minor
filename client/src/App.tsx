import React, { useState } from 'react';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { RepositoryAnalysisPage } from './pages/RepositoryAnalysisPage';
import { CommitExplorerPage } from './pages/CommitExplorerPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { SentimentAnalysisPage } from './pages/SentimentAnalysisPage';
import { BugInvestigationPage } from './pages/BugInvestigationPage';
import { ReportsPage } from './pages/ReportsPage';
import { useHealthCheck } from './hooks/useHealthCheck';
import { NavigationTab } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [activeRepo, setActiveRepo] = useState<string>('facebook/react');
  const { health, loading, refreshHealth } = useHealthCheck();

  const handleSelectRepo = (repo: string) => {
    setActiveRepo(repo);
    setCurrentTab('repository');
  };

  return (
    <DashboardLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      backendHealth={health}
      isBackendLoading={loading}
      onRefreshHealth={refreshHealth}
      activeRepo={activeRepo}
    >
      {currentTab === 'overview' && (
        <OverviewPage
          onNavigateTab={setCurrentTab}
          onSelectRepo={handleSelectRepo}
        />
      )}
      {currentTab === 'repository' && (
        <RepositoryAnalysisPage
          backendHealth={health}
          onSelectRepo={handleSelectRepo}
        />
      )}
      {currentTab === 'commits' && (
        <CommitExplorerPage backendHealth={health} />
      )}
      {currentTab === 'risk' && <RiskAnalysisPage />}
      {currentTab === 'sentiment' && <SentimentAnalysisPage />}
      {currentTab === 'investigation' && <BugInvestigationPage />}
      {currentTab === 'reports' && (
        <ReportsPage backendHealth={health} />
      )}
    </DashboardLayout>
  );
};

export default App;
