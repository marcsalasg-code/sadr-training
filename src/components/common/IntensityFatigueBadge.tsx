/**
 * IntensityFatigueBadge - Shows intensity/fatigue metrics for an exercise
 * 
 * PHASE 3: Visual indicator component
 * 
 * Displays:
 * - Target intensity (gray) if not started
 * - Actual intensity + fatigue (colored) when completed
 */

import { AuraBadge } from '../ui/aura';
import {
    getExerciseIntensityFatigue,
    getIntensityLabel,
    getIntensityColor,
} from '../../domain/performance/metrics';
import type { ExerciseEntry } from '../../types/types';

// ============================================
// TYPES
// ============================================

interface IntensityFatigueBadgeProps {
    exercise: ExerciseEntry;
    compact?: boolean;
    showFatigue?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function IntensityFatigueBadge({
    exercise,
    compact = false,
    showFatigue = false,
}: IntensityFatigueBadgeProps) {
    const metrics = getExerciseIntensityFatigue(exercise);

    // No sets completed yet - show target if available
    if (metrics.completedSets === 0) {
        if (metrics.targetIntensity !== null) {
            return (
                <span className="text-[10px] text-gray-500" title="Target intensity">
                    🎯 Int: {metrics.targetIntensity.toFixed(0)}
                </span>
            );
        }
        return null; // No data to show
    }

    // Sets completed - show actual metrics
    const intensityColor = getIntensityColor(metrics.avgIntensity);
    const intensityLabel = compact ? '' : ` (${getIntensityLabel(metrics.avgIntensity)})`;

    if (showFatigue) {
        return (
            <div className="flex items-center gap-1">
                <span
                    className={`text-[10px] ${intensityColor}`}
                    title={`Average intensity: ${metrics.avgIntensity.toFixed(1)}/10`}
                >
                    ⚡{metrics.avgIntensity.toFixed(1)}{intensityLabel}
                </span>
                <span className="text-[10px] text-gray-500">·</span>
                <span
                    className="text-[10px] text-gray-400"
                    title={`Fatigue score: ${metrics.avgFatigue.toFixed(1)}`}
                >
                    💪{metrics.avgFatigue.toFixed(1)}
                </span>
            </div>
        );
    }

    return (
        <span
            className={`text-[10px] ${intensityColor}`}
            title={`Average intensity: ${metrics.avgIntensity.toFixed(1)}/10\n${metrics.completedSets} sets completed`}
        >
            ⚡{metrics.avgIntensity.toFixed(1)}{intensityLabel}
        </span>
    );
}

// ============================================
// SESSION-LEVEL BADGE
// ============================================

interface SessionIntensityBadgeProps {
    avgIntensity: number | null;
    avgFatigue?: number | null;
    compact?: boolean;
}

export function SessionIntensityBadge({
    avgIntensity,
    avgFatigue,
    compact = false,
}: SessionIntensityBadgeProps) {
    if (avgIntensity === null || avgIntensity === 0) {
        return null;
    }

    const intensityColor = getIntensityColor(avgIntensity);

    return (
        <div className="flex items-center gap-1">
            <span
                className={`text-[10px] ${intensityColor}`}
                title={`Session intensity: ${avgIntensity.toFixed(1)}/10`}
            >
                ⚡{avgIntensity.toFixed(1)}
            </span>
            {avgFatigue !== null && avgFatigue !== undefined && !compact && (
                <>
                    <span className="text-[10px] text-gray-500">·</span>
                    <span
                        className="text-[10px] text-gray-400"
                        title={`Session fatigue: ${avgFatigue.toFixed(1)}`}
                    >
                        💪{avgFatigue.toFixed(1)}
                    </span>
                </>
            )}
        </div>
    );
}

export default IntensityFatigueBadge;
