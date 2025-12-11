# Vistas Principales - SADR Training OS

## Resumen Ejecutivo

| Vista | Líneas | Tamaño | Clasificación |
|-------|--------|--------|---------------|
| SettingsView | 434 | 24KB | 🔴 Monolítica |
| TrainingConfigView | 433 | 21KB | 🔴 Monolítica |
| Dashboard | 424 | 21KB | 🟡 Container Mixto |
| CalendarView | 397 | 22KB | 🟡 Container Mixto |
| AthleteDetail | 338 | 14KB | 🟢 Container Limpio |
| LiveSession | 336 | 17KB | 🟢 Container Limpio |
| TemplatesView | 334 | 17KB | 🟡 Container Mixto |
| ExercisesView | 320 | 15KB | 🟡 Container Mixto |
| AthletesList | 299 | 13KB | 🟢 Container Limpio |
| AnalyticsView | 288 | 15KB | 🟢 Container Limpio |
| SessionBuilder | 262 | 11KB | 🟢 Container Limpio |
| InternalLab | 54 | 2KB | 🟢 Container Limpio |

**Leyenda:**
- 🟢 **Container Limpio**: <300 líneas, usa hooks + componentes hijos
- 🟡 **Container Mixto**: 300-400 líneas, algo de lógica inline
- 🔴 **Monolítica**: >400 líneas, mucha lógica y UI mezclada

---

## Análisis Detallado

### 1. Dashboard (`src/views/Dashboard.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 424 |
| **Tamaño** | 21KB |
| **Clasificación** | 🟡 Container Mixto |

**Descripción:**
Hub principal de la aplicación. Muestra resumen de actividad, estadísticas rápidas, sesiones recientes, adherencia semanal, y accesos directos.

**Hooks utilizados:**
- `useDashboardData` - Datos agregados del dashboard
- `useTrainingStore` - Acceso a atletas, sesiones

**Slices/Store:**
- `athletes`, `sessions` (via selector)

**Estructura interna:**
- Usa componentes de `components/dashboard/`
- Tiene lógica de navegación inline
- Varios `useMemo` para cálculos de métricas

**Observaciones:**
- Podría extraer más lógica a hooks
- Algunos widgets podrían ser componentes separados

---

### 2. AthletesList (`src/views/AthletesList.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 299 |
| **Tamaño** | 13KB |
| **Clasificación** | 🟢 Container Limpio |

**Descripción:**
Lista de atletas con búsqueda, filtrado, y acciones rápidas.

**Hooks utilizados:**
- `useTrainingStore` - Atletas, sesiones
- `useState` para búsqueda/filtros

**Slices/Store:**
- `athletes`, `sessions`

**Estructura interna:**
- Usa componentes de `components/athletes/`
- Modal de creación/edición delegado a componentes

**Observaciones:**
- ✅ Bien estructurada
- Componentes hijos manejan la complejidad

---

### 3. AthleteDetail (`src/views/AthleteDetail.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 338 |
| **Tamaño** | 14KB |
| **Clasificación** | 🟢 Container Limpio |

**Descripción:**
Vista detallada de un atleta: perfil, 1RM history, sesiones recientes, estadísticas, análisis de rendimiento.

**Hooks utilizados:**
- `useTrainingStore` - Datos del atleta
- `useAthleteStats` - Estadísticas calculadas
- `useParams` - ID del atleta desde URL

**Slices/Store:**
- `athletes`, `sessions`, `exercises`

**Estructura interna:**
- Usa componentes de `components/athletes/`:
  - `AthleteProfileCard`
  - `AthleteOneRMSection`
  - `AthleteHistorySection`
  - `AthletePerformanceSection`
  - `AthleteMetricsCard`

**Observaciones:**
- ✅ Refactorizada correctamente
- Componentes extraídos reducen complejidad

---

### 4. SessionBuilder (`src/views/SessionBuilder.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 262 |
| **Tamaño** | 11KB |
| **Clasificación** | 🟢 Container Limpio |

**Descripción:**
Constructor de sesiones de entrenamiento. Permite seleccionar atleta, agregar ejercicios, configurar sets.

**Hooks utilizados:**
- `useSessionBuilder` - Toda la lógica de construcción
- `useTrainingStore` - Templates, ejercicios

**Slices/Store:**
- `sessions`, `templates`, `exercises`

**Estructura interna:**
- Usa componentes de `components/session/`:
  - `ExerciseList`
  - `SetRow`
  - `RestTimer`

**Observaciones:**
- ✅ Bien delegada a useSessionBuilder
- UI separada de lógica

---

### 5. LiveSession (`src/views/LiveSession.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 336 |
| **Tamaño** | 17KB |
| **Clasificación** | 🟢 Container Limpio |

**Descripción:**
Vista de sesión en vivo. Permite registrar sets, ver progreso, timer de descanso, completar ejercicios.

**Hooks utilizados:**
- `useLiveSession` - Gestión completa de la sesión
- `useRestTimer` - Timer de descanso
- `useParams` - ID de sesión

**Slices/Store:**
- `sessions` (via useLiveSession)

**Estructura interna:**
- Usa componentes de `components/session/`:
  - `ExerciseCard`
  - `SetRow`
  - `SessionHeader`
  - `SessionProgress`
  - `RestTimerModal`

