/**
 * TodayTrainingWidget - Widget para mostrar qué atletas entrenan hoy
 * 
 * Muestra lista de atletas con sesiones planificadas para hoy
 * con acciones directas para ir al calendario o crear sesión
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraEmptyState,
} from '../ui/aura';
import { useSessions, useAthletes, useTrainingPlans } from '../../store/store';
import { formatDateKey } from '../../utils/dateHelpers';
import type { WorkoutSession, Athlete } from '../../types/types';

interface TodayAthleteEntry {
    athlete: Athlete;
    sessions: WorkoutSession[];
    planInfo?: {
        sessionType: string;
        objective: string;
    };
}

export function TodayTrainingWidget() {
    const navigate = useNavigate();
    const sessions = useSessions();
    const athletes = useAthletes();
    const trainingPlans = useTrainingPlans();

    // Filter sessions scheduled for today
    const todayKey = formatDateKey(new Date());

    const todayAthletes = useMemo((): TodayAthleteEntry[] => {
        const todaySessions = sessions.filter(s =>
            s.scheduledDate?.startsWith(todayKey) &&
            (s.status === 'planned' || s.status === 'in_progress')
        );

        // Group by athlete
        const athleteMap = new Map<string, WorkoutSession[]>();
        todaySessions.forEach(s => {
            const current = athleteMap.get(s.athleteId) || [];
            current.push(s);
            athleteMap.set(s.athleteId, current);
        });

        // Build entries
        const entries: TodayAthleteEntry[] = [];
        athleteMap.forEach((athleteSessions, athleteId) => {
            const athlete = athletes.find(a => a.id === athleteId);
            if (!athlete) return;

            // Get plan info if available
            const plan = trainingPlans.find(p => p.athleteId === athleteId);
            const planInfo = plan ? {
                sessionType: plan.dayPlans[0]?.sessionType || plan.objective,
                objective: plan.objective,
            } : undefined;

            entries.push({ athlete, sessions: athleteSessions, planInfo });
        });

        return entries;
    }, [sessions, athletes, trainingPlans, todayKey]);

    if (todayAthletes.length === 0) {
        return (
            <AuraPanel header={
                <span className="text-white text-sm font-medium">🏋️ Hoy Toca Entrenar</span>
            }>
                <AuraEmptyState
                    icon="📅"
                    title="No hay sesiones para hoy"
                    description="No hay atletas con sesiones planificadas para hoy."
                    size="sm"
                />
            </AuraPanel>
        );
    }

    return (
        <AuraPanel header={
            <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">🏋️ Hoy Toca Entrenar</span>
                <AuraBadge variant="gold">{todayAthletes.length}</AuraBadge>
            </div>
        }>
            <div className="space-y-3">
                {todayAthletes.map(({ athlete, sessions: athleteSessions, planInfo }) => (
                    <div
                        key={athlete.id}
                        className="flex items-center justify-between p-3 bg-[#141414] rounded-lg border border-[#2A2A2A] hover:border-[var(--color-accent-gold)]/30 transition-colors"
                    >
                        {/* Athlete Info */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-accent-gold)] to-[#8B7355] flex items-center justify-center text-sm font-bold text-black">
                                {athlete.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white font-medium">{athlete.name}</p>
                                <p className="text-xs text-gray-500">
                                    {athleteSessions.length} sesión(es) •
                                    {athleteSessions[0]?.name || (planInfo ? ` ${planInfo.sessionType}` : ' Sin plan')}
                                    {athleteSessions[0]?.origin === 'plan' && (
                                        <span className="ml-1 text-[var(--color-accent-gold)]">(Plan)</span>
                                    )}
                                    {athleteSessions[0]?.origin === 'ai_suggestion' && (
                                        <span className="ml-1 text-purple-400">(IA)</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <AuraButton
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/calendar?athleteId=${athlete.id}`)}
                            >
                                📅
                            </AuraButton>
                            {athleteSessions.some(s => s.status === 'planned') && (
                                <AuraButton
                                    variant="gold"
                                    size="sm"
                                    onClick={() => navigate(`/sessions/live/${athleteSessions[0].id}`)}
                                >
                                    Comenzar ▶
                                </AuraButton>
                            )}
                            {athleteSessions.some(s => s.status === 'in_progress') && (
                                <AuraButton
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => navigate(`/sessions/live/${athleteSessions.find(s => s.status === 'in_progress')?.id}`)}
                                >
                                    Continuar →
                                </AuraButton>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </AuraPanel>
    );
}
