# 05 - Hooks y Dominio: Estado Actual

> **Fase 4** - Revisión inicial antes del refactor estratégico

## Resumen

Este documento mapea el estado actual de los hooks, el dominio, y el store para entender qué responsabilidades tiene cada pieza antes del refactor.

---

## 1. Hooks de Alto Nivel

### Inventario por Tamaño

| Hook | Líneas | Categoría | Prioridad Refactor |
|------|--------|-----------|-------------------|
| `useLiveSession.ts` | 458 | A | Alta |
| `useCalendarView.ts` | 370 | A | Media |
| `useTrainingPlanCalendar.ts` | 292 | A | Media |
| `useAnalyticsData.ts` | 283 | B | Alta |
| `useDashboardData.ts` | 284 | A | Alta |
| `useSetRow.ts` | 246 | B/C | Baja |
| `useSessionBuilder.ts` | 226 | A | Alta |
| `useWeeklySchedule.ts` | 183 | A | Media |
| `useTrainingPlan.ts` | 169 | A (Facade) | Baja |
| `useTrainingAdherence.ts` | 153 | B | Alta |
| `useRestTimer.ts` | 110 | C | — |
| `useAthleteStats.ts` | 60 | A | Baja |

---

## 2. Análisis Detallado por Hook

### `useLiveSession.ts` (458 líneas)

**Qué hace:**
- Gestiona el estado completo de una sesión en vivo (ejercicio activo, series, timers)
- Handlers para completar sets, añadir/eliminar ejercicios y series
- Cálculo de estadísticas en vivo (volumen, progreso)
- Auto-deducción de 1RM y análisis post-sesión
- Soporte multi-atleta

**Slices que toca:**
- `sessionsSlice` (getSession, updateSession)
- `exercisesSlice` (getExercise)
- `athletesSlice` (getAthlete, updateAthlete)
- `settingsSlice` (settings)

**Mezcla:**
- ✅ Acceso a estado: sí (lee y escribe sesiones)
- ⚠️ Lógica de negocio: sí (handlers mutan directamente exercises/sets)
- ⚠️ UI: sí (modales, índices de ejercicio activo)
- ⚠️ IA/Métricas: sí (llamadas a performanceEngine, oneRMEngine)

**Categoría: A (Orquestador)**

---

### `useDashboardData.ts` (284 líneas)

**Qué hace:**
- Agrega estadísticas globales para el Dashboard del coach
- Calcula métricas semanales/mensuales: volumen, sesiones, duración
- Obtiene sesiones recientes y próximas
- Calcula intensidad/fatiga semanal
- Integra con useTrainingPlan para datos del día

**Slices que toca:**
- `sessionsSlice`, `templatesSlice`, `athletesSlice`

**Mezcla:**
- ✅ Acceso a estado: sí
- ⚠️ Lógica de negocio: sí (filter/reduce/map in situ para stats)
- ❌ UI: no (solo datos)
- ❌ IA/Métricas: usa core/analysis/metrics pero no duplica

**Categoría: A (Orquestador)**

---

### `useAnalyticsData.ts` (283 líneas)

**Qué hace:**
- Filtrado de sesiones por tiempo y atleta
- Cálculo de métricas: volumen, sets, duración, top exercises
- Generación de datos para charts de volumen semanal
- Calcula intensidad/fatiga para las sesiones filtradas

**Slices que toca:**
- `sessionsSlice`, `athletesSlice`, `exercisesSlice`, `plansSlice`

**Mezcla:**
- ✅ Acceso a estado: sí
- ⚠️ Lógica de negocio: **SÍ, duplicada** (recalcula volumen, métricas)
- ⚠️ UI: sí (selectedAthlete, timeRange state)
- ❌ IA/Métricas: usa funciones de domain/sessions pero también recalcula

**Categoría: B (Lógica disfrazada de hook)** - Prioritario para refactor

---

### `useTrainingAdherence.ts` (153 líneas)

**Qué hace:**
- Calcula adherencia semanal (sesiones completadas vs planificadas)
- Calcula desviación de volumen
- Genera score semanal
- Provee recomendaciones basadas en adherencia

**Slices que toca:**
- `plansSlice`, `sessionsSlice`

**Mezcla:**
- ✅ Acceso a estado: sí
- ⚠️ Lógica de negocio: **SÍ, toda inline** (calculateAdherenceForPlan)
- ❌ UI: no
- ❌ IA: solo genera strings de recomendación

**Categoría: B (Lógica disfrazada de hook)** - Prioritario para refactor

---

### `useSessionBuilder.ts` (226 líneas)

**Qué hace:**
- Crea sesiones desde templates o manualmente
- Repite última sesión
- Validación pre-guardado
- Navegación post-creación

