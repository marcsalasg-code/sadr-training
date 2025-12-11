# SADR Training OS - Radiografía Interna

**Fecha:** 2025-12-11  
**Versión:** 1.0

---

## 1. Stack y Estructura

### Framework
- **Vite** + **React 18** + **TypeScript**
- **Zustand** para estado global (slices architecture)
- **React Router** para navegación
- **CSS vanilla** con sistema de diseño Aura

### Estructura de Carpetas

```
src/
├── ai/                    # Capa de IA (30 archivos)
│   ├── engines/           # Motores especializados (6)
│   ├── hooks/             # Hooks de IA (7)
│   ├── performance/       # Análisis de rendimiento (2)
│   ├── providers/         # Proveedores LLM (3)
│   ├── utils/             # Utilidades IA (3)
│   └── validation/        # Validación Zod (3)
├── components/            # Componentes UI (69 archivos)
│   ├── athletes/          # Componentes de atletas
│   ├── calendar/          # Componentes calendario
│   ├── common/            # Componentes compartidos
│   ├── dashboard/         # Widgets dashboard
│   ├── lab/               # Laboratorio interno
│   ├── layout/            # Layout principal
│   ├── session/           # Componentes sesión
│   ├── templates/         # Componentes plantillas
│   └── ui/                # Sistema Aura UI (23)
├── core/                  # Lógica de negocio pura
│   ├── analysis/          # Métricas (925 líneas)
│   ├── config/            # Configuración
│   ├── exercises/         # Modelo ejercicios
│   └── sessions/          # Estructura sesiones
├── hooks/                 # Hooks de aplicación (16)
├── store/                 # Estado Zustand (11 slices)
├── types/                 # Tipos globales
├── utils/                 # Utilidades (15)
└── views/                 # Vistas principales (12)
```

---

## 2. Dominios Funcionales Detectados

| Dominio | Archivos Clave | Estado |
|---------|----------------|--------|
| **Athletes** | `athletesSlice.ts`, `AthleteDetail.tsx`, `AthletesList.tsx` | Disperso |
| **Sessions** | `sessionsSlice.ts`, `SessionBuilder.tsx`, `LiveSession.tsx` | Disperso |
| **Templates** | `templatesSlice.ts`, `TemplatesView.tsx`, `TemplateFormModal.tsx` | Parcial |
| **Plans** | `plansSlice.ts`, `useTrainingPlan.ts`, `weeklyPlanEngine.ts` | Disperso |
| **Exercises** | `exercisesSlice.ts`, `exercise.model.ts`, `ExercisesView.tsx` | Mejor |
| **Calendar** | `useCalendarView.ts`, `CalendarView.tsx` | Centralizado |
| **Analytics** | `metrics.ts`, `AnalyticsView.tsx`, `analyticsEngine.ts` | Disperso |
| **Performance** | `performanceEngine.ts` (588 líneas) | Monolítico |
| **Settings** | `settingsSlice.ts`, `SettingsView.tsx` | OK |

---

## 3. Arquitectura Actual de IA

### Archivos Principales

| Archivo | Líneas | Responsabilidad |
|---------|--------|-----------------|
| `AIOrchestrator.ts` | 315 | Punto de entrada, coordina engines |
| `AIEngine.ts` | 195 | Abstracción de ejecución |
| `aiStore.ts` | 318 | Estado de IA (apiKey, history, settings) |
| `types.ts` | 218 | Tipos compartidos IA |

### Engines Especializados

| Engine | Líneas | Función |
|--------|--------|---------|
| `weeklyPlanEngine.ts` | 315 | Genera planes semanales |
| `sessionEngine.ts` | 304 | Genera/ajusta sesiones |
| `analyticsEngine.ts` | 259 | Análisis de datos |
| `oneRMEngine.ts` | 254 | Predicción 1RM |
| `templateEngine.ts` | 208 | Genera plantillas |

### Performance Engine (Crítico)

| Archivo | Líneas | Problema |
|---------|--------|----------|
| `performanceEngine.ts` | 588 | **MONOLÍTICO** - Mezcla cálculos puros con lógica IA |

### Hooks de IA

| Hook | Líneas | Uso |
|------|--------|-----|
| `useLoadPrediction.ts` | ~200 | Predicción de carga |
| `useSessionGenerator.ts` | ~190 | Genera sesiones |
| `useWeeklyPlanGenerator.ts` | ~170 | Genera planes |
| `useExerciseSuggestions.ts` | ~100 | Sugerencias ejercicios |
| `useTemplateGenerator.ts` | ~75 | Genera plantillas |

---

## 4. Tamaños de Vistas

### Vistas Críticas (>400 líneas) ⚠️

