/**
 * CalendarView - Vista de calendario mensual
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { Card, Button } from '../components/ui';
import { useSessions } from '../store/store';

export function CalendarView() {
    const navigate = useNavigate();
    const sessions = useSessions();
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

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

    const sessionsByDate = useMemo(() => {
        const map: Record<string, typeof sessions> = {};
        sessions.forEach(s => {
            const dateStr = (s.scheduledDate || s.completedAt || s.createdAt).split('T')[0];
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(s);
        });
        return map;
    }, [sessions]);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const today = new Date();
    const isToday = (date: Date) =>
        date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

    const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

    return (
        <PageContainer
            title="Calendario"
            subtitle={`${monthNames[month]} ${year}`}
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={prevMonth}>←</Button>
                    <Button variant="ghost" size="sm" onClick={goToday}>Hoy</Button>
                    <Button variant="ghost" size="sm" onClick={nextMonth}>→</Button>
                </div>
            }
        >
            <Card padding="none">
                <div className="grid grid-cols-7 border-b border-[var(--color-border-default)]">
                    {weekDays.map(day => (
                        <div key={day} className="p-3 text-center text-xs font-medium text-[var(--color-text-muted)] uppercase">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {calendarDays.map(({ date, isCurrentMonth }, index) => {
                        if (!date) return <div key={index} className="p-2 min-h-[100px]" />;
                        const dateKey = formatDateKey(date);
                        const daySessions = sessionsByDate[dateKey] || [];
                        const isTodayDate = isToday(date);
                        return (
                            <div key={index} className={`p-2 min-h-[100px] border-b border-r border-[var(--color-border-default)] ${!isCurrentMonth ? 'bg-[var(--color-bg-tertiary)] opacity-50' : ''} ${isTodayDate ? 'bg-[var(--color-accent-gold)]/5 ring-1 ring-[var(--color-accent-gold)]/30 ring-inset' : ''}`}>
                                <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-[var(--color-accent-gold)]' : !isCurrentMonth ? 'text-[var(--color-text-muted)]' : ''}`}>{date.getDate()}</div>
                                <div className="space-y-1">
                                    {daySessions.slice(0, 3).map(session => (
                                        <button key={session.id} onClick={() => navigate(`/sessions/live/${session.id}`)} className={`w-full text-left text-xs p-1 rounded truncate ${session.status === 'completed' ? 'bg-green-500/20 text-green-400' : session.status === 'in_progress' ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'} hover:opacity-80`}>
                                            {session.name}
                                        </button>
                                    ))}
                                    {daySessions.length > 3 && <p className="text-xs text-[var(--color-text-muted)]">+{daySessions.length - 3} más</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
            <div className="flex items-center gap-6 mt-4 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" /><span>Completadas</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]/30" /><span>En curso</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]" /><span>Planificadas</span></div>
            </div>
        </PageContainer>
    );
}
