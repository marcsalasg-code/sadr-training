/**
 * SADR Training OS - App Principal
 * Configuración de rutas con nuevo layout Aura
 * Code splitting para vistas pesadas
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppShell } from './components/layout';
import { AuraLoadingState } from './components/ui/aura';
import {
  Dashboard,
  AthletesList,
  AthleteDetail,
  SessionBuilder,
  LiveSession,
  TemplatesView,
  ExercisesView,
  CalendarView,
  SettingsView,
  PlanningView,
} from './views';

// Lazy load heavy views for better initial load performance
const AnalyticsView = lazy(() => import('./views/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const InternalLab = lazy(() => import('./views/InternalLab').then(m => ({ default: m.InternalLab })));

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
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/athletes" element={<AthletesList />} />
          <Route path="/athletes/:id" element={<AthleteDetail />} />
          {/* New unified planning view */}
          <Route path="/planning" element={<PlanningView />} />
          {/* Keep old routes for direct access and backward compatibility */}
          <Route path="/sessions" element={<Navigate to="/planning?tab=sessions" replace />} />
          <Route path="/sessions/live/:id" element={<LiveSession />} />
          <Route path="/templates" element={<Navigate to="/planning?tab=templates" replace />} />
          <Route path="/exercises" element={<Navigate to="/planning?tab=exercises" replace />} />
          <Route path="/calendar" element={<Navigate to="/planning?tab=calendar" replace />} />
          <Route path="/analytics" element={
            <Suspense fallback={<LoadingFallback />}>
              <AnalyticsView />
            </Suspense>
          } />
          <Route path="/analytics/training" element={<Navigate to="/analytics?tab=training" replace />} />
          <Route path="/settings" element={<SettingsView />} />
          {/* Lab moved to settings, redirect for backward compatibility */}
          <Route path="/lab" element={<Navigate to="/settings?tab=advanced" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
