/**
 * LoadSuggestion.tsx - Sugerencia de carga no intrusiva basada en 1RM
 * 
 * Muestra una recomendación discreta de peso basada en el rendimiento
 * del atleta, usando el Performance Engine.
 */

import React from 'react';
import type { Athlete } from '../../types/types';
import {
    generateLoadSuggestion,
    type PerformanceContext
} from '../../ai/performance/performanceEngine';
import { useAnchorConfig } from '../../store/store';
import { useExercises } from '../../store/store';

interface LoadSuggestionProps {
    exerciseId: string;
    athlete: Athlete;
    targetReps?: number;
    targetRPE?: number;
    show?: boolean;
}

export const LoadSuggestion: React.FC<LoadSuggestionProps> = ({
    exerciseId,
    athlete,
    targetReps = 5,
    targetRPE = 8,
    show = true,
}) => {
    const anchorConfig = useAnchorConfig();
    const exercises = useExercises();

    if (!show) return null;

    const context: PerformanceContext = {
        athlete,
        exercises,
        anchorConfig,
    };

    const suggestion = generateLoadSuggestion(
        exerciseId,
        targetReps,
        targetRPE,
        context
    );

    if (!suggestion || suggestion.weight <= 0) return null;

    // Determine color based on confidence
    const getConfidenceColor = () => {
        if (suggestion.confidence >= 0.8) return 'text-[var(--color-accent-gold)]';
        if (suggestion.confidence >= 0.5) return 'text-blue-400';
        return 'text-gray-400';
    };

    const getBadgeText = () => {
        if (suggestion.basedOn === 'direct') return 'Direct 1RM';
        if (suggestion.basedOn === 'reference') return 'Reference';
        return 'Estimated';
    };

    return (
        <div className="flex items-center gap-2 px-2 py-1 bg-[#1A1A1A]/60 rounded-lg border border-[#2A2A2A]">
            <span className="text-xs text-gray-500">💡</span>
            <span className={`text-sm font-medium ${getConfidenceColor()}`}>
                {suggestion.weight} kg
            </span>
            <span className="text-xs text-gray-500">
                × {suggestion.reps} @ RPE {suggestion.rpeTarget}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A2A2A] text-gray-500">
                {getBadgeText()}
            </span>
        </div>
    );
};

/**
 * Compact version for inline display
 */
export const LoadSuggestionCompact: React.FC<LoadSuggestionProps> = ({
    exerciseId,
    athlete,
    targetReps = 5,
    targetRPE = 8,
    show = true,
}) => {
    const anchorConfig = useAnchorConfig();
    const exercises = useExercises();

    if (!show) return null;

    const context: PerformanceContext = {
        athlete,
        exercises,
        anchorConfig,
    };

    const suggestion = generateLoadSuggestion(
        exerciseId,
        targetReps,
        targetRPE,
        context
    );

    if (!suggestion || suggestion.weight <= 0) return null;

    return (
        <span
            className="text-xs text-gray-500 italic"
            title={`Suggested: ${suggestion.weight}kg × ${suggestion.reps} @ RPE ${suggestion.rpeTarget} (${suggestion.basedOn})`}
        >
            💡 {suggestion.weight} kg
        </span>
    );
};

export default LoadSuggestion;
