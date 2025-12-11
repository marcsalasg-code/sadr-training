/**
 * Athletes Components - Barrel export
 */

// Charts
export {
    WeeklyVolumeChart,
    MonthlySessionsChart,
    IntensityFatigueTrend,
    type WeeklyVolumeData,
    type MonthlySessionsData,
    type IntensityFatigueData,
} from './AthleteCharts';

// Session Row
export {
    AthleteSessionRow,
    InfoRow,
    SESSION_STATUS_COLORS,
    SESSION_STATUS_LABELS,
    type SessionRowProps,
    type InfoRowProps,
} from './AthleteSessionRow';

// Section Components (extracted from AthleteDetail)
export { AthleteHeader } from './AthleteHeader';
export { AthleteQuickActions } from './AthleteQuickActions';
export { AthletePlanSummary } from './AthletePlanSummary';
export { AthletePhysicalData } from './AthletePhysicalData';
export { AthleteStatsGrid } from './AthleteStatsGrid';
export { AthleteChartsRow } from './AthleteChartsRow';
export { AthleteInfoTab } from './AthleteInfoTab';
export { AthleteSessionsTab } from './AthleteSessionsTab';
export { AthleteEditModal } from './AthleteEditModal';
