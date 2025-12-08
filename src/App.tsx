/**
 * TRAINING MONITOR - App Principal
 * Configuración de rutas y layout general
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout';
import {
  Dashboard,
  AthletesList,
  AthleteDetail,
  SessionBuilder,
  LiveSession,
  TemplatesView,
  ExercisesView,
  CalendarView,
  AnalyticsView,
  SettingsView,
  InternalLab,
} from './views';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[var(--color-bg-primary)]">
        {/* Sidebar fija */}
        <Sidebar />

        {/* Contenido principal */}
        <div className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/athletes" element={<AthletesList />} />
            <Route path="/athletes/:id" element={<AthleteDetail />} />
            <Route path="/sessions" element={<SessionBuilder />} />
            <Route path="/sessions/live/:id" element={<LiveSession />} />
            <Route path="/templates" element={<TemplatesView />} />
            <Route path="/exercises" element={<ExercisesView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/lab" element={<InternalLab />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
