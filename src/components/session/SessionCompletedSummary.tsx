/**
 * SessionCompletedSummary - Post-session summary view
 * 
 * Shows workout results: volume, sets, duration, stats.
 * Displayed when session.status === 'completed'
 */

import {
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraSection,
    AuraGrid,
    AuraMetric,
} from '../ui/aura';
import { formatVolume } from '../../core/analysis/metrics';
import type { WorkoutSession, Exercise, Athlete } from '../../types/types';

// ============================================
// TYPES
// ============================================

interface SessionCompletedSummaryProps {
    session: WorkoutSession;
    athlete?: Athlete;
    exercisesMap: Map<string, Exercise>;
    onBackToDashboard: () => void;
    onViewCalendar: () => void;
    onViewDetails?: () => void;
}

// ============================================
// HELPERS
// ============================================

function calculateSessionStats(session: WorkoutSession) {
    let totalVolume = 0;
    let completedSets = 0;
    let totalSets = 0;
    let totalRPE = 0;
    let rpeCount = 0;

    session.exercises.forEach(ex => {
        ex.sets.forEach(set => {
            totalSets++;
            if (set.isCompleted) {
                completedSets++;
                const weight = set.actualWeight || set.targetWeight || 0;
                const reps = set.actualReps || set.targetReps || 0;
                totalVolume += weight * reps;

                if (set.rpe) {
                    totalRPE += set.rpe;
                    rpeCount++;
                }
            }
        });
    });

    const avgRPE = rpeCount > 0 ? totalRPE / rpeCount : null;

    // Calculate duration
    let duration = 0;
    if (session.completedAt && session.createdAt) {
        const start = new Date(session.createdAt).getTime();
        const end = new Date(session.completedAt).getTime();
        duration = Math.round((end - start) / 60000); // minutes
    }

    return {
        totalVolume,
        completedSets,
        totalSets,
        completionRate: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
        avgRPE,
        duration,
    };
}

// ============================================
// COMPONENT
// ============================================

export function SessionCompletedSummary({
    session,
    athlete,
    exercisesMap,
    onBackToDashboard,
    onViewCalendar,
    onViewDetails,
}: SessionCompletedSummaryProps) {
    const stats = calculateSessionStats(session);

    // Find best set (highest volume single set)
    type BestSetInfo = { exerciseName: string; weight: number; reps: number };
    const bestSetResult = session.exercises.reduce<{ best: BestSetInfo | null; maxVolume: number }>(
        (acc, ex) => {
            const exercise = exercisesMap.get(ex.exerciseId);
            ex.sets.forEach(set => {
                if (set.isCompleted) {
                    const weight = set.actualWeight || 0;
                    const reps = set.actualReps || 0;
                    const volume = weight * reps;
                    if (volume > acc.maxVolume) {
                        acc.maxVolume = volume;
                        acc.best = {
                            exerciseName: exercise?.name || 'Unknown',
                            weight,
                            reps,
                        };
                    }
                }
            });
            return acc;
        },
        { best: null, maxVolume: 0 }
    );
    const bestSet = bestSetResult.best;

    return (
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
            {/* Success Header */}
            <AuraPanel variant="accent" corners>
                <div className="text-center py-4">
                    <div className="text-4xl mb-3">🎉</div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Session Complete!
                    </h1>
                    <p className="text-gray-400">
                        {session.name}
                        {athlete && ` • ${athlete.name}`}
                    </p>
                    {session.completedAt && (
                        <p className="text-xs text-gray-500 mt-2 font-mono">
                            Completed: {new Date(session.completedAt).toLocaleString()}
                        </p>
                    )}
                </div>
            </AuraPanel>

            {/* Main Stats */}
            <AuraGrid cols={4} gap="md">
                <AuraMetric
                    label="Total Volume"
                    value={formatVolume(stats.totalVolume)}
                />
                <AuraMetric
                    label="Sets Completed"
                    value={`${stats.completedSets}/${stats.totalSets}`}
                    trend={stats.completionRate === 100 ? { value: 100, isPositive: true } : undefined}
                />
                <AuraMetric
                    label="Duration"
                    value={stats.duration > 0 ? `${stats.duration} min` : '--'}
                />
                <AuraMetric
                    label="Avg RPE"
                    value={stats.avgRPE ? stats.avgRPE.toFixed(1) : '--'}
                />
            </AuraGrid>

            {/* Highlights */}
            {bestSet && (
                <AuraPanel
                    header={<span className="text-sm text-white">💪 Best Set</span>}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">{bestSet.exerciseName}</p>
                            <p className="text-sm text-gray-400">
                                {bestSet.weight} kg × {bestSet.reps} reps
                            </p>
                        </div>
                        <AuraBadge variant="gold">
                            {Math.round(bestSet.weight * bestSet.reps)} kg volume
                        </AuraBadge>
                    </div>
                </AuraPanel>
            )}

            {/* Exercise Summary */}
            <AuraSection
                title="Exercise Summary"
                subtitle={`${session.exercises.length} exercises performed`}
            >
                <div className="space-y-2">
                    {session.exercises.map((ex, idx) => {
                        const exercise = exercisesMap.get(ex.exerciseId);
                        const completedSets = ex.sets.filter(s => s.isCompleted).length;
                        const totalExSets = ex.sets.length;
                        const isComplete = completedSets === totalExSets;

                        // Calculate exercise volume
                        const exVolume = ex.sets
                            .filter(s => s.isCompleted)
                            .reduce((sum, s) => {
                                const w = s.actualWeight || s.targetWeight || 0;
                                const r = s.actualReps || s.targetReps || 0;
                                return sum + (w * r);
                            }, 0);

                        return (
                            <div
                                key={ex.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${isComplete
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : 'bg-[#141414] border-[#2A2A2A]'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-lg ${isComplete ? 'text-green-400' : 'text-gray-500'}`}>
                                        {isComplete ? '✓' : '○'}
                                    </span>
                                    <div>
                                        <p className="text-white font-medium">
                                            {exercise?.name || 'Unknown Exercise'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {completedSets}/{totalExSets} sets • {formatVolume(exVolume)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </AuraSection>

            {/* Session Notes */}
            {session.notes && (
                <AuraPanel
                    header={<span className="text-sm text-white">📝 Notes</span>}
                >
                    <p className="text-sm text-gray-300">{session.notes}</p>
                </AuraPanel>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <AuraButton variant="gold" fullWidth onClick={onBackToDashboard}>
                    ← Back to Dashboard
                </AuraButton>
                <AuraButton variant="secondary" fullWidth onClick={onViewCalendar}>
                    View Calendar
                </AuraButton>
                {onViewDetails && (
                    <AuraButton variant="ghost" onClick={onViewDetails}>
                        View Details
                    </AuraButton>
                )}
            </div>
        </div>
    );
}

export default SessionCompletedSummary;
