/**
 * AthleteSessionRow - Session row component for athlete detail view
 * Extracted from AthleteDetail.tsx for reusability
 */

import React from 'react';
import { AuraCard } from '../ui/aura/AuraCard';
import { AuraBadge } from '../ui/aura/AuraBadge';
import type { WorkoutSession } from '../../types/types';

// ============================================
// TYPES
// ============================================

export interface SessionRowProps {
    session: WorkoutSession;
    formatDate: (d?: string) => string;
    statusColors: Record<string, string>;
    statusLabels: Record<string, string>;
    onClick: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function AthleteSessionRow({
    session,
    formatDate,
    statusColors,
    statusLabels,
    onClick,
}: SessionRowProps) {
    return (
        <AuraCard hover onClick={onClick}>
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-white">{session.name}</h4>
                    <p className="text-xs text-gray-500">
                        {formatDate(session.completedAt || session.scheduledDate || session.createdAt)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Pre-Session Fatigue & Avg Intensity indicators */}
                    {session.preSessionFatigue != null && (
                        <span className="text-xs text-gray-400" title="Fatiga previa">
                            🏃 {session.preSessionFatigue}/10
                        </span>
                    )}
                    {session.avgIntensity != null && (
                        <span className="text-xs text-[var(--color-accent-gold)]" title="Intensidad media">
                            ⚡ {session.avgIntensity.toFixed(1)}/10
                        </span>
                    )}
                    <AuraBadge variant={statusColors[session.status] as 'gold' | 'success' | 'error' | 'muted'}>
                        {statusLabels[session.status]}
                    </AuraBadge>
                    {session.totalVolume && session.totalVolume > 0 && (
                        <span className="text-[var(--color-accent-gold)] font-mono text-sm">
                            {(session.totalVolume / 1000).toFixed(1)}K kg
                        </span>
                    )}
                </div>
            </div>
        </AuraCard>
    );
}

// ============================================
// INFO ROW COMPONENT
// ============================================

export interface InfoRowProps {
    label: string;
    value: string;
}

export function InfoRow({ label, value }: InfoRowProps) {
    return (
        <div>
            <span className="text-xs text-gray-500">{label}</span>
            <p className="text-white font-medium">{value}</p>
        </div>
    );
}

// ============================================
// STATUS CONSTANTS
// ============================================

export const SESSION_STATUS_COLORS: Record<string, string> = {
    completed: 'success',
    in_progress: 'gold',
    planned: 'muted',
    skipped: 'error',
};

export const SESSION_STATUS_LABELS: Record<string, string> = {
    completed: 'Completada',
    in_progress: 'En Progreso',
    planned: 'Planificada',
    skipped: 'Saltada',
};
