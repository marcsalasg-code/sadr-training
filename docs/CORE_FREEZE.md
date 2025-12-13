# CORE_FREEZE - Núcleo Congelado de SADR Training OS

> **Documento de control**: Este archivo define qué partes del sistema están congeladas y no deben modificarse sin un plan aprobado.

**Última actualización**: 2025-12-12  
**Estado**: ACTIVO

---

## 📋 Pantallas Principales (Rutas y Vistas)

| Ruta | Vista | Descripción | Estado |
|------|-------|-------------|--------|
| `/` | `Dashboard.tsx` | Panel principal con estadísticas globales | ✅ INTOCABLE |
| `/athletes` | `AthletesList.tsx` | Lista de atletas con filtros | ✅ INTOCABLE |
| `/athletes/:id` | `AthleteDetail.tsx` | Detalle y edición de atleta | ✅ INTOCABLE |
| `/planning` | `PlanningView.tsx` | Hub unificado de planificación | ⚠️ TOCABLE CON RIESGO |
| `/sessions/live/:id` | `LiveSession.tsx` | Sesión de entrenamiento en vivo | ✅ INTOCABLE |
| `/analytics` | `AnalyticsView.tsx` | Métricas y gráficos de rendimiento | ⚠️ TOCABLE CON RIESGO |
| `/settings` | `SettingsView.tsx` | Configuración general y avanzada | 🧪 ZONA EXPERIMENTAL |

### Vistas Redirigidas (mantener compatibilidad):
- `/sessions` → `/planning?tab=sessions`
- `/templates` → `/planning?tab=templates`
- `/exercises` → `/planning?tab=exercises`
- `/calendar` → `/planning?tab=calendar`
- `/lab` → `/settings?tab=advanced`

---

## 🧭 Navegación Básica

### Layout Principal
- **AppShell** (`components/layout/AppShell.tsx`): Contenedor principal ✅ INTOCABLE
- **Sidebar** (`components/layout/Sidebar.tsx`): Navegación lateral ✅ INTOCABLE
- **SidebarNav** (`components/layout/SidebarNav.tsx`): Items de navegación ✅ INTOCABLE
- **BrowserTopBar** (`components/layout/BrowserTopBar.tsx`): Barra superior ⚠️ TOCABLE CON RIESGO

### Comportamiento de Navegación
- React Router DOM v7
- Code splitting para `AnalyticsView` e `InternalLab` (lazy loading)
- Redirects para rutas antiguas (mantener compatibilidad)

---

## 🔄 Flujos Mínimos de Producción

### Flujo 1: Gestión de Atletas
```
AthletesList → Seleccionar atleta → AthleteDetail → Ver/Editar datos
└── Crear nuevo atleta (addAthlete)
└── Ver historial de sesiones
└── Ver estadísticas (1RM records, volumen)
```

### Flujo 2: Creación y Ejecución de Sesión
```
Dashboard/PlanningView → SessionBuilder → Seleccionar atleta
    └── Aplicar plantilla (opcional)
    └── Añadir ejercicios
    └── Guardar sesión (status: 'planned')
        └── Iniciar sesión → LiveSession
            └── Registrar sets (peso, reps, RPE)
            └── Completar ejercicio
            └── Finalizar sesión → Guardar (status: 'completed')
            └── Fatiga post-sesión (opcional)
```

### Flujo 3: Templates
```
TemplatesView → Ver templates existentes
    └── Crear template (manual o IA)
    └── Duplicar template
    └── Usar template en SessionBuilder
```

### Flujo 4: Calendario
```
CalendarView → Vista mensual
    └── Filtrar por atleta
    └── Seleccionar día → Ver agenda
    └── Crear sesión desde calendario
```

### Flujo 5: Analytics
```
AnalyticsView → Seleccionar atleta (opcional)
    └── Filtrar por rango de tiempo
    └── Ver métricas: volumen, e1RM, fatiga
    └── Ver tendencias
```

---

## 💾 Persistencia Actual

### Store Principal (Zustand)
- **Clave localStorage**: `training-monitor-storage`
- **Archivo**: `src/store/store.ts`

| Slice | Datos | Crítico |
|-------|-------|---------|
| `athletesSlice` | athletes[], addAthlete, updateAthlete, deleteAthlete | ✅ SÍ |
| `sessionsSlice` | sessions[], activeSessionId, CRUD methods | ✅ SÍ |
| `templatesSlice` | templates[], CRUD methods | ✅ SÍ |
| `exercisesSlice` | exercises[], CRUD methods | ✅ SÍ |
| `plansSlice` | trainingPlans[], activeTrainingPlanId | ⚠️ MEDIO |
| `settingsSlice` | settings (UI preferences) | 🧪 BAJO |
| `labSlice` | labEntries[] | 🧪 BAJO |
| `configSlice` | anchorConfig, exerciseCategories, trainingConfig | ⚠️ MEDIO |

