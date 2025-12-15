/**
 * AthletesList - Lista de atletas con búsqueda y gestión
 * Rediseñado con UI Aura
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Avatar } from '../components/ui';
import {
    AuraSection,
    AuraGrid,
    AuraCard,
    AuraButton,
    AuraBadge,
    AuraPanel,
    AuraEmptyState,
} from '../components/ui/aura';
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
        pin: '',
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
            pin: newAthlete.pin.trim() || undefined,
            isActive: true,
        });

        setNewAthlete({ name: '', email: '', phone: '', notes: '', pin: '' });
        setShowAddModal(false);
    };

    // Formatear fecha relativa
    const formatRelativeDate = (dateStr?: string) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <AuraSection
                title="Athletes"
                subtitle={`${athletes.length} registered athlete${athletes.length !== 1 ? 's' : ''}`}
                action={
                    <AuraButton variant="gold" onClick={() => setShowAddModal(true)}>
                        + New Athlete
                    </AuraButton>
                }
            />

            {/* Search */}
            {athletes.length > 0 && (
                <div className="flex gap-4 p-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg">
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md"
                    />
                </div>
            )}

            {/* Athletes Grid */}
            {athletes.length === 0 ? (
                <AuraPanel>
                    <AuraEmptyState
                        icon="👥"
                        title="Your team starts here!"
                        description="Add your first athlete to start tracking their progress and gains."
                        action={{
                            label: 'Add Athlete',
                            onClick: () => setShowAddModal(true),
                        }}
                    />
                </AuraPanel>
            ) : filteredAthletes.length === 0 ? (
                <AuraPanel>
                    <AuraEmptyState
                        icon="🔍"
                        title="No matches found"
                        description={`No athletes matching "${searchQuery}". Try a different search.`}
                        size="sm"
                    />
                </AuraPanel>
            ) : (
                <AuraGrid cols={3} gap="md">
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
                </AuraGrid>
            )}

            {/* Modal: Add Athlete */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="New Athlete"
                size="md"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </AuraButton>
                        <AuraButton
                            variant="gold"
                            onClick={handleCreateAthlete}
                            disabled={!newAthlete.name.trim()}
                        >
                            Create Athlete
                        </AuraButton>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Name *"
                        placeholder="Full name"
                        value={newAthlete.name}
                        onChange={(e) => setNewAthlete({ ...newAthlete, name: e.target.value })}
                        autoFocus
                    />
                    <Input
                        label="Email"
                        type="email"
                        placeholder="email@example.com"
                        value={newAthlete.email}
                        onChange={(e) => setNewAthlete({ ...newAthlete, email: e.target.value })}
                    />
                    <Input
                        label="Phone"
                        type="tel"
                        placeholder="+1 555 000 0000"
                        value={newAthlete.phone}
                        onChange={(e) => setNewAthlete({ ...newAthlete, phone: e.target.value })}
                    />
                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                            Notes
                        </label>
                        <textarea
                            placeholder="Additional notes..."
                            value={newAthlete.notes}
                            onChange={(e) => setNewAthlete({ ...newAthlete, notes: e.target.value })}
                            rows={3}
                            className="w-full bg-[#0A0A0A] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                        />
                    </div>

                    <div className="pt-4 border-t border-[#2A2A2A]">
                        <p className="text-xs text-gray-500 mb-3">Access Control</p>
                        <Input
                            label="Login PIN (Optional)"
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 1234"
                            maxLength={6}
                            value={newAthlete.pin || ''}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setNewAthlete({ ...newAthlete, pin: val });
                            }}
                        />
                        <p className="text-[10px] text-gray-600 mt-1">
                            Used for athlete to log in to their personal view.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Athlete Card Component
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
            <AuraCard hover className="relative group" onClick={onClick}>
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <Avatar name={athlete.name} imageUrl={athlete.avatarUrl} size="lg" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{athlete.name}</h3>
                        {athlete.email && (
                            <p className="text-xs text-gray-500 truncate">{athlete.email}</p>
                        )}
                        <AuraBadge variant={athlete.isActive ? 'gold' : 'muted'} size="sm">
                            {athlete.isActive ? 'Active' : 'Inactive'}
                        </AuraBadge>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#2A2A2A]">
                    <div className="text-center">
                        <p className="text-lg font-mono text-[var(--color-accent-gold)]">
                            {stats.totalSessions}
                        </p>
                        <p className="text-[9px] text-gray-500 uppercase">Sessions</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-mono text-[var(--color-accent-gold)]">
                            {stats.totalVolume >= 1000
                                ? `${(stats.totalVolume / 1000).toFixed(1)}k`
                                : stats.totalVolume}
                        </p>
                        <p className="text-[9px] text-gray-500 uppercase">Total Kg</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-mono text-gray-400">
                            {formatRelativeDate(stats.lastSessionDate)}
                        </p>
                        <p className="text-[9px] text-gray-500 uppercase">Last</p>
                    </div>
                </div>

                {/* Delete button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded bg-[#1A1A1A] text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </AuraCard>

            {/* Delete Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Delete Athlete"
                size="sm"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                        </AuraButton>
                        <AuraButton
                            variant="secondary"
                            className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                            onClick={() => {
                                onDelete();
                                setShowDeleteConfirm(false);
                            }}
                        >
                            Delete
                        </AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">
                    Delete <strong className="text-white">{athlete.name}</strong>? This cannot be undone.
                </p>
            </Modal>
        </>
    );
}
