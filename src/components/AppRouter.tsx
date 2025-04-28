import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layout/DashboardLayout';
import DashboardPage from '../pages/DashboardPage';
import VulnerabilitiesPage from '../pages/VulnerabilitiesPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import PerformanceTestPage from '../pages/PerformanceTestPage';

const AppRouter: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/vulnerabilities" element={<VulnerabilitiesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/performance" element={<PerformanceTestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AppRouter; 