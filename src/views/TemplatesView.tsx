/**
 * TemplatesView - Gestión de plantillas de entrenamiento
 * Con integración de generador IA
 * Rediseñado con UI Aura
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Select } from '../components/ui';
import {
    AuraSection,
    AuraGrid,
    AuraCard,
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraEmptyState,
} from '../components/ui/aura';
import { AthleteSelector } from '../components/session';
import { useTrainingStore, useTemplates, useExercises } from '../store/store';
import { useTemplateGenerator, useAIEnabled } from '../ai';
import { useTrainingPlan } from '../hooks';
import { getRecommendedTemplates, getTemplateBadge } from '../utils/templateHelpers';
import type { WorkoutTemplate, TemplateExercise, MuscleGroup, ExerciseCategory, Exercise } from '../types/types';

export function TemplatesView() {
    const templates = useTemplates();
    const exercises = useExercises();
    const { addTemplate, updateTemplate, deleteTemplate, addExercise, addSession } = useTrainingStore();
    const navigate = useNavigate();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // NEW: State for athlete selector
    const [showAthleteSelector, setShowAthleteSelector] = useState(false);
    const [templateForSession, setTemplateForSession] = useState<WorkoutTemplate | null>(null);

    // AI Generator
    const aiEnabled = useAIEnabled();
    const { generate, isGenerating, error: aiError, lastGenerated } = useTemplateGenerator();
    const [aiPrompt, setAIPrompt] = useState('');

    const filteredTemplates = useMemo(() => {
        if (!searchQuery.trim()) return templates;
        const q = searchQuery.toLowerCase();
        return templates.filter(t =>
            t.name.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q)
        );
    }, [templates, searchQuery]);

    // FASE 6: Calculate recommended templates based on training plan
    const { activePlan, todayPlan } = useTrainingPlan();
    const recommendedTemplates = useMemo(() => {
        if (!todayPlan) return [];
        return getRecommendedTemplates(templates, todayPlan, 3);
    }, [templates, todayPlan]);
    const recommendedIds = useMemo(() => new Set(recommendedTemplates.map(t => t.id)), [recommendedTemplates]);

    // Generar plantilla con IA
    const handleGenerateTemplate = async () => {
        if (!aiPrompt.trim()) return;
        const result = await generate(aiPrompt);
        if (result) {
            const templateExercises: TemplateExercise[] = result.exercises.map((ex, i) => {
                let existingEx = exercises.find(e => e.name.toLowerCase() === ex.name.toLowerCase());
                if (!existingEx) {
                    existingEx = addExercise({
                        name: ex.name,
                        muscleGroups: ['full_body' as MuscleGroup],
                        category: 'strength' as ExerciseCategory,
                        isCustom: true,
                    });
                }
                return {
                    id: crypto.randomUUID(),
                    exerciseId: existingEx.id,
                    defaultSets: ex.sets,
                    defaultReps: ex.reps,
                    restSeconds: ex.restSeconds,
                    notes: ex.notes,
                    order: i,
                };
            });

            addTemplate({
                name: result.name,
                description: result.description,
                exercises: templateExercises,
                difficulty: result.difficulty,
                estimatedDuration: result.estimatedDuration,
                tags: result.tags,
                isArchived: false,
            });

            setShowAIModal(false);
            setAIPrompt('');
        }
    };

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <AuraSection
                title="Templates"
                subtitle={`${templates.length} template${templates.length !== 1 ? 's' : ''}`}
                action={
                    <div className="flex gap-2">
                        {aiEnabled && (
                            <AuraButton variant="ghost" onClick={() => setShowAIModal(true)}>
                                🤖 AI Generate
                            </AuraButton>
                        )}
                        <AuraButton variant="gold" onClick={() => setShowCreateModal(true)}>
                            + New Template
                        </AuraButton>
                    </div>
                }
            />

            {/* Search */}
            {templates.length > 0 && (
                <div className="flex gap-4 p-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg">
                    <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md"
                    />
                </div>
            )}

            {/* Content */}
            {templates.length === 0 ? (
                <AuraPanel>
                    <AuraEmptyState
                        icon="📋"
                        title="Build your workout library!"
                        description={aiEnabled ? "Create templates manually or let AI design workouts for you." : "Create reusable templates to save time planning sessions."}
                        action={{ label: aiEnabled ? '🤖 Generate with AI' : 'Create Template', onClick: () => aiEnabled ? setShowAIModal(true) : setShowCreateModal(true) }}
                    />
                </AuraPanel>
            ) : filteredTemplates.length === 0 ? (
                <AuraPanel>
                    <AuraEmptyState icon="🔍" title="No matches" description={`No templates matching "${searchQuery}". Try another search.`} size="sm" />
                </AuraPanel>
            ) : (
                <div className="space-y-6">
                    {/* FASE 6: Recommended Section */}
                    {activePlan && recommendedTemplates.length > 0 && !searchQuery && (
                        <AuraPanel
                            header={
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[var(--color-accent-gold)]">✨</span>
                                        <span>Recommended for your plan</span>
                                    </div>
                                    {todayPlan && (
                                        <AuraBadge variant="gold" size="sm">
                                            Today: {todayPlan.sessionType}
                                        </AuraBadge>
                                    )}
                                </div>
                            }
                        >
                            <AuraGrid cols={3} gap="md">
                                {recommendedTemplates.map(template => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        exercises={exercises}
                                        onEdit={() => setEditingTemplate(template)}
                                        onDelete={() => deleteTemplate(template.id)}
                                        onDuplicate={() => {
                                            addTemplate({
                                                name: `${template.name} (copy)`,
                                                description: template.description,
                                                category: template.category,
                                                difficulty: template.difficulty,
                                                estimatedDuration: template.estimatedDuration,
                                                exercises: template.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() })),
                                                tags: template.tags,
                                                isArchived: false,
                                            });
                                        }}
                                        onStartSession={() => {
                                            setTemplateForSession(template);
                                            setShowAthleteSelector(true);
                                        }}
                                        recommendedBadge={getTemplateBadge(template, todayPlan)}
                                    />
                                ))}
                            </AuraGrid>
                        </AuraPanel>
                    )}

                    {/* All Templates */}
                    <AuraPanel header="All Templates">
                        <AuraGrid cols={3} gap="md">
                            {filteredTemplates.map(template => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    exercises={exercises}
                                    onEdit={() => setEditingTemplate(template)}
                                    onDelete={() => deleteTemplate(template.id)}
                                    onDuplicate={() => {
                                        addTemplate({
                                            name: `${template.name} (copy)`,
                                            description: template.description,
                                            category: template.category,
                                            difficulty: template.difficulty,
                                            estimatedDuration: template.estimatedDuration,
                                            exercises: template.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() })),
                                            tags: template.tags,
                                            isArchived: false,
                                        });
                                    }}
                                    onStartSession={() => {
                                        // NEW: Open athlete selector instead of creating session directly
                                        setTemplateForSession(template);
                                        setShowAthleteSelector(true);
                                    }}
                                    recommendedBadge={recommendedIds.has(template.id) ? getTemplateBadge(template, todayPlan) : null}
                                />
                            ))}
                        </AuraGrid>
                    </AuraPanel>
                </div>
            )}

            {/* Create Modal */}
            <TemplateFormModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                exercises={exercises}
                onSave={(data) => { addTemplate(data); setShowCreateModal(false); }}
                onAddExercise={addExercise}
            />

            {/* Edit Modal */}
            {editingTemplate && (
                <TemplateFormModal
                    isOpen={true}
                    onClose={() => setEditingTemplate(null)}
                    template={editingTemplate}
                    exercises={exercises}
                    onSave={(data) => { updateTemplate(editingTemplate.id, data); setEditingTemplate(null); }}
                    onAddExercise={addExercise}
                />
            )}

            {/* AI Modal */}
            <Modal
                isOpen={showAIModal}
                onClose={() => { setShowAIModal(false); setAIPrompt(''); }}
                title="🤖 Generate with AI"
                size="md"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowAIModal(false)}>Cancel</AuraButton>
                        <AuraButton variant="gold" onClick={handleGenerateTemplate} disabled={isGenerating || !aiPrompt.trim()}>
                            {isGenerating ? '⏳ Generating...' : '✨ Generate'}
                        </AuraButton>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Describe the template you want. AI will generate a complete routine.
                    </p>

                    <textarea
                        value={aiPrompt}
                        onChange={(e) => setAIPrompt(e.target.value)}
                        placeholder="E.g: Strength routine for beginners, upper body focus, 3 days per week..."
                        rows={4}
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                        autoFocus
                    />

                    <div className="flex flex-wrap gap-2">
                        {['Upper body strength', 'Leg hypertrophy', 'Full body beginner', 'Push-Pull-Legs'].map(suggestion => (
                            <button
                                key={suggestion}
                                onClick={() => setAIPrompt(suggestion)}
                                className="text-xs px-3 py-1 rounded-full bg-[#1A1A1A] hover:bg-[#222] text-gray-400 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>

                    {aiError && (
                        <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
                            {aiError}
                        </div>
                    )}

                    {lastGenerated && !isGenerating && (
                        <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30 text-green-400 text-sm">
                            ✓ Template "{lastGenerated.name}" generated with {lastGenerated.exercises.length} exercises
                        </div>
                    )}
                </div>
            </Modal>

            {/* NEW: Athlete Selector Modal */}
            {templateForSession && (
                <AthleteSelector
                    isOpen={showAthleteSelector}
                    onClose={() => {
                        setShowAthleteSelector(false);
                        setTemplateForSession(null);
                    }}
                    template={templateForSession}
                    onConfirm={(athleteId) => {
                        // Create session from template with selected athlete
                        const sessionExercises = templateForSession.exercises.map((te, index) => ({
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

                        const session = addSession({
                            name: `${templateForSession.name} - ${new Date().toLocaleDateString('es-ES')}`,
                            athleteId: athleteId,
                            templateId: templateForSession.id,
                            status: 'planned',
                            exercises: sessionExercises,
                            durationMinutes: templateForSession.estimatedDuration,
                        });

                        setShowAthleteSelector(false);
                        setTemplateForSession(null);
                        navigate(`/sessions/live/${session.id}`);
                    }}
                />
            )}
        </div>
    );
}

// Template Card
interface TemplateCardProps {
    template: WorkoutTemplate;
    exercises: Exercise[];
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onStartSession: () => void;
    recommendedBadge?: string | null;
}

function TemplateCard({ template, exercises, onEdit, onDelete, onDuplicate, onStartSession, recommendedBadge }: TemplateCardProps) {
    const [showDelete, setShowDelete] = useState(false);
    const getName = (id: string) => exercises.find(e => e.id === id)?.name || 'Exercise';

    const difficultyVariant = template.difficulty === 'beginner' ? 'success' : template.difficulty === 'intermediate' ? 'warning' : 'error';
    const difficultyLabel = template.difficulty === 'beginner' ? 'Easy' : template.difficulty === 'intermediate' ? 'Medium' : 'Hard';

    return (
        <>
            <AuraCard hover className="relative group" onClick={onEdit}>
                {/* Recommended Badge */}
                {recommendedBadge && (
                    <div className="absolute -top-2 -right-2 z-10">
                        <AuraBadge variant="gold" size="sm">{recommendedBadge}</AuraBadge>
                    </div>
                )}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-white">{template.name}</h3>
                        {template.category && <AuraBadge size="sm" variant="gold">{template.category}</AuraBadge>}
                    </div>
                    {template.difficulty && (
                        <AuraBadge size="sm" variant={difficultyVariant}>{difficultyLabel}</AuraBadge>
                    )}
                </div>

                {template.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{template.description}</p>
                )}

                <div className="space-y-1 mb-3">
                    {template.exercises.slice(0, 3).map(ex => (
                        <div key={ex.id} className="text-xs text-gray-400">
                            • {getName(ex.exerciseId)} ({ex.defaultSets}x{ex.defaultReps || '?'})
                        </div>
                    ))}
                    {template.exercises.length > 3 && (
                        <p className="text-[10px] text-gray-600">+{template.exercises.length - 3} more</p>
                    )}
                </div>

                <div className="flex gap-4 pt-3 border-t border-[#2A2A2A] text-xs text-gray-500">
                    <span>📋 {template.exercises.length} exercises</span>
                    {template.estimatedDuration && <span>⏱️ ~{template.estimatedDuration}min</span>}
                </div>

                {/* Start Session Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onStartSession(); }}
                    className="mt-3 w-full py-2 bg-[var(--color-accent-gold)] text-black text-xs font-medium rounded hover:opacity-90 transition-opacity"
                >
                    ▶️ Start Session
                </button>

                {/* Hover Actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                        className="p-1.5 rounded bg-[#1A1A1A] text-gray-600 hover:text-[var(--color-accent-gold)] transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowDelete(true); }}
                        className="p-1.5 rounded bg-[#1A1A1A] text-gray-600 hover:text-red-400 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </AuraCard>

            <Modal
                isOpen={showDelete}
                onClose={() => setShowDelete(false)}
                title="Delete Template"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowDelete(false)}>Cancel</AuraButton>
                        <AuraButton
                            variant="secondary"
                            className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                            onClick={() => { onDelete(); setShowDelete(false); }}
                        >
                            Delete
                        </AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">Delete <strong className="text-white">{template.name}</strong>?</p>
            </Modal>
        </>
    );
}

// Template Form Modal
interface TemplateFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    template?: WorkoutTemplate;
    exercises: Exercise[];
    onSave: (data: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onAddExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => Exercise;
}

function TemplateFormModal({ isOpen, onClose, template, exercises, onSave, onAddExercise }: TemplateFormModalProps) {
    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [category, setCategory] = useState(template?.category || '');
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(template?.difficulty || 'intermediate');
    const [estimatedDuration, setEstimatedDuration] = useState(template?.estimatedDuration || 60);
    const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>(template?.exercises || []);
    const [showAddEx, setShowAddEx] = useState(false);
    const [newExName, setNewExName] = useState('');

    const handleAddEx = (exerciseId: string) => {
        setTemplateExercises([...templateExercises, {
            id: crypto.randomUUID(),
            exerciseId,
            defaultSets: 3,
            defaultReps: 10,
            restSeconds: 90,
            order: templateExercises.length,
        }]);
        setShowAddEx(false);
    };

    const handleCreateEx = () => {
        if (!newExName.trim()) return;
        const ex = onAddExercise({
            name: newExName,
            muscleGroups: ['full_body' as MuscleGroup],
            category: 'strength' as ExerciseCategory,
            isCustom: true,
        });
        handleAddEx(ex.id);
        setNewExName('');
    };

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            category: category.trim() || undefined,
            difficulty,
            estimatedDuration,
            exercises: templateExercises,
            isArchived: false,
        });
    };

    const getName = (id: string) => exercises.find(e => e.id === id)?.name || 'Exercise';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={template ? 'Edit Template' : 'New Template'}
            size="lg"
            footer={
                <>
                    <AuraButton variant="ghost" onClick={onClose}>Cancel</AuraButton>
                    <AuraButton variant="gold" onClick={handleSave} disabled={!name.trim()}>Save</AuraButton>
                </>
            }
        >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} autoFocus />

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Category" placeholder="Push, Pull, Legs..." value={category} onChange={(e) => setCategory(e.target.value)} />
                    <Select
                        label="Difficulty"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                        options={[
                            { value: 'beginner', label: 'Beginner' },
                            { value: 'intermediate', label: 'Intermediate' },
                            { value: 'advanced', label: 'Advanced' },
                        ]}
                    />
                </div>

                <Input
                    label="Duration (min)"
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                />

                <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                        placeholder="Description..."
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest">Exercises</label>
                        <AuraButton size="sm" variant="ghost" onClick={() => setShowAddEx(true)}>+ Add</AuraButton>
                    </div>

                    {templateExercises.length === 0 ? (
                        <p className="text-sm text-center py-4 text-gray-600">No exercises</p>
                    ) : (
                        <div className="space-y-2">
                            {templateExercises.map((ex, i) => (
                                <div key={ex.id} className="p-3 rounded-lg bg-[#141414] border border-[#2A2A2A] space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex-1 text-sm font-medium text-white">{getName(ex.exerciseId)}</span>
                                        <button
                                            onClick={() => setTemplateExercises(templateExercises.filter((_, j) => j !== i))}
                                            className="text-gray-500 hover:text-red-400 p-1"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="flex items-center gap-1">
                                            <label className="text-[10px] text-gray-500">Sets:</label>
                                            <input
                                                type="number"
                                                value={ex.defaultSets}
                                                onChange={(e) => {
                                                    const u = [...templateExercises];
                                                    u[i] = { ...u[i], defaultSets: Number(e.target.value) };
                                                    setTemplateExercises(u);
                                                }}
                                                className="w-12 text-center p-1 rounded bg-[#0A0A0A] border border-[#333] text-sm text-white"
                                                min={1}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <label className="text-[10px] text-gray-500">Reps:</label>
                                            <input
                                                type="number"
                                                value={ex.defaultReps || ''}
                                                onChange={(e) => {
                                                    const u = [...templateExercises];
                                                    u[i] = { ...u[i], defaultReps: Number(e.target.value) || undefined };
                                                    setTemplateExercises(u);
                                                }}
                                                className="w-12 text-center p-1 rounded bg-[#0A0A0A] border border-[#333] text-sm text-white"
                                                placeholder="?"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <label className="text-[10px] text-gray-500">Rest:</label>
                                            <input
                                                type="number"
                                                value={ex.restSeconds || ''}
                                                onChange={(e) => {
                                                    const u = [...templateExercises];
                                                    u[i] = { ...u[i], restSeconds: Number(e.target.value) || undefined };
                                                    setTemplateExercises(u);
                                                }}
                                                className="w-14 text-center p-1 rounded bg-[#0A0A0A] border border-[#333] text-sm text-white"
                                                placeholder="90"
                                            />
                                            <span className="text-[10px] text-gray-500">s</span>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={ex.notes || ''}
                                        onChange={(e) => {
                                            const u = [...templateExercises];
                                            u[i] = { ...u[i], notes: e.target.value || undefined };
                                            setTemplateExercises(u);
                                        }}
                                        placeholder="Notes (optional)..."
                                        className="w-full p-1.5 rounded bg-[#0A0A0A] border border-[#333] text-sm text-gray-400"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Exercise Sub-Modal */}
            <Modal isOpen={showAddEx} onClose={() => setShowAddEx(false)} title="Add Exercise" size="md">
                {exercises.length === 0 ? (
                    <div className="space-y-4">
                        <p className="text-gray-500">No exercises. Create one:</p>
                        <div className="flex gap-2">
                            <Input placeholder="Name" value={newExName} onChange={(e) => setNewExName(e.target.value)} />
                            <AuraButton variant="gold" onClick={handleCreateEx}>Create</AuraButton>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {exercises.map(ex => (
                                <button
                                    key={ex.id}
                                    onClick={() => handleAddEx(ex.id)}
                                    className="w-full text-left p-3 rounded-lg bg-[#141414] border border-[#2A2A2A] hover:border-[var(--color-accent-gold)] transition-colors"
                                >
                                    <p className="font-medium text-white">{ex.name}</p>
                                    <p className="text-xs text-gray-500">{ex.muscleGroups.join(', ')}</p>
                                </button>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-[#2A2A2A]">
                            <p className="text-sm text-gray-500 mb-2">Or create new:</p>
                            <div className="flex gap-2">
                                <Input placeholder="Name" value={newExName} onChange={(e) => setNewExName(e.target.value)} />
                                <AuraButton variant="gold" onClick={handleCreateEx} disabled={!newExName.trim()}>Create</AuraButton>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </Modal>
    );
}
