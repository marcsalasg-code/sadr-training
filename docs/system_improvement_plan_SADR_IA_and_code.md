# SADR Training OS - System Improvement Plan (Código, Algoritmos e IA)

**Documento de Auditoría Técnica Exhaustiva**  
*Fecha: 2025-12-10*

---

## Resumen Ejecutivo

Este documento presenta un análisis crítico del estado actual de SADR Training OS, identificando problemas, riesgos y oportunidades de mejora en código, algoritmos y arquitectura IA. **No modifica código**, solo diagnostica y propone.

### Estadísticas Clave del Proyecto

| Categoría | Archivos | Líneas Totales |
|-----------|----------|----------------|
| Views | 12 | ~5,500+ |
| AI Engines | 6 | ~1,750 |
| AI Hooks | 7 | ~580 |
| Store Slices | 10 | ~800 |
| Utils | 13 | ~1,600 |
| Types | 1 | 549 |
| **Total** | ~60+ | ~10,000+ |

### Hallazgos Críticos

| Prioridad | Problema | Impacto |
|-----------|----------|---------|
| 🔴 Alta | `performanceEngine.ts` (595 líneas) duplica lógica de `oneRMEngine.ts` y `oneRMCalculator.ts` | Mantenibilidad |
| 🔴 Alta | `useTrainingPlan.ts` (447 líneas) es un GOD HOOK | Legibilidad/Testing |
| 🔴 Alta | `utils/metrics.ts` y `utils/dashboardMetrics.ts` duplican funciones | Inconsistencia |
| 🟡 Media | SessionBuilder (658), CalendarView (581), AthleteDetail (821) son GOD Components | Escalabilidad |
| 🟡 Media | AIOrchestrator no está conectado en los hooks de IA | IA infrautilizada |

---

## 1. ARQUITECTURA GENERAL Y CALIDAD DEL CÓDIGO

### 1.1 Estructura del Proyecto

```
src/
├── ai/                    # IA: engines, hooks, providers, validation
│   ├── engines/           # 6 motores: session, weekly, analytics, oneRM, template, performance
│   ├── hooks/             # 7 hooks React para IA
│   ├── providers/         # Mock + Remote providers
│   └── validation/        # Schemas Zod para inputs
├── components/            # 60+ componentes React
│   ├── common/            # 11 componentes compartidos (1RM, fatigue, charts)
│   ├── session/           # Componentes de sesión live
│   └── ui/                # Sistema Aura UI
├── hooks/                 # 5 hooks de dominio (useTrainingPlan, useLiveSession, etc.)
├── store/                 # Zustand: 7 slices + selectors
├── utils/                 # 13 utilidades puras
├── views/                 # 12 vistas principales
└── types/                 # types.ts (549 líneas, 71 tipos)
```

**Fortalezas:**
- ✅ Separación clara entre IA, store, views y utils
- ✅ Store dividido en slices por dominio
- ✅ Sistema de tipos TypeScript robusto
- ✅ Componentes UI reutilizables (sistema Aura)

**Debilidades:**
- ❌ Vistas demasiado grandes (God Components)
- ❌ Duplicación de lógica de métricas entre utils
- ❌ Hooks de IA no usan el Orchestrator
- ❌ performanceEngine tiene demasiadas responsabilidades

### 1.2 Patrones Detectados

| Patrón | Uso | Evaluación |
|--------|-----|------------|
| Zustand Slices | Store | ✅ Bien implementado |
| Custom Hooks | Lógica de negocio | ⚠️ Algunos muy grandes |
| Singleton | AIEngine, AIOrchestrator | ✅ Correcto |
| Function Factories | Slice creators | ✅ Limpio |
| Validation Schemas | Zod en IA | ✅ Bien estructurado |
| Memoization | Selectors, useMemo | ⚠️ Inconsistente entre vistas |

### 1.3 Flujo de Datos

```
[View] → [Hook] → [Store Action] → [State Update] → [Selector] → [View Re-render]
                        ↓
                   [AI Engine] (cuando aplica)
```

**Problema detectado:** Los hooks de IA (`useSessionGenerator`, `useWeeklyPlanGenerator`) llaman directamente a `AIEngine` sin pasar por `AIOrchestrator`, saltándose la validación centralizada.

---

## 2. ANÁLISIS POR MÓDULO

