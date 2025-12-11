# 06 - Principios: Hooks y Dominio

> **Fase 4** - Reglas de diseño post-refactor

Este documento establece los principios arquitectónicos que debe seguir el código después de la Fase 4. Son la guía para decidir dónde va cada pieza de lógica.

---

## 1. Principios Fundamentales

### 1.1 Separación de Responsabilidades

```
┌─────────────────────────────────────────────────────────────┐
│                        VIEWS (React)                        │
│  Solo rendering y props. Delegan todo a hooks.              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      HOOKS (src/hooks/)                     │
│  Orquestadores: leen store, llaman dominio, devuelven UI    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  STORE (Zustand) │ │ DOMAIN (puro)   │ │ AI (engines)    │
│  Estado global   │ │ Lógica negocio  │ │ Predicciones    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 2. Reglas para Hooks de Alto Nivel

### ✅ Hooks DEBEN:

1. **Leer estado del store** vía selectores
2. **Escribir estado** vía actions del store
3. **Llamar funciones de dominio** para cálculos y transformaciones
4. **Devolver datos listos para UI** (no crudos)
5. **Manejar estado local de UI** (modales, índices, filtros)
6. **Coordinar efectos secundarios** (navegación, timers)

### ❌ Hooks NO DEBEN:

1. **Contener lógica pesada de negocio**
   - ❌ `useMemo(() => sessions.filter(...).map(...).reduce(...))`
   - ✅ `useMemo(() => calculateWeeklyAdherence(sessions, plan))`

2. **Duplicar algoritmos de métricas**
   - ❌ Recalcular volumen, intensidad, e1RM inline
   - ✅ Usar `core/analysis/metrics` o `domain/performance/metrics`

3. **Mutar estructuras directamente**
   - ❌ `exercises[i].sets[j] = {...}`
   - ✅ `updateSetInExercise(session, exerciseId, setId, data)`

4. **Depender de detalles de implementación del store**
   - ❌ `state.sessions.items.filter(...)`
   - ✅ `selectCompletedSessions(state)`

---

## 3. Reglas para Funciones de Dominio

### Ubicación: `src/domain/*`

### ✅ Funciones de Dominio DEBEN:

1. **Ser puras** (misma entrada → misma salida)
2. **No depender de React, Zustand ni UI**
3. **Aceptar tipos del dominio como entrada**
4. **Retornar tipos del dominio como salida**
5. **Ser testables en aislamiento**

### Responsabilidades por Módulo:

#### `domain/sessions/`
```typescript
// Transformaciones de estado
createSessionFromTemplate(template, options): WorkoutSession
startSession(session): WorkoutSession
completeSession(session): WorkoutSession

// Mutaciones puras (devuelven nueva sesión)
updateSet(session, exerciseId, setId, data): WorkoutSession
addExercise(session, exercise): WorkoutSession
removeExercise(session, exerciseId): WorkoutSession

// Cálculos
calculateSessionTotals(session): SessionTotals
getSessionProgress(session): number
```

#### `domain/plans/`
```typescript
// Adherencia
calculateWeeklyAdherence(plan, sessions): WeeklyAdherence
calculateVolumeDeviation(plan, sessions): number
getAdherenceLevel(adherence): 'excellent' | 'good' | 'warning' | 'poor'

// Calendario
getTrainingDaysForWeek(plan, weekStart): DayPlan[]
isTrainingDay(plan, date): boolean
getNextTrainingDate(plan, fromDate): Date
```

#### `domain/performance/`
```typescript
// Ya implementado en Fase 3
getSetIntensity(set): number
getExerciseIntensityFatigue(exercise): ExerciseIntensityFatigue
getSessionIntensityFatigue(session): SessionIntensityFatigue
getWeeklyLoadSeries(sessions, weeksBack): WeeklyLoadData[]
```

#### `domain/athletes/`
```typescript
// Stats
getAthleteStats(athlete, sessions): AthleteStats
getAthleteProgressionTrend(athlete, sessions): ProgressionTrend
```

---

## 4. Reglas para Selectores y Slices

### Selectores (`store/selectors.ts`)

### ✅ Selectores DEBEN:

1. **Ser lo más simples posible**
2. **Usar `useShallow` para arrays/objetos**
3. **Delegar cálculos complejos a dominio**

```typescript
// ✅ Correcto: selector simple que delega a dominio
export const useWeeklyAdherenceData = () => {
    const activePlan = useActivePlan();
    const sessions = useSessions();
    
    return useMemo(
        () => activePlan 
            ? calculateWeeklyAdherence(activePlan, sessions)
            : null,
        [activePlan, sessions]
    );
};

// ❌ Incorrecto: selector con lógica de negocio inline
export const useWeeklyAdherenceData = () => {
    const activePlan = useActivePlan();
    const sessions = useSessions();
    
    return useMemo(() => {
        if (!activePlan) return null;
        const weekSessions = sessions.filter(s => ...);
        const completed = weekSessions.length;
        const planned = activePlan.sessionsPerWeek;
        // ... más cálculos inline
    }, [activePlan, sessions]);
};
```

### Slices

### ✅ Slices DEBEN:

1. **Exponer datos en estructuras coherentes con el dominio**
2. **Proveer actions atómicas** (add, update, remove)
3. **No implementar lógica de negocio compleja**

---

## 5. Reglas para IA y Métricas

### ✅ Engines de IA DEBEN:

1. **Consumir tipos del dominio** como entrada
2. **Producir tipos del dominio** como salida
3. **Usar funciones de `domain/performance/metrics`** para cálculos
4. **No reimplementar cálculos existentes**

```typescript
// ✅ Correcto
function analyzeSession(session: WorkoutSession): SessionAnalysis {
    const metrics = getSessionIntensityFatigue(session); // usa dominio
    return {
        intensity: metrics.avgIntensity,
        fatigue: metrics.avgFatigue,
        recommendation: generateRecommendation(metrics),
    };
}

// ❌ Incorrecto
function analyzeSession(session: WorkoutSession): SessionAnalysis {
    // Recalcula intensidad/fatiga desde cero
    let totalIntensity = 0;
    session.exercises.forEach(ex => {
        ex.sets.forEach(set => {
            totalIntensity += set.rpe || 7;
        });
    });
    // ...
}
```

---

## 6. Patrón de Refactorización

### Antes (lógica en hook):

```typescript
export function useTrainingAdherence() {
    const plan = useActivePlan();
    const sessions = useSessions();
    
    const weeklyAdherence = useMemo(() => {
        if (!plan) return DEFAULT_ADHERENCE;
        
        const { start, end } = getWeekRange();
        const weekSessions = sessions.filter(s => 
            s.athleteId === plan.athleteId &&
            s.status === 'completed' &&
            s.completedAt &&
            new Date(s.completedAt) >= start &&
            new Date(s.completedAt) <= end
        );
        
        const completed = weekSessions.length;
        const planned = plan.sessionsPerWeek;
        const percentage = planned > 0 ? (completed / planned) * 100 : 0;
        // ... más lógica
    }, [plan, sessions]);
    
    return { weeklyAdherence, ... };
}
```

### Después (dominio + hook orquestador):

```typescript
// domain/plans/adherence.ts
export function calculateWeeklyAdherence(
    plan: TrainingPlan,
    sessions: WorkoutSession[],
    weekRange?: { start: Date; end: Date }
): WeeklyAdherence {
    const { start, end } = weekRange || getWeekRange();
    
    const weekSessions = sessions.filter(s => 
        s.athleteId === plan.athleteId &&
        s.status === 'completed' &&
        s.completedAt &&
        new Date(s.completedAt) >= start &&
        new Date(s.completedAt) <= end
    );
    
    const completed = weekSessions.length;
    const planned = plan.sessionsPerWeek;
    const percentage = planned > 0 ? Math.round((completed / planned) * 100) : 0;
    
    return {
        planned,
        completed,
        percentage: Math.min(percentage, 100),
        // ...
    };
}
```

```typescript
// hooks/useTrainingAdherence.ts
export function useTrainingAdherence() {
    const plan = useActivePlan();
    const sessions = useSessions();
    
    const weeklyAdherence = useMemo(() => 
        plan 
            ? calculateWeeklyAdherence(plan, sessions)
            : DEFAULT_ADHERENCE,
        [plan, sessions]
    );
    
    return { weeklyAdherence, ... };
}
```

---

## 7. Checklist de Refactor

Para cada hook de Categoría B:

- [ ] Identificar lógica de negocio inline
- [ ] Crear función pura en `domain/`
- [ ] Mover los cálculos a la función de dominio
- [ ] Actualizar hook para llamar a dominio
- [ ] Verificar que hook solo orquesta
- [ ] Añadir comentario explicando el cambio

Para cada hook de Categoría A:

- [ ] Identificar handlers que mutan directamente
- [ ] Crear funciones de mutación pura en `domain/`
- [ ] Actualizar handlers para delegar a dominio
- [ ] Verificar que lógica de UI permanece en hook

---

## 8. Indicadores de Éxito

Después de la Fase 4:

1. **Hooks < 250 líneas** (objetivo)
2. **No hay `filter().map().reduce()` extensos en hooks**
3. **`domain/` contiene toda la lógica de negocio testable**
4. **Engines de IA usan tipos y funciones del dominio**
5. **Flujos existentes siguen funcionando sin cambios de UI**