**Observaciones:**
- ✅ Bien refactorizada
- `useLiveSession` centraliza la lógica (17KB hook)

---

### 6. TemplatesView (`src/views/TemplatesView.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 334 |
| **Tamaño** | 17KB |
| **Clasificación** | 🟡 Container Mixto |

**Descripción:**
Gestión de plantillas de entrenamiento. CRUD, duplicado, inicio de sesión desde template.

**Hooks utilizados:**
- `useTrainingStore` - Templates, ejercicios
- `useState` para modales y formularios
- AI hooks para generación

**Slices/Store:**
- `templates`, `exercises`, `athletes`

**Estructura interna:**
- Usa `TemplateCard` (extraído)
- Usa `TemplateFormModal`

**Observaciones:**
- Estado de modales aún inline
- Podría beneficiarse de un hook `useTemplatesView`

---

### 7. AnalyticsView (`src/views/AnalyticsView.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 288 |
| **Tamaño** | 15KB |
| **Clasificación** | 🟢 Container Limpio |

**Descripción:**
Dashboard de analytics con métricas, gráficos, tendencias, top ejercicios.

**Hooks utilizados:**
- `useAnalyticsData` - Toda la lógica de métricas
- `useState` para tabs y filtros

**Slices/Store:**
- `sessions`, `exercises`, `athletes` (via hook)

**Estructura interna:**
- Usa componentes de `components/analytics/`:
  - `MetricCard`
  - `VolumeChart`
  - `ExerciseList`

**Observaciones:**
- ✅ Bien refactorizada
- `useAnalyticsData` centraliza cálculos

---

### 8. ExercisesView (`src/views/ExercisesView.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 320 |
| **Tamaño** | 15KB |
| **Clasificación** | 🟡 Container Mixto |

**Descripción:**
Biblioteca de ejercicios. CRUD, filtrado por grupo muscular, categoría.

**Hooks utilizados:**
- `useTrainingStore` - Ejercicios
- `useState` para búsqueda, filtros, modales

**Slices/Store:**
- `exercises`

**Estructura interna:**
- Modal de edición inline
- Lógica de filtrado inline

**Observaciones:**
- ⚠️ Modal de ejercicio debería extraerse
- Podría beneficiarse de `useExercisesView` hook

---

### 9. CalendarView (`src/views/CalendarView.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 397 |
| **Tamaño** | 22KB |
| **Clasificación** | 🟡 Container Mixto |

**Descripción:**
Calendario mensual con sesiones planificadas, completadas, agenda diaria.

**Hooks utilizados:**
- `useCalendarView` - Lógica del calendario
- `useTrainingStore` - Atletas, templates

**Slices/Store:**
- `sessions`, `athletes`, `templates` (via hook)

**Estructura interna:**
- Usa componentes de `components/calendar/`
- Renderizado de grid inline

**Observaciones:**
- ⚠️ Renderizado del calendario muy detallado
- Podría extraer `CalendarGrid` como componente

---

### 10. SettingsView (`src/views/SettingsView.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 434 |
| **Tamaño** | 24KB |
| **Clasificación** | 🔴 Monolítica |

**Descripción:**
Pantalla de configuración general: perfil, 1RM settings, análisis, IA, UI.

**Hooks utilizados:**
- `useTrainingStore` - Config global
- Múltiples `useState` para cada sección

**Slices/Store:**
- `config`, `settings`, `aiStore`

**Observaciones:**
- ⚠️ **Vista más grande del proyecto**
- Múltiples secciones que podrían ser componentes
- Estado de cada sección inline
- Candidata prioritaria para refactorización

---

### 11. TrainingConfigView (`src/views/Settings/TrainingConfigView.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 433 |
| **Tamaño** | 21KB |
| **Clasificación** | 🔴 Monolítica |

**Descripción:**
Configuración detallada de entrenamiento: mesociclos, intensidad, volumen objetivo.

**Hooks utilizados:**
- `useTrainingStore` - Config de entrenamiento
- Múltiples `useState`

**Slices/Store:**
- `config`

**Observaciones:**
- ⚠️ Similar a SettingsView en complejidad
- Formularios complejos que podrían extraerse

---

### 12. InternalLab (`src/views/InternalLab.tsx`)

| Métrica | Valor |
|---------|-------|
| **Líneas** | 54 |
| **Tamaño** | 2KB |
| **Clasificación** | 🟢 Container Limpio |

**Descripción:**
Laboratorio interno para testing de IA y validaciones.

**Estructura interna:**
- Usa componentes de `components/lab/`

**Observaciones:**
- ✅ Muy limpia, solo orquesta componentes

---

## Resumen de "Monstruos" Pendientes

### Vistas Monolíticas (Prioridad Alta)
1. **SettingsView.tsx** (434 líneas) - Necesita extracción de secciones
2. **TrainingConfigView.tsx** (433 líneas) - Formularios muy largos

### Vistas Mixtas (Prioridad Media)
3. **Dashboard.tsx** (424 líneas) - Algunos widgets inline
4. **CalendarView.tsx** (397 líneas) - Grid rendering inline
5. **TemplatesView.tsx** (334 líneas) - Estado de modales inline
6. **ExercisesView.tsx** (320 líneas) - Modal de exercise inline

### Vistas Limpias (OK)
- AthleteDetail, LiveSession, AnalyticsView, SessionBuilder, AthletesList, InternalLab
