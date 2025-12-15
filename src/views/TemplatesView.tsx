/**
 * TemplatesView - Gestión de plantillas de entrenamiento
 * Con integración de generador IA
 * Rediseñado con UI Aura
 * REFACTORED: Uses new Exercise model with pattern/muscleGroup
 * REFACTORED: TemplateFormModal extracted to separate component
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input } from '../components/ui';
import {
    AuraSection,
    AuraGrid,
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraEmptyState,
} from '../components/ui/aura';
import { AthleteSelector } from '../components/session';
import { TemplateFormModal, TemplateCard } from '../components/templates';
import { useTrainingStore, useTemplates, useExercises } from '../store/store';
import { useTemplateGenerator, useAIEnabled } from '../ai';
import { useTrainingPlan } from '../hooks';
import { getRecommendedTemplates, getTemplateBadge } from '../utils/templateHelpers';
import { materializeSessionPatchFromTemplate } from '../domain/sessions/mappers';
import type { WorkoutTemplate, TemplateExercise } from '../types/types';

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
                        pattern: 'other',
                        muscleGroup: 'full',
                        tags: [],
                        isCustom: true,
                        updatedAt: new Date().toISOString(),
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
                        // Phase 16C: Use unified patch function
                        const patch = materializeSessionPatchFromTemplate(templateForSession);

                        const session = addSession({
                            name: `${templateForSession.name} - ${new Date().toLocaleDateString('es-ES')}`,
                            athleteId: athleteId,
                            templateId: patch.templateId,
                            status: 'planned',
                            exercises: patch.exercises,
                            structure: patch.structure,
                            durationMinutes: templateForSession.estimatedDuration,
                        });

                        setShowAthleteSelector(false);
                        setTemplateForSession(null);
                        // Phase 16A: Navigate to editor instead of live session
                        navigate(`/planning?tab=sessions&sessionId=${session.id}&mode=edit`);
                    }}
                />
            )}
        </div>
    );
}