**Slices que toca:**
- `sessionsSlice` (addSession), `templatesSlice`, `athletesSlice`

**Mezcla:**
- ✅ Acceso a estado: sí
- ⚠️ Lógica de negocio: sí (buildSetsFromTemplate, clonación de estructura)
- ❌ UI: navegación only
- ❌ IA: no

**Categoría: A (Orquestador)**

---

### `useTrainingPlan.ts` (169 líneas)

**Qué hace:**
- **Facade** que compone 3 hooks especializados:
  - `useActiveTrainingPlan`: CRUD de planes
  - `useTrainingAdherence`: adherencia
  - `useTrainingPlanCalendar`: sync calendario
- Genera planes con IA

**Slices que toca:**
- Indirectamente todos los de los hooks compuestos

**Categoría: A (Facade/Orquestador)** - Ya bien estructurado

---

### `useTrainingPlanCalendar.ts` (292 líneas)

**Qué hace:**
- Convierte plan a estructura de calendario
- Sincroniza sesiones planificadas con calendario
- Crea eventos de semana desde el plan

**Slices que toca:**
- `plansSlice`, `sessionsSlice`, `templatesSlice`

**Mezcla:**
- ✅ Acceso a estado: sí
- ⚠️ Lógica de negocio: sí (getNextDateForWeekday, buildCalendarDays)
- ❌ UI: no
- ❌ IA: no

**Categoría: A (Orquestador)** - Podría mover lógica a domain/plans

---

### `useCalendarView.ts` (370 líneas)

**Qué hace:**
- Navegación de mes (prev/next)
- Generación de días del calendario (con padding)
- Agrupación de sesiones por fecha
- Filtro por atleta
- Modales y acciones de sesión

**Slices que toca:**
- `sessionsSlice`, `athletesSlice`, `plansSlice`, `templatesSlice`

**Mezcla:**
- ✅ Acceso a estado: sí
- ⚠️ Lógica de negocio: sí (buildCalendarDays, sessionsByDate)
- ⚠️ UI: sí (modales, filtros, navegación)
- ❌ IA: no

**Categoría: A (Orquestador)** - Lógica de calendario podría ir a domain/plans

---

### `useSetRow.ts` (246 líneas)

**Qué hace:**
- Estado local de un SetRow (weight, reps, RPE, RIR, notes)
- Handlers de incremento/decremento
- Duplicar set anterior
- Integración con predicción de IA

**Slices que toca:**
- Ninguno directamente (recibe datos por props)

**Mezcla:**
- ❌ Acceso a estado global: no
- ⚠️ Lógica de negocio: mínima (validación de límites)
- ✅ UI: sí (todo es estado local de UI)
- ⚠️ IA: sí (useLoadPrediction)

**Categoría: C (Hook de UI)** - Bien enfocado

---

### `useRestTimer.ts` (110 líneas)

**Qué hace:**
- Cronómetro de descanso con start/pause/reset
- Vibración al finalizar

**Slices que toca:**
- Ninguno

**Categoría: C (Hook de UI/Utilitario)** - Perfecto, no tocar

---

### `useWeeklySchedule.ts` (183 líneas)

**Qué hace:**
- Genera array de días de la semana (Mon-Sun)
- Agrupa sesiones por día
- Determina días de entrenamiento

**Slices que toca:**
- `sessionsSlice`, `athletesSlice`, `plansSlice`

**Mezcla:**
- ✅ Acceso a estado: sí
- ⚠️ Lógica de negocio: sí (getWeekStart, buildWeekDays)
- ❌ UI: navegación only
- ❌ IA: no

**Categoría: A (Orquestador)** - Lógica podría ir a domain/plans

---

### `useAthleteStats.ts` (60 líneas)

**Qué hace:**
- Calcula stats para un atleta específico
- Usa funciones de `core/analysis/metrics`

**Slices que toca:**
- `sessionsSlice`

**Mezcla:**
- ✅ Acceso a estado: sí
- ❌ Lógica de negocio: delega a core/analysis (bien)
- ❌ UI: no
- ❌ IA: no

**Categoría: A (Orquestador)** - Ya bien estructurado

---

## 3. Estado del Dominio

### `src/domain/sessions/`

| Archivo | Contenido |
|---------|-----------|
| `types.ts` | Tipos: `SessionStatus`, `SetEntry`, `ExerciseEntry`, etc. |
| `mappers.ts` | `createScheduledSessionFromTemplate`, `startScheduledSession`, `updateSessionStructure`, `completeSession` |
| `index.ts` | Re-exports |

**Estado:** Bien estructurado. Los mappers cubren transformaciones de estado de sesión.

---

