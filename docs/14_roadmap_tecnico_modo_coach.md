# 14 - Roadmap Técnico: Modo Coach

> **Documento de salida principal de la auditoría**

---

## Resumen Ejecutivo

### Estado Actual

La aplicación SADR Training OS tiene una base arquitectónica **sólida** después de las Fases 1-4:

- ✅ Capa de dominio con funciones puras (`domain/sessions`, `domain/plans`, `domain/performance`)
- ✅ Métricas centralizadas en `core/analysis/metrics.ts`
- ✅ Hooks refactorizados para delegar a dominio (`useLiveSession`, `useTrainingAdherence`)
- ✅ IA modular con engines especializados y validación Zod
- ✅ LiveSession muy completo con 3 estados claros

### Problemas Principales (Top 5)

1. **Duplicación de tipos** entre `types/types.ts` y `domain/*` - confusión y riesgo de divergencia
2. **PlannedSession sin snapshot** del template - inconsistencia entre planificado y ejecutado
3. **Hooks no usan domain/plans/calendar** - duplicación de lógica de fechas
4. **No hay vista de Plan dedicada** - gestión limitada del eje central del sistema
5. **Analytics sin tendencias** - coach no ve evolución temporal

### Enfoque Recomendado

```
┌────────────────────────────────────────────────────────────────┐
│ FASE ACTUAL: Consolidar modo coach                            │
│ - Limpiar P0s antes de nuevas features                        │
│ - Completar flujos Plan→Sesión→Analytics                      │
│                                                                │
│ SIGUIENTE: Preparar base para vista atleta                    │
│ - Concepto de usuario/permisos                                │
│ - Hooks filtrados por usuario                                 │
│                                                                │
│ DESPUÉS: Fase 5 UI/Aura (pospuesta)                           │
│ - Pulido visual fino                                          │
└────────────────────────────────────────────────────────────────┘
```

---

## Líneas de Trabajo (LT)

### LT1 - Consolidar Modelo de Tipos

