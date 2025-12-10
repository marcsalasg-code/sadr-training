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
          <Route path="/sessions" element={<SessionBuilder />} />
          <Route path="/sessions/live/:id" element={<LiveSession />} />
          <Route path="/templates" element={<TemplatesView />} />
          <Route path="/exercises" element={<ExercisesView />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/analytics" element={
            <Suspense fallback={<LoadingFallback />}>
              <AnalyticsView />
            </Suspense>
          } />
          {/* Redirect old training analytics path to unified view */}
          <Route path="/analytics/training" element={<Navigate to="/analytics?tab=training" replace />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/lab" element={
            <Suspense fallback={<LoadingFallback />}>
              <InternalLab />
            </Suspense>
          } />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