### 2.1 Dashboard (`Dashboard.tsx` - 526 líneas)

**Situación actual:**
- Muestra métricas semanales, sesiones recientes, progreso del plan
- Usa `calculateWeeklyStats`, `countActiveAthletes`, `getMostUsedTemplateId` de `dashboardMetrics.ts`
- Integra `TrainingPlanModal` para crear/editar planes

**Problemas:**
| Problema | Archivo | Tipo | Prioridad |
|----------|---------|------|-----------|
| Componente grande con múltiples modales inline | `Dashboard.tsx` | Refactor | Media |
| Duplicación de lógica de navegación | `Dashboard.tsx:145-200` | DRY | Baja |

**Propuestas:**
- Extraer `DashboardMetricsSection`, `DashboardRecentActivity`, `DashboardQuickActions` como subcomponentes
- Mover modales a componentes separados

---

### 2.2 SessionBuilder (`SessionBuilder.tsx` - 658 líneas)

**Situación actual:**
- Crea sesiones manuales o con IA
- Lista sesiones existentes con filtros
- Usa `useSessionGenerator` para generación IA

**Problemas:**
| Problema | Archivo | Tipo | Prioridad |
|----------|---------|------|-----------|
| God Component con 658 líneas | `SessionBuilder.tsx` | Refactor | Alta |
| Lógica de creación mezclada con UI | `SessionBuilder.tsx:79-117` | Separación | Media |
| SessionCard inline (130+ líneas) | `SessionBuilder.tsx:535-657` | Extracción | Media |

**Propuestas:**
- Crear `hooks/useSessionBuilder.ts` para lógica de creación
- Extraer `SessionCard` a `components/sessions/SessionCard.tsx`
- Extraer `SessionFilters` y `SessionList` como componentes

---

### 2.3 LiveSession (`LiveSession.tsx` - ~430 líneas post-refactor)

**Situación actual:**
- ✅ Ya usa `useLiveSession` hook (428 líneas)
- Gestiona sets, timer de descanso, fatigue prompts
- Auto-deducción de 1RM al completar

**Problemas:**
| Problema | Archivo | Tipo | Prioridad |
|----------|---------|------|-----------|
| JSX de Stats/Header/Tabs aún inline | `LiveSession.tsx` | Extracción | Baja |
| Dependencia directa de store para toggle | `LiveSession.tsx:280` | Acoplamiento | Baja |

**Propuestas:**
- Extraer `SessionStatsBar`, `ExerciseTabs`, `SessionHeader` a `components/live-session/`

---

### 2.4 Athletes & AthleteDetail

#### Athletes (`Athletes.tsx` - ~350 líneas estimadas)
- Lista de atletas con filtros básicos
- Adecuadamente estructurado

#### AthleteDetail (`AthleteDetail.tsx` - 821 líneas)

**Problemas:**
| Problema | Archivo | Tipo | Prioridad |
|----------|---------|------|-----------|
| God Component (821 líneas) | `AthleteDetail.tsx` | Refactor | Alta |
| 5 componentes inline (SessionRow, Charts, InfoRow) | `AthleteDetail.tsx:645-820` | Extracción | Media |
| No usa `useAthleteStats` hook que ya existe | `AthleteDetail.tsx` | Integración | Media |

**Propuestas:**
- Crear `components/athletes/` con: `AthleteHeader`, `AthletePhysicalData`, `AthleteSessionsList`, `AthleteCharts`
- Integrar `useAthleteStats` para centralizar cálculos

---

### 2.5 Training Plan (`useTrainingPlan.ts` - 447 líneas)

**Situación actual:**
- GOD HOOK con múltiples responsabilidades:
  - Acceso a plan activo
  - Cálculo de adherencia semanal
  - Creación de eventos de calendario
  - Conversión plan → sesiones
  - Lógica de programación

**Problemas:**
| Problema | Archivo | Tipo | Prioridad |
|----------|---------|------|-----------|
| God Hook (447 líneas, ~15 funciones) | `useTrainingPlan.ts` | Refactor | Alta |
| Mezcla responsabilidades (calendario, adherencia, sesiones) | `useTrainingPlan.ts` | SRP | Alta |
| Helpers de fecha no reutilizables | `useTrainingPlan.ts:30-64` | Extracción | Baja |

**Propuestas:**
- Dividir en: `useActivePlan`, `useWeeklyAdherence`, `usePlanToCalendar`
- Mover helpers de fecha a `utils/dateHelpers.ts`

