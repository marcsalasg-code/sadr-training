# SADR Training OS - Refactor Fase 1 + Fase 2

## Resumen Ejecutivo

Este documento describe los cambios arquitectónicos aplicados en las Fases 1 y 2 del refactor, enfocados en mejorar la mantenibilidad y preparar el sistema para IA sin cambiar el comportamiento funcional ni la UX.

---

## 1. Arquitectura del Store (Zustand)

### Estructura Original
- **store.ts**: ~673 líneas, monolítico con 77+ funciones

### Nueva Estructura (Slices)
```
src/store/
├── index.ts           # Exports públicos centralizados
├── store.ts           # Store combinado (~309 líneas)
├── athletesSlice.ts   # Estado y acciones de atletas
├── sessionsSlice.ts   # Estado y acciones de sesiones  
├── plansSlice.ts      # Planes de entrenamiento
├── templatesSlice.ts  # Templates de sesiones
├── exercisesSlice.ts  # Ejercicios y catálogo
├── settingsSlice.ts   # Configuración de la app
├── labSlice.ts        # Laboratorio interno
└── selectors.ts       # Selectors memoizados
```

### Beneficios
- Cada slice tiene responsabilidad única
- Store combinado mantiene API pública igual
- Persist middleware sin cambios
- Cero breaking changes para consumidores

---

## 2. Métricas Centralizadas

### Archivo: `src/utils/dashboardMetrics.ts`

Funciones puras que eliminan duplicación entre vistas:

| Función | Uso |
|---------|-----|
| `calculateWeeklyStats()` | Stats completas para Dashboard |
| `calculateAthleteStats()` | Stats específicas de atleta |
| `filterWeekSessions()` | Sesiones de la semana actual |
| `calculateTotalVolume()` | Volumen total de sesiones |
| `calculateAvgDuration()` | Duración media de sesiones |
| `countActiveAthletes()` | Atletas activos |
| `getTemplateUsage()` | Uso de templates |

### Vistas que usan estas métricas
- `Dashboard.tsx` ✓
- `AthleteDetail.tsx` ✓
- `AnalyticsView.tsx` ✓

---

## 3. Selectors Memoizados

### Archivo: `src/store/selectors.ts`

21 selectors optimizados para reducir re-renders:

```typescript
useWeeklyStats()          // Stats semanales globales
useAthleteStats(id)       // Stats por atleta
useWeekSessions()         // Sesiones de la semana
useActiveAthletesCount()  // Conteo de atletas activos
useMostUsedTemplate()     // Template más usado
useWeeklyCompletionRate() // Tasa de completitud
useActivePlanWithMeta()   // Plan activo + metadata
useHasActiveSession()     // Hay sesión activa?
useActiveSession()        // Sesión activa actual
```

---

## 4. Hooks Extraídos

### `src/hooks/useLiveSession.ts`

Hook que centraliza TODA la lógica de LiveSession:
- Gestión de estado de sesión
- Handlers de sets y ejercicios
- Auto-deducción de 1RM
- Soporte multi-atleta
- Timer de descanso
- Modales de UI

**Resultado**: `LiveSession.tsx` reducido de ~723 a ~430 líneas

### `src/hooks/useAthleteStats.ts`

Hook para estadísticas de atleta con:
- Stats base de `dashboardMetrics`
- Datos de intensidad vs fatiga
- Sesiones recientes ordenadas

---

## 5. Validación de IA (Zod)

### Archivo: `src/ai/validation/inputSchemas.ts`

Schemas Zod para validar inputs antes de llamar a engines:

| Schema | Valida |
|--------|--------|
| `SessionEngineInputSchema` | Inputs de sessionEngine |
| `WeeklyPlanEngineInputSchema` | Inputs de weeklyPlanEngine |
| `AnalyticsEngineInputSchema` | Inputs de analyticsEngine |
| `PerformanceEngineInputSchema` | Inputs de performanceEngine |
| `OneRMEngineInputSchema` | Inputs de oneRMEngine |

### Funciones de validación
```typescript
validateSessionEngineInput(input)
validateWeeklyPlanEngineInput(input)
validateAnalyticsEngineInput(input)
validatePerformanceEngineInput(input)
validateOneRMEngineInput(input)
safeValidate(schema, data, name) // Versión que no lanza error
```

---

## 6. AIOrchestrator

### Archivo: `src/ai/AIOrchestrator.ts`

Singleton que será el punto único de entrada para IA:

```typescript
const orchestrator = AIOrchestrator.getInstance();

// Métodos disponibles
orchestrator.generateWeeklyPlan(input)   // → weeklyPlanEngine
orchestrator.analyzePerformance(input)   // → analyticsEngine
orchestrator.checkPerformance(input)     // → performanceEngine
orchestrator.compareWeeks(current, prev) // → comparación
```

Cada método:
1. Valida inputs con Zod
2. Llama al engine correspondiente
3. Retorna `OrchestratorResult<T>` con success/error

---

## 7. Archivos Modificados

### Nuevos
- `store/athletesSlice.ts`
- `store/sessionsSlice.ts`
- `store/plansSlice.ts`
- `store/templatesSlice.ts`
- `store/exercisesSlice.ts`
- `store/settingsSlice.ts`
- `store/labSlice.ts`
- `store/selectors.ts`
- `store/index.ts`
- `utils/dashboardMetrics.ts`
- `hooks/useLiveSession.ts`
- `hooks/useAthleteStats.ts`
- `ai/AIOrchestrator.ts`
- `ai/validation/inputSchemas.ts`
- `docs/refactor_phase1_2.md`

### Refactorizados
- `store/store.ts` (de ~673 a ~309 líneas)
- `views/LiveSession.tsx` (de ~723 a ~430 líneas)
- `views/Dashboard.tsx` (usa métricas centralizadas)
- `views/AthleteDetail.tsx` (usa métricas centralizadas)

---

## 8. Compatibilidad

✅ **Sin breaking changes**: Todas las APIs públicas mantienen misma firma
✅ **TypeScript**: Compila sin errores
✅ **Persistencia**: Zustand persist sin cambios
✅ **UI/UX**: Exactamente igual al usuario final
