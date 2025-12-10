/**
 * SessionBuilder - Constructor y gestor de sesiones de entrenamiento
 * Permite crear, editar y gestionar sesiones
 * Rediseñado con UI Aura
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Select } from '../components/ui';
import {
    AuraSection,
    AuraGrid,
    AuraPanel,
    AuraCard,
    AuraButton,
    AuraBadge,
    AuraEmptyState,
} from '../components/ui/aura';
import { AISessionGeneratorModal, SessionCard } from '../components/session';
import { useTrainingStore, useSessions, useAthletes, useTemplates } from '../store/store';
import { useAIEnabled } from '../ai';
import { useTrainingPlan } from '../hooks';
import { getRecommendedTemplates, getTemplateBadge } from '../utils/templateHelpers';
import type { WorkoutSession, ExerciseEntry } from '../types/types';

export function SessionBuilder() {
    const navigate = useNavigate();
    const sessions = useSessions();
    const athletes = useAthletes();
    const templates = useTemplates();
    const { addSession, deleteSession } = useTrainingStore();
    const isAIEnabled = useAIEnabled();
    const { activePlan, todayPlan, weeklyAdherence } = useTrainingPlan();

    // Calculate recommended templates based on today's plan
    const recommendedTemplates = useMemo(() => {
        if (!todayPlan) return [];
        return getRecommendedTemplates(templates, todayPlan).slice(0, 3);
    }, [templates, todayPlan]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiAthleteId, setAIAthleteId] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterAthlete, setFilterAthlete] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Nueva sesión
    const [newSession, setNewSession] = useState({
        name: '',
        athleteId: '',          // Legacy single athlete
        athleteIds: [] as string[],  // Multi-athlete (Sprint 4)
        isMultiAthlete: false,
        templateId: '',
        description: '',
        scheduledDate: '',
    });


    // Filtrar sesiones
    const filteredSessions = useMemo(() => {
        return sessions
            .filter(s => {
                if (filterStatus !== 'all' && s.status !== filterStatus) return false;
                if (filterAthlete !== 'all' && s.athleteId !== filterAthlete) return false;
                if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                return true;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [sessions, filterStatus, filterAthlete, searchQuery]);

    // Agrupar por estado
    const sessionsByStatus = useMemo(() => ({
        planned: filteredSessions.filter(s => s.status === 'planned'),
        in_progress: filteredSessions.filter(s => s.status === 'in_progress'),
        completed: filteredSessions.filter(s => s.status === 'completed'),
    }), [filteredSessions]);

    // Crear sesión
    const handleCreateSession = () => {
        if (!newSession.name.trim() || !newSession.athleteId) return;

        let sessionExercises: ExerciseEntry[] = [];
        if (newSession.templateId) {
            const template = templates.find(t => t.id === newSession.templateId);
            if (template) {
                sessionExercises = template.exercises.map((te, index) => ({
                    id: crypto.randomUUID(),
                    exerciseId: te.exerciseId,
                    order: index,
                    sets: Array.from({ length: te.defaultSets }, (_, i) => ({
                        id: crypto.randomUUID(),
                        setNumber: i + 1,
                        type: 'working' as const,
                        targetReps: te.defaultReps,
                        targetWeight: te.defaultWeight,
                        restSeconds: te.restSeconds,
                        isCompleted: false,
                    })),
                }));
            }
        }

        const session = addSession({
            name: newSession.name.trim(),
            athleteId: newSession.athleteId,
            templateId: newSession.templateId || undefined,
            description: newSession.description.trim() || undefined,
            scheduledDate: newSession.scheduledDate || undefined,
            status: 'planned',
            exercises: sessionExercises,
        });

        setNewSession({ name: '', athleteId: '', athleteIds: [], isMultiAthlete: false, templateId: '', description: '', scheduledDate: '' });
        setShowCreateModal(false);
        navigate(`/sessions/live/${session.id}`);
    };

    const getAthleteName = (athleteId: string) => {
        return athletes.find(a => a.id === athleteId)?.name || 'Sin atleta';
    };

    // Handler: aplicar sesión generada por IA
    const handleApplyAISession = (exercises: ExerciseEntry[], name: string) => {
        if (!aiAthleteId) return;

        const session = addSession({
            name,
            athleteId: aiAthleteId,
            status: 'planned',
            exercises,
            description: 'Generated with AI',
        });

        setShowAIModal(false);
        setAIAthleteId('');
        navigate(`/sessions/live/${session.id}`);
    };

    // Handler: abrir modal de IA
    const handleOpenAIModal = () => {
        // Si hay atletas, preseleccionar el primero
        if (athletes.length > 0) {
            setAIAthleteId(athletes[0].id);
        }
        setShowAIModal(true);
    };


    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <AuraSection
                title="Sessions"
                subtitle="Manage training sessions"
                action={
                    <div className="flex gap-2">
                        {isAIEnabled && (
                            <AuraButton variant="ghost" onClick={handleOpenAIModal}>
                                🤖 Generate with AI
                            </AuraButton>
                        )}
                        <AuraButton variant="gold" onClick={() => setShowCreateModal(true)}>
                            + New Session
                        </AuraButton>
                    </div>
                }
            />

            {/* FASE 3: Training Plan Context Banner */}
            {activePlan && (
                <AuraPanel variant="default" className="border-l-2 border-[var(--color-accent-gold)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-lg">📋</span>
                            <div>
                                <p className="text-sm font-medium text-white">{activePlan.name}</p>
                                <p className="text-xs text-gray-500">
                                    {todayPlan
                                        ? `Today: ${todayPlan.sessionType} • ${todayPlan.intensity || 'moderate'}`
                                        : 'Rest day'
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Weekly Progress</p>
                                <p className="text-sm font-mono text-[var(--color-accent-gold)]">
                                    {weeklyAdherence.completed}/{weeklyAdherence.planned} ({weeklyAdherence.percentage}%)
                                </p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                                <span className={`text-xs font-bold ${weeklyAdherence.percentage >= 80 ? 'text-green-400' : weeklyAdherence.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {weeklyAdherence.weeklyScore?.toFixed(0) || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </AuraPanel>
            )}

            {/* FASE 6: Recommended Templates for Today */}
            {todayPlan && recommendedTemplates.length > 0 && (
                <AuraPanel
                    header={
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--color-accent-gold)]">✨</span>
                                <span>Recommended for today</span>
                            </div>
                            <AuraBadge variant="gold" size="sm">
                                {todayPlan.sessionType}
                            </AuraBadge>
                        </div>
                    }
                >
                    <div className="grid grid-cols-3 gap-3">
                        {recommendedTemplates.map(template => {
                            const badgeText = getTemplateBadge(template, todayPlan);
                            return (
                                <div
                                    key={template.id}
                                    className="p-4 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] hover:border-[var(--color-accent-gold)]/30 transition-all cursor-pointer group"
                                    onClick={() => {
                                        setNewSession(prev => ({
                                            ...prev,
                                            name: template.name,
                                            templateId: template.id,
                                        }));
                                        setShowCreateModal(true);
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-white group-hover:text-[var(--color-accent-gold)] transition-colors truncate">
                                            {template.name}
                                        </h4>
                                        {badgeText && (
                                            <AuraBadge variant="gold" size="sm">
                                                {badgeText}
                                            </AuraBadge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">
                                        {template.exercises.length} exercises • {template.estimatedDuration || 45} min
                                    </p>
                                    <AuraButton variant="ghost" size="sm" className="w-full">
                                        Use →
                                    </AuraButton>
                                </div>
                            );
                        })}
                    </div>
                </AuraPanel>
            )}


            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg">
                <Input
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                />
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'planned', label: 'Planned' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'cancelled', label: 'Cancelled' },
                    ]}
                    className="w-40"
                />
                <Select
                    value={filterAthlete}
                    onChange={(e) => setFilterAthlete(e.target.value)}
                    options={[
                        { value: 'all', label: 'All Athletes' },
                        ...athletes.map(a => ({ value: a.id, label: a.name })),
                    ]}
                    className="w-40"
                />
            </div>

            {sessions.length === 0 ? (
                <AuraPanel>
                    <AuraEmptyState
                        icon="🏋️"
                        title="No sessions yet"
                        description="Start by creating a session from a template or generate one with AI."
                        action={{
                            label: 'Create Session',
                            onClick: () => setShowCreateModal(true),
                        }}
                    />
                </AuraPanel>
            ) : (
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
                                        onClick={() => navigate(`/sessions/live/${session.id}`)}
                                        onDelete={() => deleteSession(session.id)}
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
                                        onClick={() => navigate(`/sessions/live/${session.id}`)}
                                        onDelete={() => deleteSession(session.id)}
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
                                        onClick={() => navigate(`/sessions/live/${session.id}`)}
                                        onDelete={() => deleteSession(session.id)}
                                        onDuplicate={() => {
                                            addSession({
                                                name: `${session.name} (copy)`,
                                                athleteId: session.athleteId,
                                                status: 'planned',
                                                exercises: session.exercises.map(ex => ({
                                                    ...ex,
                                                    id: crypto.randomUUID(),
                                                    sets: ex.sets.map(s => ({
                                                        ...s,
                                                        id: crypto.randomUUID(),
                                                        isCompleted: false,
                                                        completedAt: undefined,
                                                        actualWeight: s.targetWeight,
                                                        actualReps: s.targetReps,
                                                    })),
                                                })),
                                            });
                                        }}
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
            )}

            {/* Modal: Create Session */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="New Session"
                size="md"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </AuraButton>
                        <AuraButton
                            variant="gold"
                            onClick={handleCreateSession}
                            disabled={!newSession.name.trim() || !newSession.athleteId}
                        >
                            Create & Start
                        </AuraButton>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Session Name *"
                        placeholder="E.g: Push Day, Legs, Full Body..."
                        value={newSession.name}
                        onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                        autoFocus
                    />
                    <Select
                        label="Athlete *"
                        value={newSession.athleteId}
                        onChange={(e) => setNewSession({
                            ...newSession,
                            athleteId: e.target.value,
                            athleteIds: e.target.value ? [e.target.value] : [],
                        })}
                        placeholder="Select athlete"
                        options={athletes.map(a => ({ value: a.id, label: a.name }))}
                    />

                    {/* Multi-athlete toggle (Sprint 4) */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="multiAthlete"
                            checked={newSession.isMultiAthlete}
                            onChange={(e) => setNewSession({ ...newSession, isMultiAthlete: e.target.checked })}
                            className="w-4 h-4 rounded bg-[#1A1A1A] border-[#2A2A2A]"
                        />
                        <label htmlFor="multiAthlete" className="text-sm text-gray-400">
                            Add more athletes (multi-athlete session)
                        </label>
                    </div>

                    {/* Additional athletes selector */}
                    {newSession.isMultiAthlete && (
                        <div className="p-3 bg-[#141414] rounded-lg border border-[#2A2A2A]">
                            <p className="text-xs text-gray-500 mb-2">Select additional athletes:</p>
                            <div className="flex flex-wrap gap-2">
                                {athletes
                                    .filter(a => a.id !== newSession.athleteId)
                                    .map(athlete => (
                                        <label
                                            key={athlete.id}
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-all ${newSession.athleteIds.includes(athlete.id)
                                                ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/30'
                                                : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-[#2A2A2A]'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={newSession.athleteIds.includes(athlete.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...newSession.athleteIds, athlete.id]
                                                        : newSession.athleteIds.filter(id => id !== athlete.id);
                                                    setNewSession({ ...newSession, athleteIds: ids });
                                                }}
                                                className="sr-only"
                                            />
                                            {athlete.name}
                                        </label>
                                    ))}
                            </div>
                        </div>
                    )}
                    {templates.length > 0 && (
                        <Select
                            label="Template (optional)"
                            value={newSession.templateId}
                            onChange={(e) => setNewSession({ ...newSession, templateId: e.target.value })}
                            placeholder="No template"
                            options={[
                                { value: '', label: 'No template' },
                                ...templates.map(t => ({ value: t.id, label: t.name })),
                            ]}
                        />
                    )}
                    <Input
                        label="Scheduled Date (optional)"
                        type="date"
                        value={newSession.scheduledDate}
                        onChange={(e) => setNewSession({ ...newSession, scheduledDate: e.target.value })}
                    />
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                            Notes (optional)
                        </label>
                        <textarea
                            placeholder="Session notes..."
                            value={newSession.description}
                            onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                            rows={2}
                            className="w-full bg-[#0A0A0A] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal: AI Session Generator */}
            <AISessionGeneratorModal
                isOpen={showAIModal}
                onClose={() => {
                    setShowAIModal(false);
                    setAIAthleteId('');
                }}
                athleteId={aiAthleteId}
                onApplySession={handleApplyAISession}
            />
        </div>
    );
}
