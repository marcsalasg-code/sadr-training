/**
 * AthleteHomeView - Simple home for athlete role
 * 
 * Phase 15A: Shows athlete's next session and quick access to their data.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTrainingStore, useSessions } from '../store/store';
import { AuraCard, AuraEmptyState, AuraButton } from '../components/ui/aura';

export function AthleteHomeView() {
    const currentUser = useTrainingStore((s) => s.currentUser);
    const sessions = useSessions();
    const athletes = useTrainingStore((s) => s.athletes);
    const logout = useTrainingStore((s) => s.logout);

    const athleteId = currentUser?.athleteId;
    const athlete = athletes.find(a => a.id === athleteId);

    // Get athlete's sessions
    const mySessions = useMemo(() =>
        sessions.filter(s => s.athleteId === athleteId),
        [sessions, athleteId]
    );

    // Find next upcoming session
    const nextSession = useMemo(() => {
        const now = new Date();
        return mySessions
            .filter(s => s.status === 'planned' && s.scheduledDate)
            .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
            .find(s => new Date(s.scheduledDate!) >= now);
    }, [mySessions]);

    // Find active session
    const activeSession = useMemo(() =>
        mySessions.find(s => s.status === 'in_progress'),
        [mySessions]
    );

    // Stats
    const completedCount = mySessions.filter(s => s.status === 'completed').length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Hola, {athlete?.name || currentUser?.name || 'Atleta'} 👋
                    </h1>
                    <p className="text-sm text-gray-400">Tu espacio personal de entrenamiento</p>
                </div>
                <button
                    onClick={logout}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                    Cerrar sesión
                </button>
            </div>

            {/* Active Session Banner */}
            {activeSession && (
                <Link to={`/sessions/live/${activeSession.id}`}>
                    <AuraCard className="bg-green-900/20 border-green-700/50 hover:border-green-500 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-2xl">🏋️</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-green-400 font-medium">Sesión en progreso</p>
                                <p className="text-sm text-gray-300">{activeSession.name}</p>
                            </div>
                            <AuraButton variant="gold" size="sm">
                                Continuar
                            </AuraButton>
                        </div>
                    </AuraCard>
                </Link>
            )}

            {/* Next Session */}
            {nextSession && !activeSession && (
                <AuraCard>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[var(--color-accent-gold)]/10 flex items-center justify-center">
                            <span className="text-2xl">📅</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Próxima sesión</p>
                            <p className="text-white font-medium">{nextSession.name}</p>
                            <p className="text-sm text-gray-400">
                                {nextSession.scheduledDate && new Date(nextSession.scheduledDate).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </AuraCard>
            )}

            {/* No sessions */}
            {!nextSession && !activeSession && (
                <AuraEmptyState
                    icon="📋"
                    title="Sin sesiones programadas"
                    description="Tu entrenador aún no ha programado tu próxima sesión."
                />
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <AuraCard>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Sesiones completadas</p>
                    <p className="text-3xl font-bold text-white mt-1">{completedCount}</p>
                </AuraCard>
                <AuraCard>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Sesiones pendientes</p>
                    <p className="text-3xl font-bold text-white mt-1">
                        {mySessions.filter(s => s.status === 'planned').length}
                    </p>
                </AuraCard>
            </div>

            {/* Links */}
            <div className="flex gap-3">
                <Link to="/analytics" className="flex-1">
                    <AuraButton variant="secondary" className="w-full">
                        📊 Ver mis estadísticas
                    </AuraButton>
                </Link>
                <Link to="/settings" className="flex-1">
                    <AuraButton variant="secondary" className="w-full">
                        ⚙️ Configuración
                    </AuraButton>
                </Link>
            </div>
        </div>
    );
}

export default AthleteHomeView;
