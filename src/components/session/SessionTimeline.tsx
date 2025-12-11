/**
 * SessionTimeline - Visual exercise navigation for sessions
 * 
 * PHASE 1: Flat list with status indicators
 * PHASE 2: Block grouping support (warmup, main, accessories)
 * 
 * Used in:
 * - LiveSession: Navigate between exercises during workout
 * - SessionBuilder: View/edit session structure (future)
 */

import { useMemo } from 'react';
import {
    AuraBadge,
} from '../ui/aura';
import type { ExerciseEntry, Exercise } from '../../types/types';
import type { SessionStructure, SessionBlockConfig } from '../../core/sessions/sessionStructure.model';
import { IntensityFatigueBadge } from '../common/IntensityFatigueBadge';

// ============================================
// TYPES
// ============================================

// Re-export for convenience
export type SessionBlock = SessionBlockConfig;

export interface SessionTimelineProps {
    exercises: ExerciseEntry[];
    /** Optional block structure for grouping */
    blocks?: SessionBlock[];
    /** Alternative: SessionStructure from workout session */
    structure?: SessionStructure;
    activeExerciseId?: string;
    onSelectExercise?: (exerciseId: string, index: number) => void;
    exercisesMap: Map<string, Exercise>;
    compact?: boolean;
    /** Enable edit mode (for SessionBuilder) */
    editable?: boolean;
    /** Callback for reordering */
    onReorderExercise?: (fromIdx: number, toIdx: number) => void;
}

// ============================================
// BLOCK ICONS & LABELS
// ============================================

const BLOCK_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
    warmup: { icon: '🔥', label: 'Warm-up', color: 'text-orange-400' },
    main: { icon: '💪', label: 'Main', color: 'text-blue-400' },
    accessory: { icon: '🎯', label: 'Accessories', color: 'text-purple-400' },
    cooldown: { icon: '❄️', label: 'Cool-down', color: 'text-cyan-400' },
    default: { icon: '📋', label: 'Exercises', color: 'text-gray-400' },
};

// ============================================
// SUB-COMPONENTS
// ============================================

interface ExerciseRowProps {
    exercise: ExerciseEntry;
    exerciseInfo?: Exercise;
    index: number;
    isActive: boolean;
    compact: boolean;
    onSelect?: () => void;
    showIntensity?: boolean;  // PHASE 3: Show intensity/fatigue badge
}

