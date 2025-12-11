/**
 * SessionBuilder - Constructor y gestor de sesiones de entrenamiento
 * 
 * REFACTORED: Container component that orchestrates section components
 * Original: 561 lines → Now: ~250 lines
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AuraSection,
    AuraButton,
} from '../components/ui/aura';
import {
    AISessionGeneratorModal,
    TrainingPlanBanner,
    RecommendedTemplatesPanel,
    SessionFilters,
    SessionsListByStatus,
    SessionCreateModal,
} from '../components/session';
import { useTrainingStore, useSessions, useAthletes, useTemplates, useExercises } from '../store/store';
import { useAIEnabled } from '../ai';
import { useTrainingPlan } from '../hooks';
import { getRecommendedTemplates, getTemplateBadge } from '../utils/templateHelpers';
import { createDefaultMigrationStructure, DEFAULT_BLOCK_ID } from '../core/sessions/sessionStructure.migration';
import type { ExerciseEntry } from '../types/types';

export function SessionBuilder() {
    const navigate = useNavigate();
    const sessions = useSessions();
    const athletes = useAthletes();
    const templates = useTemplates();
    const { addSession, deleteSession } = useTrainingStore();
    const isAIEnabled = useAIEnabled();
    const { activePlan, todayPlan, weeklyAdherence } = useTrainingPlan();
    const exercises = useExercises();

    // Create exercises map for template preview
    const exercisesMap = useMemo(() => {
        const map = new Map<string, typeof exercises[0]>();
        for (const ex of exercises) {
            map.set(ex.id, ex);
        }
        return map;
    }, [exercises]);

    // State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiAthleteId, setAIAthleteId] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterAthlete, setFilterAthlete] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [newSession, setNewSession] = useState({
        name: '',
        athleteId: '',
        athleteIds: [] as string[],
        isMultiAthlete: false,
        templateId: '',
        description: '',
        scheduledDate: '',
    });

    // Recommended templates
    const recommendedTemplates = useMemo(() => {
        if (!todayPlan) return [];
        return getRecommendedTemplates(templates, todayPlan).slice(0, 3).map(t => ({
            id: t.id,
            name: t.name,
            exerciseCount: t.exercises.length,
            estimatedDuration: t.estimatedDuration || 45,
            badge: getTemplateBadge(t, todayPlan) || undefined,
        }));
    }, [templates, todayPlan]);

    // Filter sessions
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

    // Group by status
    const sessionsByStatus = useMemo(() => ({
        planned: filteredSessions.filter(s => s.status === 'planned'),
        in_progress: filteredSessions.filter(s => s.status === 'in_progress'),
        completed: filteredSessions.filter(s => s.status === 'completed'),
    }), [filteredSessions]);

    // Handlers
    const getAthleteName = (athleteId: string) => {
        return athletes.find(a => a.id === athleteId)?.name || 'Sin atleta';
    };

    const handleCreateSession = () => {
        if (!newSession.name.trim() || !newSession.athleteId) return;

        let sessionExercises: ExerciseEntry[] = [];
        let sessionStructure = createDefaultMigrationStructure(crypto.randomUUID());

        if (newSession.templateId) {
            const template = templates.find(t => t.id === newSession.templateId);
            if (template) {
                sessionStructure = template.structure
                    ? { ...template.structure, id: `structure-${crypto.randomUUID()}` }
                    : sessionStructure;

                const defaultBlockId = sessionStructure.blocks[0]?.id || DEFAULT_BLOCK_ID;

                sessionExercises = template.exercises.map((te, index) => ({
                    id: crypto.randomUUID(),
                    exerciseId: te.exerciseId,
                    order: index,
                    blockId: defaultBlockId,
                    sets: Array.from({ length: te.defaultSets }, (_, i) => ({
                        id: crypto.randomUUID(),
                        setNumber: i + 1,
                        type: 'working' as const,
                        targetReps: te.defaultReps,
                        targetWeight: te.defaultWeight,
                        restSeconds: te.restSeconds,
                        isCompleted: false,
                        blockId: defaultBlockId,
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
            origin: 'manual',
            structure: sessionStructure,
        });

        setNewSession({ name: '', athleteId: '', athleteIds: [], isMultiAthlete: false, templateId: '', description: '', scheduledDate: '' });
        setShowCreateModal(false);
        navigate(`/sessions/live/${session.id}`);
    };

    const handleApplyAISession = (exercises: ExerciseEntry[], name: string) => {
        if (!aiAthleteId) return;

        const aiSessionStructure = createDefaultMigrationStructure(crypto.randomUUID());
        const defaultBlockId = aiSessionStructure.blocks[0]?.id || DEFAULT_BLOCK_ID;

        const exercisesWithBlockId = exercises.map(ex => ({
            ...ex,
            blockId: ex.blockId || defaultBlockId,
            sets: ex.sets.map(set => ({
                ...set,
                blockId: set.blockId || defaultBlockId,
            })),
        }));

        const session = addSession({
            name,
            athleteId: aiAthleteId,
            status: 'planned',
            exercises: exercisesWithBlockId,
            description: 'Generated with AI',
            origin: 'ai_suggestion',
            structure: aiSessionStructure,
        });

        setShowAIModal(false);
        setAIAthleteId('');
        navigate(`/sessions/live/${session.id}`);
    };

    const handleOpenAIModal = () => {
        if (athletes.length > 0) {
            setAIAthleteId(athletes[0].id);
        }
        setShowAIModal(true);
    };

    const handleSelectTemplate = (templateId: string, templateName: string) => {
        setNewSession(prev => ({ ...prev, name: templateName, templateId }));
        setShowCreateModal(true);
    };

    const handleDuplicateSession = (session: typeof sessions[0]) => {
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

            {/* Training Plan Banner */}
            {activePlan && (
                <TrainingPlanBanner
                    planName={activePlan.name}
                    todaySessionType={todayPlan?.sessionType}
                    todayIntensity={todayPlan?.intensity}
                    weeklyCompleted={weeklyAdherence.completed}
                    weeklyPlanned={weeklyAdherence.planned}
                    weeklyPercentage={weeklyAdherence.percentage}
                    weeklyScore={weeklyAdherence.weeklyScore}
                />
            )}

            {/* Recommended Templates */}
            {todayPlan && (
                <RecommendedTemplatesPanel
                    templates={recommendedTemplates}
                    todaySessionType={todayPlan.sessionType}
                    onSelectTemplate={handleSelectTemplate}
                />
            )}

            {/* Filters */}
            <SessionFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterStatus={filterStatus}
                onStatusChange={setFilterStatus}
                filterAthlete={filterAthlete}
                onAthleteChange={setFilterAthlete}
                athletes={athletes}
            />

            {/* Sessions List */}
            <SessionsListByStatus
                sessionsByStatus={sessionsByStatus}
                getAthleteName={getAthleteName}
                onSessionClick={(id) => navigate(`/sessions/live/${id}`)}
                onSessionDelete={(id) => deleteSession(id)}
                onSessionDuplicate={handleDuplicateSession}
                emptyStateAction={() => setShowCreateModal(true)}
                isEmpty={sessions.length === 0}
            />

            {/* Create Modal */}
            <SessionCreateModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateSession}
                newSession={newSession}
                setNewSession={setNewSession}
                athletes={athletes}
                templates={templates}
                exercisesMap={exercisesMap}
            />

            {/* AI Modal */}
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
