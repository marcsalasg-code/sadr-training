# Hooks Refactor Documentation

**Status:** IN PROGRESS

---

## Phase 3 Progress: View Refactoring

### AthleteDetail.tsx - Components Created

| Component | Location | Purpose |
|-----------|----------|---------|
| `AthleteHeader` | `components/athletes/AthleteHeader.tsx` | Avatar, badges, action buttons |
| `AthleteQuickActions` | `components/athletes/AthleteQuickActions.tsx` | Quick action panel |
| `AthletePlanSummary` | `components/athletes/AthletePlanSummary.tsx` | Active plan summary |
| `AthletePhysicalData` | `components/athletes/AthletePhysicalData.tsx` | Height, weight, BMI, level |
| `AthleteStatsGrid` | `components/athletes/AthleteStatsGrid.tsx` | 4-column stats grid |
| `AthleteChartsRow` | `components/athletes/AthleteChartsRow.tsx` | Volume/Sessions charts |
| `AthleteInfoTab` | `components/athletes/AthleteInfoTab.tsx` | Contact, goals, custom fields |
| `AthleteSessionsTab` | `components/athletes/AthleteSessionsTab.tsx` | Sessions list tab |
| `AthleteEditModal` | `components/athletes/AthleteEditModal.tsx` | Edit form modal |

### Status
- ✅ Components created
- ✅ Import paths fixed
- ✅ TypeScript compiles
- ⏳ AthleteDetail.tsx not yet refactored to use new components

---

## Next Steps

### Immediate (to complete AthleteDetail refactor)
1. Rewrite `AthleteDetail.tsx` to use extracted components
2. Reduce from 740 lines to ~250 lines

### Subsequent Views (Phase 3 continuation)
- SessionBuilder.tsx (560 → ~250)
- LiveSession.tsx (538 → ~250)
- AnalyticsView.tsx (522 → ~250)
- TemplatesView.tsx (468 → ~250)

### Phase 4: Hook Refactoring
- useLiveSession (455 lines)
- useCalendarView (365 lines)
- useAnalyticsData (271 lines)
- useDashboardData (279 lines)

### Phase 5: AI Reorganization
- performanceEngine.ts split
- Domain types for AI

### Phase 6: Flow Documentation
- Plan → Sessions flow
- LiveSession workflow
- AI generation flow
- Analytics flow
