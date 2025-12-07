/**
 * AthletesList - Lista de atletas con búsqueda y gestión
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Card, Button, Input, Badge, Avatar, EmptyState, Modal } from '../components/ui';
import { useAthletes, useTrainingStore, useSessions } from '../store/store';
import type { Athlete } from '../types/types';

export function AthletesList() {
    const navigate = useNavigate();
    const athletes = useAthletes();
    const sessions = useSessions();
    const { addAthlete, deleteAthlete } = useTrainingStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAthlete, setNewAthlete] = useState({
        name: '',
        email: '',
        phone: '',
        notes: '',
    });

    // Filtrar atletas por búsqueda
    const filteredAthletes = useMemo(() => {
        if (!searchQuery.trim()) return athletes;
        const query = searchQuery.toLowerCase();
        return athletes.filter(
            (athlete) =>
                athlete.name.toLowerCase().includes(query) ||
                athlete.email?.toLowerCase().includes(query)
        );
    }, [athletes, searchQuery]);

    // Estadísticas por atleta
    const getAthleteStats = (athleteId: string) => {
        const athleteSessions = sessions.filter(s => s.athleteId === athleteId);
        const completedSessions = athleteSessions.filter(s => s.status === 'completed');
        const totalVolume = completedSessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
        const lastSession = completedSessions.sort((a, b) =>
            new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
        )[0];

        return {
            totalSessions: completedSessions.length,
            totalVolume,
            lastSessionDate: lastSession?.completedAt,
        };
    };

    // Crear nuevo atleta
    const handleCreateAthlete = () => {
        if (!newAthlete.name.trim()) return;

        addAthlete({
            name: newAthlete.name.trim(),
            email: newAthlete.email.trim() || undefined,
            phone: newAthlete.phone.trim() || undefined,
            notes: newAthlete.notes.trim() || undefined,
            isActive: true,
        });

        setNewAthlete({ name: '', email: '', phone: '', notes: '' });
        setShowAddModal(false);
    };

    // Formatear fecha relativa
    const formatRelativeDate = (dateStr?: string) => {
        if (!dateStr) return 'Nunca';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
        return date.toLocaleDateString();
    };

    return (
        <PageContainer
            title="Atletas"
            subtitle={`${athletes.length} atleta${athletes.length !== 1 ? 's' : ''} registrado${athletes.length !== 1 ? 's' : ''}`}
            actions={
                <Button onClick={() => setShowAddModal(true)}>
                    + Nuevo Atleta
                </Button>
            }
        >
            {/* Barra de búsqueda */}
            {athletes.length > 0 && (
                <div className="mb-6">
                    <Input
                        placeholder="Buscar por nombre o email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md"
                    />
                </div>
            )}

            {/* Lista de atletas */}
            {athletes.length === 0 ? (
                <Card>
                    <EmptyState
                        icon="👥"
                        title="No hay atletas registrados"
                        description="Añade tu primer atleta para comenzar a registrar sus entrenamientos."
                        action={{
                            label: 'Añadir Atleta',
                            onClick: () => setShowAddModal(true),
                        }}
                    />
                </Card>
            ) : filteredAthletes.length === 0 ? (
                <Card>
                    <EmptyState
                        icon="🔍"
                        title="Sin resultados"
                        description={`No se encontraron atletas que coincidan con "${searchQuery}"`}
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAthletes.map((athlete) => {
                        const stats = getAthleteStats(athlete.id);

                        return (
                            <AthleteCard
                                key={athlete.id}
                                athlete={athlete}
                                stats={stats}
                                formatRelativeDate={formatRelativeDate}
                                onClick={() => navigate(`/athletes/${athlete.id}`)}
                                onDelete={() => deleteAthlete(athlete.id)}
                            />
                        );
                    })}
                </div>
            )}

            {/* Modal: Añadir Atleta */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Nuevo Atleta"
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateAthlete}
                            disabled={!newAthlete.name.trim()}
                        >
                            Crear Atleta
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Nombre *"
                        placeholder="Nombre completo del atleta"
                        value={newAthlete.name}
                        onChange={(e) => setNewAthlete({ ...newAthlete, name: e.target.value })}
                        autoFocus
                    />
                    <Input
                        label="Email"
                        type="email"
                        placeholder="email@ejemplo.com"
                        value={newAthlete.email}
                        onChange={(e) => setNewAthlete({ ...newAthlete, email: e.target.value })}
                    />
                    <Input
                        label="Teléfono"
                        type="tel"
                        placeholder="+34 600 000 000"
                        value={newAthlete.phone}
                        onChange={(e) => setNewAthlete({ ...newAthlete, phone: e.target.value })}
                    />
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Notas
                        </label>
                        <textarea
                            placeholder="Notas adicionales sobre el atleta..."
                            value={newAthlete.notes}
                            onChange={(e) => setNewAthlete({ ...newAthlete, notes: e.target.value })}
                            rows={3}
                            className="input resize-none"
                        />
                    </div>
                </div>
            </Modal>
        </PageContainer>
    );
}

// Componente de tarjeta de atleta
interface AthleteCardProps {
    athlete: Athlete;
    stats: {
        totalSessions: number;
        totalVolume: number;
        lastSessionDate?: string;
    };
    formatRelativeDate: (date?: string) => string;
    onClick: () => void;
    onDelete: () => void;
}

function AthleteCard({ athlete, stats, formatRelativeDate, onClick, onDelete }: AthleteCardProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <>
            <Card
                hover
                className="relative group"
                onClick={onClick}
            >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <Avatar name={athlete.name} imageUrl={athlete.avatarUrl} size="lg" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
                            {athlete.name}
                        </h3>
                        {athlete.email && (
                            <p className="text-sm text-[var(--color-text-muted)] truncate">
                                {athlete.email}
                            </p>
                        )}
                        <Badge variant={athlete.isActive ? 'gold' : 'default'} size="sm">
                            {athlete.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[var(--color-border-default)]">
                    <div className="text-center">
                        <p className="text-lg font-bold text-[var(--color-accent-beige)]">
                            {stats.totalSessions}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">Sesiones</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-[var(--color-accent-beige)]">
                            {stats.totalVolume >= 1000
                                ? `${(stats.totalVolume / 1000).toFixed(1)}k`
                                : stats.totalVolume}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">Kg total</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                            {formatRelativeDate(stats.lastSessionDate)}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">Última</p>
                    </div>
                </div>

                {/* Delete button (appears on hover) */}
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

            {/* Delete confirmation modal */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Eliminar Atleta"
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
                    ¿Estás seguro de que quieres eliminar a <strong>{athlete.name}</strong>?
                    Esta acción no se puede deshacer.
                </p>
            </Modal>
        </>
    );
}