| Vista | Líneas | Problema |
|-------|--------|----------|
| `AthleteDetail.tsx` | **740** | 🔴 MUY GRANDE - Mezcla stats, historial, acciones |
| `SessionBuilder.tsx` | **560** | 🔴 GRANDE - Lógica de construcción inline |
| `LiveSession.tsx` | **538** | 🔴 GRANDE - Mucha lógica de estado |
| `AnalyticsView.tsx` | **522** | 🟡 GRANDE - Cálculos inline |
| `TemplatesView.tsx` | **468** | 🟡 GRANDE - CRUD completo inline |
| `SettingsView.tsx` | **462** | 🟡 GRANDE - Múltiples secciones |
| `Dashboard.tsx` | **443** | 🟡 GRANDE - Muchos widgets inline |
| `CalendarView.tsx` | **419** | 🟡 GRANDE - Lógica de calendario |

### Vistas Aceptables (<400 líneas) ✅

| Vista | Líneas |
|-------|--------|
| `ExercisesView.tsx` | 349 |
| `AthletesList.tsx` | 320 |
| `InternalLab.tsx` | 61 |

---

## 5. Hooks de Alto Nivel

| Hook | Líneas | Complejidad |
|------|--------|-------------|
| `useLiveSession.ts` | **455** | 🔴 Muy complejo |
| `useCalendarView.ts` | **365** | 🔴 Grande |
| `useTrainingPlanCalendar.ts` | **291** | 🟡 Medio |
| `useDashboardData.ts` | **279** | 🟡 Medio |
| `useAnalyticsData.ts` | **271** | 🟡 Medio |
| `useSetRow.ts` | 245 | OK |
| `useSessionBuilder.ts` | 225 | OK |
| `useOneRMAnchorManager.ts` | 213 | OK |

---

## 6. Core Analysis (Métricas)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `core/analysis/metrics.ts` | **925** | 🔴 MONOLÍTICO - Fuente única de métricas |

**Contenido:**
- Cálculos de volumen, intensidad, fatiga
- Clasificación de cargas
- Estadísticas por atleta/sesión
- Series de tiempo
- Helpers de fecha

**Problema:** Archivo muy grande que mezcla múltiples dominios.

---

## 7. Store (Zustand)

### Arquitectura Actual
- **Slices pattern** ✅ bien implementado
- Total: 11 archivos, ~1,500 líneas

| Slice | Líneas | Dominio |
|-------|--------|---------|
| `store.ts` | 376 | Composición + migrations |
| `selectors.ts` | 296 | Selectores memoizados |
| `configSlice.ts` | 221 | Configuración training |
| `exercisesSlice.ts` | 168 | Ejercicios CRUD |
| `labSlice.ts` | 82 | Laboratorio |
| `plansSlice.ts` | 81 | Planes training |
| `sessionsSlice.ts` | 80 | Sesiones CRUD |
| `athletesSlice.ts` | 65 | Atletas CRUD |
| `templatesSlice.ts` | 65 | Templates CRUD |
| `settingsSlice.ts` | 61 | Settings |

---

## 8. Problemas Arquitectónicos Detectados

### 🔴 Críticos

1. **Vistas monolíticas** - 5 vistas >500 líneas
2. **performanceEngine.ts** - 588 líneas mezclando cálculos y IA
3. **metrics.ts** - 925 líneas sin separación de dominios
4. **Lógica de negocio en vistas** - Cálculos inline en componentes

### 🟡 Moderados

1. **Hooks grandes** - useLiveSession (455), useCalendarView (365)
2. **IA acoplada a UI** - Engines usan tipos del store, no de dominio
3. **Sin capa de dominio clara** - Lógica dispersa entre hooks/utils/core

### ✅ Bien Implementado

1. Store con slices pattern
2. Sistema de componentes Aura
3. Hooks de sesión extraídos (useSetRow, useSessionBuilder)
4. Migraciones en onRehydrateStorage

---

## 9. Plan de Refactor Propuesto

### Fase 1: Crear `src/domain/`
- Extraer tipos y lógica pura por dominio
- Mover cálculos de `metrics.ts` a dominios específicos

### Fase 2: Refactor Vistas Grandes
- AthleteDetail → Container + Sections
- SessionBuilder → Container + Sections
- LiveSession → Container + Sections
- AnalyticsView → Container + Sections

### Fase 3: Simplificar Hooks
- Extraer lógica de negocio a domain/
- Dejar hooks como orchestradores

### Fase 4: Reorganizar IA
- Engines consumen tipos de domain/
- Extraer cálculos de performance a domain/performance

### Fase 5: Documentar Flujos
- Plan → Semanas → Sesiones → Sets
- LiveSession workflow
- IA generation flow
- Analytics calculation flow