### AI Store (Separado)
- **Clave localStorage**: `ai-settings-storage`
- **Archivo**: `src/ai/aiStore.ts`
- Contiene: apiKey, providerType, aiEnabled, logs

### Migraciones Automáticas
- Ejecutan en `onRehydrateStorage` del store
- `migrateExerciseCatalog`: Añade pattern/muscleGroup
- `migrateSessions` / `migrateTemplates`: Añade structure/blockId
- Validación y recálculo de volúmenes en sesiones completadas

---

## 🔒 Clasificación de Zonas

### ✅ INTOCABLE (No tocar sin aprobación explícita)

1. **Store principal** (`store/store.ts`)
   - Estructura de slices
   - Persistencia y partialize
   - Migraciones existentes

2. **Tipos de dominio** (`domain/*/types.ts`)
   - WorkoutSession, SetEntry, ExerciseEntry
   - Athlete, Exercise
   - WorkoutTemplate, TemplateExercise

3. **Flujo de LiveSession**
   - `useLiveSession.ts` (mutaciones de sets)
   - `domain/sessions/workout.ts`
   - Componentes de `components/session/`

4. **Rutas principales** (`App.tsx`)
   - Paths existentes
   - Redirects de compatibilidad

5. **Layout base**
   - AppShell, Sidebar, ContentArea

### ⚠️ TOCABLE CON RIESGO (Solo con plan documentado)

1. **Hooks de datos**
   - `useDashboardData`, `useAnalyticsData`, `useCalendarView`
   - Cambios pueden afectar múltiples vistas

2. **Cálculos de métricas**
   - `core/analysis/metrics.ts`
   - `domain/sessions/calculations.ts`

3. **Sistema de IA**
   - Engines, Orchestrator
   - Prompts y providers

4. **Vistas de Analytics/Calendar**
   - Lógica de filtrado
   - Integración con hooks

### 🧪 ZONA EXPERIMENTAL (Iterar más libre)

1. **InternalLab** y componentes de lab
2. **Settings avanzados**
3. **UI styling** (colores, animaciones) - sin cambiar estructura
4. **Nuevos componentes UI** en `components/ui/aura/`

---

## ✅ Smoke Test del Núcleo

Ejecutar manualmente después de cada cambio tipo B o C:

### Checklist de Validación (8-12 pasos)

| # | Paso | Resultado Esperado |
|---|------|-------------------|
| 1 | Abrir `/` (Dashboard) | Carga sin errores, muestra estadísticas |
| 2 | Navegar a `/athletes` | Lista de atletas visible |
| 3 | Entrar a un atleta (`/athletes/:id`) | Detalle carga correctamente |
| 4 | Volver atrás | Navegación funciona, no hay pantalla blanca |
| 5 | Ir a `/planning?tab=templates` | Templates visibles, crear/duplicar funciona |
| 6 | Ir a `/planning?tab=calendar` | Calendario muestra, cambio semana/mes funciona |
| 7 | Crear una sesión nueva en SessionBuilder | Guardar funciona, aparece en lista |
| 8 | Iniciar LiveSession (`/sessions/live/:id`) | Carga sesión, UI interactiva |
| 9 | Registrar al menos un set completo | Set se marca, volumen se actualiza |
| 10 | Finalizar sesión | Modal de confirmación, sesión status='completed' |
| 11 | Verificar en Dashboard | Sesión aparece en "recientes" |
| 12 | Recargar página en ruta profunda | No hay pantalla blanca, estado persiste |

### Comandos de Verificación Automatizados

```bash
# Lint (debe pasar sin errores críticos)
npm run lint

# TypeScript check (debe compilar sin errores)
npm run build

# Dev server (verificar que inicia)
npm run dev
```

---

## 📝 Historial de Cambios en Núcleo

| Fecha | Tipo | Descripción | Aprobado |
|-------|------|-------------|----------|
| 2025-12-12 | Doc | Creación de CORE_FREEZE.md | N/A |

---

## ⚠️ Reglas Obligatorias

1. **NO modificar** archivos marcados como ✅ INTOCABLE sin plan aprobado
2. **NO refactorizar** "ya que estamos aquí..."
3. **UN objetivo** por rama/cambio
4. **Ejecutar Smoke Test** después de cambios tipo B/C
5. **Documentar** cualquier modificación en este archivo