### `src/domain/performance/`

| Archivo | Contenido |
|---------|-----------|
| `types.ts` | `PerformanceMetrics`, `WeeklyMetrics`, `LoadClassification`, etc. |
| `metrics.ts` | **NUEVO (Fase 3)**: `getSetIntensity`, `getExerciseIntensityFatigue`, `getSessionIntensityFatigue`, `getWeeklyLoadSeries`, `getWeeklyAdherenceSeries` |
| `index.ts` | Re-exports |

**Estado:** Fase 3 añadió funciones de intensidad/fatiga. Falta integrar completamente con hooks.

---

### `src/domain/plans/`

| Archivo | Contenido |
|---------|-----------|
| `types.ts` | `TrainingPlan`, `DayPlan`, `WeekPlan`, `PlannedSession` |
| `index.ts` | Re-exports |

**Estado:** Solo tipos. **Falta lógica de dominio** para:
- Calcular adherencia
- Determinar días de entrenamiento
- Transformar plan a calendario

---

### `src/domain/athletes/`

| Archivo | Contenido |
|---------|-----------|
| `types.ts` | Tipos de atleta |
| `index.ts` | Re-exports |

**Estado:** Solo tipos. Podría añadir lógica de stats por atleta.

---

### `src/core/analysis/metrics.ts` (926 líneas)

**Single Source of Truth para métricas:**
- `computeTopSetLoadKg`, `computeEstimated1RM`, `computeSessionVolumeKg`
- `computeAverageRPE`, `formatVolume`
- `computeSessionStats`, `calculateAthleteStats`
- `getWeeklyIntensityFatigue`, `getAthleteIntensityFatigueSeries`
- Filtros: `filterSessionsByAthlete`, `filterCompletedSessions`, `filterSessionsByDateRange`

**Estado:** Muy completo y bien organizado. Los hooks deberían usar más estas funciones.

---

## 4. Store y Selectores

### Slices

| Slice | Responsabilidad |
|-------|-----------------|
| `athletesSlice` | CRUD atletas |
| `sessionsSlice` | CRUD sesiones |
| `templatesSlice` | CRUD templates |
| `plansSlice` | CRUD planes de entrenamiento |
| `exercisesSlice` | CRUD ejercicios |
| `settingsSlice` | Configuración de usuario |
| `configSlice` | Configuración de entrenamiento (patrones, grupos) |
| `labSlice` | Experimentos internos |

### `selectors.ts` (297 líneas)

**Selectores existentes:**
- Básicos: `useAthletes`, `useSessions`, `useExercises`, etc.
- Computed: `useWeeklyStats`, `useAthleteStats`, `useWeekSessions`
- Por ID: `useSessionById`, `useAthleteById`, `useExerciseById`
- Training: `useActivePlanWithMeta`, `useInProgressSessions`

**Estado:** Buenos selectores básicos. Algunos calculan lógica que debería estar en dominio.

---

## 5. Clasificación Final

### Categoría A - Orquestadores

Hooks que coordinan múltiples slices y funciones de dominio:

| Hook | Nota |
|------|------|
| `useLiveSession` | Necesita delegar más a dominio |
| `useDashboardData` | Necesita usar más core/analysis |
| `useSessionBuilder` | Necesita delegar creación a domain/sessions |
| `useCalendarView` | Necesita extraer lógica a domain/plans |
| `useTrainingPlanCalendar` | Necesita extraer lógica a domain/plans |
| `useWeeklySchedule` | Necesita extraer lógica a domain/plans |
| `useTrainingPlan` | Ya es facade, bien estructurado |
| `useAthleteStats` | Bien, usa core/analysis |

### Categoría B - Lógica disfrazada de hook

Hooks con lógica de negocio que debería vivir en dominio:

| Hook | Lógica a extraer |
|------|------------------|
| `useAnalyticsData` | Cálculos de métricas, filtros complejos |
| `useTrainingAdherence` | `calculateAdherenceForPlan`, recomendaciones |

### Categoría C - UI/Utilitarios

| Hook | Estado |
|------|--------|
| `useRestTimer` | ✅ Perfecto |
| `useSetRow` | ✅ Bien enfocado (UI local + AI) |

---

## 6. Próximos Pasos

1. **Crear `domain/plans/adherence.ts`**: Extraer lógica de `useTrainingAdherence`
2. **Crear `domain/plans/calendar.ts`**: Extraer lógica de calendario
3. **Crear `domain/sessions/workout.ts`**: Funciones puras para mutaciones de sesión en vivo
4. **Refactorizar `useAnalyticsData`**: Usar funciones de domain/performance/metrics
5. **Refactorizar `useLiveSession`**: Delegar handlers a domain/sessions
