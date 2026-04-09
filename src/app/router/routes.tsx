import { Routes, Route } from 'react-router-dom';

import { MinimalLayout } from '@/app/layouts/MinimalLayout';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { AppLayout } from '@/app/layouts/AppLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

import { LandingPage } from '@/app/pages/LandingPage';
import { LoginPage } from '@/app/pages/LoginPage';
import { DealsPage } from '@/domains/deals/pages/DealsPage';
import { DashboardPage } from '@/app/pages/DashboardPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public — Landing */}
      <Route element={<MinimalLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Auth — Login */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected — App Shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/deals" element={<DealsPage />} />
        {/* Future routes go here */}
      </Route>
    </Routes>
  );
}
