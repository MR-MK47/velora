/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const CommandDashboard = lazy(() => import('./pages/CommandDashboard'));
const CampaignWorkspace = lazy(() => import('./pages/CampaignWorkspace'));
const Settings = lazy(() => import('./pages/Settings'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center text-primary"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<CommandDashboard />} />
            <Route path="campaigns" element={<CampaignWorkspace />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
