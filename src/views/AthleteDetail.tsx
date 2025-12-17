/**
 * AthleteDetail - Vista detallada de un atleta
 * 
 * REFACTORED: Container component that orchestrates section components
 * Original: 740 lines → Now: ~250 lines
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal } from '../components/ui';
import {
    AuraPanel,
    AuraTabs,
} from '../components/ui/aura';
import { OneRMSection } from '../components/common/OneRMSection';
import { StrengthProgress } from '../components/common/StrengthProgress';
import {
    IntensityFatigueTrend,
    AthleteHeader,
    AthleteQuickActions,
    AthletePlanSummary,
    AthletePhysicalData,
    AthleteStatsGrid,
    AthleteChartsRow,
    AthleteInfoTab,
    AthleteSessionsTab,
    AthleteEditModal,
} from '../components/athletes';
import { TrainingPlanModal } from '../components/dashboard';
import { AuraButton, AuraEmptyState } from '../components/ui/aura';
import { useTrainingStore, useSessions, useExercises, useTrainingPlans, useActiveTrainingPlanId } from '../store/store';
import { useSessionBuilder } from '../hooks';
import {
    getAthleteIntensityFatigueSeries,
} from '../core/analysis/metrics';
import {
    filterSessionsByAthlete,
    filterCompletedSessions,
    calculateTotalVolume,
    calculateAvgDuration,
} from '../utils/dashboardMetrics';
import type { Athlete } from '../types/types';

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
    const [showTrainingPlanModal, setShowTrainingPlanModal] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

    // Training plan data
    const trainingPlans = useTrainingPlans();
    const activeTrainingPlanId = useActiveTrainingPlanId();
    const athletePlan = useMemo(() => {
        return trainingPlans.find(p => p.athleteId === athlete?.id);
    }, [trainingPlans, athlete?.id]);
    const isActivePlan = athletePlan?.id === activeTrainingPlanId;

    // Session builder
    const { repeatLastSession, getLastSession } = useSessionBuilder();
    const hasLastSession = useMemo(() => {
        if (!athlete) return false;
        return getLastSession(athlete.id) !== null;
    }, [athlete, getLastSession]);

    // Sessions and stats
    const athleteSessions = useMemo(() => {
        if (!athlete) return [];
        return filterSessionsByAthlete(sessions, athlete.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [sessions, athlete]);

    const stats = useMemo(() => {
        const completed = filterCompletedSessions(athleteSessions);
        const totalVolume = calculateTotalVolume(completed);
        const totalSets = completed.reduce((sum, s) => sum + (s.totalSets || 0), 0);

        return {
            totalSessions: completed.length,
            totalVolume,
            totalSets,
            avgDuration: calculateAvgDuration(completed),
        };
    }, [athleteSessions]);

    // Chart data
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

            weeks.push({ label: `W${8 - i}`, volume: weekVolume });
        }
        return weeks;
    }, [athleteSessions]);

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

    const intensityFatigueData = useMemo(() => {
        if (!athlete) return [];
        return getAthleteIntensityFatigueSeries(athleteSessions, athlete.id);
    }, [athleteSessions, athlete]);

    // Handlers
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    };

    const handleStartEdit = () => {
        setEditData({
            name: athlete!.name,
            email: athlete!.email || '',
            phone: athlete!.phone || '',
            birthDate: athlete!.birthDate || '',
            goals: athlete!.goals || '',
            injuries: athlete!.injuries || '',
            notes: athlete!.notes || '',
            heightCm: athlete!.heightCm,
            currentWeightKg: athlete!.currentWeightKg,
            experienceLevel: athlete!.experienceLevel,
        });
        setIsEditing(true);
    };

    const handleSave = () => {
        updateAthlete(athlete!.id, {
            ...editData,
            email: editData.email?.trim() || undefined,
            phone: editData.phone?.trim() || undefined,
        });
        setIsEditing(false);
    };

    const handleDelete = () => {
        deleteAthlete(athlete!.id);
        navigate('/athletes');
    };

    const handleAddCustomField = () => {
        const key = prompt('Nombre del campo:');
        if (!key?.trim()) return;
        const value = prompt('Valor:');
        if (value === null) return;
        updateAthlete(athlete!.id, {
            customFields: { ...athlete!.customFields, [key.trim()]: value },
        });
    };

    const handleDeleteCustomField = (key: string) => {
        if (!confirm(`¿Eliminar "${key}"?`)) return;
        const newFields = { ...athlete!.customFields };
        delete newFields[key];
        updateAthlete(athlete!.id, { customFields: newFields });
    };

    // Empty state
    if (!athlete) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <AuraPanel>
                    <AuraEmptyState
                        icon="❌"
                        title="Atleta no encontrado"
                        description="El atleta que buscas no existe o ha sido eliminado."
                        action={{ label: 'Volver a la lista', onClick: () => navigate('/athletes') }}
                    />
                </AuraPanel>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header + Avatar */}
            <AthleteHeader
                name={athlete.name}
                isActive={athlete.isActive}
                email={athlete.email}
                hasInjuries={!!athlete.injuries}
                onBack={() => navigate('/athletes')}
                onEdit={handleStartEdit}
                onDelete={() => setShowDeleteModal(true)}
            />

            {/* Quick Actions */}
            <AthleteQuickActions
                athleteId={athlete.id}
                hasLastSession={hasLastSession}
                onViewCalendar={() => navigate(`/athletes/${athlete.id}/calendar`)}
                onViewAnalytics={() => navigate(`/analytics?athleteId=${athlete.id}`)}
                onOpenPlanModal={() => setShowTrainingPlanModal(true)}
                onRepeatLastSession={() => repeatLastSession(athlete.id)}
            />

            {/* Active Plan Summary */}
            {athletePlan && (
                <AthletePlanSummary
                    plan={{
                        name: athletePlan.name,
                        objective: athletePlan.objective,
                        sessionsPerWeek: athletePlan.sessionsPerWeek,
                        dayPlansCount: athletePlan.dayPlans?.length,
                    }}
                    isActivePlan={isActivePlan}
                    onOpenPlanModal={() => setShowTrainingPlanModal(true)}
                />
            )}

            {/* Physical Data */}
            <AthletePhysicalData
                heightCm={athlete.heightCm}
                currentWeightKg={athlete.currentWeightKg}
                experienceLevel={athlete.experienceLevel}
                personalRecords={athlete.personalRecords}
            />

            {/* 1RM Section */}
            <OneRMSection
                athlete={athlete}
                exercises={exercises}
                sessions={sessions}
                onUpdateAthlete={updateAthlete}
            />

            {/* Strength Progress */}
            <AuraPanel header={<div><h3 className="text-white font-medium">Strength Progress</h3><p className="text-xs text-gray-500">1RM trends over time</p></div>}>
                <StrengthProgress athlete={athlete} compact={false} />
            </AuraPanel>

            {/* Intensity vs Fatigue */}
            {intensityFatigueData.length > 0 && (
                <AuraPanel header={<div><h3 className="text-white font-medium">⚡ Intensidad vs Fatiga</h3><p className="text-xs text-gray-500">Últimas sesiones</p></div>}>
                    <IntensityFatigueTrend data={intensityFatigueData} />
                </AuraPanel>
            )}

            {/* Stats Grid */}
            <AthleteStatsGrid
                totalSessions={stats.totalSessions}
                totalVolume={stats.totalVolume}
                totalSets={stats.totalSets}
                avgDuration={stats.avgDuration}
            />

            {/* Charts Row */}
            <AthleteChartsRow
                weeklyVolumeData={weeklyVolumeData}
                monthlySessionsData={monthlySessionsData}
            />

            {/* Tabs */}
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
                <AthleteInfoTab
                    email={athlete.email}
                    phone={athlete.phone}
                    birthDate={athlete.birthDate}
                    createdAt={athlete.createdAt}
                    goals={athlete.goals}
                    injuries={athlete.injuries}
                    notes={athlete.notes}
                    customFields={athlete.customFields}
                    formatDate={formatDate}
                    onAddCustomField={handleAddCustomField}
                    onDeleteCustomField={handleDeleteCustomField}
                />
            )}

            {activeTab === 'sessions' && (
                <AthleteSessionsTab
                    sessions={athleteSessions}
                    formatDate={formatDate}
                    onSessionClick={(sessionId) => navigate(`/sessions/live/${sessionId}`)}
                    onCreateSession={() => navigate('/templates')}
                />
            )}

            {/* Edit Modal */}
            <AthleteEditModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                onSave={handleSave}
                editData={editData}
                setEditData={setEditData}
            />

            {/* Delete Modal */}
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

            {/* Training Plan Modal */}
            <TrainingPlanModal
                isOpen={showTrainingPlanModal}
                onClose={() => setShowTrainingPlanModal(false)}
                preselectedAthleteId={athlete.id}
            />
        </div>
    );
}