---

### 2.6 Calendar (`CalendarView.tsx` - 581 líneas)

**Problemas:**
| Problema | Archivo | Tipo | Prioridad |
|----------|---------|------|-----------|
| God Component | `CalendarView.tsx` | Refactor | Media |
| Lógica de calendario inline | `CalendarView.tsx:100-220` | Hook | Media |

**Propuestas:**
- Crear `hooks/useCalendarNavigation.ts`
- Extraer `CalendarGrid`, `DayAgenda`, `CreateSessionModal`

---

### 2.7 Templates (`TemplatesView.tsx` - ~400 líneas estimadas)
- Gestiona templates de sesiones
- Relativamente bien estructurado

---

### 2.8 Analytics (`AnalyticsView.tsx` - 510 líneas)

**Situación actual:**
- Muestra gráficos y métricas históricas
- Integra `AIInsightsPanel` para análisis IA

**Problemas:**
| Problema | Archivo | Tipo | Prioridad |
|----------|---------|------|-----------|
| Cálculos de métricas inline | `AnalyticsView.tsx` | Centralización | Media |
| No usa analyticsEngine para insights avanzados | `AnalyticsView.tsx` | IA | Media |

**Propuestas:**
- Usar selectores memoizados de `store/selectors.ts`
- Integrar `calculateWeeklyAnalytics` de `analyticsEngine.ts`

---

### 2.9 AI Engines y Hooks

#### Engines Existentes

| Engine | Líneas | Función | Uso Real |
|--------|--------|---------|----------|
| `sessionEngine.ts` | 305 | Genera sesiones desde DayPlan | ⚠️ Parcial |
| `weeklyPlanEngine.ts` | 316 | Genera planes semanales | ✅ En uso |
| `analyticsEngine.ts` | 260 | Calcula analytics semanales | ⚠️ Parcial |
| `oneRMEngine.ts` | 255 | Recomendaciones de 1RM | ⚠️ No conectado |
| `templateEngine.ts` | ~180 | Genera templates | ⚠️ Parcial |
| `performanceEngine.ts` | 595 | Get/Update 1RM, Load suggestions, Overtraining | ✅ En uso |

#### Problema Crítico: Duplicación 1RM

```
performanceEngine.ts (595 líneas)
├── getOneRepMax()          → duplica oneRMCalculator.ts
├── updateOneRepMax()       → duplica oneRMCalculator.ts  
├── estimate1RMFromSets()   → usa oneRMCalculator internamente
├── suggestNextLoad()       → lógica única
├── getReferenceRM()        → lógica única (anchor system)
├── generateLoadSuggestion()→ lógica única
├── shouldAutoDeduceOneRM() → podría vivir en oneRMEngine
├── autoDeduceOneRM()       → podría vivir en oneRMEngine
└── detectOvertraining()    → lógica única

oneRMEngine.ts (255 líneas)
├── analyzeOneRMProgression() → genera SUGERENCIAS (no aplica cambios)
└── analyzeSessionForOneRM()  → análisis post-sesión

oneRMCalculator.ts (242 líneas)
├── estimateOneRM_Epley()     → fórmula pura
├── estimateOneRM_Brzycki()   → fórmula pura
├── getEffectiveLoad()        → bodyweight handling
├── getRecommendedIncrement() → incrementos
├── createOneRMRecord()       → factory
└── updateOneRMRecord()       → inmutable update
```

**Propuesta de refactor:**
1. `oneRMCalculator.ts` → Fórmulas puras (mantener)
2. `oneRMEngine.ts` → Análisis y sugerencias (mantener)
3. `performanceEngine.ts` → Reducir a SOLO: `generateLoadSuggestion`, `getReferenceRM`, `detectOvertraining`

---

### 2.10 Store Zustand

#### Slices Existentes (todos bien estructurados)

| Slice | Líneas | Estado |
|-------|--------|--------|
| `athletesSlice.ts` | 66 | ✅ Limpio |
| `sessionsSlice.ts` | 81 | ✅ Limpio |
| `plansSlice.ts` | 82 | ✅ Limpio |
| `templatesSlice.ts` | ~70 | ✅ Limpio |
| `exercisesSlice.ts` | ~80 | ✅ Limpio |
| `settingsSlice.ts` | ~60 | ✅ Limpio |
| `labSlice.ts` | ~50 | ✅ Limpio |

