# 13 - Deuda Técnica y Riesgos

> **Objetivo**: Lista priorizada de problemas técnicos desde la perspectiva del modo coach

---

## Clasificación de Prioridades

| Nivel | Significado |
|-------|-------------|
| **P0** | Bloqueante o muy importante - abordar antes de nuevas features |
| **P1** | Importante - se puede convivir un tiempo corto |
| **P2** | Mejora deseable / optimización |

---

## P0 - Críticos

### P0.1 - Duplicación de tipos types/types.ts vs domain/*

**Tipo**: modelo de dominio

**Descripción**:
- `types/types.ts` (609 líneas) contiene `WorkoutSession`, `WorkoutTemplate`, `SetEntry`, `ExerciseEntry`
- `domain/sessions/types.ts` contiene los mismos tipos
- Mismo nombre, definiciones similares pero no idénticas
- Riesgo de divergencia silenciosa

**Ubicación**:
- `src/types/types.ts`
- `src/domain/sessions/types.ts`
- `src/domain/templates/types.ts`

**Impacto**:
- Confusión al importar (`from '../types/types'` vs `from '../domain/sessions'`)
- Errores de tipo sutiles cuando las definiciones divergen
- Dificulta el mantenimiento

**Acción sugerida**:
Consolidar: `types/types.ts` debería re-exportar de `domain/*`, no definir localmente.

---

### P0.2 - PlannedSession no tiene snapshot del template

**Tipo**: modelo de dominio

**Descripción**:
- `PlannedSession` solo guarda `templateId` y `dayOfWeek`
- Si el template cambia después de planificar, la sesión generada será diferente
- El coach planifica con expectativas que luego no se cumplen

**Ubicación**:
- `src/domain/plans/types.ts` (PlannedSession)
- `src/domain/sessions/mappers.ts` (createScheduledSessionFromTemplate)

**Impacto**:
- Inconsistencia entre lo planificado y lo ejecutado
- El coach no puede confiar en que la sesión será como la planificó

**Acción sugerida**:
Opción A: Guardar snapshot de ejercicios en PlannedSession  
Opción B: Bloquear edición de templates usados en planes activos

---

### P0.3 - Hooks no usan funciones de domain/plans/calendar

**Tipo**: hook/arquitectura

**Descripción**:
- `useWeeklySchedule` define `getWeekStart` localmente (línea 58-66)
- `useCalendarView` construye días del mes inline
- Ya existe `getWeekStartMonday`, `buildCalendarMonth` en domain/plans/calendar

**Ubicación**:
- `src/hooks/useWeeklySchedule.ts`
- `src/hooks/useCalendarView.ts`
- `src/domain/plans/calendar.ts`

**Impacto**:
- Duplicación de lógica
- Posible inconsistencia en cálculos de fechas
- Viola los principios de Fase 4

**Acción sugerida**:
Refactorizar hooks para usar funciones de domain/plans/calendar.

---

## P1 - Importantes

### P1.1 - Engines de IA importan de types/types en lugar de domain/*

**Tipo**: IA/arquitectura

**Descripción**:
- `sessionEngine.ts`, `templateEngine.ts` importan de `../../types/types`
- Deberían importar de `../../domain/sessions` o `../../domain/templates`

**Ubicación**:
- `src/ai/engines/sessionEngine.ts`
- `src/ai/engines/templateEngine.ts`
- `src/ai/engines/weeklyPlanEngine.ts`

**Impacto**:
- Dependen del monolito types/types.ts
- Dificulta migración a tipos de dominio

