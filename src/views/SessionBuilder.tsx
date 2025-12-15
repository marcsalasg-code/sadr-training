/**
 * SessionBuilder - Constructor y gestor de sesiones de entrenamiento
 * 
 * REFACTORED: Container component that orchestrates section components
 * 
 * Supports:
 * - Session list view (default)
 * - Edit mode: editing a session by sessionId + mode=edit from URL
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    AuraSection,
    AuraButton,
    AuraCard,
    AuraEmptyState,
    AuraBadge,
} from '../components/ui/aura';
import {
    AISessionGeneratorModal,
    TrainingPlanBanner,
    RecommendedTemplatesPanel,
    SessionFilters,
    SessionsListByStatus,
    SessionCreateModal,
    TemplatePickerModal,
} from '../components/session';
import { Modal } from '../components/ui/Modal';
import { SlotPickerModal } from '../components/scheduling/SlotPickerModal';
import { useTrainingStore, useSessions, useAthletes, useTemplates, useExercises } from '../store/store';
import { useAIEnabled } from '../ai';
import { useTrainingPlan, useIsCoach } from '../hooks';
import { getRecommendedTemplates, getTemplateBadge } from '../utils/templateHelpers';
import { createDefaultMigrationStructure, DEFAULT_BLOCK_ID } from '../core/sessions/sessionStructure.migration';
import { materializeSessionPatchFromTemplate } from '../domain/sessions/mappers';
import type { ExerciseEntry, WorkoutSession, WorkoutTemplate, SessionStructure } from '../types/types';

// Phase 16C: Snapshot type for undo
interface SessionSnapshot {
    exercises: ExerciseEntry[];
    structure: SessionStructure | undefined;
    templateId: string | undefined;
    status: WorkoutSession['status'];
}

// ============================================
// PROPS
// ============================================

interface SessionBuilderProps {
    editSessionId?: string;
    editMode?: boolean;
}

// ============================================
// SESSION EDITOR COMPONENT
// ============================================

interface SessionEditorProps {
    session: WorkoutSession;
    onClose: () => void;
    onSave: (exercises: ExerciseEntry[], structure?: WorkoutSession['structure'], templateId?: string) => void;
    onSaveAndStart: (exercises: ExerciseEntry[], structure?: WorkoutSession['structure'], templateId?: string) => void;
    onReschedule: (scheduledDate: string) => void;
}

function SessionEditor({ session, onClose, onSave, onSaveAndStart, onReschedule }: SessionEditorProps) {
    const exercises = useExercises();
    const athletes = useAthletes();
    const allSessions = useSessions();
    const templates = useTemplates(); // Phase 16C: For resolving template names
    const [editableExercises, setEditableExercises] = useState<ExerciseEntry[]>(session.exercises);
    const [editableStructure, setEditableStructure] = useState(session.structure);
    const [showAddExercise, setShowAddExercise] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [pendingTemplate, setPendingTemplate] = useState<WorkoutTemplate | null>(null);
    const [appliedTemplateId, setAppliedTemplateId] = useState<string | undefined>(session.templateId);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false); // Phase 16C

    // Phase 16C: Undo snapshot (1-step)
    const [undoSnapshot, setUndoSnapshot] = useState<SessionSnapshot | null>(null);

    // Phase 16A: Coach-only feature
    const isCoach = useIsCoach();

    // Phase 16C: Get template name for display
    const appliedTemplateName = useMemo(() => {
        if (!appliedTemplateId) return null;
        return templates.find(t => t.id === appliedTemplateId)?.name || `ID: ${appliedTemplateId.slice(0, 8)}...`;
    }, [appliedTemplateId, templates]);

    const athlete = athletes.find(a => a.id === session.athleteId);

    // Parse scheduled date for SlotPickerModal
    const initialRescheduleDate = session.scheduledDate ? session.scheduledDate.split('T')[0] : '';
    const initialRescheduleTime = session.scheduledDate
        ? session.scheduledDate.split('T')[1]?.substring(0, 5) || '09:00'
        : '09:00';

    // Can reschedule if planned/reserved and has scheduledDate
    const canReschedule = (session.status === 'planned' || session.status === 'reserved') && !!session.scheduledDate;

    // Check for duplicate when rescheduling
    const checkRescheduleDuplicate = useCallback((date: string, time: string, athleteId: string): boolean => {
        const scheduledPrefix = `${date}T${time}`;
        return allSessions.some(s =>
            s.id !== session.id &&
            s.athleteId === athleteId &&
            s.scheduledDate?.startsWith(scheduledPrefix)
        );
    }, [allSessions, session.id]);

    // Create exercises map for quick lookup
    const exercisesMap = useMemo(() => {
        const map = new Map<string, typeof exercises[0]>();
        for (const ex of exercises) {
            map.set(ex.id, ex);
        }
        return map;
    }, [exercises]);

    // Get exercise name
    const getExerciseName = useCallback((exerciseId: string) => {
        return exercisesMap.get(exerciseId)?.name || 'Ejercicio desconocido';
    }, [exercisesMap]);

    // Add exercise
    const handleAddExercise = (exerciseId: string) => {
        const newExercise: ExerciseEntry = {
            id: crypto.randomUUID(),
            exerciseId,
            order: editableExercises.length,
            sets: [], // Start with empty sets - user can add them in LiveSession
        };
        setEditableExercises(prev => [...prev, newExercise]);
        setHasChanges(true);
        setShowAddExercise(false);
    };

    // Remove exercise
    const handleRemoveExercise = (exerciseId: string) => {
        setEditableExercises(prev =>
            prev.filter(e => e.id !== exerciseId)
                .map((e, i) => ({ ...e, order: i }))
        );
        setHasChanges(true);
    };

    // Phase 16A: Apply template
    const handleApplyTemplate = (template: WorkoutTemplate) => {
        // If session has exercises, confirm replacement
        if (editableExercises.length > 0) {
            setPendingTemplate(template);
        } else {
            applyTemplateNow(template);
        }
    };

    const applyTemplateNow = (template: WorkoutTemplate) => {
        // Phase 16C: Save snapshot for undo
        setUndoSnapshot({
            exercises: editableExercises,
            structure: editableStructure,
            templateId: appliedTemplateId,
            status: session.status,
        });

        // Use the unified patch function
        const patch = materializeSessionPatchFromTemplate(template);
        setEditableExercises(patch.exercises);
        setEditableStructure(patch.structure);
        setAppliedTemplateId(patch.templateId);
        setHasChanges(true);
        setPendingTemplate(null);
        setShowTemplatePicker(false);
    };

    const handleConfirmReplace = () => {
        if (pendingTemplate) {
            applyTemplateNow(pendingTemplate);
        }
    };

    // Phase 16C: Remove template reference (keeps exercises)
    const handleRemoveTemplate = () => {
        setAppliedTemplateId(undefined);
        setHasChanges(true);
        setShowRemoveConfirm(false);
    };

    // Phase 16C: Undo last apply
    const handleUndo = () => {
        if (undoSnapshot) {
            setEditableExercises(undoSnapshot.exercises);
            setEditableStructure(undoSnapshot.structure);
            setAppliedTemplateId(undoSnapshot.templateId);
            setUndoSnapshot(null);
            setHasChanges(true);
        }
    };

    // Save
    const handleSave = () => {
        onSave(editableExercises, editableStructure, appliedTemplateId);
        setHasChanges(false);
    };

    // Save and start
    const handleSaveAndStart = () => {
        if (editableExercises.length === 0) {
            setSaveError('Añade al menos un ejercicio antes de iniciar la sesión.');
            return;
        }
        onSaveAndStart(editableExercises, editableStructure, appliedTemplateId);
    };

    return (
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-white">{session.name}</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        {athlete?.name || 'Sin atleta'} • {session.status === 'reserved' ? '📌 Reservada' : '📋 Planificada'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Phase 16C: Template info badge */}
                    {appliedTemplateName && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/20">
                            📎 {appliedTemplateName}
                        </span>
                    )}
                    {/* Phase 16C: Undo button */}
                    {isCoach && undoSnapshot && (
                        <AuraButton variant="ghost" size="sm" onClick={handleUndo}>
                            ↩️ Deshacer
                        </AuraButton>
                    )}
                    {/* Phase 16C: Remove template button */}
                    {isCoach && appliedTemplateId && (
                        <AuraButton variant="ghost" size="sm" onClick={() => setShowRemoveConfirm(true)}>
                            ✕ Quitar
                        </AuraButton>
                    )}
                    {/* Phase 16A/C: Apply/Change Template - Coach only */}
                    {isCoach && (
                        <AuraButton variant="ghost" onClick={() => setShowTemplatePicker(true)}>
                            📎 {appliedTemplateId ? 'Cambiar plantilla' : 'Aplicar plantilla'}
                        </AuraButton>
                    )}
                    {canReschedule && (
                        <AuraButton variant="ghost" onClick={() => setShowReschedule(true)}>
                            🗓 Reprogramar
                        </AuraButton>
                    )}
                    <AuraButton variant="secondary" onClick={onClose}>
                        ← Volver
                    </AuraButton>
                </div>
            </div>

            {/* Session Info */}
            {session.scheduledDate && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>📅</span>
                    <span>
                        {new Date(session.scheduledDate).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>
            )}

            {/* Error message */}
            {saveError && (
                <div className="p-4 rounded-lg bg-red-900/30 border border-red-600 text-red-200 text-sm">
                    ⚠️ {saveError}
                </div>
            )}

            {/* Exercises List */}
            <AuraCard>
                <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
                    <h3 className="font-medium text-white">
                        Ejercicios ({editableExercises.length})
                    </h3>
                    <AuraButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAddExercise(true)}
                    >
                        + Añadir ejercicio
                    </AuraButton>
                </div>

                {editableExercises.length === 0 ? (
                    <div className="p-8">
                        <AuraEmptyState
                            icon="💪"
                            title="Sin ejercicios"
                            description="Añade ejercicios para completar esta sesión."
                            action={{
                                label: "+ Añadir ejercicio",
                                onClick: () => setShowAddExercise(true),
                            }}
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-[#2A2A2A]">
                        {editableExercises.map((ex, index) => (
                            <div
                                key={ex.id}
                                className="p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500 font-mono w-6">
                                        {index + 1}.
                                    </span>
                                    <div>
                                        <p className="font-medium text-white">
                                            {getExerciseName(ex.exerciseId)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {ex.sets.length} sets configurados
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveExercise(ex.id)}
                                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                    title="Eliminar ejercicio"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </AuraCard>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
                <div className="flex items-center gap-2">
                    {hasChanges && (
                        <AuraBadge variant="gold">Cambios sin guardar</AuraBadge>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <AuraButton variant="secondary" onClick={handleSave} disabled={!hasChanges}>
                        💾 Guardar
                    </AuraButton>
                    <AuraButton variant="gold" onClick={handleSaveAndStart}>
                        ▶ Guardar e iniciar
                    </AuraButton>
                </div>
            </div>

            {/* Add Exercise Modal */}
            <Modal
                isOpen={showAddExercise}
                onClose={() => setShowAddExercise(false)}
                title="Añadir ejercicio"
                size="lg"
            >
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {exercises.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                            No hay ejercicios en el catálogo.
                        </p>
                    ) : (
                        exercises.map(ex => (
                            <button
                                key={ex.id}
                                onClick={() => handleAddExercise(ex.id)}
                                className="w-full p-3 text-left rounded-lg border border-[#2A2A2A] hover:border-[#C5A572] hover:bg-[#1A1A1A] transition-all"
                            >
                                <p className="font-medium text-white">{ex.name}</p>
                                {ex.pattern && (
                                    <p className="text-xs text-gray-500 mt-0.5">{ex.pattern}</p>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </Modal>

            {/* Reschedule Modal */}
            <SlotPickerModal
                isOpen={showReschedule}
                title="🗓 Reprogramar sesión"
                onConfirm={(result) => {
                    const newScheduledDate = `${result.date}T${result.time}:00.000Z`;
                    onReschedule(newScheduledDate);
                    setShowReschedule(false);
                }}
                onCancel={() => setShowReschedule(false)}
                athletes={athletes.filter(a => a.isActive !== false).map(a => ({ id: a.id, name: a.name }))}
                initialDate={initialRescheduleDate}
                initialTime={initialRescheduleTime}
                initialAthleteId={session.athleteId}
                confirmButtonText="Guardar nueva fecha"
                checkDuplicate={checkRescheduleDuplicate}
                duplicateWarning="Ya existe una sesión para este atleta en esa hora."
            />

            {/* Phase 16A: Template Picker Modal */}
            <TemplatePickerModal
                isOpen={showTemplatePicker}
                onClose={() => setShowTemplatePicker(false)}
                onSelect={handleApplyTemplate}
            />

            {/* Phase 16A: Confirm Replace Dialog */}
            <Modal
                isOpen={!!pendingTemplate}
                onClose={() => setPendingTemplate(null)}
                title="⚠️ Reemplazar ejercicios"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setPendingTemplate(null)}>
                            Cancelar
                        </AuraButton>
                        <AuraButton variant="gold" onClick={handleConfirmReplace}>
                            Sí, reemplazar
                        </AuraButton>
                    </>
                }
            >
                <p className="text-sm text-gray-300">
                    Esta sesión ya tiene {editableExercises.length} ejercicio(s).
                    ¿Deseas reemplazarlos con los de la plantilla <strong className="text-white">"{pendingTemplate?.name}"</strong>?
                </p>
            </Modal>

            {/* Phase 16C: Remove Template Confirmation */}
            <Modal
                isOpen={showRemoveConfirm}
                onClose={() => setShowRemoveConfirm(false)}
                title="✕ Quitar plantilla"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowRemoveConfirm(false)}>
                            Cancelar
                        </AuraButton>
                        <AuraButton variant="secondary" onClick={handleRemoveTemplate}>
                            Sí, quitar
                        </AuraButton>
                    </>
                }
            >
                <p className="text-sm text-gray-300">
                    Se eliminará la referencia a la plantilla. Los ejercicios actuales se mantendrán.
                </p>
            </Modal>
        </div>
    );
}

// ============================================
// SESSION NOT FOUND
// ============================================

function SessionNotFound({ onBack }: { onBack: () => void }) {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <AuraCard className="p-8">
                <AuraEmptyState
                    icon="❌"
                    title="Sesión no encontrada"
                    description="La sesión que buscas no existe o ha sido eliminada."
                    action={{
                        label: "← Volver a sesiones",
                        onClick: onBack,
                    }}
                />
            </AuraCard>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SessionBuilder({ editSessionId, editMode }: SessionBuilderProps) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const sessions = useSessions();
    const athletes = useAthletes();
    const templates = useTemplates();
    const { addSession, deleteSession, updateSession } = useTrainingStore();
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

    // Check if in edit mode
    const sessionToEdit = useMemo(() => {
        if (editSessionId && editMode) {
            return sessions.find(s => s.id === editSessionId);
        }
        return null;
    }, [editSessionId, editMode, sessions]);

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

    // Clear edit mode from URL
    const handleCloseEditMode = useCallback(() => {
        const params = new URLSearchParams(searchParams);
        params.delete('sessionId');
        params.delete('mode');
        setSearchParams(params, { replace: true });
    }, [searchParams, setSearchParams]);

    // Handle save session (with reserved -> planned promotion)
    const handleSaveSession = useCallback((
        exercises: ExerciseEntry[],
        structure?: WorkoutSession['structure'],
        templateId?: string
    ) => {
        if (sessionToEdit) {
            const hasExercises = exercises.length > 0;
            const shouldPromote = sessionToEdit.status === 'reserved' && hasExercises;

            updateSession(sessionToEdit.id, {
                exercises,
                structure, // Phase 16A: Persist structure from applied template
                templateId, // Phase 16B: Track which template was applied
                ...(shouldPromote ? { status: 'planned' as const } : {}),
                updatedAt: new Date().toISOString(),
            });
        }
    }, [sessionToEdit, updateSession]);

    // Handle save and start (always promote to planned before starting)
    const handleSaveAndStart = useCallback((
        exercises: ExerciseEntry[],
        structure?: WorkoutSession['structure'],
        templateId?: string
    ) => {
        if (sessionToEdit) {
            // Always set to planned when starting (handles both reserved and planned cases)
            updateSession(sessionToEdit.id, {
                exercises,
                structure, // Phase 16A: Persist structure from applied template
                templateId, // Phase 16B: Track which template was applied
                status: 'planned', // Ensure it's planned before starting
                updatedAt: new Date().toISOString(),
            });
            navigate(`/sessions/live/${sessionToEdit.id}`);
        }
    }, [sessionToEdit, updateSession, navigate]);

    // Handle reschedule (update scheduledDate)
    const handleReschedule = useCallback((scheduledDate: string) => {
        if (sessionToEdit) {
            updateSession(sessionToEdit.id, {
                scheduledDate,
                updatedAt: new Date().toISOString(),
            });
        }
    }, [sessionToEdit, updateSession]);

    // If in edit mode, show editor
    if (editSessionId && editMode) {
        if (!sessionToEdit) {
            return <SessionNotFound onBack={handleCloseEditMode} />;
        }
        return (
            <SessionEditor
                session={sessionToEdit}
                onClose={handleCloseEditMode}
                onSave={handleSaveSession}
                onSaveAndStart={handleSaveAndStart}
                onReschedule={handleReschedule}
            />
        );
    }

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
        planned: filteredSessions.filter(s => s.status === 'planned' || s.status === 'reserved'),
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
                // Phase 16C: Use unified patch function
                const patch = materializeSessionPatchFromTemplate(template);
                sessionExercises = patch.exercises;
                // Use template structure if available, otherwise use default
                sessionStructure = patch.structure
                    ? { ...patch.structure, id: `structure-${crypto.randomUUID()}` }
                    : sessionStructure;
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
        // PHASE 12C: Canonical path -> Go to Editor, not Live
        navigate(`/planning?tab=sessions&sessionId=${session.id}&mode=edit`);
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
        // PHASE 12C: Canonical path -> Go to Editor, not Live
        navigate(`/planning?tab=sessions&sessionId=${session.id}&mode=edit`);
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

    // Handle session click - go to edit mode for reserved/planned, go live for others
    const handleSessionClick = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session && (session.status === 'reserved' || session.status === 'planned')) {
            // Open edit mode
            const params = new URLSearchParams(searchParams);
            params.set('sessionId', sessionId);
            params.set('mode', 'edit');
            setSearchParams(params);
        } else {
            navigate(`/sessions/live/${sessionId}`);
        }
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
                onSessionClick={handleSessionClick}
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
