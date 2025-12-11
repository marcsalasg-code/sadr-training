# Radiografía General - SADR Training OS

## Mapa de Carpetas

```
src/
├── views/                    # Vistas principales (12 archivos)
│   ├── Dashboard.tsx         # 21KB - Hub principal
│   ├── AthletesList.tsx      # 13KB - Lista de atletas
│   ├── AthleteDetail.tsx     # 14KB - Detalle de atleta
│   ├── SessionBuilder.tsx    # 11KB - Constructor de sesiones
│   ├── LiveSession.tsx       # 17KB - Sesión en vivo
│   ├── TemplatesView.tsx     # 18KB - Gestión de plantillas
│   ├── AnalyticsView.tsx     # 15KB - Analytics y métricas
│   ├── CalendarView.tsx      # 23KB - Calendario mensual
│   ├── ExercisesView.tsx     # 15KB - Biblioteca de ejercicios
│   ├── SettingsView.tsx      # 25KB - Configuración general
│   ├── InternalLab.tsx       # 2KB - Laboratorio interno
│   └── Settings/             # Subvistas de settings
│
├── components/               # Componentes reutilizables (10 subdirs, ~90 archivos)
│   ├── analytics/            # 3 archivos - Componentes de analytics
│   ├── athletes/             # 12 archivos - Componentes de atletas
│   ├── calendar/             # 2 archivos - Componentes de calendario
│   ├── common/               # 12 archivos - ExercisePicker, etc.
│   ├── dashboard/            # 5 archivos - Widgets del dashboard
│   ├── lab/                  # 6 archivos - Laboratorio de pruebas
│   ├── layout/               # 7 archivos - AppShell, Sidebar, TopBar
│   ├── session/              # 17 archivos - Sets, ejercicios, timers
│   ├── templates/            # 3 archivos - TemplateFormModal, etc.
│   └── ui/                   # 23 archivos - Sistema Aura UI
│
├── hooks/                    # Custom hooks (16 archivos)
│   ├── useLiveSession.ts     # 17KB - Gestión sesión en vivo
│   ├── useCalendarView.ts    # 13KB - Lógica del calendario
│   ├── useDashboardData.ts   # 10KB - Datos del dashboard
│   ├── useAnalyticsData.ts   # 10KB - Métricas y analytics
│   ├── useTrainingPlanCalendar.ts  # 10KB
│   ├── useSessionBuilder.ts  # 8KB
│   ├── useSetRow.ts          # 8KB - Manejo de sets
│   └── [...otros hooks]
│
├── store/                    # Estado global Zustand (11 archivos)
│   ├── store.ts              # 16KB - Store principal combinado
│   ├── selectors.ts          # 8KB - Selectores optimizados
│   ├── configSlice.ts        # 7KB - Configuración de entrenamiento
│   ├── exercisesSlice.ts     # 5KB
│   ├── plansSlice.ts         # 3KB
│   ├── sessionsSlice.ts      # 2KB
│   ├── athletesSlice.ts      # 2KB
│   ├── templatesSlice.ts     # 2KB
│   └── [...otros slices]
│
├── domain/                   # Capa de dominio puro (6 módulos)
│   ├── athletes/             # Tipos y lógica de atletas
│   ├── sessions/             # Tipos y cálculos de sesiones
│   ├── exercises/            # Modelo de ejercicios
│   ├── templates/            # Tipos de plantillas
│   ├── plans/                # Planes de entrenamiento
│   ├── performance/          # Métricas de rendimiento
│   └── index.ts              # Re-exports centralizados
│
├── core/                     # Lógica core/análisis (4 subdirs)
│   ├── analysis/             # metrics.ts - Cálculos centralizados
│   ├── config/               # Modelo de configuración
│   ├── exercises/            # Modelo y migración de ejercicios
│   └── sessions/             # Estructura de sesiones
│
├── ai/                       # Capa de IA (7 subdirs)
│   ├── AIOrchestrator.ts     # 10KB - Orquestador principal
│   ├── AIEngine.ts           # 6KB - Clase base de engines
│   ├── aiStore.ts            # 11KB - Estado de IA
│   ├── engines/              # 6 engines especializados
│   ├── hooks/                # 7 hooks de IA
│   ├── performance/          # performanceEngine.ts (18KB)
│   ├── providers/            # Proveedores (Mock, Remote)
│   ├── prompts/              # Templates de prompts
│   ├── utils/                # Utilidades de IA
│   └── validation/           # Validación de inputs/outputs
│
├── utils/                    # Utilidades generales (15 archivos)
│   ├── metrics.ts            # 19KB - Re-exports de core/analysis
│   ├── dataSimulator.ts      # 11KB - Simulación de datos
│   ├── oneRMCalculator.ts    # 8KB - Cálculos de 1RM
│   ├── oneRMReference.ts     # 9KB - Sistema de anclas
│   ├── sessionValidation.ts  # 9KB
│   └── [...otros utils]
│
└── types/
    └── types.ts              # Tipos globales principales
```