#### Selectors (`selectors.ts`)
- 21 selectores memoizados
- ✅ Bien implementado

**Problema:** Algunos selectores duplican lógica de `dashboardMetrics.ts`

---

## 3. ANÁLISIS ESPECÍFICO DE IA

### 3.1 IAs Implementadas

| IA | Prompt/Lógica | Datos Consumidos | Output | Uso Real |
|----|---------------|------------------|--------|----------|
| Session Generation | Genera sesión de 4 bloques | exercises, athlete, config | ExerciseEntry[] | ✅ SessionBuilder |
| Weekly Plan | Distribuye días según objetivo | athlete, availability, history | DayPlan[] | ✅ Dashboard modal |
| Analytics | Score semanal, tendencias | sessions, plan, adherence | WeeklyAnalytics | ⚠️ Parcial |
| 1RM Analysis | Sugiere ajustes de 1RM | sets, oneRMRecords | OneRMRecommendation | ❌ No conectado |
| Load Prediction | Peso sugerido para reps/RPE | 1RM, targetReps, RPE | LoadSuggestion | ✅ LiveSession |
| Overtraining | Detecta sobreentrenamiento | volumes, intensity | OvertrainingIndicator | ⚠️ Parcial |

### 3.2 Validación de Inputs

**Archivo:** `ai/validation/inputSchemas.ts` (211 líneas)

| Schema | Usado Por | Integración |
|--------|-----------|-------------|
| `SessionEngineInputSchema` | AIOrchestrator | ⚠️ Solo orchestrator |
| `WeeklyPlanEngineInputSchema` | AIOrchestrator | ⚠️ Solo orchestrator |
| `AnalyticsEngineInputSchema` | AIOrchestrator | ⚠️ Solo orchestrator |
| `PerformanceEngineInputSchema` | AIOrchestrator | ⚠️ Solo orchestrator |
| `OneRMEngineInputSchema` | AIOrchestrator | ⚠️ Solo orchestrator |

**Problema:** Los hooks de IA (`useSessionGenerator`, etc.) NO usan las funciones de validación. Llaman directamente a `AIEngine` sin validar.

### 3.3 AIOrchestrator (303 líneas)

**Estado:** Implementado pero infrautilizado

```typescript
// Métodos disponibles
orchestrator.generateWeeklyPlan(input)   // ✅ Valida + llama engine
orchestrator.analyzePerformance(input)   // ✅ Valida + llama engine
orchestrator.checkPerformance(input)     // ✅ Valida + llama engine
orchestrator.compareWeeks(current, prev) // ✅ Sin validación (simple)
```

**Problema:** Ningún hook de IA usa el orchestrator. Ejemplo de `useSessionGenerator`:

```typescript
// Actual (sin validación):
const response = await AIEngine.complete<SessionGenerationResponse>({...});

// Debería ser:
const result = orchestrator.generateSession(validatedInput);
```

### 3.4 Incoherencias y Riesgos IA

| Incoherencia | Detalle | Impacto |
|--------------|---------|---------|
| Prompts sin contexto histórico | `sessionEngine` no recibe PR/1RM del atleta | Sugerencias genéricas |
| Outputs no aprovechados | `analyticsEngine.recommendations[]` no se muestra | Valor perdido |
| Engines desconectados | `oneRMEngine` no se llama en ningún flujo | Feature muerta |
| Duplicación orchestrator | `useWeeklyPlanGenerator` reimplementa lógica de orchestrator | Inconsistencia |

### 3.5 Propuestas de Mejora IA

| Mejora | Beneficio | Prioridad |
|--------|-----------|-----------|
| Hooks IA → usen AIOrchestrator | Validación centralizada | Alta |
| Conectar `oneRMEngine` en post-sesión | Sugerencias automáticas de 1RM | Media |
| Feed analytics.recommendations → Dashboard | Insights visibles al usuario | Media |
| Enriquecer sessionEngine con 1RM context | Sugerencias de peso más precisas | Baja |

---

## 4. LÓGICA INTERNA DE ENTRENAMIENTO

### 4.1 Cálculo de Volumen

**Archivo:** `utils/dashboardMetrics.ts`

```typescript
calculateTotalVolume(sessions) → ∑(session.totalVolume)
// Problema: Si totalVolume no está grabado, retorna 0
// No recalcula desde sets
```

