# ARCH_MAP - Mapa de Arquitectura SADR Training OS

> **Propósito**: Visualizar dependencias críticas y puntos de riesgo en el sistema.

**Última actualización**: 2025-12-12

---

## 🏗️ Capas de Arquitectura (Alto Nivel)

```
┌────────────────────────────────────────────────────────────────────┐
│                          VIEWS (React Components)                   │
│    Dashboard, AthletesList, AthleteDetail, SessionBuilder,         │
│    LiveSession, TemplatesView, CalendarView, AnalyticsView         │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ uses
┌──────────────────────────────▼─────────────────────────────────────┐
│                           HOOKS (React Hooks)                       │
│    useDashboardData, useLiveSession, useCalendarView,              │
│    useAnalyticsData, useSessionBuilder, useTrainingPlan            │
└───────────────┬──────────────────────────────────┬─────────────────┘
                │ imports                          │ reads/writes
┌───────────────▼──────────────┐   ┌───────────────▼─────────────────┐
│     DOMAIN (Pure TypeScript) │   │          STORE (Zustand)        │
│  sessions, athletes,         │   │   store.ts (combined slices)    │
│  exercises, templates,       │   │   athletesSlice, sessionsSlice  │
│  plans, performance          │   │   templatesSlice, exercisesSlice│
└───────────────┬──────────────┘   │   plansSlice, configSlice       │
                │                  └───────────────┬─────────────────┘
                │ uses                             │ persists to
┌───────────────▼──────────────┐   ┌───────────────▼─────────────────┐
│      CORE (Analysis/Config)  │   │     PERSISTENCE (localStorage)  │
│  core/analysis/metrics.ts    │   │  "training-monitor-storage"     │
│  core/config/                │   │  "ai-settings-storage"          │
│  core/exercises/             │   └─────────────────────────────────┘
│  core/sessions/              │
└──────────────────────────────┘
```

---

## 📁 Estructura de Directorios con Dependencias

```
src/
├── views/                 ──────────> hooks/, components/, store/
│   ├── Dashboard.tsx      ──────────> useDashboardData, useSessionBuilder
│   ├── AthleteDetail.tsx  ──────────> useTrainingStore, core/analysis/metrics
│   ├── LiveSession.tsx    ──────────> useLiveSession, useTrainingStore
│   ├── SessionBuilder.tsx ──────────> useSessionBuilder, useExercises
│   ├── CalendarView.tsx   ──────────> useCalendarView
│   ├── AnalyticsView.tsx  ──────────> useAnalyticsData
│   └── TemplatesView.tsx  ──────────> useTrainingStore, useTrainingPlan
│
├── hooks/                 ──────────> domain/, store/, core/
│   ├── useLiveSession.ts  ──────────> domain/sessions, store
│   ├── useDashboardData.ts─────────> store, domain/sessions
│   ├── useAnalyticsData.ts─────────> store, domain/sessions
│   ├── useCalendarView.ts ──────────> store, domain/plans
│   └── useSessionBuilder.ts────────> store
│
├── domain/                ──────────> types/, core/
│   ├── sessions/          ──────────> types/types.ts
│   │   ├── types.ts       ──────────> (tipos propios)
│   │   ├── calculations.ts─────────> types.ts
│   │   ├── helpers.ts     ──────────> types.ts
│   │   ├── workout.ts     ──────────> types.ts (mutaciones de sesión)
│   │   └── mappers.ts     ──────────> types.ts
│   ├── athletes/          ──────────> types/types.ts
│   ├── exercises/         ──────────> types/types.ts
│   ├── templates/         ──────────> types/types.ts
│   ├── plans/             ──────────> types/types.ts, domain/sessions
│   └── performance/       ──────────> types/types.ts
│
├── store/                 ──────────> domain/, zustand
│   ├── store.ts           ──────────> *Slice.ts, domain/, core/
│   ├── athletesSlice.ts   ──────────> (independiente)
│   ├── sessionsSlice.ts   ──────────> (independiente)
│   └── ...otros slices
│
├── core/                  ──────────> types/
│   ├── analysis/metrics.ts─────────> types/types.ts
│   ├── config/            ──────────> types/types.ts
│   ├── exercises/         ──────────> types/types.ts
│   └── sessions/          ──────────> types/types.ts
│
├── ai/                    ──────────> types/, domain/, aiStore
│   ├── AIOrchestrator.ts  ──────────> engines/, validation/
│   ├── aiStore.ts         ──────────> zustand (standalone)
│   ├── engines/           ──────────> types/, aiStore
│   ├── hooks/             ──────────> aiStore, engines
│   ├── providers/         ──────────> AIEngine.ts
│   └── performance/       ──────────> types/
│
├── components/            ──────────> domain/, store/, ui/
│   ├── session/           ──────────> store, hooks
│   ├── athletes/          ──────────> store
│   ├── calendar/          ──────────> store
│   ├── layout/            ──────────> (independiente)
│   └── ui/aura/           ──────────> (componentes base)
│
├── utils/                 ──────────> core/, types/
│   └── metrics.ts         ──────────> core/analysis/metrics (re-export)
│
└── types/
    └── types.ts           ──────────> (tipos globales, raíz de dependencias)
```

---

## ⚠️ Puntos Críticos de Riesgo

### 1. `types/types.ts` - Punto único de fallo