---

## Stack Técnico

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Framework | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| Lenguaje | TypeScript | 5.9.3 |
| State Management | Zustand | 5.0.9 |
| Styling | Tailwind CSS | 4.1.17 |
| Routing | React Router DOM | 7.10.1 |
| Validation | Zod | 4.1.13 |
| UI System | Aura (custom) | - |

---

## Dominios Funcionales

### 1. Atletas (`athletes`)
- **Rutas**: `AthletesList.tsx`, `AthleteDetail.tsx`
- **Components**: `components/athletes/` (12 archivos)
- **Store**: `athletesSlice.ts`
- **Domain**: `domain/athletes/`
- **Funcionalidad**: CRUD de atletas, perfiles, 1RM records, estadísticas

### 2. Sesiones (`sessions`)
- **Rutas**: `SessionBuilder.tsx`, `LiveSession.tsx`
- **Components**: `components/session/` (17 archivos)
- **Store**: `sessionsSlice.ts`
- **Domain**: `domain/sessions/`
- **Hooks**: `useLiveSession`, `useSessionBuilder`, `useSetRow`
- **Funcionalidad**: Planificación, ejecución en vivo, tracking de sets

### 3. Plantillas (`templates`)
- **Rutas**: `TemplatesView.tsx`
- **Components**: `components/templates/` (3 archivos)
- **Store**: `templatesSlice.ts`
- **Domain**: `domain/templates/`
- **Funcionalidad**: Plantillas reutilizables, generación con IA

### 4. Planes de Entrenamiento (`plans`)
- **Store**: `plansSlice.ts`
- **Domain**: `domain/plans/`
- **Hooks**: `useTrainingPlan`, `useTrainingPlanCalendar`
- **Funcionalidad**: Planes semanales, mesociclos, adherencia

### 5. Ejercicios (`exercises`)
- **Rutas**: `ExercisesView.tsx`
- **Components**: `components/common/ExercisePicker.tsx`
- **Store**: `exercisesSlice.ts`
- **Domain**: `domain/exercises/`
- **Core**: `core/exercises/` - modelo y migración
- **Funcionalidad**: Catálogo de ejercicios, patrones de movimiento

### 6. Calendario (`calendar`)
- **Rutas**: `CalendarView.tsx`
- **Components**: `components/calendar/`
- **Hooks**: `useCalendarView`, `useTrainingPlanCalendar`
- **Funcionalidad**: Vista mensual, planificación, agenda diaria

### 7. Analytics/Performance
- **Rutas**: `AnalyticsView.tsx`, `Dashboard.tsx`
- **Components**: `components/analytics/`, `components/dashboard/`
- **Hooks**: `useAnalyticsData`, `useDashboardData`
- **Domain**: `domain/performance/`
- **Core**: `core/analysis/metrics.ts`
- **Funcionalidad**: KPIs, gráficos, tendencias, insights

### 8. Configuración (`settings`)
- **Rutas**: `SettingsView.tsx`, `Settings/TrainingConfigView.tsx`
- **Store**: `configSlice.ts`, `settingsSlice.ts`
- **Core**: `core/config/`
- **Funcionalidad**: Config de 1RM, análisis, UI, IA

