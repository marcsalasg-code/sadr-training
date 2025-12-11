# Riesgos, Errores y Oportunidades de Mejora

## 1. Riesgos Técnicos / Deuda

### 1.1 Vistas Monolíticas
| Vista | Líneas | Problema |
|-------|--------|----------|
| `SettingsView.tsx` | 434 | Múltiples secciones de config mezcladas |
| `TrainingConfigView.tsx` | 433 | Formularios complejos sin extraer |

**Riesgo**: Difícil de mantener, propenso a bugs al modificar una sección.

### 1.2 Hooks Demasiado Grandes
| Hook | Tamaño | Problema |
|------|--------|----------|
| `useLiveSession.ts` | 17KB, 456 líneas | Centraliza demasiada lógica |
| `useCalendarView.ts` | 13KB | Lógica de rendering mezclada |
| `useAnalyticsData.ts` | 10KB | Muchos cálculos inline |

**Riesgo**: Difícil de testear unitariamente, re-renders innecesarios.

### 1.3 Engines de IA con Cálculo + Prompts Mezclados
| Engine | Problema |
|--------|----------|
| `performanceEngine.ts` (589 líneas) | Mezcla 1RM calculations con load suggestions |
| `sessionEngine.ts` | Mezcla validación con generación |

**Riesgo**: No hay IA real, todo es cálculo local. Dificulta integrar IA externa.

### 1.4 Duplicación de Tipos
| Ubicación 1 | Ubicación 2 | Tipo |
|-------------|-------------|------|
| `types/types.ts` | `domain/sessions/types.ts` | `SetEntry`, `ExerciseEntry` |
| `types/types.ts` | `domain/athletes/types.ts` | `Athlete` |
| `ai/types.ts` | `domain/` (no existe) | `LoadSuggestion`, `ProgressionStrategy` |

**Riesgo**: Inconsistencias entre definiciones, imports confusos.

### 1.5 Store Monolítico
- `store.ts` tiene 16KB combinando todos los slices
- No hay separación clara de responsabilidades
- Selectores en archivo separado (`selectors.ts`) pero incompletos

**Riesgo**: Cambios en un dominio afectan todo el store.

### 1.6 aiStore Separado
- El estado de IA está en `ai/aiStore.ts`, no integrado en store principal
- Hooks de IA acceden a ambos stores

**Riesgo**: Dos fuentes de verdad, sincronización manual.

---

## 2. Errores e Incoherencias Detectados

### 2.1 Tipos Incoherentes
```
❌ domain/sessions/types.ts: exerciseName: string (requerido)
❌ types/types.ts: exerciseName?: string (opcional)
→ Se resolvió haciendo opcional en domain, pero es un parche.
```

### 2.2 Imports Inconsistentes
```
✅ Hooks usan domain layer
❌ AI engines usan types/types.ts directamente
❌ Store slices usan types/types.ts directamente
→ No hay adopción completa del domain layer.
```

### 2.3 Código Potencialmente Muerto
| Archivo | Evidencia |
|---------|-----------|
| `utils/dashboardMetrics.ts` | Re-exporta de core/analysis, marcado deprecated |
| `utils/metrics.ts` | 19KB pero solo re-exporta de core/analysis |
| `docs/02_hooks_refactor.md` | Outdated, no refleja estado actual |
| `docs/refactor_phase1_2.md` | Documentación de refactor anterior |

### 2.4 Nombres Contradictorios
| Nombre Actual | Problema |
|---------------|----------|
| `computeSessionVolumeKg` | ¿Por qué "Kg"? El cálculo es genérico |
| `getWeekStart` en 2 lugares | `domain/performance` y `core/analysis` |
| `OneRMSource` vs `SourceType` | Términos inconsistentes |

### 2.5 Warnings/Issues Conocidos
```
⚠️ TypeScript compila sin errores (verificado)
⚠️ No hay tests unitarios visibles
⚠️ No hay CI/CD configured
⚠️ ESLint warnings posibles (no verificados en esta auditoría)
```

---

## 3. Lista de Mejoras Priorizadas (Backlog)

### P0 - Crítico / Bloqueante
_No hay bloqueantes críticos. El código compila y funciona._

### P1 - Importante para Limpieza y Claridad