**Mejora propuesta:** Fallback a cálculo desde `session.exercises[].sets[]`

### 4.2 Registro de Sets

**Tipo:** `SetEntry` (types.ts:183-208)

```typescript
interface SetEntry {
    id: UUID;
    setNumber: number;
    type: SetType;           // warmup | working | drop | failure | backoff
    targetReps?: number;
    targetWeight?: number;
    actualReps?: number;
    actualWeight?: number;
    rpe?: number;            // 1-10
    intensity?: number;      // 0-100 (%)
    // ... más campos
}
```

**Problema:** `rpe` e `intensity` coexisten con significados confusos:
- `rpe` = Rating of Perceived Exertion (1-10 subjetivo)
- `intensity` = Porcentaje del 1RM (0-100%)

**Mejora:** Renombrar `intensity` → `percentOf1RM` o calcularlo dinámicamente

### 4.3 Sistema 1RM

**Fortalezas:**
- ✅ Fórmulas en funciones puras (`oneRMCalculator.ts`)
- ✅ Historial guardado en `athlete.oneRMRecords`
- ✅ Soporta bodyweight + lastre
- ✅ Anclas de referencia (press banca → pushups)

**Debilidades:**
- ❌ Lógica fragmentada entre 3 archivos
- ❌ `oneRMEngine` genera sugerencias pero nadie las consume
- ❌ Auto-deducción solo en `handleFinishSession` de `useLiveSession`

### 4.4 Métricas del Dashboard

| Métrica | Cálculo | Archivo |
|---------|---------|---------|
| weeklyVolume | `∑ completedSessions.totalVolume` | dashboardMetrics.ts |
| sessionCount | `completedSessions.length` | dashboardMetrics.ts |
| avgDuration | `∑ durationMinutes / count` | dashboardMetrics.ts |
| completionRate | `completed / planned × 100` | dashboardMetrics.ts |

**Problema de duplicación:**

```
utils/dashboardMetrics.ts    → calculateWeeklyStats()
utils/metrics.ts             → calculateMetrics()
store/selectors.ts           → useWeeklyStats()
```

**Mejora:** Unificar en `utils/metrics.ts` y que selectors y dashboardMetrics importen de ahí.

---

## 5. FLUJOS COMPLETOS

### Flujo A: Crear Sesión Manual

```
SessionBuilder → handleCreateSession() → store.addSession()
                                       → navigate('/live/{id}')
```
**Weakness:** No valida que atleta exista antes de crear.

### Flujo B: Crear Sesión con IA

```
SessionBuilder → useSessionGenerator.generate() 
              → AIEngine.complete<SessionGenerationResponse>()
              → mapGeneratedToSession()
              → store.addSession()
```
**Weakness:** No usa AIOrchestrator, no valida inputs.

### Flujo C: Ejecutar LiveSession

```
LiveSession → useLiveSession(id)
            → session state, handlers
            → handleCompleteSet() → updateSession()
                                  → restTimer.start()
            → handleFinishSession() → autoDeduceOneRM()
                                    → updateSession({status: 'completed'})
```
**Strength:** Flujo completo con auto-deducción de 1RM.

### Flujo D: Completar Sesión

```
useLiveSession.handleFinishSession()
├── Calcula duración
├── Para cada ejercicio:
│   └── Si shouldAutoDeduceOneRM() → autoDeduceOneRM() → updateAthlete()
├── computeSessionAvgIntensity()
└── updateSession({status: 'completed', totalVolume, avgIntensity...})
```

### Flujo H: Cálculo de Métricas Dashboard

```
Dashboard
├── useSessions() → sessions[]
├── calculateWeeklyStats(sessions) → { volume, count, avgDuration }
├── useActivePlanWithMeta() → plan + metadata
└── Render métricas
```

### Flujo I: Dashboard ↔ Plan ↔ Calendar

```
Dashboard:
├── TrainingPlanModal → createTrainingPlan()
│                     → store.addTrainingPlan()
│                     → setActiveTrainingPlan(id)
└── Plan visible en header

Calendar:
├── useTrainingPlan() → getActivePlan()
├── getDayPlanFor(date) → muestra indicador de día planificado
└── handleCreateSession() → puede usar template del plan
```

---

## 6. DIAGRAMA DE DEPENDENCIAS

