/**
 * TemplatesView - Gestión de plantillas de entrenamiento
 * Con integración de generador IA
 */

import { useState, useMemo } from 'react';
import { PageContainer } from '../components/layout';
import { Card, Button, Input, Badge, EmptyState, Modal, Select } from '../components/ui';
import { useTrainingStore, useTemplates, useExercises } from '../store/store';
import { useTemplateGenerator, useAIEnabled } from '../ai';
import type { WorkoutTemplate, TemplateExercise, MuscleGroup, ExerciseCategory, Exercise } from '../types/types';

export function TemplatesView() {
    const templates = useTemplates();
    const exercises = useExercises();
    const { addTemplate, updateTemplate, deleteTemplate, addExercise } = useTrainingStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Generar plantilla con IA
    const handleGenerateTemplate = async () => {
        if (!aiPrompt.trim()) return;
        const result = await generate(aiPrompt);
        if (result) {
            // Crear ejercicios si no existen y mapear la plantilla
            const templateExercises: TemplateExercise[] = result.exercises.map((ex, i) => {
                // Buscar ejercicio existente o crear uno nuevo
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
        <PageContainer
            title="Plantillas"
            subtitle={`${templates.length} plantilla${templates.length !== 1 ? 's' : ''}`}
            actions={
                <div className="flex gap-2">
                    {aiEnabled && (
                        <Button variant="ghost" onClick={() => setShowAIModal(true)}>
                            🤖 Crear con IA
                        </Button>
                    )}
                    <Button onClick={() => setShowCreateModal(true)}>+ Nueva Plantilla</Button>
                </div>
            }
        >
            {templates.length > 0 && (
                <div className="mb-6">
                    <Input
                        placeholder="Buscar plantillas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md"
                    />
                </div>
            )}

            {templates.length === 0 ? (
                <Card>
                    <EmptyState
                        icon="📋"
                        title="Sin plantillas"
                        description={aiEnabled ? "Crea plantillas manualmente o genera una con IA." : "Crea plantillas para reutilizar entrenamientos."}
                        action={{ label: aiEnabled ? '🤖 Crear con IA' : 'Crear Plantilla', onClick: () => aiEnabled ? setShowAIModal(true) : setShowCreateModal(true) }}
                    />
                </Card>
            ) : filteredTemplates.length === 0 ? (
                <Card>
                    <EmptyState icon="🔍" title="Sin resultados" description={`No hay plantillas que coincidan con "${searchQuery}"`} />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            exercises={exercises}
                            onEdit={() => setEditingTemplate(template)}
                            onDelete={() => deleteTemplate(template.id)}
                            onDuplicate={() => {
                                addTemplate({
                                    name: `${template.name} (copia)`,
                                    description: template.description,
                                    category: template.category,
                                    difficulty: template.difficulty,
                                    estimatedDuration: template.estimatedDuration,
                                    exercises: template.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() })),
                                    tags: template.tags,
                                    isArchived: false,
                                });
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Modal de Creación Manual */}
            <TemplateFormModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                exercises={exercises}
                onSave={(data) => { addTemplate(data); setShowCreateModal(false); }}
                onAddExercise={addExercise}
            />

            {/* Modal de Edición */}
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

            {/* Modal de Generación IA */}
            <Modal
                isOpen={showAIModal}
                onClose={() => { setShowAIModal(false); setAIPrompt(''); }}
                title="🤖 Generar Plantilla con IA"
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowAIModal(false)}>Cancelar</Button>
                        <Button onClick={handleGenerateTemplate} disabled={isGenerating || !aiPrompt.trim()}>
                            {isGenerating ? '⏳ Generando...' : '✨ Generar'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-[var(--color-text-muted)]">
                        Describe la plantilla que quieres crear. La IA generará una rutina completa basada en tu descripción.
                    </p>

                    <textarea
                        value={aiPrompt}
                        onChange={(e) => setAIPrompt(e.target.value)}
                        placeholder="Ej: Rutina de fuerza para principiantes, enfocada en tren superior, 3 días por semana..."
                        rows={4}
                        className="input resize-none"
                        autoFocus
                    />

                    {/* Suggestions */}
                    <div className="flex flex-wrap gap-2">
                        {['Fuerza upper body', 'Hipertrofia piernas', 'Full body principiante', 'Push-Pull-Legs'].map(suggestion => (
                            <button
                                key={suggestion}
                                onClick={() => setAIPrompt(suggestion)}
                                className="text-xs px-3 py-1 rounded-full bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]"
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
                            ✓ Plantilla "{lastGenerated.name}" generada con {lastGenerated.exercises.length} ejercicios
                        </div>
                    )}
                </div>
            </Modal>
        </PageContainer>
    );
}

// Template Card
interface TemplateCardProps {
    template: WorkoutTemplate;
    exercises: Exercise[];
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

function TemplateCard({ template, exercises, onEdit, onDelete, onDuplicate }: TemplateCardProps) {
    const [showDelete, setShowDelete] = useState(false);
    const getName = (id: string) => exercises.find(e => e.id === id)?.name || 'Ejercicio';

    return (
        <>
            <Card hover className="relative group" onClick={onEdit}>
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        {template.category && <Badge size="sm" variant="gold">{template.category}</Badge>}
                    </div>
                    {template.difficulty && (
                        <Badge size="sm" variant={template.difficulty === 'beginner' ? 'success' : template.difficulty === 'intermediate' ? 'warning' : 'error'}>
                            {template.difficulty === 'beginner' ? 'Fácil' : template.difficulty === 'intermediate' ? 'Medio' : 'Difícil'}
                        </Badge>
                    )}
                </div>
                {template.description && <p className="text-sm text-[var(--color-text-muted)] mb-3">{template.description}</p>}
                <div className="space-y-1 mb-3">
                    {template.exercises.slice(0, 3).map(ex => (
                        <div key={ex.id} className="text-sm text-[var(--color-text-secondary)]">• {getName(ex.exerciseId)} ({ex.defaultSets}x{ex.defaultReps || '?'})</div>
                    ))}
                    {template.exercises.length > 3 && <p className="text-xs text-[var(--color-text-muted)]">+{template.exercises.length - 3} más</p>}
                </div>
                <div className="flex gap-4 pt-3 border-t border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
                    <span>📋 {template.exercises.length} ejercicios</span>
                    {template.estimatedDuration && <span>⏱️ ~{template.estimatedDuration}min</span>}
                </div>
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-accent-gold)]" title="Duplicar">📝</button>
                    <button onClick={(e) => { e.stopPropagation(); setShowDelete(true); }} className="p-2 rounded-lg hover:text-red-400" title="Eliminar">🗑️</button>
                </div>
            </Card>
            <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Eliminar" size="sm" footer={<><Button variant="ghost" onClick={() => setShowDelete(false)}>Cancelar</Button><Button className="bg-red-600" onClick={() => { onDelete(); setShowDelete(false); }}>Eliminar</Button></>}>
                <p>¿Eliminar <strong>{template.name}</strong>?</p>
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
        onSave({ name: name.trim(), description: description.trim() || undefined, category: category.trim() || undefined, difficulty, estimatedDuration, exercises: templateExercises, isArchived: false });
    };

    const getName = (id: string) => exercises.find(e => e.id === id)?.name || 'Ejercicio';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={template ? 'Editar Plantilla' : 'Nueva Plantilla'} size="lg" footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} disabled={!name.trim()}>Guardar</Button></>}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <Input label="Nombre *" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Categoría" placeholder="Push, Pull, Legs..." value={category} onChange={(e) => setCategory(e.target.value)} />
                    <Select label="Dificultad" value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')} options={[{ value: 'beginner', label: 'Principiante' }, { value: 'intermediate', label: 'Intermedio' }, { value: 'advanced', label: 'Avanzado' }]} />
                </div>
                <Input label="Duración (min)" type="number" value={estimatedDuration} onChange={(e) => setEstimatedDuration(Number(e.target.value))} />
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Descripción</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input resize-none" placeholder="Descripción..." />
                </div>
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Ejercicios</label>
                        <Button size="sm" variant="ghost" onClick={() => setShowAddEx(true)}>+ Añadir</Button>
                    </div>
                    {templateExercises.length === 0 ? (
                        <p className="text-sm text-center py-4 text-[var(--color-text-muted)]">Sin ejercicios</p>
                    ) : (
                        <div className="space-y-2">
                            {templateExercises.map((ex, i) => (
                                <div key={ex.id} className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex-1 text-sm font-medium">{getName(ex.exerciseId)}</span>
                                        <button onClick={() => setTemplateExercises(templateExercises.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 p-1">✕</button>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="flex items-center gap-1">
                                            <label className="text-xs text-[var(--color-text-muted)]">Series:</label>
                                            <input type="number" value={ex.defaultSets} onChange={(e) => { const u = [...templateExercises]; u[i] = { ...u[i], defaultSets: Number(e.target.value) }; setTemplateExercises(u); }} className="w-14 text-center p-1 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-sm" min={1} />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <label className="text-xs text-[var(--color-text-muted)]">Reps:</label>
                                            <input type="number" value={ex.defaultReps || ''} onChange={(e) => { const u = [...templateExercises]; u[i] = { ...u[i], defaultReps: Number(e.target.value) || undefined }; setTemplateExercises(u); }} className="w-14 text-center p-1 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-sm" placeholder="?" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <label className="text-xs text-[var(--color-text-muted)]">Desc:</label>
                                            <input type="number" value={ex.restSeconds || ''} onChange={(e) => { const u = [...templateExercises]; u[i] = { ...u[i], restSeconds: Number(e.target.value) || undefined }; setTemplateExercises(u); }} className="w-16 text-center p-1 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-sm" placeholder="90" />
                                            <span className="text-xs text-[var(--color-text-muted)]">s</span>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        value={ex.notes || ''}
                                        onChange={(e) => { const u = [...templateExercises]; u[i] = { ...u[i], notes: e.target.value || undefined }; setTemplateExercises(u); }}
                                        placeholder="Notas (opcional)..."
                                        className="w-full p-1.5 rounded bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] text-sm text-[var(--color-text-muted)]"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Modal isOpen={showAddEx} onClose={() => setShowAddEx(false)} title="Añadir Ejercicio" size="md">
                {exercises.length === 0 ? (
                    <div className="space-y-4">
                        <p className="text-[var(--color-text-muted)]">No hay ejercicios. Crea uno:</p>
                        <div className="flex gap-2">
                            <Input placeholder="Nombre" value={newExName} onChange={(e) => setNewExName(e.target.value)} />
                            <Button onClick={handleCreateEx}>Crear</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {exercises.map(ex => (
                                <button key={ex.id} onClick={() => handleAddEx(ex.id)} className="w-full text-left p-3 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-elevated)]">
                                    <p className="font-medium">{ex.name}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">{ex.muscleGroups.join(', ')}</p>
                                </button>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-[var(--color-border-default)]">
                            <p className="text-sm text-[var(--color-text-muted)] mb-2">O crea uno nuevo:</p>
                            <div className="flex gap-2">
                                <Input placeholder="Nombre" value={newExName} onChange={(e) => setNewExName(e.target.value)} />
                                <Button onClick={handleCreateEx} disabled={!newExName.trim()}>Crear</Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </Modal>
    );
}
