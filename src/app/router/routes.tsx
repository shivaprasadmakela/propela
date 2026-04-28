import { Routes, Route } from 'react-router-dom';

import { MinimalLayout } from '@/app/layouts/MinimalLayout';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { AppLayout } from '@/app/layouts/AppLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

import { LandingPage } from '@/app/pages/LandingPage';
import { LoginPage } from '@/app/pages/LoginPage';
import { ForgotPasswordPage } from '@/app/pages/ForgotPasswordPage';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { DealsPage } from '@/domains/deals/pages/DealsPage';
import { DashboardPage } from '@/app/pages/DashboardPage';
import { ProductsPage } from '@/domains/products/pages/ProductsPage';
import { AccountsPage } from '@/domains/accounts/pages/AccountsPage';
import { SettingsPage } from '@/domains/settings/pages/SettingsPage';
import { DealProfilePage } from '@/domains/deals/pages/DealProfilePage';
import { AccountProfilePage } from '@/domains/accounts/pages/AccountProfilePage';
import { TasksPage } from '@/domains/tasks/pages/TasksPage';

export function AppRoutes() {
  return (
    <Routes>
      {}
      <Route element={<MinimalLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/dealProfile/:code" element={<DealProfilePage />} />
        <Route path="/accountProfile/:code" element={<AccountProfilePage />} />
        {}
      </Route>
      
      {}
      <Route element={<MinimalLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
