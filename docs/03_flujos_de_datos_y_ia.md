# Flujos de Datos y IA - SADR Training OS

## Arquitectura de Capas (Visión General)

```
┌─────────────────────────────────────────────────────────────────┐
│                         VISTAS (React)                          │
│  Dashboard, LiveSession, AnalyticsView, CalendarView, etc.     │
└─────────────────────────────┬───────────────────────────────────┘
                              │ usa
┌─────────────────────────────▼───────────────────────────────────┐
│                    HOOKS (Custom React Hooks)                   │
│  useLiveSession, useDashboardData, useAnalyticsData, etc.       │
│  Centraliza lógica de negocio y efectos secundarios             │
└──────────┬────────────────────────────────────┬─────────────────┘
           │ importa funciones puras            │ accede a estado
┌──────────▼──────────────────────┐  ┌──────────▼─────────────────┐
│       DOMAIN LAYER              │  │        STORE (Zustand)     │
│  src/domain/ + core/analysis/   │  │  store.ts + slices         │
│  Tipos + cálculos puros         │  │  Estado global reactivo    │
└─────────────────────────────────┘  └────────────────────────────┘
                                              │
┌─────────────────────────────────────────────▼───────────────────┐
│                        AI LAYER                                  │
│  AIOrchestrator → Engines → Hooks de IA                         │
│  aiStore (estado separado de IA)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo 1: Planificación (Plan → Semanas → Sesiones → Sets)

### Entidades Involucradas
```
TrainingPlan
├── id, name, athleteId, startDate, duration
├── weekStructure: DayPlan[]
│   ├── day: 0-6 (Lun-Dom)
│   ├── isTrainingDay: boolean
│   ├── sessionType: 'upper' | 'lower' | 'full_body' | ...
│   └── focusAreas: MuscleGroup[]
└── mesocycle: { currentWeek, totalWeeks, phase }

WorkoutSession
├── id, name, athleteId, status
├── scheduledDate, completedAt
├── templateId (opcional)
└── exercises: ExerciseEntry[]
    └── sets: SetEntry[]
        ├── targetReps, targetWeight, targetRPE
        └── actualReps, actualWeight, actualRPE, isCompleted
```

### Slices Implicados
| Slice | Archivo | Rol |
|-------|---------|-----|
| `plans` | `plansSlice.ts` | CRUD de TrainingPlan |
| `sessions` | `sessionsSlice.ts` | CRUD de WorkoutSession |
| `config` | `configSlice.ts` | Configuración de mesociclos |

### Hooks de Gestión
| Hook | Archivo | Función |
|------|---------|---------|
| `useTrainingPlan` | `hooks/useTrainingPlan.ts` | Plan activo, semana actual |
| `useTrainingPlanCalendar` | `hooks/useTrainingPlanCalendar.ts` | Generación de calendario desde plan |
| `useActiveTrainingPlan` | `hooks/useActiveTrainingPlan.ts` | Selector del plan activo |
| `useTrainingAdherence` | `hooks/useTrainingAdherence.ts` | Cálculo de adherencia semanal |

### Vistas que Consumen este Flujo
- `CalendarView.tsx` - Visualiza plan en calendario
- `Dashboard.tsx` - Muestra adherencia y próximas sesiones
- `SettingsView.tsx` - Configura mesociclo y plan

### Diagrama de Flujo
```
[ConfigSlice] → (settings de mesociclo)
       ↓
[PlansSlice] → TrainingPlan { weekStructure }
       ↓
[useTrainingPlanCalendar] → Genera DayPlan[] para cada día
       ↓
[CalendarView] → Renderiza grid con días de entrenamiento
       ↓
[Click en día] → Crea WorkoutSession con scheduledDate
       ↓