function ExerciseRow({ exercise, exerciseInfo, index, isActive, compact, onSelect, showIntensity = true }: ExerciseRowProps) {
    const completedSets = exercise.sets.filter(s => s.isCompleted).length;
    const totalSets = exercise.sets.length;
    const isComplete = completedSets === totalSets && totalSets > 0;
    const isStarted = completedSets > 0;
    const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

    return (
        <button
            onClick={onSelect}
            className={`
                w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left
                ${isActive
                    ? 'bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30'
                    : 'bg-[#141414] border border-transparent hover:border-[#333]'
                }
                ${onSelect ? 'cursor-pointer' : 'cursor-default'}
            `}
        >
            {/* Status Indicator */}
            <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                ${isComplete
                    ? 'bg-green-500/20 text-green-400'
                    : isActive
                        ? 'bg-[var(--color-accent-gold)] text-black'
                        : isStarted
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-[#222] text-gray-500'
                }
            `}>
                {isComplete ? '✓' : index + 1}
            </div>

            {/* Exercise Info */}
            <div className="flex-1 min-w-0">
                <p className={`truncate ${compact ? 'text-xs' : 'text-sm'} ${isActive ? 'text-white font-medium' : 'text-gray-300'}`}>
                    {exerciseInfo?.name || 'Unknown Exercise'}
                </p>

                {/* Progress Bar */}
                {!compact && (
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-[#222] rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${isComplete ? 'bg-green-500' : 'bg-[var(--color-accent-gold)]'}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">
                            {completedSets}/{totalSets}
                        </span>
                    </div>
                )}

                {/* PHASE 3: Intensity/Fatigue Badge */}
                {showIntensity && !compact && (
                    <div className="mt-1">
                        <IntensityFatigueBadge exercise={exercise} compact showFatigue />
                    </div>
                )}
            </div>

            {/* Active Indicator */}
            {isActive && (
                <div className="flex-shrink-0">
                    <AuraBadge variant="gold" size="sm">Active</AuraBadge>
                </div>
            )}
        </button>
    );
}

interface BlockSectionProps {
    block: SessionBlock;
    exercises: ExerciseEntry[];
    exercisesMap: Map<string, Exercise>;
    activeExerciseId?: string;
    onSelectExercise?: (exerciseId: string, index: number) => void;
    getGlobalIndex: (exerciseId: string) => number;
    compact: boolean;
    defaultExpanded?: boolean;
}

function BlockSection({
    block,
    exercises,
    exercisesMap,
    activeExerciseId,
    onSelectExercise,
    getGlobalIndex,
    compact,
    defaultExpanded = true,
}: BlockSectionProps) {
    const config = BLOCK_CONFIG[block.type] || BLOCK_CONFIG.default;
    const completedCount = exercises.filter(ex =>
        ex.sets.every(s => s.isCompleted) && ex.sets.length > 0
    ).length;
    const hasActive = exercises.some(ex => ex.id === activeExerciseId);

    return (
        <div className="space-y-1">
            {/* Block Header */}
            <div className={`
                flex items-center justify-between px-2 py-1.5 rounded
                ${hasActive ? 'bg-[var(--color-accent-gold)]/5' : 'bg-[#0D0D0D]'}
            `}>
                <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span className={`text-xs font-medium ${config.color}`}>
                        {(block as SessionBlockConfig).title || config.label}
                    </span>
                </div>
                <span className="text-[10px] text-gray-500">
                    {completedCount}/{exercises.length}
                </span>
            </div>

            {/* Block Exercises */}
            <div className="pl-3 space-y-1 border-l border-[#222] ml-2">
                {exercises.map(ex => {
                    const globalIdx = getGlobalIndex(ex.id);
                    return (
                        <ExerciseRow
                            key={ex.id}
                            exercise={ex}
                            exerciseInfo={exercisesMap.get(ex.exerciseId)}
                            index={globalIdx}
                            isActive={ex.id === activeExerciseId}
                            compact={compact}
                            onSelect={() => onSelectExercise?.(ex.id, globalIdx)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SessionTimeline({
    exercises,
    blocks,
    structure,
    activeExerciseId,
    onSelectExercise,
    exercisesMap,
    compact = false,
    editable = false,
}: SessionTimelineProps) {
    // Merge blocks from props or structure
    const effectiveBlocks = useMemo((): SessionBlock[] => {
        if (blocks && blocks.length > 0) return blocks as SessionBlock[];
        if (structure?.blocks && structure.blocks.length > 0) {
            return structure.blocks.map((b: SessionBlockConfig): SessionBlock => ({
                ...b,
            }));
        }
        return [];
    }, [blocks, structure]);

    // Group exercises by blockId
    const groupedExercises = useMemo(() => {
        if (effectiveBlocks.length === 0) {
            return null; // No grouping, use flat list
        }

        const groups = new Map<string, ExerciseEntry[]>();
        const ungrouped: ExerciseEntry[] = [];

        for (const block of effectiveBlocks) {
            groups.set(block.id, []);
        }

        for (const ex of exercises) {
            if (ex.blockId && groups.has(ex.blockId)) {
                groups.get(ex.blockId)!.push(ex);
            } else {
                ungrouped.push(ex);
            }
        }

        return { groups, ungrouped };
    }, [exercises, effectiveBlocks]);

    // Get global index for an exercise
    const getGlobalIndex = (exerciseId: string): number => {
        return exercises.findIndex(ex => ex.id === exerciseId);
    };

    // Calculate totals
    const completedExercises = exercises.filter(ex =>
        ex.sets.every(s => s.isCompleted) && ex.sets.length > 0
    ).length;

    if (exercises.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 text-sm">
                No exercises in this session
            </div>
        );
    }

    return (
        <div className={`space-y-2 ${compact ? 'text-xs' : ''}`}>
            {/* Timeline Header */}
            <div className="flex items-center justify-between px-2 pb-2 border-b border-[#222]">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                    {groupedExercises ? 'Session Structure' : 'Exercise Timeline'}
                </span>
                <span className="text-[10px] text-gray-500">
                    {completedExercises}/{exercises.length} done
                </span>
            </div>

            {/* Grouped View (with blocks) */}
            {groupedExercises ? (
                <div className="space-y-3">
                    {[...effectiveBlocks]
                        .sort((a: SessionBlock, b: SessionBlock) => a.order - b.order)
                        .map(block => {
                            const blockExercises = groupedExercises.groups.get(block.id) || [];
                            if (blockExercises.length === 0) return null;

                            return (
                                <BlockSection
                                    key={block.id}
                                    block={block}
                                    exercises={blockExercises}
                                    exercisesMap={exercisesMap}
                                    activeExerciseId={activeExerciseId}
                                    onSelectExercise={onSelectExercise}
                                    getGlobalIndex={getGlobalIndex}
                                    compact={compact}
                                />
                            );
                        })}

                    {/* Ungrouped exercises */}
                    {groupedExercises.ungrouped.length > 0 && (
                        <BlockSection
                            block={{ id: 'ungrouped', title: 'Other', type: 'linear', order: 999 } as SessionBlock}
                            exercises={groupedExercises.ungrouped}
                            exercisesMap={exercisesMap}
                            activeExerciseId={activeExerciseId}
                            onSelectExercise={onSelectExercise}
                            getGlobalIndex={getGlobalIndex}
                            compact={compact}
                        />
                    )}
                </div>
            ) : (
                /* Flat View (no blocks) */
                <div className="space-y-1 py-1">
                    {exercises.map((ex, idx) => (
                        <ExerciseRow
                            key={ex.id}
                            exercise={ex}
                            exerciseInfo={exercisesMap.get(ex.exerciseId)}
                            index={idx}
                            isActive={ex.id === activeExerciseId}
                            compact={compact}
                            onSelect={() => onSelectExercise?.(ex.id, idx)}
                        />
                    ))}
                </div>
            )}

            {/* Edit mode hint */}
            {editable && (
                <div className="text-center pt-2 border-t border-[#222]">
                    <p className="text-[10px] text-gray-500">
                        Click exercise to edit • Drag to reorder (coming soon)
                    </p>
                </div>
            )}
        </div>
    );
}

export default SessionTimeline;
