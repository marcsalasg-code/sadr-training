/**
 * SessionCard - Reusable session card component
 * Extracted from SessionBuilder.tsx for reusability
 */

import { useState } from 'react';
import { Modal } from '../ui';
import { AuraCard, AuraBadge, AuraButton } from '../ui/aura';
import type { WorkoutSession } from '../../types/types';

// ============================================
// TYPES
// ============================================

export interface SessionCardProps {
    session: WorkoutSession;
    athleteName: string;
    onClick: () => void;
    onDelete: () => void;
    onDuplicate?: () => void;
}

// ============================================
// STATUS CONFIGURATION
// ============================================

export const SESSION_STATUS_CONFIG = {
    reserved: { label: 'Reserved', variant: 'default' as const },
    planned: { label: 'Planned', variant: 'default' as const },
    in_progress: { label: 'Live', variant: 'gold' as const },
    completed: { label: 'Done', variant: 'success' as const },
    cancelled: { label: 'Cancelled', variant: 'error' as const },
};

// ============================================
// COMPONENT
// ============================================

export function SessionCard({ session, athleteName, onClick, onDelete, onDuplicate }: SessionCardProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const status = SESSION_STATUS_CONFIG[session.status];
    const isLive = session.status === 'in_progress';

    return (
        <>
            <AuraCard
                hover
                variant={isLive ? 'glass' : 'solid'}
                className={`relative group ${isLive ? 'border-[var(--color-accent-gold)]/30' : ''}`}
                onClick={onClick}
            >
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold truncate ${isLive ? 'text-[var(--color-accent-gold)]' : 'text-white'}`}>
                            {session.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{athleteName}</p>
                    </div>
                    <AuraBadge variant={status.variant} size="sm">
                        {status.label}
                    </AuraBadge>
                </div>

                {/* Stats for completed sessions */}
                {session.status === 'completed' && (
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#2A2A2A]">
                        <div className="text-center">
                            <p className="text-lg font-mono text-[var(--color-accent-gold)]">
                                {session.exercises?.length || 0}
                            </p>
                            <p className="text-[9px] text-gray-500 uppercase">Exercises</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-mono text-[var(--color-accent-gold)]">
                                {session.totalSets || 0}
                            </p>
                            <p className="text-[9px] text-gray-500 uppercase">Sets</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-mono text-[var(--color-accent-gold)]">
                                {(session.totalVolume || 0) >= 1000
                                    ? `${((session.totalVolume || 0) / 1000).toFixed(1)}k`
                                    : session.totalVolume || 0}
                            </p>
                            <p className="text-[9px] text-gray-500 uppercase">Kg</p>
                        </div>
                    </div>
                )}

                {/* Scheduled date for planned */}
                {session.scheduledDate && session.status === 'planned' && (
                    <p className="text-xs text-[var(--color-accent-gold)] mt-3 font-mono">
                        📅 {new Date(session.scheduledDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </p>
                )}

                {/* Hover Actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {onDuplicate && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                            className="p-1.5 rounded bg-[#1A1A1A] text-gray-500 hover:text-[var(--color-accent-gold)] transition-colors"
                            title="Duplicate"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                        className="p-1.5 rounded bg-[#1A1A1A] text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </AuraCard>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Delete Session"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                        </AuraButton>
                        <AuraButton
                            variant="secondary"
                            className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                            onClick={() => {
                                onDelete();
                                setShowDeleteConfirm(false);
                            }}
                        >
                            Delete
                        </AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">
                    Delete session <strong className="text-white">{session.name}</strong>?
                </p>
            </Modal>
        </>
    );
}

export default SessionCard;