```
                    ┌─────────────────┐
                    │  types/types.ts │  ◄─── CRÍTICO
                    └────────┬────────┘
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
    domain/sessions    domain/athletes    domain/exercises
            │                │                │
            ▼                ▼                ▼
    store/slices      hooks/*          components/*
```

**Riesgo**: Un cambio en los tipos principales rompe múltiples capas.  
**Mitigación**: Congelar tipos core (WorkoutSession, SetEntry, Athlete, Exercise).

---

### 2. Store con múltiples consumers

```
┌─────────────────────────────────────────────────────────────────┐
│                    store/store.ts                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │athletes │ │sessions │ │templates│ │exercises│ │ plans   │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼──────────┼─────────┼──────────┼──────────┼──────────────┘
        │          │         │          │          │
        ▼          ▼         ▼          ▼          ▼
   AthletesList LiveSession Templates  Exercises  Calendar
   AthleteDetail Dashboard  SessionBuilder        Analytics
```

**Riesgo**: Cambio en estructura de un slice puede romper múltiples vistas.  
**Mitigación**: Los slices deben mantener backward compatibility.

---

### 3. LiveSession - flujo de mutaciones

```
┌────────────────┐
│  LiveSession   │
│  (view)        │
└───────┬────────┘
        │ calls
┌───────▼────────┐
│ useLiveSession │ ◄─── Orquestador crítico
└───────┬────────┘
        │ delegates to
┌───────▼────────────────┐
│ domain/sessions/workout │
│ - completeSet           │
│ - uncompleteSet         │
│ - addSet                │
│ - removeSet             │
│ - addExerciseToSession  │
└───────┬────────────────┘
        │ updates
┌───────▼────────┐
│ sessionsSlice  │
│ (updateSession)│
└────────────────┘
```

**Riesgo**: Cambio en cualquier paso puede perder datos de sesión en progreso.  
**Mitigación**: NUNCA modificar `workout.ts` sin tests exhaustivos.

---

### 4. Persistencia - puntos de escritura

```
localStorage
├── "training-monitor-storage"   ◄─── store.ts (Zustand persist)
│   ├── athletes[]
│   ├── sessions[]
│   ├── templates[]
│   ├── exercises[]
│   ├── trainingPlans[]
│   ├── settings
│   ├── anchorConfig
│   └── exerciseCategories
│
└── "ai-settings-storage"        ◄─── aiStore.ts (Zustand standalone)
    ├── apiKey
    ├── providerType
    ├── aiEnabled
    └── logs[]
```

**Riesgo**: Cambio en `partialize()` o estructura puede perder datos.  
**Mitigación**: Cualquier cambio de persistencia requiere migración.

---

### 5. Routing - redirects de compatibilidad

```
App.tsx
├── / ─────────────────────> Dashboard
├── /athletes ─────────────> AthletesList
├── /athletes/:id ─────────> AthleteDetail
├── /planning ─────────────> PlanningView
├── /sessions ─────────────> REDIRECT → /planning?tab=sessions
├── /sessions/live/:id ────> LiveSession
├── /templates ────────────> REDIRECT → /planning?tab=templates
├── /exercises ────────────> REDIRECT → /planning?tab=exercises
├── /calendar ─────────────> REDIRECT → /planning?tab=calendar
├── /analytics ────────────> AnalyticsView (lazy)
├── /settings ─────────────> SettingsView
└── /lab ──────────────────> REDIRECT → /settings?tab=advanced
```

**Riesgo**: Eliminar redirects rompe URLs guardadas/bookmarks.  
**Mitigación**: NUNCA eliminar rutas existentes, solo añadir nuevas.

---

## 🔗 Dependencias Externas

| Dependencia | Uso | Riesgo |
|-------------|-----|--------|
| `zustand` | Estado global + persistencia | CRÍTICO - migrar requiere mucho trabajo |
| `react-router-dom` | Navegación | MEDIO - cambios en rutas |
| `zod` | Validación de IA | BAJO - aislado en AI layer |
| `tailwindcss` | Estilos | BAJO - solo presentación |

---

## 📊 Métricas de Complejidad por Módulo

| Archivo | Líneas | Imports | Riesgo |
|---------|--------|---------|--------|
| `store/store.ts` | 409 | 12 | 🔴 ALTO |
| `hooks/useLiveSession.ts` | 403 | 15 | 🔴 ALTO |
| `views/LiveSession.tsx` | 427 | 18 | 🔴 ALTO |
| `views/Dashboard.tsx` | 447 | 14 | 🟡 MEDIO |
| `hooks/useCalendarView.ts` | ~400 | 10 | 🟡 MEDIO |
| `hooks/useAnalyticsData.ts` | ~300 | 8 | 🟡 MEDIO |
| `domain/sessions/*` | ~500 | 5 | 🟡 MEDIO |
| `components/ui/aura/*` | ~1000 | -- | 🟢 BAJO |

---

## 📝 Reglas de Arquitectura

1. **Flujo de datos unidireccional**: View → Hook → Domain → Store
2. **Domain layer puro**: Sin dependencias de React ni store
3. **Hooks como orquestadores**: Conectan domain con store
4. **Componentes presentacionales**: Sin lógica de negocio
5. **Tipos centralizados**: Todo en `types/types.ts` o `domain/*/types.ts`
