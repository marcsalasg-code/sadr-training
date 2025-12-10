/**
 * DayAgenda - Vista de agenda diaria por horas
 * Muestra sesiones programadas y permite crear nuevas en franjas horarias
 */

import { AuraPanel, AuraButton, AuraBadge } from '../ui/aura';
import type { WorkoutSession } from '../../types/types';

interface DayAgendaProps {
    date: Date;
    sessions: WorkoutSession[];
    onClose: () => void;
    onCreateSession: (hour: number) => void;
    onGoToSession: (sessionId: string) => void;
}

// Horas del día a mostrar (6:00 - 22:00)
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

// Formato de fecha legible
function formatDateLong(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
}

export function DayAgenda({ date, sessions, onClose, onCreateSession, onGoToSession }: DayAgendaProps) {
    // Agrupar sesiones por hora (aproximado por scheduledDate)
    const getSessionsAtHour = (hour: number) => {
        return sessions.filter(s => {
            if (!s.scheduledDate) return false;
            // Parsear la hora del scheduledDate si tiene hora, o asumir que es todo el día
            const scheduled = new Date(s.scheduledDate);
            return scheduled.getHours() === hour;
        });
    };

    // Status config para badges
    const statusConfig: Record<string, { label: string; variant: 'default' | 'gold' | 'success' | 'error' }> = {
        planned: { label: 'Planificada', variant: 'default' },
        in_progress: { label: 'En Progreso', variant: 'gold' },
        completed: { label: 'Completada', variant: 'success' },
        cancelled: { label: 'Cancelada', variant: 'error' },
    };

    return (
        <AuraPanel className="mt-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white">
                        📅 {formatDateLong(date)}
                    </h3>
                    <p className="text-xs text-gray-500">
                        {sessions.length === 0
                            ? 'No hay sesiones programadas'
                            : `${sessions.length} sesión(es) programada(s)`}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-0 max-h-[400px] overflow-y-auto">
                {HOURS.map(hour => {
                    const sessionsAtHour = getSessionsAtHour(hour);
                    const isWorkHour = hour >= 7 && hour <= 21;

                    return (
                        <div
                            key={hour}
                            className={`flex items-start gap-3 py-2 border-b border-[#1A1A1A] ${!isWorkHour ? 'opacity-50' : ''
                                }`}
                        >
                            {/* Hora */}
                            <span className="text-xs text-gray-500 w-12 font-mono pt-1">
                                {hour.toString().padStart(2, '0')}:00
                            </span>

                            {/* Contenido */}
                            <div className="flex-1 min-h-[32px]">
                                {sessionsAtHour.length > 0 ? (
                                    <div className="space-y-1">
                                        {sessionsAtHour.map(session => {
                                            const status = statusConfig[session.status] || statusConfig.planned;
                                            return (
                                                <button
                                                    key={session.id}
                                                    onClick={() => onGoToSession(session.id)}
                                                    className="w-full text-left p-2 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30 hover:bg-[var(--color-accent-gold)]/20 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-white font-medium">
                                                            {session.name}
                                                        </span>
                                                        <AuraBadge variant={status.variant} size="sm">
                                                            {status.label}
                                                        </AuraBadge>
                                                    </div>
                                                    {session.notes && (
                                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                                            {session.notes}
                                                        </p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onCreateSession(hour)}
                                        className="w-full text-left text-xs text-gray-600 hover:text-gray-400 py-1 px-2 rounded hover:bg-[#1A1A1A] transition-colors"
                                    >
                                        + Añadir sesión
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
                <AuraButton
                    variant="ghost"
                    onClick={() => onCreateSession(9)}
                    className="w-full"
                >
                    + Nueva Sesión para Este Día
                </AuraButton>
            </div>
        </AuraPanel>
    );
}
