# SADR Training OS - Contexto Completo para IA

## Resumen del Proyecto
**SADR Training OS** es una aplicación web para entrenadores de fuerza que permite gestionar atletas, planificar sesiones de entrenamiento, trackear progreso, y analizar métricas de rendimiento.

**Stack Tecnológico:**
- React 18 + TypeScript
- Vite como bundler
- Zustand para estado global (persistido en localStorage)
- React Router para navegación
- CSS variables con tema oscuro premium

---

## Estructura de Archivos Principal

```
src/
├── App.tsx                    # Router principal, 5 rutas: /, /athletes, /planning, /analytics, /settings
├── views/                     # Vistas principales (15 archivos)
│   ├── Dashboard.tsx          # Panel principal con WeeklyScheduleWidget
│   ├── PlanningView.tsx       # Vista unificada con tabs: Sesiones|Plantillas|Calendario|Ejercicios
│   ├── AthletesList.tsx       # Lista de atletas
│   ├── AthleteDetail.tsx      # Detalle de atleta con historial
│   ├── AnalyticsView.tsx      # Métricas y análisis
│   ├── SettingsView.tsx       # Configuración + Avanzado (Lab)
│   └── LiveSession.tsx        # Sesión de entrenamiento en vivo
├── components/
│   ├── ui/aura/               # Sistema de componentes UI (AuraPanel, AuraButton, etc.)
│   ├── dashboard/             # WeeklyScheduleWidget, TodayTrainingWidget
│   ├── session/               # SetRow, SessionStructureEditor
│   └── common/                # Componentes compartidos
├── hooks/                     # 19 custom hooks
│   ├── useLiveSession.ts      # Gestión de sesión en vivo (refactorizado)
│   ├── useLiveSessionModals.ts# Estados de modales (extraído)
│   ├── useLiveSessionSetHandlers.ts # Handlers de sets (extraído)
│   ├── useDashboardData.ts    # Datos del dashboard
│   └── useWeeklySchedule.ts   # Calendario semanal
├── store/                     # Estado global Zustand
│   ├── store.ts               # Store principal con persistencia
│   ├── athletesSlice.ts       # CRUD atletas
│   ├── sessionsSlice.ts       # CRUD sesiones
│   └── configSlice.ts         # Configuración del coach
├── domain/                    # Funciones puras de negocio
│   ├── sessions/              # Cálculos de sesiones, tipos
│   ├── athletes/              # Tipos de atletas
│   ├── exercises/             # Catálogo de ejercicios
│   └── performance/           # Métricas de rendimiento
├── core/
│   ├── analysis/metrics.ts    # Motor de métricas consolidado
│   └── config/                # Modelos de configuración
├── ai/                        # Motor IA
│   ├── AIOrchestrator.ts      # Orquestador principal
│   └── engines/               # Motores específicos (1RM, analytics)
└── utils/                     # Utilidades
```

---

## Navegación (5 items)

| Ruta | Vista | Descripción |
|------|-------|-------------|
| `/` | Dashboard | Calendario semanal, métricas, acciones rápidas |
| `/athletes` | AthletesList | Lista de atletas con búsqueda |
| `/planning` | PlanningView | Tabs: Sesiones, Plantillas, Calendario, Ejercicios |
| `/analytics` | AnalyticsView | Gráficos, tendencias, análisis |
| `/settings` | SettingsView | Configuración + Avanzado (Lab) |

---

## Modelos de Datos Clave

### Athlete
```typescript
interface Athlete {
  id: string;
  name: string;
  currentWeightKg: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  oneRMRecords: Record<string, OneRMRecord>;
}
```

### WorkoutSession
```typescript
interface WorkoutSession {
  id: string;
  athleteId: string;
  name: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  exercises: ExerciseEntry[];
  totalVolume?: number;
  durationMinutes?: number;
}
```

### SetEntry
```typescript
interface SetEntry {
  id: string;
  plannedReps: number;
  plannedWeight: number;
  actualReps?: number;
  actualWeight?: number;
  isCompleted: boolean;
  rpe?: number;
}
```

---

## Flujo de Sesión de Entrenamiento

1. Crear sesión desde Planificación → status: `planned`
2. Iniciar sesión → status: `in_progress`, aparece en Dashboard
3. Completar sets (peso, reps, RPE)
4. Terminar sesión → status: `completed`, calcula 1RM automático

---

## Mejoras Recientes Implementadas

### Alta Prioridad ✅
- Consolidación de métricas (`utils/metrics.ts` → re-exports, -536 líneas)
- Validación de volumen en rehydration del store
- Eliminación de type assertions innecesarios

### Media Prioridad ✅
- UI para ejercicios anchor 1RM en Settings
- Refactor de `useLiveSession` en sub-hooks (-110 líneas)
- Umbrales de volumen configurables por coach

### Restructuración UX ✅
- Sidebar simplificado: 9 → 5 items
- PlanningView unificada con 4 tabs
- Lab integrado en Settings > Avanzado
- Calendario semanal premium en Dashboard

---

## Variables CSS del Tema

```css
--color-bg-primary: #0A0A0A;
--color-bg-secondary: #0D0D0D;
--color-accent-gold: #C5A572;
--color-text-primary: #FFFFFF;
--color-text-muted: #6B7280;
--color-border-default: #2A2A2A;
```

---

## Comandos de Desarrollo

```bash
npm run dev      # Servidor desarrollo
npm run build    # Build producción
npx tsc --noEmit # Verificar tipos
npm run lint     # ESLint
```

---

## Estado Actual

- **TypeScript:** Compila sin errores
- **Dev Server:** http://localhost:5173/
- **Archivos TS/TSX:** 222 archivos
- **Última actualización:** 2025-12-12