### 9. Laboratorio (`lab`)
- **Rutas**: `InternalLab.tsx`
- **Components**: `components/lab/`
- **Store**: `labSlice.ts`
- **Funcionalidad**: Testing interno, validación de IA

---

## Capa de Dominio (`src/domain/`)

| Módulo | Archivos | Contenido |
|--------|----------|-----------|
| `athletes/` | `types.ts`, `index.ts` | Tipos de Athlete, funciones de estadísticas |
| `sessions/` | `types.ts`, `index.ts` | WorkoutSession, SetEntry, cálculos de volumen/progress |
| `exercises/` | `types.ts`, `index.ts` | Exercise model, patterns, muscle groups |
| `templates/` | `types.ts`, `index.ts` | WorkoutTemplate, TemplateExercise |
| `plans/` | `types.ts`, `index.ts` | TrainingPlan, DayPlan, WeekStructure |
| `performance/` | `types.ts`, `index.ts` | PerformanceMetrics, ProgressionSuggestion, fatigue |

### Uso Real del Domain Layer
- ✅ **useLiveSession**: Usa `calculateSessionTotals`, `getSessionProgress`
- ✅ **useDashboardData**: Usa `getCompletedSessions`, `sortSessionsByDate`
- ✅ **useAnalyticsData**: Usa `filterSessionsByAthlete`, `filterSessionsByDateRange`
- ✅ **useCalendarView**: Usa `filterSessionsByAthlete`
- ⚠️ **Vistas**: La mayoría aún importa de `types/types.ts` directamente
- ⚠️ **AI Layer**: Usa `types/types.ts`, no `domain/`

---

## Capa de IA (`src/ai/`)

### Orquestador
- **Archivo**: `AIOrchestrator.ts` (316 líneas)
- **Patrón**: Singleton
- **Métodos**: `generateWeeklyPlan`, `analyzePerformance`, `checkPerformance`, `compareWeeks`
- **Validación**: Valida inputs antes de pasar a engines

### Engines (`src/ai/engines/`)
| Engine | Tamaño | Función |
|--------|--------|---------|
| `analyticsEngine.ts` | 8KB | Análisis de rendimiento semanal |
| `oneRMEngine.ts` | 9KB | Análisis y sugerencias de 1RM |
| `sessionEngine.ts` | 10KB | Generación de sesiones |
| `templateEngine.ts` | 6KB | Generación de templates |
| `weeklyPlanEngine.ts` | 9KB | Generación de planes semanales |

### Performance Engine (`src/ai/performance/`)
- **Archivo**: `performanceEngine.ts` (589 líneas, 18KB)
- **Funciones**: `estimate1RMFromSets`, `getOneRepMax`, `updateOneRepMax`, `generateLoadSuggestion`, `detectOvertraining`, `checkLoadWarning`
- **Estado**: Bien organizado, sin IA real (cálculos locales)

### AI Hooks (`src/ai/hooks/`)
| Hook | Descripción |
|------|-------------|
| `useTemplateGenerator` | Generación de templates con IA |
| `useSessionGenerator` | Generación de sesiones |
| `useWeeklyPlanGenerator` | Generación de planes semanales |
| `useLoadPrediction` | Predicción de carga |
| `useExerciseSuggestions` | Sugerencias de ejercicios |
| `useAITest` | Testing de IA |

### AI Store (`src/ai/aiStore.ts`)
- **Tamaño**: 11KB
- **Estado**: `providerType`, `apiKey`, `aiEnabled`, `logs`, `lastFeedback`
- **Slices**: Config de IA, logging, feedback

### Providers (`src/ai/providers/`)
- `MockAIProvider.ts` - Respuestas simuladas para desarrollo
- `RemoteAIProvider.ts` - Conexión a API externa
- `index.ts` - Factory de providers

### Conexión con Estado Global
- `aiStore.ts` usa Zustand standalone (no integrado en store principal)
- Los engines reciben datos via parámetros, no acceden al store directamente
- Los hooks de IA importan del aiStore para config y logging
