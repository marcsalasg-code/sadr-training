/**
 * LibraryView - Global Assets Hub (Flow B)
 * 
 * Phase 28: Unified view for Templates and Exercises.
 * No athlete context - purely for resource management.
 * 
 * Replaces /planning?tab=templates and /planning?tab=exercises
 */

import { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuraSection } from '../components/ui/aura';
import { TemplatesView } from './TemplatesView';
import { ExercisesView } from './ExercisesView';

type LibraryTab = 'templates' | 'exercises';

const TABS: { id: LibraryTab; label: string; icon: string }[] = [
    { id: 'templates', label: 'Plantillas', icon: '📋' },
    { id: 'exercises', label: 'Ejercicios', icon: '💪' },
];

const VALID_TABS = new Set<string>(['templates', 'exercises']);

export function LibraryView() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Derive activeTab from URL (default: templates)
    const activeTab = useMemo<LibraryTab>(() => {
        const tab = searchParams.get('tab');
        return (tab && VALID_TABS.has(tab) ? tab : 'templates') as LibraryTab;
    }, [searchParams]);

    // Persist last tab to localStorage for re-entry memory
    useEffect(() => {
        localStorage.setItem('sadr_library_last_tab', activeTab);
    }, [activeTab]);

    // On mount, if no tab specified, use last remembered tab
    useEffect(() => {
        if (!searchParams.get('tab')) {
            const lastTab = localStorage.getItem('sadr_library_last_tab');
            if (lastTab && VALID_TABS.has(lastTab)) {
                const params = new URLSearchParams(searchParams);
                params.set('tab', lastTab);
                setSearchParams(params, { replace: true });
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleTabChange = (tab: LibraryTab) => {
        const params = new URLSearchParams();
        params.set('tab', tab);
        setSearchParams(params);
    };

    return (
        <div className="min-h-screen">
            {/* Header with Tabs */}
            <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-default)] sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 pt-6">
                    <AuraSection
                        title="Biblioteca"
                        subtitle="Gestiona plantillas y ejercicios reutilizables"
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
                {activeTab === 'templates' && <TemplatesView />}
                {activeTab === 'exercises' && <ExercisesView />}
            </div>
        </div>
    );
}

export default LibraryView;
