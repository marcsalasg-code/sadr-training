/**
 * SessionBuilder - Constructor y gestor de sesiones de entrenamiento
 * Permite crear, editar y gestionar sesiones
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Card, Button, Input, Select, Badge, EmptyState, Modal } from '../components/ui';
import { useTrainingStore, useSessions, useAthletes, useTemplates } from '../store/store';
import type { WorkoutSession, ExerciseEntry } from '../types/types';

export function SessionBuilder() {
    const navigate = useNavigate();
    const sessions = useSessions();
    const athletes = useAthletes();
    const templates = useTemplates();
    const { addSession, deleteSession } = useTrainingStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterAthlete, setFilterAthlete] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Nueva sesión
    const [newSession, setNewSession] = useState({
        name: '',
        athleteId: '',
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

        // Si hay plantilla seleccionada, copiar ejercicios
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

        setNewSession({ name: '', athleteId: '', templateId: '', description: '', scheduledDate: '' });
        setShowCreateModal(false);
        navigate(`/sessions/live/${session.id}`);
    };

    // Obtener nombre del atleta
    const getAthleteName = (athleteId: string) => {
        return athletes.find(a => a.id === athleteId)?.name || 'Sin atleta';
    };

    return (
        <PageContainer
            title="Sesiones"
            subtitle="Gestiona las sesiones de entrenamiento"
            actions={
                <Button onClick={() => setShowCreateModal(true)}>
                    + Nueva Sesión
                </Button>
            }
        >
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6">
                <Input
                    placeholder="Buscar sesión..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                />
                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                        { value: 'all', label: 'Todos los estados' },
                        { value: 'planned', label: 'Planificadas' },
                        { value: 'in_progress', label: 'En curso' },
                        { value: 'completed', label: 'Completadas' },
                        { value: 'cancelled', label: 'Canceladas' },
                    ]}
                    className="w-48"
                />
                <Select
                    value={filterAthlete}
                    onChange={(e) => setFilterAthlete(e.target.value)}
                    options={[
                        { value: 'all', label: 'Todos los atletas' },
                        ...athletes.map(a => ({ value: a.id, label: a.name })),
                    ]}
                    className="w-48"
                />
            </div>

            {sessions.length === 0 ? (
                <Card>
                    <EmptyState
                        icon="🏋️"
                        title="No hay sesiones"
                        description="Crea tu primera sesión de entrenamiento para comenzar."
                        action={{
                            label: 'Crear Sesión',
                            onClick: () => setShowCreateModal(true),
                        }}
                    />
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* En curso */}
                    {sessionsByStatus.in_progress.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
                                En Curso ({sessionsByStatus.in_progress.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sessionsByStatus.in_progress.map(session => (
                                    <SessionCard
                                        key={session.id}
                                        session={session}
                                        athleteName={getAthleteName(session.athleteId)}
                                        onClick={() => navigate(`/sessions/live/${session.id}`)}
                                        onDelete={() => deleteSession(session.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Planificadas */}
                    {sessionsByStatus.planned.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                📅 Planificadas ({sessionsByStatus.planned.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sessionsByStatus.planned.map(session => (
                                    <SessionCard
                                        key={session.id}
                                        session={session}
                                        athleteName={getAthleteName(session.athleteId)}
                                        onClick={() => navigate(`/sessions/live/${session.id}`)}
                                        onDelete={() => deleteSession(session.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completadas */}
                    {sessionsByStatus.completed.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                ✅ Completadas ({sessionsByStatus.completed.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sessionsByStatus.completed.slice(0, 9).map(session => (
                                    <SessionCard
                                        key={session.id}
                                        session={session}
                                        athleteName={getAthleteName(session.athleteId)}
                                        onClick={() => navigate(`/sessions/live/${session.id}`)}
                                        onDelete={() => deleteSession(session.id)}
                                    />
                                ))}
                            </div>
                            {sessionsByStatus.completed.length > 9 && (
                                <p className="text-center text-[var(--color-text-muted)] mt-4">
                                    +{sessionsByStatus.completed.length - 9} sesiones más
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Crear Sesión */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Nueva Sesión"
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateSession}
                            disabled={!newSession.name.trim() || !newSession.athleteId}
                        >
                            Crear y Comenzar
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Nombre de la sesión *"
                        placeholder="Ej: Push Day, Piernas, Full Body..."
                        value={newSession.name}
                        onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                        autoFocus
                    />

                    <Select
                        label="Atleta *"
                        value={newSession.athleteId}
                        onChange={(e) => setNewSession({ ...newSession, athleteId: e.target.value })}
                        placeholder="Selecciona un atleta"
                        options={athletes.map(a => ({ value: a.id, label: a.name }))}
                    />

                    {templates.length > 0 && (
                        <Select
                            label="Plantilla (opcional)"
                            value={newSession.templateId}
                            onChange={(e) => setNewSession({ ...newSession, templateId: e.target.value })}
                            placeholder="Sin plantilla"
                            options={[
                                { value: '', label: 'Sin plantilla' },
                                ...templates.map(t => ({ value: t.id, label: t.name })),
                            ]}
                        />
                    )}

                    <Input
                        label="Fecha programada (opcional)"
                        type="date"
                        value={newSession.scheduledDate}
                        onChange={(e) => setNewSession({ ...newSession, scheduledDate: e.target.value })}
                    />

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea
                            placeholder="Notas sobre la sesión..."
                            value={newSession.description}
                            onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                            rows={2}
                            className="input resize-none"
                        />
                    </div>
                </div>
            </Modal>
        </PageContainer>
    );
}

// Componente: Session Card
interface SessionCardProps {
    session: WorkoutSession;
    athleteName: string;
    onClick: () => void;
    onDelete: () => void;
}

function SessionCard({ session, athleteName, onClick, onDelete }: SessionCardProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const statusConfig = {
        planned: { label: 'Planificada', variant: 'default' as const },
        in_progress: { label: 'En curso', variant: 'gold' as const },
        completed: { label: 'Completada', variant: 'success' as const },
        cancelled: { label: 'Cancelada', variant: 'error' as const },
    };

    const status = statusConfig[session.status];

    return (
        <>
            <Card hover className="relative group" onClick={onClick}>
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h4 className="font-semibold text-[var(--color-text-primary)]">{session.name}</h4>
                        <p className="text-sm text-[var(--color-text-muted)]">{athleteName}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                {session.status === 'completed' && (
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--color-border-default)]">
                        <div className="text-center">
                            <p className="text-lg font-bold text-[var(--color-accent-beige)]">
                                {session.exercises?.length || 0}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">Ejercicios</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-[var(--color-accent-beige)]">
                                {session.totalSets || 0}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">Series</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-[var(--color-accent-beige)]">
                                {(session.totalVolume || 0) >= 1000
                                    ? `${((session.totalVolume || 0) / 1000).toFixed(1)}k`
                                    : session.totalVolume || 0}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">Kg</p>
                        </div>
                    </div>
                )}

                {session.scheduledDate && session.status === 'planned' && (
                    <p className="text-sm text-[var(--color-accent-gold)] mt-3">
                        📅 {new Date(session.scheduledDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </p>
                )}

                {/* Delete button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </Card>

            {/* Delete confirmation */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Eliminar Sesión"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                                onDelete();
                                setShowDeleteConfirm(false);
                            }}
                        >
                            Eliminar
                        </Button>
                    </>
                }
            >
                <p className="text-[var(--color-text-secondary)]">
                    ¿Eliminar la sesión <strong>{session.name}</strong>?
                </p>
            </Modal>
        </>
    );
}