[SessionsSlice] → Almacena sesión creada
```

---

## Flujo 2: Live Session (Ejecución en Tiempo Real)

### Entidades Involucradas
```
WorkoutSession (status: 'in_progress')
├── exercises: ExerciseEntry[]
│   ├── id, exerciseId, order
│   └── sets: SetEntry[]
│       ├── id, setNumber, type
│       ├── targetReps, targetWeight, targetRPE
│       ├── actualReps, actualWeight, actualRPE
│       ├── isCompleted, completedAt
│       └── restSeconds
└── completedAt (null hasta finalizar)
```

### Hook Principal: `useLiveSession`
**Archivo**: `src/hooks/useLiveSession.ts` (17KB, 456 líneas)

**Responsabilidades:**
- Cargar sesión por ID
- Calcular `liveStats` (volumen, sets completados, progreso)
- Handlers para completar/editar sets
- Timer de descanso
- Finalización de sesión

**Funciones del Domain Layer usadas:**
```typescript
import { calculateSessionTotals, getSessionProgress } from '../domain/sessions';
```

### Componentes Involucrados
| Componente | Archivo | Rol |
|------------|---------|-----|
| `LiveSession` | Vista principal | Orquesta UI |
| `ExerciseCard` | `session/ExerciseCard.tsx` | Card de ejercicio |
| `SetRow` | `session/SetRow.tsx` | Fila de set editable |
| `SessionHeader` | `session/SessionHeader.tsx` | Nombre, atleta, timer |
| `SessionProgress` | `session/SessionProgress.tsx` | Barra de progreso |
| `RestTimerModal` | `session/RestTimerModal.tsx` | Timer entre sets |

### Diagrama de Flujo
```
[Usuario navega a /sessions/live/:id]
       ↓
[useLiveSession(id)] → Carga session de store
       ↓
[Domain: calculateSessionTotals] → totalVolume, totalSets, completedSets
[Domain: getSessionProgress] → progressPercent
       ↓
[Render LiveSession] → ExerciseCard[] → SetRow[]
       ↓
[Usuario completa set]
       ↓
[handleCompleteSet(exerciseId, setId, data)]
       ↓
[updateSession en store] → Re-render con nuevos stats
       ↓
[Si todos sets completos → completeSession()]
       ↓
[session.status = 'completed', completedAt = now()]
```

---

## Flujo 3: IA (Generación con Inteligencia Artificial)

### Arquitectura del AI Layer
```
src/ai/
├── AIOrchestrator.ts      # Entry point unificado
├── AIEngine.ts            # Clase base abstracta
├── aiStore.ts             # Estado de IA (Zustand separado)
├── types.ts               # Tipos de IA
│
├── engines/               # Motores específicos
│   ├── analyticsEngine.ts
│   ├── oneRMEngine.ts
│   ├── sessionEngine.ts
│   ├── templateEngine.ts
│   └── weeklyPlanEngine.ts
│
├── hooks/                 # Hooks de React para IA
│   ├── useTemplateGenerator.ts
│   ├── useSessionGenerator.ts
│   ├── useWeeklyPlanGenerator.ts
│   ├── useLoadPrediction.ts
│   └── useExerciseSuggestions.ts
│
├── performance/           # Motor de rendimiento
│   └── performanceEngine.ts (589 líneas)
│
├── providers/             # Abstracción de proveedores
│   ├── MockAIProvider.ts
│   └── RemoteAIProvider.ts
│
└── validation/            # Validación de inputs/outputs
```

### Componentes Clave

#### AIOrchestrator (`AIOrchestrator.ts`)
**Patrón**: Singleton
**Rol**: Entry point unificado que valida inputs y delega a engines

```typescript
class AIOrchestrator {
    generateWeeklyPlan(input): OrchestratorResult<WeeklyPlanResult>
    analyzePerformance(input): OrchestratorResult<AnalyticsResult>
    checkPerformance(input): OrchestratorResult<PerformanceCheckResult>
    compareWeeks(current, previous): OrchestratorResult
}
```

#### aiStore (`aiStore.ts`)
**Estado de IA separado del store principal**

```typescript
interface AIState {
    providerType: 'mock' | 'remote';
    apiKey: string | null;
    aiEnabled: boolean;
    logs: AILogEntry[];
    lastFeedback: AIFeedback | null;
    // ... acciones
}
```

### Flujo de Generación de Template
```
[Usuario en TemplatesView]
       ↓
[Click "Generar con IA"]
       ↓
[useTemplateGenerator hook]
       ↓
[Valida inputs: athleteId, objetivo, duración]
       ↓
[AIOrchestrator.generateWeeklyPlan() o templateEngine]
       ↓
[MockAIProvider genera respuesta simulada]
       ↓
[Respuesta validada con Zod schema]
       ↓
[Template creado en templatesSlice]
       ↓
[Log guardado en aiStore]
```

### Flujo de Sugerencia de Carga (1RM)
```
[Usuario en LiveSession, nuevo set]
       ↓