```
┌─────────────────────────────────────────────────────────────┐
│                           VIEWS                              │
│  Dashboard, SessionBuilder, LiveSession, AthleteDetail...   │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌────────────────┐   ┌────────────────┐
│    HOOKS       │   │   COMPONENTS   │
│ useTrainingPlan│   │     session/   │
│ useLiveSession │   │     common/    │
│ useAthleteStats│   │       ui/      │
└───────┬────────┘   └────────────────┘
        │
        ▼
┌────────────────┐   ┌────────────────┐
│     STORE      │◄──│   SELECTORS    │
│    (slices)    │   │  (memoized)    │
└───────┬────────┘   └────────────────┘
        │
        ▼
┌────────────────┐   ┌────────────────┐
│     UTILS      │   │   AI ENGINES   │
│   metrics.ts   │   │  sessionEngine │
│ dashboardM..   │   │  weeklyPlan..  │
│ oneRMCalc..    │   │  performanceE. │
└────────────────┘   └───────┬────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
            ┌────────────┐    ┌────────────┐
            │AIOrchestrator│   │  AIEngine   │
            │(validación)│    │ (providers) │
            └────────────┘    └────────────┘
```

### Dependencias Críticas

| Módulo | Depende De | Riesgo |
|--------|------------|--------|
| Dashboard | store, dashboardMetrics, useTrainingPlan | Medio |
| LiveSession | useLiveSession, store, performanceEngine | Bajo |
| AthleteDetail | store, dashboardMetrics, useAthleteStats | Medio |
| useTrainingPlan | store (4 slices), utils | Alto (es crítico) |
| performanceEngine | oneRMCalculator, types | Alto (muy grande) |

---

## 7. COMPONENTES CRÍTICOS

### 7.1 Archivos Más Grandes

| Archivo | Líneas | Tipo | Riesgo |
|---------|--------|------|--------|
| `AthleteDetail.tsx` | 821 | View | Alto |
| `SessionBuilder.tsx` | 658 | View | Alto |
| `performanceEngine.ts` | 595 | Engine | Alto |
| `CalendarView.tsx` | 581 | View | Medio |
| `types.ts` | 549 | Types | Bajo |
| `Dashboard.tsx` | 526 | View | Medio |
| `AnalyticsView.tsx` | 510 | View | Medio |
| `useTrainingPlan.ts` | 447 | Hook | Alto |

### 7.2 Lógica Duplicada

| Lógica | Ubicaciones | Acción |
|--------|-------------|--------|
| Filtrado de sesiones por semana | `dashboardMetrics.ts`, `metrics.ts` | Unificar |
| Cálculo de volumen | `dashboardMetrics.ts`, `metrics.ts`, inline en vistas | Centralizar |
| Get/Update 1RM | `performanceEngine.ts`, `oneRMCalculator.ts` | Consolidar |
| Helpers de fecha (getWeekStart) | `useTrainingPlan.ts`, `dashboardMetrics.ts`, `metrics.ts` | Extraer a `dateHelpers.ts` |

### 7.3 Incoherencias Entre Vistas

| Vista A | Vista B | Incoherencia |
|---------|---------|--------------|
| Dashboard | AthleteDetail | Formato de volumen (K vs real) |
| Dashboard | AnalyticsView | Período de "semana" calculado diferente |
| LiveSession | SessionBuilder | Nombres de ejercicios resueltos diferente |

---

## 8. LIMITACIONES Y OPORTUNIDADES

### 8.1 Features Incompletas

| Feature | Estado | Archivo | Bloqueador |
|---------|--------|---------|------------|
| oneRMEngine recommendations | Implementado, no conectado | `oneRMEngine.ts` | Falta UI |
| Overtraining detection | Implementado, parcial | `performanceEngine.ts` | Solo en AIInsightsPanel |
| Template generation IA | Hook existe, no usado | `useTemplateGenerator.ts` | No hay UI trigger |

### 8.2 Datos No Utilizados

| Dato | Se Guarda En | Uso Actual | Oportunidad |
|------|--------------|------------|-------------|
| `session.preSessionFatigue` | WorkoutSession | Solo display | Correlacionar con rendimiento |
| `athlete.experienceLevel` | Athlete | Filtros | Ajustar sugerencias IA |
| `oneRMRecords.history[]` | Athlete | Solo display | Trend analysis |
| `plan.metadata.historicalAdherence` | TrainingPlan | Guardado | Mostrar en Dashboard |

