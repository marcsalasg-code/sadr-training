/**
 * LiveSessionHeader - Header for live session with status, title, and actions
 */

import { AuraButton, AuraBadge } from '../ui/aura';

interface Athlete {
    id: string;
    name: string;
}

interface LiveSessionHeaderProps {
    sessionName: string;
    sessionStatus: string;
    isMultiAthlete: boolean;
    sessionAthletes: Athlete[];
    activeAthleteId: string;
    onAthleteChange: (athleteId: string) => void;
    onExit: () => void;
    onCancel: () => void;
    onFinish: () => void;
}

export function LiveSessionHeader({
    sessionName,
    sessionStatus,
    isMultiAthlete,
    sessionAthletes,
    activeAthleteId,
    onAthleteChange,
    onExit,
    onCancel,
    onFinish,
}: LiveSessionHeaderProps) {
    return (
        <header className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    {sessionStatus === 'in_progress' && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
                            <span className="text-[10px] font-bold text-[var(--color-accent-gold)] uppercase tracking-widest">
                                Live Session
                            </span>
                        </div>
                    )}
                    {isMultiAthlete && (
                        <AuraBadge variant="muted" size="sm">Multi-Athlete</AuraBadge>
                    )}
                </div>
                <h1 className="text-2xl text-white font-semibold tracking-tight">{sessionName}</h1>

                {/* Multi-Athlete Selector */}
                {isMultiAthlete && sessionAthletes.length > 1 && (
                    <div className="flex gap-2 mt-2">
                        {sessionAthletes.map(athlete => (
                            <button
                                key={athlete.id}
                                onClick={() => onAthleteChange(athlete.id)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${activeAthleteId === athlete.id
                                    ? 'bg-[var(--color-accent-gold)] text-black'
                                    : 'bg-[#1A1A1A] text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                                    }`}
                            >
                                {athlete.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <AuraButton variant="ghost" onClick={onExit}>
                    ← Exit
                </AuraButton>
                {sessionStatus === 'in_progress' && (
                    <AuraButton
                        variant="ghost"
                        className="!text-red-400 hover:!bg-red-400/10"
                        onClick={onCancel}
                    >
                        Cancel
                    </AuraButton>
                )}
                <AuraButton variant="gold" onClick={onFinish}>
                    Finish ✓
                </AuraButton>
            </div>
        </header>
    );
}
