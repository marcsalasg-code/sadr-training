/**
 * SADR Training OS - App Principal
 * Phase 15: Protected routes with AuthGuard and SessionScopeGuard
 * Phase 28: Context-centric navigation (Library, DevLab, AthleteCalendar)
 * Code splitting para vistas pesadas
 */

import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
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
const CloudLoginView = lazy(() => import('./views/auth/CloudLoginView'));
const AthleteHomeView = lazy(() => import('./views/AthleteHomeView'));
const AnalyticsView = lazy(() => import('./views/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const PlanningView = lazy(() => import('./views/PlanningView').then(m => ({ default: m.PlanningView })));
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
const AthleteDetail = lazy(() => import('./views/AthleteDetail').then(m => ({ default: m.AthleteDetail })));
// Phase 28: New views
const LibraryView = lazy(() => import('./views/LibraryView').then(m => ({ default: m.LibraryView })));
const DevLabView = lazy(() => import('./views/DevLabView').then(m => ({ default: m.DevLabView })));
const AthleteCalendarView = lazy(() => import('./views/AthleteCalendarView').then(m => ({ default: m.AthleteCalendarView })));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <AuraLoadingState message="Loading view..." variant="dots" />
    </div>
  );
}

import { AppErrorBoundary } from './components/system/AppErrorBoundary';

/**
 * Phase 28: Smart redirect for legacy /planning URLs
 * Routes to appropriate destination based on tab parameter
 */
function PlanningRedirect() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  const athleteId = searchParams.get('athleteId');
  const sessionId = searchParams.get('sessionId');
  const mode = searchParams.get('mode');

  // If editing a session, preserve that context
  if (tab === 'sessions' && sessionId) {
    // Keep session editing in PlanningView for now (backward compat)
    return null; // Don't redirect, let PlanningView handle it
  }

  // Calendar with athleteId -> athlete-scoped calendar
  if (tab === 'calendar' && athleteId) {
    return <Navigate to={`/athletes/${athleteId}/calendar`} replace />;
  }

  // Templates/Exercises -> Library
  if (tab === 'templates' || tab === 'exercises') {
    return <Navigate to={`/library?tab=${tab}`} replace />;
  }

  // Default: go to Library
  return <Navigate to="/library?tab=templates" replace />;
}

function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Route: Login */}
          <Route path="/login" element={
            <Suspense fallback={<LoadingFallback />}>
              <LoginView />
            </Suspense>
          } />

          {/* Public Route: Cloud Login */}
          <Route path="/cloud-login" element={
            <Suspense fallback={<LoadingFallback />}>
              <CloudLoginView />
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
              {/* Phase 28: Library (Templates + Exercises) */}
              <Route path="/library" element={
                <Suspense fallback={<LoadingFallback />}>
                  <LibraryView />
                </Suspense>
              } />

              {/* Phase 28: DevLab (separated from Settings) */}
              <Route path="/devlab" element={
                <Suspense fallback={<LoadingFallback />}>
                  <DevLabView />
                </Suspense>
              } />

              {/* Athletes */}
              <Route path="/athletes" element={<AthletesList />} />
              <Route path="/athletes/:id" element={
                <Suspense fallback={<LoadingFallback />}>
                  <AthleteDetail />
                </Suspense>
              } />

              {/* Phase 28: Athlete-scoped Calendar (Flow A) */}
              <Route path="/athletes/:id/calendar" element={
                <Suspense fallback={<LoadingFallback />}>
                  <AthleteCalendarView />
                </Suspense>
              } />

              {/* 
                DEPRECATED: PlanningView (Phase 28)
                Kept for backward compatibility with session editing
                Most routes redirect via PlanningRedirect
              */}
              <Route path="/planning" element={
                <Suspense fallback={<LoadingFallback />}>
                  <PlanningRedirectWrapper />
                </Suspense>
              } />

              {/* Legacy redirects (coach only) - Phase 28 updated */}
              <Route path="/sessions" element={<Navigate to="/library?tab=templates" replace />} />
              <Route path="/templates" element={<Navigate to="/library?tab=templates" replace />} />
              <Route path="/exercises" element={<Navigate to="/library?tab=exercises" replace />} />
              <Route path="/calendar" element={<Navigate to="/library?tab=templates" replace />} />
              <Route path="/lab" element={<Navigate to="/devlab" replace />} />
            </Route>
          </Route>

          {/* Catch-all redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
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

/**
 * Phase 28: Wrapper that decides whether to redirect or show PlanningView
 * For session editing (sessionId present), shows PlanningView
 * Otherwise, redirects to appropriate new route
 */
function PlanningRedirectWrapper() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  // If editing a session, show PlanningView (backward compat)
  if (sessionId) {
    return <PlanningView />;
  }

  // Otherwise, use smart redirect
  return <PlanningRedirect />;
}

export default App;

