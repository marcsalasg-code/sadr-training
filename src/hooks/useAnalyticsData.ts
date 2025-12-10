/**
 * useAnalyticsData - Hook para datos y métricas de Analytics
 * 
 * Extrae la lógica de cálculo de AnalyticsView.tsx:
 * - Filtro de sesiones por tiempo y atleta
 * - Métricas principales (volumen, sets, duración)
 * - Volumen semanal
 * - Top ejercicios
 * - Session log
 * - 1RM y intensity metrics
 */

import { useMemo, useState } from 'react';
import { useSessions, useAthletes, useExercises, useTrainingPlans } from '../store/store';
import { getSessionLog } from '../utils/sessionLog';
import { getWeeklyIntensityFatigue } from '../utils/metrics';
import {
    filterCompletedSessions,
    calculateTotalVolume,
    calculateTotalDuration,
    calculateAvgDuration,
} from '../utils/dashboardMetrics';
import type { WorkoutSession, Athlete, Exercise, TrainingPlan } from '../types/types';

// ============================================
// TYPES
// ============================================

export interface AnalyticsMetrics {
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    totalDuration: number;
    avgVolume: number;
    avgDuration: number;
    sessionCount: number;
}

export interface TopExercise {
    id: string;
    name: string;
    volume: number;
    sets: number;
}

export interface WeeklyIntensityFatigueData {
    avgIntensity: number | null;
    avgFatigue: number | null;
    count: number;
}

export interface UseAnalyticsDataReturn {
    // State
    selectedAthlete: string;
    setSelectedAthlete: (id: string) => void;
    timeRange: string;
    setTimeRange: (range: string) => void;

    // Filtered data
    filteredSessions: WorkoutSession[];

    // Calculations
    metrics: AnalyticsMetrics;
    weeklyVolume: [string, number][];
    maxWeekVolume: number;
    topExercises: TopExercise[];
    sessionLog: ReturnType<typeof getSessionLog>;
    weeklyIntensityFatigue: WeeklyIntensityFatigueData;

    // Reference data
    athletes: Athlete[];
    exercises: Exercise[];
    sessions: WorkoutSession[];
    trainingPlans: TrainingPlan[];
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useAnalyticsData(): UseAnalyticsDataReturn {
    const sessions = useSessions();
    const athletes = useAthletes();
    const exercises = useExercises();
    const trainingPlans = useTrainingPlans();

    // Filter state
    const [selectedAthlete, setSelectedAthlete] = useState<string>('all');
    const [timeRange, setTimeRange] = useState<string>('month');

    // Filter sessions by time range and athlete
    const filteredSessions = useMemo(() => {
        let cutoff = new Date();
        if (timeRange === 'week') cutoff.setDate(cutoff.getDate() - 7);
        else if (timeRange === 'month') cutoff.setMonth(cutoff.getMonth() - 1);
        else if (timeRange === '3months') cutoff.setMonth(cutoff.getMonth() - 3);
        else cutoff = new Date(0);

        return sessions
            .filter(s => s.status === 'completed')
            .filter(s => selectedAthlete === 'all' || s.athleteId === selectedAthlete)
            .filter(s => s.completedAt && new Date(s.completedAt) >= cutoff);
    }, [sessions, selectedAthlete, timeRange]);

    // Main metrics
    const metrics = useMemo((): AnalyticsMetrics => {
        const totalVolume = calculateTotalVolume(filteredSessions);
        const totalSets = filteredSessions.reduce((sum, s) => sum + (s.totalSets || 0), 0);
        const totalReps = filteredSessions.reduce((sum, s) => sum + (s.totalReps || 0), 0);
        const totalDuration = calculateTotalDuration(filteredSessions);
        const avgVolume = filteredSessions.length > 0 ? Math.round(totalVolume / filteredSessions.length) : 0;
        const avgDuration = calculateAvgDuration(filteredSessions);

        return { totalVolume, totalSets, totalReps, totalDuration, avgVolume, avgDuration, sessionCount: filteredSessions.length };
    }, [filteredSessions]);

    // Weekly volume for chart
    const weeklyVolume = useMemo((): [string, number][] => {
        const weeks: Record<string, number> = {};
        filteredSessions.forEach(s => {
            if (!s.completedAt) return;
            const date = new Date(s.completedAt);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            weeks[weekKey] = (weeks[weekKey] || 0) + (s.totalVolume || 0);
        });
        return Object.entries(weeks)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-8);
    }, [filteredSessions]);

    // Max volume for chart scaling
    const maxWeekVolume = weeklyVolume.length > 0 ? Math.max(...weeklyVolume.map(([, v]) => v)) : 1;

    // Top exercises by volume
    const topExercises = useMemo((): TopExercise[] => {
        const volumes: Record<string, { volume: number; sets: number }> = {};
        filteredSessions.forEach(s => {
            s.exercises?.forEach(ex => {
                if (!volumes[ex.exerciseId]) volumes[ex.exerciseId] = { volume: 0, sets: 0 };
                ex.sets.forEach(set => {
                    if (set.isCompleted) {
                        volumes[ex.exerciseId].volume += (set.actualWeight || 0) * (set.actualReps || 0);
                        volumes[ex.exerciseId].sets++;
                    }
                });
            });
        });
        return Object.entries(volumes)
            .map(([id, data]) => ({ id, name: exercises.find(e => e.id === id)?.name || 'Ejercicio', ...data }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5);
    }, [filteredSessions, exercises]);

    // Session log
    const sessionLog = useMemo(() => {
        let fromDate: string | undefined;
        const now = new Date();
        if (timeRange === 'week') {
            const cutoff = new Date(now);
            cutoff.setDate(cutoff.getDate() - 7);
            fromDate = cutoff.toISOString();
        } else if (timeRange === 'month') {
            const cutoff = new Date(now);
            cutoff.setMonth(cutoff.getMonth() - 1);
            fromDate = cutoff.toISOString();
        } else if (timeRange === '3months') {
            const cutoff = new Date(now);
            cutoff.setMonth(cutoff.getMonth() - 3);
            fromDate = cutoff.toISOString();
        }

        return getSessionLog(sessions, athletes, {
            athleteId: selectedAthlete === 'all' ? null : selectedAthlete,
            statuses: ['completed'],
            fromDate,
        });
    }, [sessions, athletes, selectedAthlete, timeRange]);

    // Weekly intensity/fatigue
    const weeklyIntensityFatigue = useMemo((): WeeklyIntensityFatigueData => {
        return getWeeklyIntensityFatigue(filteredSessions);
    }, [filteredSessions]);

    return {
        // State
        selectedAthlete,
        setSelectedAthlete,
        timeRange,
        setTimeRange,

        // Filtered data
        filteredSessions,

        // Calculations
        metrics,
        weeklyVolume,
        maxWeekVolume,
        topExercises,
        sessionLog,
        weeklyIntensityFatigue,

        // Reference data
        athletes,
        exercises,
        sessions,
        trainingPlans,
    };
}

export default useAnalyticsData;
