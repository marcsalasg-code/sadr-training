/**
 * Session Components
 * Componentes relacionados con la sesión de entrenamiento
 */

export { SetRow, type SetRowProps } from './SetRow';
export { AddExerciseModal, type AddExerciseModalProps } from './AddExerciseModal';
export { AISessionGeneratorModal } from './AISessionGeneratorModal';
export { AthleteSelector } from './AthleteSelector';
export { IntervalTimer, type IntervalResult } from './IntervalTimer';
export { FatiguePrompt, type FatiguePromptProps } from './FatiguePrompt';
export { SessionCard, type SessionCardProps, SESSION_STATUS_CONFIG } from './SessionCard';
export { SessionStructureEditor } from './SessionStructureEditor';

// Section Components (extracted from SessionBuilder)
export { TrainingPlanBanner } from './TrainingPlanBanner';
export { RecommendedTemplatesPanel } from './RecommendedTemplatesPanel';
export { SessionFilters } from './SessionFilters';
export { SessionsListByStatus } from './SessionsListByStatus';
export { SessionCreateModal } from './SessionCreateModal';

// Section Components (extracted from LiveSession)
export { LiveSessionHeader } from './LiveSessionHeader';
export { LiveSessionStats } from './LiveSessionStats';
export { ExerciseTabs } from './ExerciseTabs';

// State-based Session Views (Phase 1)
export { SessionNotStarted } from './SessionNotStarted';
export { SessionCompletedSummary } from './SessionCompletedSummary';
export { SessionTimeline, type SessionTimelineProps } from './SessionTimeline';

// Phase 2: Template/Session structure
export { TemplatePreview } from './TemplatePreview';
