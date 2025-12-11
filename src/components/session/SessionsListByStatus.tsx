/**
 * SessionsListByStatus - Grouped session cards by status
 */

import { AuraGrid, AuraPanel, AuraEmptyState } from '../ui/aura';
import { SessionCard } from './SessionCard';
import type { WorkoutSession } from '../../types/types';

interface SessionsByStatus {
    in_progress: WorkoutSession[];
    planned: WorkoutSession[];
    completed: WorkoutSession[];
}

interface SessionsListByStatusProps {
    sessionsByStatus: SessionsByStatus;
    getAthleteName: (athleteId: string) => string;
    onSessionClick: (sessionId: string) => void;
    onSessionDelete: (sessionId: string) => void;
    onSessionDuplicate?: (session: WorkoutSession) => void;
    emptyStateAction: () => void;
    isEmpty: boolean;
}

export function SessionsListByStatus({
    sessionsByStatus,
    getAthleteName,
    onSessionClick,
    onSessionDelete,
    onSessionDuplicate,
    emptyStateAction,
    isEmpty,
}: SessionsListByStatusProps) {
    if (isEmpty) {
        return (
            <AuraPanel>
                <AuraEmptyState
                    icon="🏋️"
                    title="No sessions yet"
                    description="Start by creating a session from a template or generate one with AI."
                    action={{
                        label: 'Create Session',
                        onClick: emptyStateAction,
                    }}
                />
            </AuraPanel>
        );
    }

    return (
        <div className="space-y-8">
            {/* In Progress */}
            {sessionsByStatus.in_progress.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
                        <h3 className="text-sm font-mono text-[var(--color-accent-gold)] uppercase tracking-widest">
                            Live ({sessionsByStatus.in_progress.length})
                        </h3>
                    </div>
                    <AuraGrid cols={3} gap="md">
                        {sessionsByStatus.in_progress.map(session => (
                            <SessionCard
                                key={session.id}
                                session={session}
                                athleteName={getAthleteName(session.athleteId)}
                                onClick={() => onSessionClick(session.id)}
                                onDelete={() => onSessionDelete(session.id)}
                            />
                        ))}
                    </AuraGrid>
                </section>
            )}

            {/* Planned */}
            {sessionsByStatus.planned.length > 0 && (
                <section>
                    <h3 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-4">
                        Planned ({sessionsByStatus.planned.length})
                    </h3>
                    <AuraGrid cols={3} gap="md">
                        {sessionsByStatus.planned.map(session => (
                            <SessionCard
                                key={session.id}
                                session={session}
                                athleteName={getAthleteName(session.athleteId)}
                                onClick={() => onSessionClick(session.id)}
                                onDelete={() => onSessionDelete(session.id)}
                            />
                        ))}
                    </AuraGrid>
                </section>
            )}

            {/* Completed */}
            {sessionsByStatus.completed.length > 0 && (
                <section>
                    <h3 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-4">
                        Completed ({sessionsByStatus.completed.length})
                    </h3>
                    <AuraGrid cols={3} gap="md">
                        {sessionsByStatus.completed.slice(0, 9).map(session => (
                            <SessionCard
                                key={session.id}
                                session={session}
                                athleteName={getAthleteName(session.athleteId)}
                                onClick={() => onSessionClick(session.id)}
                                onDelete={() => onSessionDelete(session.id)}
                                onDuplicate={onSessionDuplicate ? () => onSessionDuplicate(session) : undefined}
                            />
                        ))}
                    </AuraGrid>
                    {sessionsByStatus.completed.length > 9 && (
                        <p className="text-center text-gray-600 mt-4 text-sm">
                            +{sessionsByStatus.completed.length - 9} more sessions
                        </p>
                    )}
                </section>
            )}
        </div>
    );
}
