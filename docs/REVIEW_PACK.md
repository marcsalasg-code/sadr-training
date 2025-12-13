# REVIEW PACK — SADR Training OS

> **Fecha**: 2025-12-13  
> **Commit**: `00d155922172c0496d21ee1f86a8d632a955f457`  
> **Branch**: `master`

---

## 1) Repositorio

| Campo | Valor |
|-------|-------|
| **URL** | https://github.com/marcsalasg-code/sadr-training |
| **Branch** | `master` |
| **Commit SHA** | `00d155922172c0496d21ee1f86a8d632a955f457` |
| **Estado** | ✅ HEAD === origin/master, working tree clean |

---

## 2) Estructura del Proyecto

```
src/
├── views/
│   ├── Dashboard.tsx
│   ├── PlanningView.tsx
│   ├── CalendarView.tsx
│   ├── SessionBuilder.tsx
│   ├── LiveSession.tsx
│   ├── AthletesList.tsx
│   ├── AthleteDetail.tsx
│   ├── TemplatesView.tsx
│   ├── ExercisesView.tsx
│   ├── AnalyticsView.tsx (lazy)
│   ├── SettingsView.tsx
│   └── InternalLab.tsx (lazy)
│
├── components/
│   ├── dashboard/
│   │   ├── DayAgendaPanel.tsx
│   │   ├── WeeklyScheduleWidget.tsx
│   │   └── ...
│   ├── session/
│   ├── athletes/
│   ├── calendar/
│   ├── templates/
│   ├── layout/
│   ├── ui/
│   └── scheduling/ (empty)
│
├── store/
│   ├── store.ts
│   ├── sessionsSlice.ts
│   ├── athletesSlice.ts
│   └── ...
│
├── domain/
│   ├── sessions/
│   ├── athletes/
│   ├── exercises/
│   └── ...
│
└── ai/
    ├── AIEngine.ts
    ├── aiStore.ts
    └── ...
```

---

## 3) Rutas (src/App.tsx)

**Rutas directas:**
```tsx
<Route path="/" element={<Dashboard />} />
<Route path="/athletes" element={<AthletesList />} />
<Route path="/athletes/:id" element={<AthleteDetail />} />
<Route path="/planning" element={<PlanningView />} />
<Route path="/sessions/live/:id" element={<LiveSession />} />
<Route path="/analytics" element={<Suspense><AnalyticsView /></Suspense>} />
<Route path="/settings" element={<SettingsView />} />
```

**Redirects (compatibilidad):**
```tsx
/sessions    → /planning?tab=sessions
/templates   → /planning?tab=templates
/exercises   → /planning?tab=exercises
/calendar    → /planning?tab=calendar
/lab         → /settings?tab=advanced
```

---

## 4) Smoke Test Manual

| # | Ruta | Acción | Esperado |
|---|------|--------|----------|
| 1 | `/` | Abrir | Dashboard con stats y calendario semanal |
| 2 | `/planning` | Abrir | 4 tabs: Sesiones, Plantillas, Calendario, Ejercicios |
| 3 | `/planning?tab=sessions` | Click tab | SessionBuilder visible |
| 4 | `/planning?tab=calendar` | Click tab | Calendario mensual con sesiones |
| 5 | `/athletes` | Abrir | Lista de atletas |
| 6 | `/athletes/:id` | Click atleta | Detalle del atleta con historial |
| 7 | `/sessions/live/:id` | Iniciar sesión | LiveSession interactivo |

**Criterio de fallo**: Pantalla blanca, error rojo en consola, 404.

---

## 5) Archivos Clave — Permalinks

Base: `https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457`

| Archivo | Link |
|---------|------|
| App.tsx | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/src/App.tsx) |
| Dashboard.tsx | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/src/views/Dashboard.tsx) |
| PlanningView.tsx | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/src/views/PlanningView.tsx) |
| CalendarView.tsx | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/src/views/CalendarView.tsx) |
| SessionBuilder.tsx | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/src/views/SessionBuilder.tsx) |
| LiveSession.tsx | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/src/views/LiveSession.tsx) |
| DayAgendaPanel.tsx | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/src/components/dashboard/DayAgendaPanel.tsx) |
| WeeklyScheduleWidget.tsx | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/src/components/dashboard/WeeklyScheduleWidget.tsx) |
| store.ts | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/src/store/store.ts) |
| sessionsSlice.ts | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/src/store/sessionsSlice.ts) |
| CORE_FREEZE.md | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/docs/CORE_FREEZE.md) |
| ARCH_MAP.md | [blob](https://github.com/marcsalasg-code/sadr-training/blob/00d155922172c0496d21ee1f86a8d632a955f457/docs/ARCH_MAP.md) |

---

## 6) Diferencia entre Plan y Realidad

> **IMPORTANTE**: Los siguientes componentes NO EXISTEN en este repositorio:

| Componente planeado | Estado | Equivalente actual |
|---------------------|--------|--------------------|
| `SessionsLibrary.tsx` | ❌ No existe | `SessionBuilder.tsx` |
| `SlotPickerModal.tsx` | ❌ No existe | `DayAgendaPanel.tsx` |
| `components/scheduling/` | ⚠️ Carpeta vacía | Lógica en `dashboard/` |

**Conclusión**: Cualquier fase futura que mencione estos componentes debe tratarse como **trabajo nuevo a implementar**, no como archivos perdidos a restaurar.

---

## 7) Vercel

| Campo | Valor |
|-------|-------|
| **Production URL** | https://sadr-training.vercel.app |
| **Latest Deployment** | https://sadr-training-ihkmvxq9z-marcs-projects-4c8f55b9.vercel.app |
| **Deployment ID** | `dpl_3VwxprQt6V1k6gwXTtdqbUYoDmHF` |
| **Estado** | ✅ Ready (Production) |
| **Creado** | 2025-12-13 12:50:04 CET |
| **Branch** | master |

**Aliases:**
- https://sadr-training.vercel.app
- https://sadr-training-marcs-projects-4c8f55b9.vercel.app
- https://sadr-training-git-master-marcs-projects-4c8f55b9.vercel.app

---

## 8) Build & Lint

| Métrica | Resultado |
|---------|-----------|
| **Build** | ✅ PASS (2.59s, 315 modules) |
| **Bundle** | 650 KB main + 23 KB lazy |
| **Lint** | 226 errors, 5 warnings |

**Top errores lint** (todos en `src_backup_*/`):
1. `@typescript-eslint/no-unused-vars` — imports no usados
2. Fast refresh warnings
3. Variables asignadas pero no usadas

> Los errores están en carpeta `src_backup_*` que debería excluirse de lint.