**Acción sugerida**:
Actualizar imports de engines para usar domain/*.

---

### P1.2 - useAnalyticsData tiene cálculos inline

**Tipo**: hook/arquitectura

**Descripción**:
- `weeklyVolume` se calcula inline con reduce/map
- `topExercises` también
- Debería usar funciones de domain/performance o core/analysis

**Ubicación**:
- `src/hooks/useAnalyticsData.ts` líneas 150-186

**Impacto**:
- Lógica duplicada
- Más difícil de testear
- Viola principios de Fase 4

**Acción sugerida**:
Crear `getWeeklyVolumeSeries` y `getTopExercisesByVolume` en domain/performance.

---

### P1.3 - No hay vista dedicada de Plan de Entrenamiento

**Tipo**: flujo/UX

**Descripción**:
- Los planes se gestionan desde modales (TrainingPlanModal)
- No hay ruta `/plans` ni vista completa
- El coach no puede ver/editar su plan fuera del Dashboard

**Ubicación**:
- `src/components/dashboard/TrainingPlanModal.tsx`
- No existe `src/views/PlansView.tsx`

**Impacto**:
- UX limitada para gestión de planes
- El plan es central pero su gestión es secundaria

**Acción sugerida**:
Crear `PlansView.tsx` con:
- Lista de planes
- Detalle de plan activo
- Vista de semanas del plan
- Historial de adherencia

---

### P1.4 - useSessionBuilder no usa mappers de dominio

**Tipo**: hook/arquitectura

**Descripción**:
- `handleCreateSession` construye `ExerciseEntry[]` manualmente
- Ya existe `createScheduledSessionFromTemplate` en domain/sessions/mappers

**Ubicación**:
- `src/hooks/useSessionBuilder.ts` línea ~101-150

**Impacto**:
- Duplicación de lógica de transformación
- Posible inconsistencia con mappers

**Acción sugerida**:
Refactorizar para usar mappers de domain/sessions.

---

### P1.5 - domain/sessions/types.ts tiene funciones de cálculo

**Tipo**: modelo de dominio

**Descripción**:
- `calculateSetVolume`, `calculateSessionTotals` están en types.ts
- Duplican lo que hace core/analysis/metrics
- Un archivo de "tipos" no debería tener lógica

**Ubicación**:
- `src/domain/sessions/types.ts` líneas 76-120

**Impacto**:
- Confusión sobre dónde están los cálculos
- Duplicación con core/analysis

**Acción sugerida**:
Mover funciones a domain/sessions/calculations.ts o eliminar si duplican core/analysis.

---

## P2 - Mejoras Deseables

### P2.1 - DayPlan.dayOfWeek es string, no número

**Tipo**: modelo de dominio

**Descripción**:
- `DayPlan.dayOfWeek` es tipo `WeekDay` (string: 'monday', 'tuesday', etc.)
- Algunos flujos esperan número (0-6)
- Requiere conversión constante

**Ubicación**:
- `src/types/types.ts` (DayPlan, WeekDay)

**Impacto**:
- Código de conversión disperso
- Posibles bugs en comparaciones

**Acción sugerida**:
Estandarizar a un solo formato (preferiblemente número).

---

### P2.2 - No hay tests unitarios para funciones de dominio

**Tipo**: testing

**Descripción**:
- Las funciones puras de domain/* son testeables
- No hay tests implementados

**Ubicación**:
- No existe carpeta `src/domain/**/__tests__`

**Impacto**:
- Menor confianza en refactors
- Regresiones no detectadas

**Acción sugerida**:
Añadir tests para:
- domain/sessions/workout
- domain/plans/adherence
- domain/plans/calendar
- domain/performance/metrics

---

### P2.3 - Analytics no muestra tendencias temporales

**Tipo**: flujo/UX

**Descripción**:
- Adherencia solo muestra semana actual
- No hay gráfico de evolución de adherencia
- Coach no ve si mejora o empeora en el tiempo

**Ubicación**:
- `src/views/AnalyticsView.tsx`
- `src/hooks/useAnalyticsData.ts`

**Impacto**:
- Coach no tiene visión longitudinal
- Menos insights accionables

**Acción sugerida**:
Añadir `calculateAdherenceTrend` (ya existe en domain/plans/adherence) a Analytics.

---

### P2.4 - No hay comparativa multi-atleta

**Tipo**: flujo/UX

**Descripción**:
- Dashboard/Analytics muestran métricas globales o por atleta individual
- No hay vista que compare atletas lado a lado

**Ubicación**:
- `src/views/Dashboard.tsx`
- `src/views/AnalyticsView.tsx`

**Impacto**:
- Coach con múltiples atletas no puede compararlos fácilmente

**Acción sugerida**:
Añadir tab "Comparativa" en Analytics con tabla de atletas y sus métricas.

---

### P2.5 - Falta concepto de usuario/permisos para vista atleta

**Tipo**: arquitectura

**Descripción**:
- No hay autenticación ni roles
- Todos los datos son visibles para cualquiera
- Bloquea implementación de vista atleta

**Ubicación**:
- Afecta toda la app

**Impacto**:
- No se puede lanzar modo atleta sin esto
- Prep work necesario

**Acción sugerida**:
Preparar:
- Concepto de `currentUserId`
- Selector `useCurrentUserSessions()`
- Hook `useUserRole() → 'coach' | 'athlete'`

---

## Resumen Visual

```
┌─────────────────────────────────────────────────────────────┐
│                         P0 - CRÍTICO                        │
├─────────────────────────────────────────────────────────────┤
│ • Duplicación types/types.ts vs domain/*                    │
│ • PlannedSession sin snapshot                               │
│ • Hooks no usan domain/plans/calendar                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       P1 - IMPORTANTE                       │
├─────────────────────────────────────────────────────────────┤
│ • IA engines importan de types/types                        │
│ • useAnalyticsData cálculos inline                          │
│ • No hay PlansView                                          │
│ • useSessionBuilder no usa mappers                          │
│ • domain/sessions/types.ts tiene funciones                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       P2 - DESEABLE                         │
├─────────────────────────────────────────────────────────────┤
│ • DayPlan.dayOfWeek string vs número                        │
│ • No hay tests de dominio                                   │
│ • Analytics sin tendencias                                  │
│ • Sin comparativa multi-atleta                              │
│ • Sin usuario/permisos (bloquea vista atleta)               │
└─────────────────────────────────────────────────────────────┘
```