### 8.3 Priorización de Mejoras

| Fase | Mejora | Esfuerzo | Impacto |
|------|--------|----------|---------|
| 1 | Unificar utils/metrics + dashboardMetrics | Bajo | Alto |
| 1 | Hooks IA → AIOrchestrator | Medio | Alto |
| 2 | Dividir useTrainingPlan en 3 hooks | Medio | Alto |
| 2 | Reducir performanceEngine | Medio | Alto |
| 3 | Extraer subcomponentes de God Views | Alto | Medio |
| 3 | Conectar oneRMEngine post-sesión | Bajo | Medio |

---

## 9. FLUJO DE DATOS: EJEMPLO COMPLETO

### Un Atleta Completa una Sesión

```
1. LiveSession carga
   └─ useLiveSession(id)
      └─ store.getSession(id) → session
      └─ useState: activeExerciseIndex, modals...

2. Usuario completa sets
   └─ handleCompleteSet(exIdx, setIdx, data)
      └─ updateSession({exercises: updatedExercises})
      └─ restTimer.start()

3. Usuario finaliza sesión
   └─ handleFinishSession()
      ├─ Calcula duración desde sessionStartTime
      ├─ Para cada ejercicio:
      │   └─ if shouldAutoDeduceOneRM():
      │       └─ estimated = autoDeduceOneRM(sets)
      │       └─ updatedAthlete = updateOneRepMax(...)
      │       └─ store.updateAthlete(athleteId, {oneRMRecords})
      ├─ avgIntensity = computeSessionAvgIntensity(session)
      └─ store.updateSession(id, {
            status: 'completed',
            completedAt,
            durationMinutes,
            totalVolume,
            avgIntensity
         })

4. Dashboard se actualiza
   └─ useSessions() re-fetches
   └─ calculateWeeklyStats() recalcula
   └─ useWeeklyCompletionRate() actualiza

5. Calendar se actualiza
   └─ Sessions del día muestran estado 'completed'

6. AthleteDetail se actualiza
   └─ Nuevos 1RM records visibles
   └─ Historial de sesiones actualizado

7. Analytics se actualiza
   └─ Nuevos datos para gráficos
   └─ AIInsightsPanel puede regenerar insights

8. IA (oportunidad no aprovechada)
   └─ oneRMEngine.analyzeSessionForOneRM() DEBERÍA generar sugerencias
   └─ Mostrar notificación: "Tu Press Banca aumentó a 85kg"
```

### Ineficiencias Detectadas

- **Paso 3:** Auto-deducción 1RM es silenciosa (solo console.log)
- **Paso 4-6:** Múltiples re-renders por actualización de store
- **Paso 8:** oneRMEngine no se llama, se pierde oportunidad de feedback

---

## 10. CONCLUSIONES

### Fortalezas del Sistema

1. **Store bien arquitecturado** - Slices limpios, selectors memoizados
2. **Sistema de tipos robusto** - 549 líneas de tipos bien definidos
3. **Validación Zod implementada** - Solo falta conexión
4. **Engines de IA funcionales** - Solo falta orquestación
5. **UI system coherente** - Aura components reutilizables

### Debilidades Principales

1. **God Components** - 5 vistas con 500+ líneas cada una
2. **God Hook** - useTrainingPlan (447 líneas)
3. **Duplicación de métricas** - 3 archivos con lógica similar
4. **IA infrautilizada** - Orchestrator no conectado, engines no llamados
5. **performanceEngine** - 595 líneas, debería ser 200

### Roadmap Sugerido

| Fase | Objetivo | Prioridad | Esfuerzo |
|------|----------|-----------|----------|
| **Fase 1** | Limpieza de duplicación en utils | Alta | 2-4h |
| **Fase 2** | Conectar hooks IA → AIOrchestrator | Alta | 4-6h |
| **Fase 3** | Dividir useTrainingPlan | Alta | 4-6h |
| **Fase 4** | Reducir performanceEngine | Media | 2-4h |
| **Fase 5** | Extraer subcomponentes de Views | Media | 8-12h |
| **Fase 6** | Conectar oneRMEngine en flujo post-sesión | Baja | 2-4h |

---

**Documento generado para planificación de refactor técnico y diseño de arquitectura IA.**
