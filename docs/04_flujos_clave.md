# Flujos de Datos Clave - SADR Training OS

## Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────┐
│                     VIEWS (React Components)                 │
│  AthleteDetail, SessionBuilder, LiveSession, AnalyticsView  │
└─────────────────────────┬───────────────────────────────────┘
                          │ uses
┌─────────────────────────▼───────────────────────────────────┐
│                     HOOKS (React Hooks)                      │
│  useLiveSession, useDashboardData, useAnalyticsData,        │
│  useCalendarView, useTrainingPlan                           │
└─────────────────────────┬───────────────────────────────────┘
                          │ imports
┌─────────────────────────▼───────────────────────────────────┐
│                    DOMAIN LAYER (Pure TS)                    │
│  sessions, athletes, exercises, templates, performance      │
└─────────────────────────┬───────────────────────────────────┘
                          │ uses
┌─────────────────────────▼───────────────────────────────────┐
│                    STORE (Zustand)                          │
│  trainingStore.ts, aiStore.ts                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo 1: Live Session

```mermaid
sequenceDiagram
    participant V as LiveSession View
    participant H as useLiveSession
    participant D as Domain Layer
    participant S as Store

    V->>H: useEffect(sessionId)
    H->>S: getSession(id)
    S-->>H: session data
    H->>D: calculateSessionTotals(session)
    D-->>H: totals (volume, sets, reps)
    H->>D: getSessionProgress(session)
    D-->>H: progress %
    H-->>V: liveStats, handlers
    V->>V: Render UI
```

---

## Flujo 2: Dashboard Stats

```mermaid
sequenceDiagram
    participant V as Dashboard
    participant H as useDashboardData
    participant D as Domain Layer
    participant S as Store

    V->>H: useDashboardData()
    H->>S: useSessions(), useAthletes()
    S-->>H: all data
    H->>D: getCompletedSessions(sessions)
    D-->>H: completed sessions
    H->>D: sortSessionsByDate(sessions)
    D-->>H: sorted list
    H-->>V: stats, recentSessions
```

---

## Flujo 3: Analytics Filtering

```mermaid
sequenceDiagram
    participant V as AnalyticsView
    participant H as useAnalyticsData
    participant D as Domain Layer

    V->>H: setTimeRange('month')
    H->>D: getCompletedSessions(all)
    D-->>H: completed
    H->>D: filterSessionsByAthlete(completed, id)
    D-->>H: athlete sessions
    H->>D: filterSessionsByDateRange(sessions, cutoff)
    D-->>H: filtered sessions
    H-->>V: filteredSessions, metrics
```

---

## Domain Functions Reference

| Function | Module | Purpose |
|----------|--------|---------|
| `calculateSessionTotals` | sessions | Volume, sets, reps totals |
| `getSessionProgress` | sessions | Completion % |
| `getCompletedSessions` | sessions | Filter by status |
| `sortSessionsByDate` | sessions | Sort newest first |
| `filterSessionsByAthlete` | sessions | Filter by athlete ID |
| `filterSessionsByDateRange` | sessions | Filter by date |
| `calculateVolumeLoad` | performance | weight × reps × sets |
| `classifyLoad` | performance | light/moderate/heavy/max |