**Objetivo**: Eliminar duplicación types/types.ts vs domain/*

**Archivos implicados**:
- `src/types/types.ts` (609 líneas)
- `src/domain/sessions/types.ts`
- `src/domain/templates/types.ts`
- `src/domain/plans/types.ts`
- Todos los imports en la app

**Acciones**:
1. Auditar qué tipos se usan de cada archivo
2. Mover definiciones canónicas a domain/*
3. Hacer que types/types.ts re-exporte de domain/*
4. Actualizar todos los imports

**Riesgos de no hacerlo**:
- Divergencia silenciosa de tipos
- Confusión creciente
- Bugs sutiles de tipo

**Beneficio**:
- Single source of truth para tipos
- Imports claros y consistentes
- Base limpia para vista atleta

---

### LT2 - Completar Uso de Funciones de Dominio en Hooks

**Objetivo**: Todos los hooks usan funciones de domain/*

**Archivos implicados**:
- `src/hooks/useWeeklySchedule.ts`
- `src/hooks/useCalendarView.ts`
- `src/hooks/useSessionBuilder.ts`
- `src/hooks/useAnalyticsData.ts`
- `src/domain/plans/calendar.ts`
- `src/domain/sessions/mappers.ts`

**Acciones**:
1. useWeeklySchedule → usar `getWeekStartMonday`, `buildWeekDays`
2. useCalendarView → usar `buildCalendarMonth`, `isTrainingDay`
3. useSessionBuilder → usar `createScheduledSessionFromTemplate`
4. useAnalyticsData → crear y usar `getWeeklyVolumeSeries`

**Riesgos de no hacerlo**:
- Duplicación de lógica
- Inconsistencia en cálculos
- Viola principios Fase 4

**Beneficio**:
- Hooks más simples
- Lógica testeable en dominio
- Consistencia garantizada

---

### LT3 - Robustecer Flujo Plan→Sesión

**Objetivo**: PlannedSession más robusto + Vista de Plan

**Archivos implicados**:
- `src/domain/plans/types.ts` (PlannedSession)
- `src/domain/sessions/mappers.ts`
- Nuevo: `src/views/PlansView.tsx`
- `src/components/dashboard/TrainingPlanModal.tsx`

**Acciones**:
1. Evaluar: ¿snapshot de ejercicios en PlannedSession o bloqueo de templates?
2. Crear PlansView con:
   - Lista de planes
   - Detalle de plan activo
   - Vista de semanas
   - Historial de adherencia
3. Añadir ruta `/plans` en App.tsx

**Riesgos de no hacerlo**:
- Coach no puede gestionar planes fuera del Dashboard
- Inconsistencia planificado vs ejecutado

**Beneficio**:
- UX completa para planificación
- Plan como eje central del sistema
- Base para onboarding de atletas

---

### LT4 - Añadir Tendencias a Analytics

**Objetivo**: Coach ve evolución temporal, no solo snapshot

**Archivos implicados**:
- `src/views/AnalyticsView.tsx`
- `src/hooks/useAnalyticsData.ts`
- `src/domain/plans/adherence.ts` (calculateAdherenceTrend ya existe)
- `src/domain/performance/metrics.ts`

**Acciones**:
1. Añadir gráfico de tendencia de adherencia (últimas 4-8 semanas)
2. Añadir comparativa "vs semana pasada" en métricas principales
3. Añadir indicador de tendencia de volumen (↑ ↓ →)

**Riesgos de no hacerlo**:
- Coach no sabe si mejora o empeora
- Insights no accionables

**Beneficio**:
- Visión longitudinal
- Decisiones informadas
- Preparación para narrativa IA

---

### LT5 - Alinear IA con Dominio

**Objetivo**: Engines importan de domain/*, no de types/types

**Archivos implicados**:
- `src/ai/engines/sessionEngine.ts`
- `src/ai/engines/templateEngine.ts`
- `src/ai/engines/weeklyPlanEngine.ts`
- `src/ai/performance/performanceEngine.ts`

**Acciones**:
1. Actualizar imports para usar domain/*
2. Crear mappers IA ↔ Dominio si es necesario
3. Estandarizar DayPlan.dayOfWeek (string vs número)

**Riesgos de no hacerlo**:
- Engines dependen del monolito
- Dificulta migración de tipos

**Beneficio**:
- IA alineada con dominio
- Preparación para mejoras de IA

---

### LT6 - Preparar Base para Vista Atleta

**Objetivo**: Concepto de usuario y filtrado por permisos

**Archivos implicados**:
- Nuevo: `src/hooks/useCurrentUser.ts`
- `src/store/store.ts` (concepto de currentUserId)
- Modificar selectores para filtrar por usuario

**Acciones**:
1. Definir tipo `UserRole = 'coach' | 'athlete'`
2. Añadir `currentUserId` y `currentUserRole` al store
3. Crear selector `useCurrentUserSessions()`
4. Preparar hooks para recibir param de modo

**Riesgos de no hacerlo**:
- Vista atleta bloqueada indefinidamente

**Beneficio**:
- Base para multi-usuario
- Reutilización de componentes existentes

---

## Backlog Priorizado

### P0 - Antes de Nuevas Features

| # | Tarea | Tipo | Módulos |
|---|-------|------|---------|
| 1 | Consolidar types/types.ts re-exportando de domain/* | refactor | types, domain |
| 2 | useWeeklySchedule usar domain/plans/calendar | refactor | hooks, domain |
| 3 | useCalendarView usar domain/plans/calendar | refactor | hooks, domain |
| 4 | Mover funciones de domain/sessions/types.ts a calculations.ts | refactor | domain |

### P1 - Segunda Ola

| # | Tarea | Tipo | Módulos |
|---|-------|------|---------|
| 5 | Crear PlansView.tsx | feature | views, components |
| 6 | useSessionBuilder usar mappers de dominio | refactor | hooks |
| 7 | Engines de IA importar de domain/* | refactor | ai |
| 8 | Añadir tendencia de adherencia a Analytics | feature | views, hooks |
| 9 | useAnalyticsData crear getWeeklyVolumeSeries | refactor | hooks, domain |

### P2 - Cuando P0/P1 Controlados

| # | Tarea | Tipo | Módulos |
|---|-------|------|---------|
| 10 | Tests unitarios para domain/* | testing | domain |
| 11 | Comparativa multi-atleta en Analytics | feature | views |
| 12 | Estandarizar DayPlan.dayOfWeek | refactor | types |
| 13 | Preparar concepto de usuario/roles | arquitectura | store, hooks |
| 14 | Snapshot de template en PlannedSession | modelo | domain |

---

## Sugerencias de Fases Futuras

### Fase 5 - Limpieza Final de Flujos Coach

**Objetivo**: P0s y P1s (#1-9) completados

**Prompts sugeridos**:
```
"Consolida types/types.ts para que re-exporte de domain/*. 
Actualiza todos los imports en la app. No cambies comportamiento."

"Refactoriza useWeeklySchedule y useCalendarView para usar 
las funciones de domain/plans/calendar. Mantén la misma API."

"Crea PlansView.tsx con lista de planes, detalle del plan activo,
vista de semanas y gráfico de adherencia. Usa componentes Aura."
```

---

### Fase 6 - Tendencias y Analytics Avanzados

**Objetivo**: Analytics con visión longitudinal

**Prompts sugeridos**:
```
"Añade gráfico de tendencia de adherencia (últimas 8 semanas) 
a AnalyticsView. Usa calculateAdherenceTrend de domain/plans."

"Añade indicadores de tendencia (↑ ↓ →) a las métricas del 
Dashboard comparando con la semana anterior."
```

---

### Fase 7 - Preparación Vista Atleta

**Objetivo**: Base técnica para multi-usuario

**Prompts sugeridos**:
```
"Añade concepto de currentUserId y currentUserRole al store.
Crea useCurrentUser hook. No cambies flujos existentes todavía."

"Crea useCurrentUserSessions que filtra sesiones por currentUserId.
Prepara useLiveSession para recibir modo 'coach' | 'athlete'."
```

---

### Fase 8 - UI/Aura (Pospuesta)

**Objetivo**: Pulido visual fino

**Notas**:
- Solo abordar después de flujos coach sólidos
- Focus en consistencia y responsive
- Revisar componentes Aura uno por uno

---

## Métricas de Éxito

Al completar LT1-LT4:

| Métrica | Objetivo |
|---------|----------|
| Imports de types/types.ts | 0 directos (solo re-exports) |
| Hooks con lógica inline | < 3 |
| Funciones de domain/ usadas | > 90% por hooks |
| Cobertura tests domain/ | > 50% |
| Flujos coach sin fricción | 5/5 |

---

## Conclusión

La base está bien puesta. Las Fases 1-4 dejaron una arquitectura limpia con dominio, hooks y métricas separados. 

**El foco ahora debe ser**:
1. Limpiar la deuda residual (tipos, duplicación)
2. Completar experiencia coach (PlansView, tendencias)
3. Preparar base para atleta (sin implementar aún)

**Las nuevas features pueden esperar** hasta que P0s estén resueltos. Esto garantiza que cada feature nueva se construya sobre cimientos sólidos.
