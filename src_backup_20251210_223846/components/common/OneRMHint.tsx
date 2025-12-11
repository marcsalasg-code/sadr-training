/**
 * OneRMHint - Componente de ayuda visual discreta para 1RM
 * 
 * Muestra indicaciones de 1RM (propio o de referencia) de forma minimalista.
 * Diseñado para no saturar la UI pero proporcionar contexto útil.
 */

import { useMemo } from 'react';
import { useExercises, useAnchorConfig } from '../../store/store';
import {
    getOneRMReferenceContext,
    calculateRelativeLoad,
    getLoadSuggestionText,
} from '../../utils/oneRMReference';
import type { Athlete } from '../../types/types';

interface OneRMHintProps {
    exerciseId: string;
    athlete: Athlete;
    targetReps?: number;        // Para mostrar sugerencia de carga
    compact?: boolean;          // Versión más pequeña
    showLoadSuggestion?: boolean; // Mostrar sugerencia de % carga
    className?: string;
}

/**
 * Chip discreto mostrando 1RM o referencia
 */
export function OneRMHint({
    exerciseId,
    athlete,
    targetReps,
    compact = false,
    showLoadSuggestion = false,
    className = '',
}: OneRMHintProps) {
    const exercises = useExercises();
    const anchorConfig = useAnchorConfig();

    const context = useMemo(() => {
        return getOneRMReferenceContext(exerciseId, exercises, athlete, anchorConfig);
    }, [exerciseId, exercises, athlete, anchorConfig]);

    // Si no hay referencia, no mostrar nada
    if (!context.hasReference || !context.oneRM) {
        return null;
    }

    const isReference = context.referenceType !== 'own';

    // Texto de sugerencia de carga
    const loadSuggestion = showLoadSuggestion && targetReps && context.oneRM
        ? getLoadSuggestionText(context.oneRM, targetReps, isReference)
        : null;

    if (compact) {
        // Versión ultra compacta: solo valor
        return (
            <span
                className={`text-xs font-mono ${isReference
                        ? 'text-gray-400'
                        : 'text-[var(--color-accent-gold)]'
                    } ${className}`}
                title={context.displayText}
            >
                {isReference ? '↗' : ''}{context.oneRM}kg
            </span>
        );
    }

    return (
        <div className={`inline-flex items-center gap-1 ${className}`}>
            {/* Badge principal */}
            <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${isReference
                        ? 'bg-gray-800 text-gray-300 border border-gray-700'
                        : 'bg-[var(--color-accent-gold)]/15 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/30'
                    }`}
                title={context.displayText}
            >
                {isReference && (
                    <span className="text-gray-500">↗</span>
                )}
                <span className="font-mono">{context.oneRM}kg</span>
                {isReference && context.sourceExercise && (
                    <span className="text-gray-500 text-[10px]">
                        ({context.sourceExercise.name.substring(0, 8)}...)
                    </span>
                )}
            </span>

            {/* Sugerencia de carga */}
            {loadSuggestion && (
                <span className="text-[10px] text-gray-500">
                    {loadSuggestion}
                </span>
            )}
        </div>
    );
}

/**
 * Versión tooltip/hover para mostrar más detalle
 */
interface OneRMTooltipProps {
    exerciseId: string;
    athlete: Athlete;
    targetReps?: number;
}

export function OneRMTooltipContent({ exerciseId, athlete, targetReps }: OneRMTooltipProps) {
    const exercises = useExercises();
    const anchorConfig = useAnchorConfig();

    const context = useMemo(() => {
        return getOneRMReferenceContext(exerciseId, exercises, athlete, anchorConfig);
    }, [exerciseId, exercises, athlete, anchorConfig]);

    if (!context.hasReference || !context.oneRM) {
        return <p className="text-xs text-gray-500">Sin datos de 1RM</p>;
    }

    const isReference = context.referenceType !== 'own';

    // Tabla de porcentajes
    const percentages = [100, 90, 85, 80, 75, 70];

    return (
        <div className="space-y-2 min-w-[180px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                    {isReference ? 'Referencia 1RM' : '1RM'}
                </span>
                <span className="font-mono text-sm text-[var(--color-accent-gold)]">
                    {context.oneRM}kg
                </span>
            </div>

            {/* Fuente si es referencia */}
            {isReference && context.sourceExercise && (
                <p className="text-[10px] text-gray-500">
                    Basado en: {context.sourceExercise.name}
                </p>
            )}

            {/* Tabla de % */}
            <div className="border-t border-[#2A2A2A] pt-2">
                <p className="text-[10px] text-gray-500 mb-1">Cargas aproximadas:</p>
                <div className="grid grid-cols-3 gap-1 text-xs">
                    {percentages.map(pct => (
                        <div key={pct} className="text-center">
                            <span className="text-gray-500">{pct}%</span>
                            <span className="block font-mono text-gray-300">
                                {calculateRelativeLoad(context.oneRM!, pct)}kg
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sugerencia para reps objetivo */}
            {targetReps && (
                <div className="border-t border-[#2A2A2A] pt-2">
                    <p className="text-[10px] text-gray-500">
                        Para {targetReps} reps: {getLoadSuggestionText(context.oneRM, targetReps, isReference)}
                    </p>
                </div>
            )}
        </div>
    );
}

/**
 * Icono info con tooltip que muestra OneRMTooltipContent
 */
export function OneRMInfoIcon({
    exerciseId,
    athlete,
    targetReps,
}: OneRMTooltipProps) {
    const exercises = useExercises();
    const anchorConfig = useAnchorConfig();

    const context = useMemo(() => {
        return getOneRMReferenceContext(exerciseId, exercises, athlete, anchorConfig);
    }, [exerciseId, exercises, athlete, anchorConfig]);

    if (!context.hasReference) {
        return null;
    }

    return (
        <div className="relative group">
            <button
                className="w-5 h-5 rounded-full bg-[#2A2A2A] text-gray-500 text-xs hover:bg-[#333] hover:text-gray-300 transition-colors"
                title="Info 1RM"
            >
                ℹ
            </button>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 shadow-xl">
                    <OneRMTooltipContent
                        exerciseId={exerciseId}
                        athlete={athlete}
                        targetReps={targetReps}
                    />
                </div>
            </div>
        </div>
    );
}

export default OneRMHint;
