/**
 * PlanningView - Vista unificada de planificación
 * 
 * Consolida: Sesiones, Plantillas, Calendario, Ejercicios
 * Cada sección es un tab interno para reducir fragmentación
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuraSection } from '../components/ui/aura';
import { SessionBuilder } from './SessionBuilder';
import { TemplatesView } from './TemplatesView';
import { CalendarView } from './CalendarView';
import { ExercisesView } from './ExercisesView';

type PlanningTab = 'sessions' | 'templates' | 'calendar' | 'exercises';

const TABS: { id: PlanningTab; label: string; icon: string }[] = [
    { id: 'sessions', label: 'Sesiones', icon: '🏋️' },
    { id: 'templates', label: 'Plantillas', icon: '📋' },
    { id: 'calendar', label: 'Calendario', icon: '📅' },
    { id: 'exercises', label: 'Ejercicios', icon: '💪' },
];

export function PlanningView() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') as PlanningTab | null;
    const [activeTab, setActiveTab] = useState<PlanningTab>(tabParam || 'sessions');

    const handleTabChange = (tab: PlanningTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    return (
        <div className="min-h-screen">
            {/* Header with Tabs */}
            <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-default)] sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 pt-6">
                    <AuraSection
                        title="Planificación"
                        subtitle="Gestiona sesiones, plantillas y calendario"
                    />

                    {/* Tab Navigation */}
                    <div className="flex gap-1 mt-4 -mb-px">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    px-5 py-3 text-sm font-medium rounded-t-lg
                                    border-b-2 transition-all duration-200
                                    ${activeTab === tab.id
                                        ? 'bg-[var(--color-bg-primary)] border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
                                        : 'border-transparent text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-bg-tertiary)]'
                                    }
                                `}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-[var(--color-bg-primary)]">
                {activeTab === 'sessions' && <SessionBuilder />}
                {activeTab === 'templates' && <TemplatesView />}
                {activeTab === 'calendar' && <CalendarView />}
                {activeTab === 'exercises' && <ExercisesView />}
            </div>
        </div>
    );
}

export default PlanningView;
