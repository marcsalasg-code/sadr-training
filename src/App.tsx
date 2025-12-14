/**
 * SADR Training OS - App Principal
 * Phase 15: Protected routes with AuthGuard and SessionScopeGuard
 * Code splitting para vistas pesadas
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppShell } from './components/layout';
import { AuraLoadingState } from './components/ui/aura';
import { AuthGuard, SessionScopeGuard } from './routes';
import {
  Dashboard,
  AthletesList,
  LiveSession,
} from './views';

// Lazy load views
const LoginView = lazy(() => import('./views/LoginView'));
const AthleteHomeView = lazy(() => import('./views/AthleteHomeView'));
const AnalyticsView = lazy(() => import('./views/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const PlanningView = lazy(() => import('./views/PlanningView').then(m => ({ default: m.PlanningView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
const AthleteDetail = lazy(() => import('./views/AthleteDetail').then(m => ({ default: m.AthleteDetail })));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <AuraLoadingState message="Loading view..." variant="dots" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route: Login */}
        <Route path="/login" element={
          <Suspense fallback={<LoadingFallback />}>
            <LoginView />
          </Suspense>
        } />

        {/* Protected Routes (any authenticated user) */}
        <Route element={<AuthGuard />}>
          <Route element={<AppShell><Routes><Route path="*" element={null} /></Routes></AppShell>}>
            {/* Placeholder - actual routes below */}
          </Route>
        </Route>

        {/* All app routes inside AppShell with auth */}
        <Route element={<AuthGuard />}>
          <Route element={<AppShellWrapper />}>
            {/* Common routes (coach + athlete) */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/me" element={
              <Suspense fallback={<LoadingFallback />}>
                <AthleteHomeView />
              </Suspense>
            } />
            <Route path="/analytics" element={
              <Suspense fallback={<LoadingFallback />}>
                <AnalyticsView />
              </Suspense>
            } />
            <Route path="/settings" element={
              <Suspense fallback={<LoadingFallback />}>
                <SettingsView />
              </Suspense>
            } />

            {/* Live Session with scope guard */}
            <Route element={<SessionScopeGuard />}>
              <Route path="/sessions/live/:id" element={<LiveSession />} />
            </Route>

            {/* Redirects */}
            <Route path="/analytics/training" element={<Navigate to="/analytics?tab=training" replace />} />
          </Route>
        </Route>

        {/* Coach-only routes */}
        <Route element={<AuthGuard allowedRoles={['coach']} />}>
          <Route element={<AppShellWrapper />}>
            <Route path="/planning" element={
              <Suspense fallback={<LoadingFallback />}>
                <PlanningView />
              </Suspense>
            } />
            <Route path="/athletes" element={<AthletesList />} />
            <Route path="/athletes/:id" element={
              <Suspense fallback={<LoadingFallback />}>
                <AthleteDetail />
              </Suspense>
            } />

            {/* Legacy redirects (coach only) */}
            <Route path="/sessions" element={<Navigate to="/planning?tab=sessions" replace />} />
            <Route path="/templates" element={<Navigate to="/planning?tab=templates" replace />} />
            <Route path="/exercises" element={<Navigate to="/planning?tab=exercises" replace />} />
            <Route path="/calendar" element={<Navigate to="/planning?tab=calendar" replace />} />
            <Route path="/lab" element={<Navigate to="/settings?tab=advanced" replace />} />
          </Route>
        </Route>

        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Wrapper component to nest AppShell with Outlet
 */
import { Outlet } from 'react-router-dom';

function AppShellWrapper() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default App;