| ID | Descripción | Archivos Afectados | Tipo de Cambio |
|----|-------------|-------------------|----------------|
| P1-01 | **Refactorizar SettingsView** | `views/SettingsView.tsx` | Extraer secciones a `components/settings/` |
| P1-02 | **Refactorizar TrainingConfigView** | `views/Settings/TrainingConfigView.tsx` | Extraer formularios a componentes |
| P1-03 | **Unificar tipos en domain layer** | `types/types.ts` → `domain/*` | Migrar tipos gradualmente |
| P1-04 | **Eliminar utils/metrics.ts** | `utils/metrics.ts`, consumidores | Cambiar imports a `core/analysis` |
| P1-05 | **Eliminar utils/dashboardMetrics.ts** | `utils/dashboardMetrics.ts` | Deprecated, eliminar |
| P1-06 | **Dividir useLiveSession** | `hooks/useLiveSession.ts` | Extraer sub-hooks: `useSessionProgress`, `useSetHandlers` |
| P1-07 | **Integrar aiStore en store principal** | `ai/aiStore.ts`, `store/store.ts` | Mover slice de IA al store combinado |

### P2 - Mejoras Deseables pero No Urgentes

| ID | Descripción | Archivos Afectados | Tipo de Cambio |
|----|-------------|-------------------|----------------|
| P2-01 | **Extraer CalendarGrid component** | `views/CalendarView.tsx` | Mover grid a `components/calendar/` |
| P2-02 | **Extraer ExerciseFormModal** | `views/ExercisesView.tsx` | Mover modal a componente |
| P2-03 | **Crear useTemplatesView hook** | `views/TemplatesView.tsx` | Extraer lógica de modales |
| P2-04 | **Separar performanceEngine** | `ai/performance/performanceEngine.ts` | Dividir: 1RM engine + load engine + overtraining engine |
| P2-05 | **Actualizar AI layer para IA real** | `ai/providers/*` | Implementar RemoteAIProvider con OpenAI/Claude |
| P2-06 | **Agregar tests unitarios** | `src/__tests__/` | Crear tests para domain + hooks críticos |
| P2-07 | **Limpiar documentación outdated** | `docs/02_hooks_refactor.md`, `docs/refactor_phase1_2.md` | Eliminar o actualizar |
| P2-08 | **Estandarizar naming conventions** | Todo el proyecto | Definir y aplicar convenciones |
| P2-09 | **Agregar exportaciones barrel** | `domain/index.ts`, `hooks/index.ts` | Simplificar imports |
| P2-10 | **Implementar error boundaries** | `App.tsx`, vistas críticas | Manejar errores de rendering |

### P3 - Nice-to-Have

| ID | Descripción | Archivos Afectados | Tipo de Cambio |
|----|-------------|-------------------|----------------|
| P3-01 | **Dark/Light mode dinámico** | `index.css`, componentes UI | Añadir toggle de tema |
| P3-02 | **Internacionalización (i18n)** | Todo el proyecto | Añadir soporte multi-idioma |
| P3-03 | **PWA support** | `vite.config.ts`, manifest | Hacer app instalable |
| P3-04 | **Optimistic updates en store** | Slices con API | Mejorar UX de guardado |
| P3-05 | **Skeleton loaders** | Vistas principales | Mejorar perceived performance |

---

## 4. Resumen Ejecutivo para Análisis Externo

### Estado Actual
- ✅ Proyecto funcional, compila sin errores
- ✅ Stack moderno: React 19, Vite, Zustand, Tailwind
- ✅ Domain layer creado pero parcialmente adoptado
- ✅ AI layer estructurado pero sin IA real
- ✅ 6 vistas refactorizadas a container limpio

### Deuda Técnica Principal
1. **2 vistas monolíticas** (>430 líneas cada una)
2. **Duplicación de tipos** entre `types/types.ts` y `domain/`
3. **Hooks grandes** (useLiveSession 17KB)
4. **aiStore separado** del store principal

### Prioridades Recomendadas
1. P1-01, P1-02: Refactorizar vistas monolíticas
2. P1-03: Unificar tipos en domain layer
3. P1-04, P1-05: Eliminar utils deprecated
4. P1-06: Dividir hooks grandes

### Métricas Clave
- **Total vistas**: 12
- **Vistas limpias**: 6 (50%)
- **Vistas mixtas**: 4 (33%)
- **Vistas monolíticas**: 2 (17%)
- **Líneas en vistas**: ~3,900
- **Hooks custom**: 16
- **Componentes**: ~90 archivos
