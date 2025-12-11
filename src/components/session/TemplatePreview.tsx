/**
 * TemplatePreview - Shows template structure preview
 * 
 * Used in SessionCreateModal to preview the exercises/blocks
 * before creating a session from a template.
 */

import {
    AuraBadge,
} from '../ui/aura';
import type { WorkoutTemplate, Exercise } from '../../types/types';
import type { SessionBlockConfig } from '../../core/sessions/sessionStructure.model';

// ============================================
// TYPES
// ============================================

interface TemplatePreviewProps {
    template: WorkoutTemplate;
    exercisesMap: Map<string, Exercise>;
    compact?: boolean;
}

// ============================================
// BLOCK ICONS
// ============================================

const BLOCK_CONFIG: Record<string, { icon: string; label: string }> = {
    warmup: { icon: '🔥', label: 'Warm-up' },
    main: { icon: '💪', label: 'Main' },
    accessory: { icon: '🎯', label: 'Accessories' },
    cooldown: { icon: '❄️', label: 'Cool-down' },
    linear: { icon: '📋', label: 'Exercises' },
    movilidad_calentamiento: { icon: '🔥', label: 'Movilidad' },
    fuerza: { icon: '💪', label: 'Fuerza' },
    tecnica_especifica: { icon: '🎯', label: 'Técnica' },
    emom_hiit: { icon: '⚡', label: 'EMOM/HIIT' },
    emom: { icon: '⚡', label: 'EMOM' },
    amrap: { icon: '🔄', label: 'AMRAP' },
    circuit: { icon: '🔁', label: 'Circuit' },
};

// ============================================
// COMPONENT
// ============================================

export function TemplatePreview({
    template,
    exercisesMap,
    compact = false,
}: TemplatePreviewProps) {
    const totalSets = template.exercises.reduce((sum, ex) => sum + (ex.defaultSets || 3), 0);
    const totalExercises = template.exercises.length;

    // Check if template uses blocks
    const hasBlocks = template.structure?.blocks && template.structure.blocks.length > 0;

    return (
        <div className="space-y-3">
            {/* Header Stats */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-[#0D0D0D] rounded">
                <span className="text-xs text-gray-400">
                    📋 {template.name}
                </span>
                <div className="flex gap-2 text-[10px] text-gray-500">
                    <span>{totalExercises} exercises</span>
                    <span>•</span>
                    <span>{totalSets} sets</span>
                    {template.estimatedDuration && (
                        <>
                            <span>•</span>
                            <span>~{template.estimatedDuration} min</span>
                        </>
                    )}
                </div>
            </div>

            {/* Exercise List */}
            {hasBlocks ? (
                // Grouped by blocks
                <div className="space-y-2">
                    {template.structure!.blocks
                        .sort((a, b) => a.order - b.order)
                        .map((block: SessionBlockConfig) => {
                            // Find exercises with matching blockId
                            const blockExercises = template.exercises.filter(ex =>
                                (ex as { blockId?: string }).blockId === block.id ||
                                // Fallback: check blockType
                                (ex as { blockType?: string }).blockType === block.type
                            );

                            if (blockExercises.length === 0) return null;

                            const config = BLOCK_CONFIG[block.type] || { icon: '📋', label: block.title };

                            return (
                                <div key={block.id} className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 px-1">
                                        <span>{config.icon}</span>
                                        <span>{block.title || config.label}</span>
                                    </div>
                                    <div className="pl-4 space-y-1">
                                        {blockExercises.map((ex, idx) => {
                                            const exercise = exercisesMap.get(ex.exerciseId);
                                            return (
                                                <ExercisePreviewRow
                                                    key={ex.id}
                                                    index={idx + 1}
                                                    name={exercise?.name || 'Unknown'}
                                                    sets={ex.defaultSets || 3}
                                                    reps={ex.defaultReps}
                                                    compact={compact}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            ) : (
                // Flat list
                <div className="space-y-1">
                    {template.exercises.map((ex, idx) => {
                        const exercise = exercisesMap.get(ex.exerciseId);
                        return (
                            <ExercisePreviewRow
                                key={ex.id}
                                index={idx + 1}
                                name={exercise?.name || 'Unknown'}
                                sets={ex.defaultSets || 3}
                                reps={ex.defaultReps}
                                compact={compact}
                            />
                        );
                    })}
                </div>
            )}

            {/* Difficulty badge */}
            {template.difficulty && (
                <div className="flex justify-end pt-2">
                    <AuraBadge variant={
                        template.difficulty === 'beginner' ? 'success' :
                            template.difficulty === 'intermediate' ? 'gold' : 'error'
                    } size="sm">
                        {template.difficulty}
                    </AuraBadge>
                </div>
            )}
        </div>
    );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ExercisePreviewRowProps {
    index: number;
    name: string;
    sets: number;
    reps?: number;
    compact?: boolean;
}

function ExercisePreviewRow({ index, name, sets, reps, compact }: ExercisePreviewRowProps) {
    return (
        <div className={`
            flex items-center gap-2 p-2 bg-[#141414] rounded border border-[#222]
            ${compact ? 'py-1' : ''}
        `}>
            <span className="text-[10px] font-mono text-gray-500 w-5">{index}.</span>
            <span className={`flex-1 text-gray-300 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                {name}
            </span>
            <span className="text-[10px] text-gray-500">
                {sets}{reps ? ` × ${reps}` : ' sets'}
            </span>
        </div>
    );
}

export default TemplatePreview;
