/**
 * AthleteDetail - Vista detallada de un atleta
 * Muestra perfil, historial de sesiones, estadísticas y gráficos
 * 
 * REFACTORED: Chart and row components extracted to components/athletes/
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Input } from '../components/ui';
import {
    AuraSection,
    AuraGrid,
    AuraPanel,
    AuraCard,
    AuraButton,
    AuraBadge,
    AuraMetric,
    AuraEmptyState,
    AuraTabs,
    AuraDivider,
} from '../components/ui/aura';
import { OneRMSection } from '../components/common/OneRMSection';
import { StrengthProgress } from '../components/common/StrengthProgress';
import {
    WeeklyVolumeChart,
    MonthlySessionsChart,
    IntensityFatigueTrend,
    AthleteSessionRow,
    InfoRow,
    SESSION_STATUS_COLORS,
    SESSION_STATUS_LABELS,
} from '../components/athletes';
import { useTrainingStore, useSessions, useExercises } from '../store/store';
import { calculateBMI, getBMICategory, experienceLevelLabels } from '../utils';
import { getAthleteIntensityFatigueSeries } from '../utils/metrics';
import {
    filterSessionsByAthlete,
    filterCompletedSessions,
    calculateTotalVolume,
    calculateAvgDuration,
} from '../utils/dashboardMetrics';
import type { Athlete, WorkoutSession } from '../types/types';

export function AthleteDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getAthlete, updateAthlete, deleteAthlete } = useTrainingStore();
    const sessions = useSessions();
    const exercises = useExercises();

    const athlete = getAthlete(id || '');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Athlete>>({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

    // Sesiones del atleta - using centralized filter
    const athleteSessions = useMemo(() => {
        if (!athlete) return [];
        return filterSessionsByAthlete(sessions, athlete.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [sessions, athlete]);

    // Estadísticas - using centralized calculations
    const stats = useMemo(() => {
        const completed = filterCompletedSessions(athleteSessions);
        const totalVolume = calculateTotalVolume(completed);
        const totalSets = completed.reduce((sum, s) => sum + (s.totalSets || 0), 0);

        return {
            totalSessions: completed.length,
            totalVolume,
            totalSets,
            avgDuration: calculateAvgDuration(completed),
            avgVolumePerSession: completed.length > 0 ? Math.round(totalVolume / completed.length) : 0,
        };
    }, [athleteSessions]);

    // NEW: Weekly volume data (last 8 weeks)
    const weeklyVolumeData = useMemo(() => {
        const weeks: { label: string; volume: number }[] = [];
        const now = new Date();

        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);

            const weekVolume = athleteSessions
                .filter(s => s.status === 'completed' && s.completedAt)
                .filter(s => {
                    const date = new Date(s.completedAt!);
                    return date >= weekStart && date < weekEnd;
                })
                .reduce((sum, s) => sum + (s.totalVolume || 0), 0);

            weeks.push({
                label: `W${8 - i}`,
                volume: weekVolume,
            });
        }

        return weeks;
    }, [athleteSessions]);

    // NEW: Monthly sessions count (last 6 months)
    const monthlySessionsData = useMemo(() => {
        const months: { label: string; count: number }[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthCount = athleteSessions
                .filter(s => s.status === 'completed' && s.completedAt)
                .filter(s => {
                    const date = new Date(s.completedAt!);
                    return date >= monthStart && date <= monthEnd;
                })
                .length;

            months.push({
                label: monthStart.toLocaleDateString('es-ES', { month: 'short' }),
                count: monthCount,
            });
        }

        return months;
    }, [athleteSessions]);

    // NEW: Intensity vs Fatigue trend data
    const intensityFatigueData = useMemo(() => {
        if (!athlete) return [];
        return getAthleteIntensityFatigueSeries(athleteSessions, athlete.id);
    }, [athleteSessions, athlete]);

    if (!athlete) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <AuraPanel>
                    <AuraEmptyState
                        icon="❌"
                        title="Atleta no encontrado"
                        description="El atleta que buscas no existe o ha sido eliminado."
                        action={{
                            label: 'Volver a la lista',
                            onClick: () => navigate('/athletes'),
                        }}
                    />
                </AuraPanel>
            </div>
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
            // Physical Data (FASE A)
            heightCm: athlete.heightCm,
            currentWeightKg: athlete.currentWeightKg,
            experienceLevel: athlete.experienceLevel,
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

    // Use imported constants from components/athletes
    const statusColors = SESSION_STATUS_COLORS;
    const statusLabels = SESSION_STATUS_LABELS;

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <AuraSection
                title={athlete.name}
                subtitle={athlete.isActive ? 'Atleta activo' : 'Atleta inactivo'}
                action={
                    <div className="flex items-center gap-2">
                        <AuraButton variant="ghost" onClick={() => navigate('/athletes')}>
                            ← Volver
                        </AuraButton>
                        <AuraButton variant="secondary" onClick={handleStartEdit}>
                            ✏️ Editar
                        </AuraButton>
                        <AuraButton
                            variant="ghost"
                            className="!text-red-400 hover:!bg-red-400/10"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            🗑️
                        </AuraButton>
                    </div>
                }
            />

            {/* Avatar + Status */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent-gold)] to-[#8B7355] flex items-center justify-center text-2xl font-bold text-black">
                    {athlete.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <AuraBadge variant={athlete.isActive ? 'gold' : 'muted'}>
                            {athlete.isActive ? 'Activo' : 'Inactivo'}
                        </AuraBadge>
                        {athlete.injuries && <AuraBadge variant="warning">⚠️ Lesiones</AuraBadge>}
                    </div>
                    {athlete.email && <p className="text-sm text-gray-500 mt-1">{athlete.email}</p>}
                </div>
            </div>

            {/* Physical Data Section (FASE A) */}
            <AuraPanel header={<span className="text-white text-sm font-medium">📏 Datos Físicos</span>}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-[#141414]">
                        <p className="text-2xl font-mono text-[var(--color-accent-gold)]">
                            {athlete.heightCm ? `${athlete.heightCm}` : '-'}
                        </p>
                        <p className="text-xs text-gray-500">Altura (cm)</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[#141414]">
                        <p className="text-2xl font-mono text-[var(--color-accent-gold)]">
                            {athlete.currentWeightKg ? `${athlete.currentWeightKg}` : '-'}
                        </p>
                        <p className="text-xs text-gray-500">Peso (kg)</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[#141414]">
                        <p className="text-2xl font-mono text-white">
                            {athlete.heightCm && athlete.currentWeightKg
                                ? calculateBMI(athlete.currentWeightKg, athlete.heightCm)
                                : '-'}
                        </p>
                        <p className="text-xs text-gray-500">
                            IMC {athlete.heightCm && athlete.currentWeightKg && (
                                <span className="text-[var(--color-accent-gold)]">
                                    ({getBMICategory(calculateBMI(athlete.currentWeightKg, athlete.heightCm))})
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[#141414]">
                        <p className="text-lg font-medium text-white">
                            {athlete.experienceLevel
                                ? experienceLevelLabels[athlete.experienceLevel]?.split(' ')[0] || athlete.experienceLevel
                                : '-'}
                        </p>
                        <p className="text-xs text-gray-500">Nivel</p>
                    </div>
                </div>

                {/* Personal Records Preview */}
                {athlete.personalRecords && Object.keys(athlete.personalRecords).length > 0 && (
                    <>
                        <AuraDivider className="my-4" />
                        <div>
                            <p className="text-xs text-gray-500 mb-2">🏆 Records Personales (Top 3)</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(athlete.personalRecords)
                                    .sort((a, b) => b[1].estimated1RM - a[1].estimated1RM)
                                    .slice(0, 3)
                                    .map(([exId, pr]) => (
                                        <AuraBadge key={exId} variant="gold" size="sm">
                                            {pr.weight}kg × {pr.reps} = {pr.estimated1RM}kg 1RM
                                        </AuraBadge>
                                    ))}
                            </div>
                        </div>
                    </>
                )}
            </AuraPanel>

            {/* 1RM Section (Sistema 1RM) */}
            <OneRMSection
                athlete={athlete}
                exercises={exercises}
                sessions={sessions}
                onUpdateAthlete={updateAthlete}
            />

            {/* Strength Progress Trends (Sprint 5) */}
            <AuraPanel header={<div><h3 className="text-white font-medium">Strength Progress</h3><p className="text-xs text-gray-500">1RM trends over time</p></div>}>
                <StrengthProgress athlete={athlete} compact={false} />
            </AuraPanel>

            {/* Intensity vs Fatigue Trend (Sprint Intensity-Fatigue) */}
            {intensityFatigueData.length > 0 && (
                <AuraPanel header={<div><h3 className="text-white font-medium">⚡ Intensidad vs Fatiga</h3><p className="text-xs text-gray-500">Últimas sesiones</p></div>}>
                    <IntensityFatigueTrend data={intensityFatigueData} />
                </AuraPanel>
            )}

            {/* Main Stats */}
            <AuraGrid cols={4} gap="md">
                <AuraMetric
                    label="Sesiones Completadas"
                    value={stats.totalSessions}
                    icon={<span className="text-xl">🏋️</span>}
                />
                <AuraMetric
                    label="Volumen Total"
                    value={`${(stats.totalVolume / 1000).toFixed(1)}K`}
                    icon={<span className="text-xl">📈</span>}
                />
                <AuraMetric
                    label="Series Totales"
                    value={stats.totalSets}
                    icon={<span className="text-xl">🔢</span>}
                />
                <AuraMetric
                    label="Duración Media"
                    value={`${stats.avgDuration} min`}
                    icon={<span className="text-xl">⏱️</span>}
                />
            </AuraGrid>

            {/* Charts Row */}
            <AuraGrid cols={2} gap="lg">
                {/* Weekly Volume Chart */}
                <AuraPanel header={<span className="text-white text-sm font-medium">📊 Volumen Semanal (8 semanas)</span>}>
                    <WeeklyVolumeChart data={weeklyVolumeData} />
                </AuraPanel>

                {/* Monthly Sessions Chart */}
                <AuraPanel header={<span className="text-white text-sm font-medium">📅 Sesiones por Mes (6 meses)</span>}>
                    <MonthlySessionsChart data={monthlySessionsData} />
                </AuraPanel>
            </AuraGrid>

            {/* Tabs: Info & Sessions */}
            <AuraTabs
                tabs={[
                    { id: 'info', label: 'Información' },
                    { id: 'sessions', label: `Sesiones (${athleteSessions.length})` },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            {/* Tab Content */}
            {activeTab === 'info' && (
                <div className="space-y-4 pt-4">
                    <AuraPanel header={<span className="text-white text-sm">Datos de Contacto</span>}>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow label="Email" value={athlete.email || '-'} />
                            <InfoRow label="Teléfono" value={athlete.phone || '-'} />
                            <InfoRow label="Fecha de nacimiento" value={formatDate(athlete.birthDate)} />
                            <InfoRow label="Registrado" value={formatDate(athlete.createdAt)} />
                        </div>
                    </AuraPanel>

                    {athlete.goals && (
                        <AuraPanel header={<span className="text-white text-sm">🎯 Objetivos</span>}>
                            <p className="text-gray-400 whitespace-pre-wrap">{athlete.goals}</p>
                        </AuraPanel>
                    )}

                    {athlete.injuries && (
                        <AuraPanel
                            header={<span className="text-yellow-400 text-sm">⚠️ Lesiones / Limitaciones</span>}
                            className="border-yellow-600/30"
                        >
                            <p className="text-gray-400 whitespace-pre-wrap">{athlete.injuries}</p>
                        </AuraPanel>
                    )}

                    {athlete.notes && (
                        <AuraPanel header={<span className="text-white text-sm">📝 Notas</span>}>
                            <p className="text-gray-400 whitespace-pre-wrap">{athlete.notes}</p>
                        </AuraPanel>
                    )}

                    {/* Custom Fields Section */}
                    <AuraPanel
                        header={
                            <div className="flex items-center justify-between w-full">
                                <span className="text-white text-sm">🏷️ Campos Personalizados</span>
                                <AuraButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const key = prompt('Nombre del campo:');
                                        if (!key?.trim()) return;
                                        const value = prompt('Valor:');
                                        if (value === null) return;
                                        updateAthlete(athlete.id, {
                                            customFields: {
                                                ...athlete.customFields,
                                                [key.trim()]: value,
                                            },
                                        });
                                    }}
                                >
                                    + Añadir
                                </AuraButton>
                            </div>
                        }
                    >
                        {athlete.customFields && Object.keys(athlete.customFields).length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(athlete.customFields).map(([key, value]) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between p-2 rounded bg-[#141414] group"
                                    >
                                        <div>
                                            <p className="text-xs text-gray-500">{key}</p>
                                            <p className="text-sm text-white">
                                                {typeof value === 'boolean'
                                                    ? (value ? '✓ Sí' : '✗ No')
                                                    : String(value)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (!confirm(`¿Eliminar "${key}"?`)) return;
                                                const newFields = { ...athlete.customFields };
                                                delete newFields[key];
                                                updateAthlete(athlete.id, { customFields: newFields });
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition-opacity"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                                No hay campos personalizados. Haz clic en "+ Añadir" para crear uno.
                            </p>
                        )}
                    </AuraPanel>
                </div>
            )}

            {activeTab === 'sessions' && (
                <div className="space-y-3 pt-4">
                    {athleteSessions.length === 0 ? (
                        <AuraEmptyState
                            icon="🏋️"
                            title="Sin sesiones"
                            description="Este atleta aún no tiene sesiones registradas."
                            action={{
                                label: 'Crear Sesión',
                                onClick: () => navigate('/templates'),
                            }}
                        />
                    ) : (
                        athleteSessions.slice(0, 10).map((session) => (
                            <AthleteSessionRow
                                key={session.id}
                                session={session}
                                formatDate={formatDate}
                                statusColors={statusColors}
                                statusLabels={statusLabels}
                                onClick={() => navigate(`/sessions/live/${session.id}`)}
                            />
                        ))
                    )}
                    {athleteSessions.length > 10 && (
                        <p className="text-center text-sm text-gray-500 py-2">
                            +{athleteSessions.length - 10} sesiones más
                        </p>
                    )}
                </div>
            )}

            {/* Modal: Editar */}
            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title="Editar Atleta"
                size="lg"
                footer={
                    <>
                        <AuraButton variant="ghost" onClick={() => setIsEditing(false)}>
                            Cancelar
                        </AuraButton>
                        <AuraButton variant="gold" onClick={handleSave}>
                            Guardar Cambios
                        </AuraButton>
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

                    {/* Physical Data Inputs (FASE A) */}
                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="Altura (cm)"
                            type="number"
                            value={editData.heightCm?.toString() || ''}
                            onChange={(e) => setEditData({ ...editData, heightCm: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="ej: 175"
                        />
                        <Input
                            label="Peso (kg)"
                            type="number"
                            value={editData.currentWeightKg?.toString() || ''}
                            onChange={(e) => setEditData({ ...editData, currentWeightKg: e.target.value ? Number(e.target.value) : undefined })}
                            placeholder="ej: 75"
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Nivel</label>
                            <select
                                value={editData.experienceLevel || ''}
                                onChange={(e) => setEditData({ ...editData, experienceLevel: e.target.value as Athlete['experienceLevel'] || undefined })}
                                className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none"
                            >
                                <option value="">Seleccionar nivel...</option>
                                <option value="novice">Principiante (0-6 meses)</option>
                                <option value="beginner">Inicial (6-12 meses)</option>
                                <option value="intermediate">Intermedio (1-3 años)</option>
                                <option value="advanced">Avanzado (3-5 años)</option>
                                <option value="elite">Elite (5+ años)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Objetivos</label>
                        <textarea
                            value={editData.goals || ''}
                            onChange={(e) => setEditData({ ...editData, goals: e.target.value })}
                            rows={3}
                            className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                            placeholder="Objetivos del atleta..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Lesiones / Limitaciones</label>
                        <textarea
                            value={editData.injuries || ''}
                            onChange={(e) => setEditData({ ...editData, injuries: e.target.value })}
                            rows={2}
                            className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                            placeholder="Lesiones o limitaciones..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Notas</label>
                        <textarea
                            value={editData.notes || ''}
                            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                            rows={2}
                            className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
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
                        <AuraButton variant="ghost" onClick={() => setShowDeleteModal(false)}>
                            Cancelar
                        </AuraButton>
                        <AuraButton
                            variant="secondary"
                            className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                            onClick={handleDelete}
                        >
                            Eliminar
                        </AuraButton>
                    </>
                }
            >
                <p className="text-gray-400">
                    ¿Estás seguro de que quieres eliminar a <strong className="text-white">{athlete.name}</strong>?
                    Se eliminarán también todas sus sesiones asociadas.
                </p>
            </Modal>
        </div>
    );
}

