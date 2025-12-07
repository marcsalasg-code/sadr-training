/**
 * AthleteDetail - Vista detallada de un atleta
 * Muestra perfil, historial de sesiones y estadísticas
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Card, Button, Input, Badge, Avatar, Tabs, EmptyState, Modal } from '../components/ui';
import { useTrainingStore, useSessions } from '../store/store';
import type { Athlete } from '../types/types';

export function AthleteDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getAthlete, updateAthlete, deleteAthlete } = useTrainingStore();
    const sessions = useSessions();

    const athlete = getAthlete(id || '');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Athlete>>({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Sesiones del atleta
    const athleteSessions = useMemo(() => {
        if (!athlete) return [];
        return sessions
            .filter(s => s.athleteId === athlete.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [sessions, athlete]);

    // Estadísticas
    const stats = useMemo(() => {
        const completed = athleteSessions.filter(s => s.status === 'completed');
        const totalVolume = completed.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
        const totalSets = completed.reduce((sum, s) => sum + (s.totalSets || 0), 0);
        const totalDuration = completed.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

        // Sesiones por mes (últimos 6 meses)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recentSessions = completed.filter(s =>
            s.completedAt && new Date(s.completedAt) > sixMonthsAgo
        );

        return {
            totalSessions: completed.length,
            totalVolume,
            totalSets,
            avgDuration: completed.length > 0 ? Math.round(totalDuration / completed.length) : 0,
            recentSessions: recentSessions.length,
            avgVolumePerSession: completed.length > 0 ? Math.round(totalVolume / completed.length) : 0,
        };
    }, [athleteSessions]);

    if (!athlete) {
        return (
            <PageContainer title="Atleta no encontrado" subtitle="">
                <Card>
                    <EmptyState
                        icon="❌"
                        title="Atleta no encontrado"
                        description="El atleta que buscas no existe o ha sido eliminado."
                        action={{
                            label: 'Volver a la lista',
                            onClick: () => navigate('/athletes'),
                        }}
                    />
                </Card>
            </PageContainer>
        );
    }

    // Iniciar edición
    const handleStartEdit = () => {
        setEditData({
            name: athlete.name,
            email: athlete.email || '',
            phone: athlete.phone || '',
            birthDate: athlete.birthDate || '',
            goals: athlete.goals || '',
            injuries: athlete.injuries || '',
            notes: athlete.notes || '',
        });
        setIsEditing(true);
    };

    // Guardar cambios
    const handleSave = () => {
        updateAthlete(athlete.id, {
            ...editData,
            email: editData.email?.trim() || undefined,
            phone: editData.phone?.trim() || undefined,
        });
        setIsEditing(false);
    };

    // Eliminar atleta
    const handleDelete = () => {
        deleteAthlete(athlete.id);
        navigate('/athletes');
    };

    // Formatear fecha
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const tabs = [
        {
            id: 'overview',
            label: 'Resumen',
            icon: '📊',
            content: (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatBox label="Sesiones" value={stats.totalSessions} icon="🏋️" />
                        <StatBox label="Volumen Total" value={`${(stats.totalVolume / 1000).toFixed(1)}k kg`} icon="📈" />
                        <StatBox label="Series Totales" value={stats.totalSets} icon="🔢" />
                        <StatBox label="Duración Media" value={`${stats.avgDuration} min`} icon="⏱️" />
                    </div>

                    {/* Información adicional */}
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Información del Atleta</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoRow label="Email" value={athlete.email || '-'} />
                            <InfoRow label="Teléfono" value={athlete.phone || '-'} />
                            <InfoRow label="Fecha de nacimiento" value={formatDate(athlete.birthDate)} />
                            <InfoRow label="Registrado" value={formatDate(athlete.createdAt)} />
                        </div>
                    </Card>

                    {/* Objetivos */}
                    {athlete.goals && (
                        <Card>
                            <h3 className="text-lg font-semibold mb-2">🎯 Objetivos</h3>
                            <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap">
                                {athlete.goals}
                            </p>
                        </Card>
                    )}

                    {/* Lesiones/Notas médicas */}
                    {athlete.injuries && (
                        <Card className="border-amber-500/30">
                            <h3 className="text-lg font-semibold mb-2 text-amber-400">⚠️ Lesiones / Limitaciones</h3>
                            <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap">
                                {athlete.injuries}
                            </p>
                        </Card>
                    )}

                    {/* Notas */}
                    {athlete.notes && (
                        <Card>
                            <h3 className="text-lg font-semibold mb-2">📝 Notas</h3>
                            <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap">
                                {athlete.notes}
                            </p>
                        </Card>
                    )}
                </div>
            ),
        },
        {
            id: 'sessions',
            label: 'Sesiones',
            icon: '📋',
            content: (
                <div className="space-y-4">
                    {athleteSessions.length === 0 ? (
                        <EmptyState
                            icon="🏋️"
                            title="Sin sesiones"
                            description="Este atleta aún no tiene sesiones registradas."
                            action={{
                                label: 'Crear Sesión',
                                onClick: () => navigate('/sessions'),
                            }}
                        />
                    ) : (
                        athleteSessions.map((session) => (
                            <Card key={session.id} hover onClick={() => navigate(`/sessions/live/${session.id}`)}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold">{session.name}</h4>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            {formatDate(session.completedAt || session.scheduledDate || session.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={
                                            session.status === 'completed' ? 'success' :
                                                session.status === 'in_progress' ? 'gold' :
                                                    session.status === 'cancelled' ? 'error' : 'default'
                                        }>
                                            {session.status === 'completed' ? 'Completada' :
                                                session.status === 'in_progress' ? 'En curso' :
                                                    session.status === 'cancelled' ? 'Cancelada' : 'Planificada'}
                                        </Badge>
                                        {session.totalVolume && (
                                            <span className="text-[var(--color-accent-beige)] font-semibold">
                                                {session.totalVolume.toLocaleString()} kg
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            ),
        },
    ];

    return (
        <PageContainer
            title={athlete.name}
            subtitle={athlete.isActive ? 'Atleta activo' : 'Atleta inactivo'}
            actions={
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate('/athletes')}>
                        ← Volver
                    </Button>
                    <Button variant="secondary" onClick={handleStartEdit}>
                        ✏️ Editar
                    </Button>
                    <Button variant="secondary" className="text-red-400" onClick={() => setShowDeleteModal(true)}>
                        🗑️
                    </Button>
                </div>
            }
        >
            {/* Header con avatar */}
            <div className="flex items-center gap-6 mb-8">
                <Avatar name={athlete.name} imageUrl={athlete.avatarUrl} size="lg" />
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold">{athlete.name}</h2>
                        <Badge variant={athlete.isActive ? 'gold' : 'default'}>
                            {athlete.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>
                    {athlete.email && (
                        <p className="text-[var(--color-text-muted)]">{athlete.email}</p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs tabs={tabs} />

            {/* Modal: Editar */}
            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title="Editar Atleta"
                size="lg"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave}>
                            Guardar Cambios
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Nombre"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Email"
                            type="email"
                            value={editData.email || ''}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        />
                        <Input
                            label="Teléfono"
                            type="tel"
                            value={editData.phone || ''}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Fecha de nacimiento"
                        type="date"
                        value={editData.birthDate || ''}
                        onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                    />
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Objetivos
                        </label>
                        <textarea
                            value={editData.goals || ''}
                            onChange={(e) => setEditData({ ...editData, goals: e.target.value })}
                            rows={3}
                            className="input resize-none"
                            placeholder="Objetivos del atleta..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Lesiones / Limitaciones
                        </label>
                        <textarea
                            value={editData.injuries || ''}
                            onChange={(e) => setEditData({ ...editData, injuries: e.target.value })}
                            rows={2}
                            className="input resize-none"
                            placeholder="Lesiones o limitaciones a tener en cuenta..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Notas
                        </label>
                        <textarea
                            value={editData.notes || ''}
                            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                            rows={2}
                            className="input resize-none"
                            placeholder="Notas adicionales..."
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal: Eliminar */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Eliminar Atleta"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                            Cancelar
                        </Button>
                        <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                            Eliminar
                        </Button>
                    </>
                }
            >
                <p className="text-[var(--color-text-secondary)]">
                    ¿Estás seguro de que quieres eliminar a <strong>{athlete.name}</strong>?
                    Se eliminarán también todas sus sesiones asociadas.
                </p>
            </Modal>
        </PageContainer>
    );
}

// Componente auxiliar: Stat Box
function StatBox({ label, value, icon }: { label: string; value: string | number; icon: string }) {
    return (
        <Card className="text-center">
            <span className="text-2xl mb-2 block">{icon}</span>
            <p className="text-xl font-bold text-[var(--color-accent-beige)]">{value}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        </Card>
    );
}

// Componente auxiliar: Info Row
function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
            <p className="font-medium">{value}</p>
        </div>
    );
}
