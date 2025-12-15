/**
 * AthleteHomeView - Home for athlete role
 * 
 * Phase 15C: Shows athlete's sessions and quick access with role-filtered data.
 */

import { Link } from 'react-router-dom';
import { useTrainingStore } from '../store/store';
import { AuraCard, AuraEmptyState, AuraButton } from '../components/ui/aura';
import {
    useCurrentUser,
    useMyActiveSession,
    useMyUpcomingSessions,
    useMyCompletedSessionsCount,
    useMyRecentCompletedSessions,
    useMyProfile,
} from '../hooks';

export function AthleteHomeView() {
    const currentUser = useCurrentUser();
    const logout = useTrainingStore((s) => s.logout);

    // Use visibility hooks
    const myProfile = useMyProfile();
    const activeSession = useMyActiveSession();
    const upcomingSessions = useMyUpcomingSessions(3);
    const completedCount = useMyCompletedSessionsCount();

    const athleteName = myProfile?.name || currentUser?.name || 'Atleta';
    const pendingCount = upcomingSessions.length;
    const recentSessions = useMyRecentCompletedSessions(5);

    return (
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Hola, {athleteName} 👋
                    </h1>
                    <p className="text-sm text-gray-400">Tu espacio personal de entrenamiento</p>
                </div>
                <button
                    onClick={logout}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-2 rounded-md hover:bg-[#2A2A2A]"
                >
                    Cerrar sesión
                </button>
            </div>

            {/* Active Session Banner */}
            {activeSession && (
                <Link to={`/sessions/live/${activeSession.id}`}>
                    <AuraCard className="bg-green-900/20 border-green-700/50 hover:border-green-500 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-3xl">🏋️</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-green-400 font-medium text-lg">Sesión en progreso</p>
                                <p className="text-sm text-gray-300">{activeSession.name}</p>
                            </div>
                            <AuraButton variant="gold" size="md">
                                Continuar
                            </AuraButton>
                        </div>
                    </AuraCard>
                </Link>
            )}

            {/* Next Session - Clickable card to start/view */}
            {!activeSession && upcomingSessions.length > 0 && (() => {
                const nextSession = upcomingSessions[0];
                const scheduledDate = nextSession.scheduledDate ? new Date(nextSession.scheduledDate) : null;
                const isToday = scheduledDate && scheduledDate.toDateString() === new Date().toDateString();
                const hasExercises = nextSession.exercises.length > 0;

                return (
                    <Link to={`/sessions/live/${nextSession.id}`}>
                        <AuraCard className={`hover:border-[var(--color-accent-gold)]/50 transition-colors cursor-pointer ${isToday ? 'border-[var(--color-accent-gold)]/30' : ''}`}>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isToday ? 'bg-[var(--color-accent-gold)]/20' : 'bg-[var(--color-accent-gold)]/10'}`}>
                                        <span className="text-3xl">{isToday ? '🔥' : '📅'}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Próxima sesión</p>
                                            {isToday && (
                                                <span className="text-[10px] font-bold text-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10 px-1.5 py-0.5 rounded">
                                                    HOY
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-white font-medium text-lg">{nextSession.name}</p>
                                        <p className="text-sm text-gray-400">
                                            {scheduledDate && scheduledDate.toLocaleDateString('es-ES', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    {/* CTA based on readiness */}
                                    {hasExercises ? (
                                        <AuraButton variant="gold" size="md">
                                            {isToday ? '▶ Empezar' : 'Empezar →'}
                                        </AuraButton>
                                    ) : (
                                        <span className="text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                                            Pendiente
                                        </span>
                                    )}
                                </div>

                                {/* More upcoming sessions */}
                                {upcomingSessions.length > 1 && (
                                    <div className="border-t border-[#2A2A2A] pt-3 space-y-2">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">También programadas</p>
                                        {upcomingSessions.slice(1).map(session => (
                                            <div key={session.id} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-300 truncate">{session.name}</span>
                                                <span className="text-gray-500 text-xs">
                                                    {session.scheduledDate && new Date(session.scheduledDate).toLocaleDateString('es-ES', {
                                                        weekday: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </AuraCard>
                    </Link>
                );
            })()}

            {/* No sessions */}
            {!activeSession && upcomingSessions.length === 0 && (
                <AuraEmptyState
                    icon="📋"
                    title="Sin sesiones programadas"
                    description="Tu entrenador aún no ha programado tu próxima sesión."
                />
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <AuraCard>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Completadas</p>
                    <p className="text-3xl font-bold text-white mt-1">{completedCount}</p>
                    <p className="text-xs text-gray-500 mt-1">sesiones</p>
                </AuraCard>
                <AuraCard>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Pendientes</p>
                    <p className="text-3xl font-bold text-white mt-1">{pendingCount}</p>
                    <p className="text-xs text-gray-500 mt-1">sesiones</p>
                </AuraCard>
            </div>

            {/* Recent History - Phase 19C */}
            {recentSessions.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm text-gray-400 uppercase tracking-wider">Últimas sesiones</h2>
                    <div className="space-y-2">
                        {recentSessions.map(session => (
                            <Link key={session.id} to={`/sessions/live/${session.id}`}>
                                <AuraCard className="hover:border-[var(--color-accent-gold)]/30 transition-colors cursor-pointer py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">✅</span>
                                            <div>
                                                <p className="text-white font-medium text-sm">{session.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {session.completedAt && new Date(session.completedAt).toLocaleDateString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-[var(--color-accent-beige)]">
                                                {session.totalVolume ? `${(session.totalVolume / 1000).toFixed(1)}k kg` : '-'}
                                            </p>
                                            <p className="text-[10px] text-gray-500">
                                                {session.totalSets || 0} series
                                            </p>
                                        </div>
                                    </div>
                                </AuraCard>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Links */}
            <div className="flex gap-3">
                <Link to="/analytics" className="flex-1">
                    <AuraButton variant="secondary" className="w-full h-12">
                        📊 Mis estadísticas
                    </AuraButton>
                </Link>
                <Link to="/settings" className="flex-1">
                    <AuraButton variant="secondary" className="w-full h-12">
                        ⚙️ Configuración
                    </AuraButton>
                </Link>
            </div>
        </div>
    );
}

export default AthleteHomeView;
