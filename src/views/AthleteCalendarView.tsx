/**
 * AthleteCalendarView - Athlete-Scoped Calendar (Flow A)
 * 
 * Phase 28: Wraps CalendarView with athlete context.
 * - Pre-filters by athleteId from route
 * - Provides explicit "Back to Athlete" button
 * - Preserves athlete context during session operations
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuraButton } from '../components/ui/aura';
import { CalendarView } from './CalendarView';
import { useCalendarView } from '../hooks';
import { useTrainingStore } from '../store/store';

export function AthleteCalendarView() {
    const { id: athleteId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getAthlete } = useTrainingStore();

    // Get athlete info for header
    const athlete = athleteId ? getAthlete(athleteId) : undefined;

    // Get calendar hook to force athlete selection
    const { setSelectedAthleteId } = useCalendarView();

    // Force athlete filter on mount
    useEffect(() => {
        if (athleteId) {
            setSelectedAthleteId(athleteId);
        }
    }, [athleteId, setSelectedAthleteId]);

    // Handle back navigation
    const handleBack = () => {
        if (athleteId) {
            navigate(`/athletes/${athleteId}`);
        } else {
            navigate('/athletes');
        }
    };

    // If no athlete found, show error state
    if (!athleteId || !athlete) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="p-8 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] text-center">
                    <p className="text-gray-400">Atleta no encontrado</p>
                    <AuraButton
                        variant="secondary"
                        onClick={() => navigate('/athletes')}
                        className="mt-4"
                    >
                        ← Volver a atletas
                    </AuraButton>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Athlete Context Header with Back Button */}
            <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-default)] px-6 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <AuraButton
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                        >
                            ← Volver a {athlete.name}
                        </AuraButton>
                        <div className="h-4 w-px bg-[var(--color-border-default)]" />
                        <span className="text-sm text-gray-400">
                            Calendario de <span className="text-white font-medium">{athlete.name}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Calendar Content (uses existing CalendarView with forced filter and returnPath) */}
            <CalendarView returnPath={`/athletes/${athleteId}/calendar`} />
        </div>
    );
}

export default AthleteCalendarView;