[useLoadPrediction hook]
       ↓
[performanceEngine.generateLoadSuggestion()]
       ↓
[Busca 1RM directo del atleta]
       ↓ (si no existe)
[Busca 1RM de referencia (anchor system)]
       ↓
[calculateWeightForReps(oneRM, targetReps, targetRPE)]
       ↓
[Retorna LoadSuggestion { weight, reps, confidence }]
```

### Flujo de Detección de Overtraining
```
[Dashboard o AnalyticsView carga]
       ↓
[AIOrchestrator.checkPerformance()]
       ↓
[performanceEngine.detectOvertraining()]
       ↓
[Analiza: weeklyVolumes, recentIntensity, sessionsPerWeek]
       ↓
[Retorna OvertrainingIndicator { level, score, factors, recommendation }]
```

---

## Flujo 4: Analytics / Performance

### Fuentes de Datos
```
WorkoutSession (status: 'completed')
├── exercises[].sets[] → Volumen = weight × reps
├── completedAt → Fecha para agrupar por semana
└── exercises[].sets[].actualRPE → RPE promedio
```

### Capa de Cálculo

#### Core Analysis (`core/analysis/metrics.ts`)
**Archivo**: 19KB, función central para métricas

**Funciones principales:**
```typescript
computeSessionVolumeKg(sets: ExecutedSet[]): number
computeAverageRPE(sets: ExecutedSet[]): number | null
computeBestE1RM(sets: ExecutedSet[]): number | null
computeTopSetLoadKg(sets: ExecutedSet[]): number
calculateWeeklyStats(sessions, athletes, templates): WeeklyStats
countActiveAthletes(sessions, days): number
```

#### Domain Performance (`domain/performance/types.ts`)
**Funciones puras:**
```typescript
calculateVolumeLoad(weight, reps, sets): number
calculateAverageIntensity(sets): number
calculateFatigueScore(avgRPE, volumeVsAverage): number
calculateVolumeTrend(weeklyVolumes): VolumeTrend
suggestProgression(currentWeight, lastReps, targetReps, lastRPE): ProgressionSuggestion
```

### Hooks de Analytics
| Hook | Archivo | Función |
|------|---------|---------|
| `useDashboardData` | 10KB | Stats globales para dashboard |
| `useAnalyticsData` | 10KB | Métricas filtradas por atleta/tiempo |
| `useSessionMetrics` | 4KB | Métricas de una sesión específica |
| `useAthleteStats` | 2KB | Stats de un atleta |

### Diagrama de Flujo
```
[AnalyticsView monta]
       ↓
[useAnalyticsData(filters)]
       ↓
[Domain: getCompletedSessions(all)]
[Domain: filterSessionsByAthlete(sessions, athleteId)]
[Domain: filterSessionsByDateRange(sessions, cutoff)]
       ↓
[Core: computeSessionVolumeKg, computeAverageRPE, ...]
       ↓
[useMemo: metrics { totalVolume, avgRPE, topSet, weeklyVolume[] }]
       ↓
[Render: MetricCards, VolumeChart, ExerciseList]
```

### Vistas que Consumen Analytics
| Vista | Datos Mostrados |
|-------|-----------------|
| `Dashboard` | Weekly stats, completion rate, active athletes |
| `AnalyticsView` | Volume trends, top exercises, session log |
| `AthleteDetail` | Athlete-specific stats, 1RM evolution |

---

## Resumen de Dependencias

### Hooks → Domain Layer
| Hook | Funciones Domain Usadas |
|------|-------------------------|
| `useLiveSession` | `calculateSessionTotals`, `getSessionProgress` |
| `useDashboardData` | `getCompletedSessions`, `sortSessionsByDate` |
| `useAnalyticsData` | `getCompletedSessions`, `filterSessionsByAthlete`, `filterSessionsByDateRange` |
| `useCalendarView` | `filterSessionsByAthlete` |

### AI Layer → Utils/Core
| AI Component | Dependencias |
|--------------|--------------|
| `performanceEngine` | `utils/oneRMCalculator` |
| `AIOrchestrator` | Engines, validators |
| `engines/*` | `types/types.ts` (NO domain/) |

### Store → Types
- Todos los slices importan de `types/types.ts`
- No hay uso directo de `domain/` desde store
