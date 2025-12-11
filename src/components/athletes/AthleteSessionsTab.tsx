/**
 * AthleteSessionsTab - Sessions tab content with session list
 */

import { AuraEmptyState } from '../ui/aura';
import { AthleteSessionRow, SESSION_STATUS_COLORS, SESSION_STATUS_LABELS } from './AthleteSessionRow';
import type { WorkoutSession } from '../../types/types';

interface AthleteSessionsTabProps {
    sessions: WorkoutSession[];
    formatDate: (dateStr?: string) => string;
    onSessionClick: (sessionId: string) => void;
    onCreateSession: () => void;
}

export function AthleteSessionsTab({
    sessions,
    formatDate,
    onSessionClick,
    onCreateSession,
}: AthleteSessionsTabProps) {
    if (sessions.length === 0) {
        return (
            <div className="pt-4">
                <AuraEmptyState
                    icon="🏋️"
                    title="Sin sesiones"
                    description="Este atleta aún no tiene sesiones registradas."
                    action={{
                        label: 'Crear Sesión',
                        onClick: onCreateSession,
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-3 pt-4">
            {sessions.slice(0, 10).map((session) => (
                <AthleteSessionRow
                    key={session.id}
                    session={session}
                    formatDate={formatDate}
                    statusColors={SESSION_STATUS_COLORS}
                    statusLabels={SESSION_STATUS_LABELS}
                    onClick={() => onSessionClick(session.id)}
                />
            ))}
            {sessions.length > 10 && (
                <p className="text-center text-sm text-gray-500 py-2">
                    +{sessions.length - 10} sesiones más
                </p>
            )}
        </div>
    );
}
