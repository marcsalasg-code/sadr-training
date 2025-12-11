/**
 * TemplateCard - Card component for displaying a template with actions
 */

import { useState } from 'react';
import { Modal } from '../ui';
import { AuraCard, AuraButton, AuraBadge } from '../ui/aura';
import type { WorkoutTemplate, Exercise } from '../../types/types';

interface TemplateCardProps {
    template: WorkoutTemplate;
    exercises: Exercise[];
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onStartSession: () => void;
    recommendedBadge?: string | null;
}

export function TemplateCard({
    template,
    exercises,
    onEdit,
    onDelete,
    onDuplicate,
    onStartSession,
    recommendedBadge,
}: TemplateCardProps) {
    const [showDelete, setShowDelete] = useState(false);
    const getName = (id: string) => exercises.find(e => e.id === id)?.name || 'Exercise';

    const difficultyVariant = template.difficulty === 'beginner' ? 'success' : template.difficulty === 'intermediate' ? 'warning' : 'error';
    const difficultyLabel = template.difficulty === 'beginner' ? 'Easy' : template.difficulty === 'intermediate' ? 'Medium' : 'Hard';

    return (
        <>
            <AuraCard hover className="relative group" onClick={onEdit}>
                {/* Recommended Badge */}
                {recommendedBadge && (
                    <div className="absolute -top-2 -right-2 z-10">
                        <AuraBadge variant="gold" size="sm">{recommendedBadge}</AuraBadge>
                    </div>
                )}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-white">{template.name}</h3>
                        {template.category && <AuraBadge size="sm" variant="gold">{template.category}</AuraBadge>}
                    </div>
                    {template.difficulty && (
                        <AuraBadge size="sm" variant={difficultyVariant}>{difficultyLabel}</AuraBadge>
                    )}
                </div>

                {template.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{template.description}</p>
                )}

                <div className="space-y-1 mb-3">
                    {template.exercises.slice(0, 3).map(ex => (
                        <div key={ex.id} className="text-xs text-gray-400">
                            • {getName(ex.exerciseId)} ({ex.defaultSets}x{ex.defaultReps || '?'})
                        </div>
                    ))}
                    {template.exercises.length > 3 && (
                        <p className="text-[10px] text-gray-600">+{template.exercises.length - 3} more</p>
                    )}
                </div>

                <div className="flex gap-4 pt-3 border-t border-[#2A2A2A] text-xs text-gray-500">
                    <span>📋 {template.exercises.length} exercises</span>
                    {template.estimatedDuration && <span>⏱️ ~{template.estimatedDuration}min</span>}
                </div>

                {/* Start Session Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onStartSession(); }}
                    className="mt-3 w-full py-2 bg-[var(--color-accent-gold)] text-black text-xs font-medium rounded hover:opacity-90 transition-opacity"
                >
                    ▶️ Start Session
                </button>

                {/* Hover Actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                        className="p-1.5 rounded bg-[#1A1A1A] text-gray-600 hover:text-[var(--color-accent-gold)] transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowDelete(true); }}
                        className="p-1.5 rounded bg-[#1A1A1A] text-gray-600 hover:text-red-400 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </AuraCard>

            <Modal
                isOpen={showDelete}
                onClose={() => setShowDelete(false)}
                title="Delete Template"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowDelete(false)}>Cancel</AuraButton>
                        <AuraButton
                            variant="secondary"
                            className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                            onClick={() => { onDelete(); setShowDelete(false); }}
                        >
                            Delete
                        </AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">Delete <strong className="text-white">{template.name}</strong>?</p>
            </Modal>
        </>
    );
}
