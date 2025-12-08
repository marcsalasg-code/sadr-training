/**
 * CalendarView - Vista de calendario mensual interactivo
 * Muestra sesiones reales, permite filtrar por atleta y crear sesiones
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Card, Button, Badge, Modal, Input, Select, EmptyState } from '../components/ui';
import { useTrainingStore, useSessions, useAthletes, useTemplates } from '../store/store';
import type { WorkoutSession } from '../types/types';

export function CalendarView() {
    const navigate = useNavigate();
    const sessions = useSessions();
    const athletes = useAthletes();
    const templates = useTemplates();
    const { addSession, getAthlete } = useTrainingStore();

    // Estado del calendario
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedAthleteId, setSelectedAthleteId] = useState<string>('all');

    // Estado del modal de día
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const [newSessionAthleteId, setNewSessionAthleteId] = useState('');
    const [newSessionTemplateId, setNewSessionTemplateId] = useState('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Filtrar sesiones por atleta
    const filteredSessions = useMemo(() => {
        if (selectedAthleteId === 'all') return sessions;
        return sessions.filter(s => s.athleteId === selectedAthleteId);
    }, [sessions, selectedAthleteId]);

    // Generar días del calendario
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startWeekday = firstDay.getDay();

        const days: { date: Date | null; isCurrentMonth: boolean }[] = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startWeekday - 1; i >= 0; i--) {
            days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }
        return days;
    }, [year, month]);

    // Agrupar sesiones por fecha
    const sessionsByDate = useMemo(() => {
        const map: Record<string, WorkoutSession[]> = {};
        filteredSessions.forEach(s => {
            const dateStr = (s.scheduledDate || s.completedAt || s.createdAt).split('T')[0];
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(s);
        });
        return map;
    }, [filteredSessions]);

    // Navegación del calendario
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const today = new Date();
    const isToday = (date: Date) =>
        date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

    const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

    // Opciones para selects
    const athleteOptions = [
        { value: 'all', label: 'Todos los atletas' },
        ...athletes.map(a => ({ value: a.id, label: a.name }))
    ];

    const athleteOptionsForCreate = [
        { value: '', label: 'Seleccionar atleta...' },
        ...athletes.map(a => ({ value: a.id, label: a.name }))
    ];

    const templateOptions = [
        { value: '', label: 'Sin plantilla' },
        ...templates.map(t => ({ value: t.id, label: t.name }))
    ];

    // Handler: click en día
    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setShowCreateForm(false);
        setNewSessionName('');
        setNewSessionAthleteId(selectedAthleteId !== 'all' ? selectedAthleteId : '');
        setNewSessionTemplateId('');
    };

    // Handler: cerrar modal
    const handleCloseModal = () => {
        setSelectedDate(null);
        setShowCreateForm(false);
    };

    // Handler: crear sesión
    const handleCreateSession = () => {
        if (!newSessionName.trim() || !newSessionAthleteId || !selectedDate) return;

        const selectedTemplate = templates.find(t => t.id === newSessionTemplateId);

        addSession({
            name: newSessionName.trim(),
            athleteId: newSessionAthleteId,
            templateId: newSessionTemplateId || undefined,
            scheduledDate: formatDateKey(selectedDate),
            status: 'planned',
            exercises: selectedTemplate?.exercises.map((ex, idx) => ({
                id: crypto.randomUUID(),
                exerciseId: ex.exerciseId,
                order: idx,
                sets: Array.from({ length: ex.sets }, (_, i) => ({
                    id: crypto.randomUUID(),
                    setNumber: i + 1,
                    type: 'working' as const,
                    targetReps: ex.reps,
                    targetWeight: undefined,
                    restSeconds: ex.restSeconds,
                    isCompleted: false,
                })),
            })) || [],
        });

        setShowCreateForm(false);
        setNewSessionName('');
        setNewSessionAthleteId('');
        setNewSessionTemplateId('');
    };

    // Handler: acción de sesión según estado
    const getSessionAction = (session: WorkoutSession): { label: string; onClick: () => void } => {
        switch (session.status) {
            case 'planned':
                return { label: 'Iniciar', onClick: () => navigate(`/sessions/live/${session.id}`) };
            case 'in_progress':
                return { label: 'Continuar', onClick: () => navigate(`/sessions/live/${session.id}`) };
            case 'completed':
                return { label: 'Ver resumen', onClick: () => navigate(`/sessions/live/${session.id}`) };
            case 'cancelled':
            default:
                return { label: 'Ver', onClick: () => navigate(`/sessions/live/${session.id}`) };
        }
    };

    // Formato de fecha para modal
    const formatModalDate = (date: Date): string => {
        const dayName = dayNames[date.getDay()];
        const day = date.getDate();
        const monthName = monthNames[date.getMonth()];
        return `${dayName}, ${day} de ${monthName}`;
    };

    // Sesiones del día seleccionado
    const selectedDaySessions = selectedDate ? (sessionsByDate[formatDateKey(selectedDate)] || []) : [];

    // Config de estados para badges
    const statusConfig: Record<string, { label: string; variant: 'default' | 'gold' | 'success' | 'error' }> = {
        planned: { label: 'Planificada', variant: 'default' },
        in_progress: { label: 'En curso', variant: 'gold' },
        completed: { label: 'Completada', variant: 'success' },
        cancelled: { label: 'Cancelada', variant: 'error' },
    };

    return (
        <PageContainer
            title="Calendario"
            subtitle={`${monthNames[month]} ${year}`}
            actions={
                <div className="flex items-center gap-3">
                    {/* Filtro por atleta */}
                    <Select
                        value={selectedAthleteId}
                        onChange={(e) => setSelectedAthleteId(e.target.value)}
                        options={athleteOptions}
                        className="w-48"
                    />
                    {/* Navegación del calendario */}
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={prevMonth}>←</Button>
                        <Button variant="ghost" size="sm" onClick={goToday}>Hoy</Button>
                        <Button variant="ghost" size="sm" onClick={nextMonth}>→</Button>
                    </div>
                </div>
            }
        >
            <Card padding="none">
                {/* Cabecera de días de la semana */}
                <div className="grid grid-cols-7 border-b border-[var(--color-border-default)]">
                    {weekDays.map(day => (
                        <div key={day} className="p-3 text-center text-xs font-medium text-[var(--color-text-muted)] uppercase">{day}</div>
                    ))}
                </div>

                {/* Grid de días */}
                <div className="grid grid-cols-7">
                    {calendarDays.map(({ date, isCurrentMonth }, index) => {
                        if (!date) return <div key={index} className="p-2 min-h-[100px]" />;
                        const dateKey = formatDateKey(date);
                        const daySessions = sessionsByDate[dateKey] || [];
                        const isTodayDate = isToday(date);

                        // Contar sesiones por estado para indicadores
                        const hasPlanned = daySessions.some(s => s.status === 'planned');
                        const hasInProgress = daySessions.some(s => s.status === 'in_progress');
                        const hasCompleted = daySessions.some(s => s.status === 'completed');

                        return (
                            <div
                                key={index}
                                onClick={() => handleDayClick(date)}
                                className={`p-2 min-h-[100px] border-b border-r border-[var(--color-border-default)] cursor-pointer transition-colors hover:bg-[var(--color-bg-elevated)] ${!isCurrentMonth ? 'bg-[var(--color-bg-tertiary)] opacity-50' : ''} ${isTodayDate ? 'bg-[var(--color-accent-gold)]/5 ring-1 ring-[var(--color-accent-gold)]/30 ring-inset' : ''}`}
                            >
                                {/* Número del día */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-medium ${isTodayDate ? 'text-[var(--color-accent-gold)]' : !isCurrentMonth ? 'text-[var(--color-text-muted)]' : ''}`}>
                                        {date.getDate()}
                                    </span>
                                    {/* Indicadores de estado */}
                                    {daySessions.length > 0 && (
                                        <div className="flex gap-1">
                                            {hasInProgress && <div className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)]" />}
                                            {hasPlanned && <div className="w-2 h-2 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]" />}
                                            {hasCompleted && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                        </div>
                                    )}
                                </div>

                                {/* Lista de sesiones (máximo 3) */}
                                <div className="space-y-1">
                                    {daySessions.slice(0, 3).map(session => (
                                        <button
                                            key={session.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/sessions/live/${session.id}`);
                                            }}
                                            className={`w-full text-left text-xs p-1 rounded truncate ${session.status === 'completed' ? 'bg-green-500/20 text-green-400' : session.status === 'in_progress' ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]' : session.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'} hover:opacity-80`}
                                        >
                                            {session.name}
                                        </button>
                                    ))}
                                    {daySessions.length > 3 && (
                                        <p className="text-xs text-[var(--color-text-muted)]">+{daySessions.length - 3} más</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Leyenda */}
            <div className="flex items-center gap-6 mt-4 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" /><span>Completadas</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]/30" /><span>En curso</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]" /><span>Planificadas</span></div>
            </div>

            {/* Modal: Día seleccionado */}
            <Modal
                isOpen={!!selectedDate}
                onClose={handleCloseModal}
                title={selectedDate ? formatModalDate(selectedDate) : ''}
                size="md"
            >
                <div className="space-y-4">
                    {/* Lista de sesiones del día */}
                    {selectedDaySessions.length > 0 ? (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-[var(--color-text-muted)]">
                                Sesiones ({selectedDaySessions.length})
                            </h4>
                            <div className="space-y-2">
                                {selectedDaySessions.map(session => {
                                    const athlete = getAthlete(session.athleteId);
                                    const action = getSessionAction(session);
                                    const status = statusConfig[session.status];

                                    return (
                                        <div
                                            key={session.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{session.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {selectedAthleteId === 'all' && athlete && (
                                                        <span className="text-xs text-[var(--color-text-muted)]">
                                                            {athlete.name}
                                                        </span>
                                                    )}
                                                    <Badge size="sm" variant={status.variant}>
                                                        {status.label}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={action.onClick}>
                                                {action.label}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <EmptyState
                            icon="📅"
                            title="Sin sesiones"
                            description="No hay sesiones programadas para este día."
                        />
                    )}

                    {/* Separador */}
                    <div className="border-t border-[var(--color-border-default)]" />

                    {/* Crear nueva sesión */}
                    {!showCreateForm ? (
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => setShowCreateForm(true)}
                        >
                            + Crear nueva sesión
                        </Button>
                    ) : (
                        <div className="space-y-3 p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]">
                            <h4 className="font-medium text-sm">Nueva sesión</h4>
                            <Input
                                placeholder="Nombre de la sesión *"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                            />
                            <Select
                                value={newSessionAthleteId}
                                onChange={(e) => setNewSessionAthleteId(e.target.value)}
                                options={athleteOptionsForCreate}
                            />
                            <Select
                                value={newSessionTemplateId}
                                onChange={(e) => setNewSessionTemplateId(e.target.value)}
                                options={templateOptions}
                            />
                            <p className="text-xs text-[var(--color-text-muted)]">
                                Fecha: {selectedDate ? formatModalDate(selectedDate) : ''}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCreateForm(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleCreateSession}
                                    disabled={!newSessionName.trim() || !newSessionAthleteId}
                                >
                                    Crear Sesión
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </PageContainer>
    );
}
