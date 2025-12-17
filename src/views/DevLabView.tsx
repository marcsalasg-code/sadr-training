/**
 * DevLabView - Internal Development Tools (Flow C)
 * 
 * Phase 28: Separated from Settings for clear role distinction.
 * Contains: AI Engine, Simulator, System Stats, 1RM Anchors, Categories
 * 
 * NOT for regular user preferences - strictly internal/dev tools.
 */

import { useState } from 'react';
import { AuraSection } from '../components/ui/aura';
import {
    AIEnginePanel,
    SystemStatsPanel,
    FeedbackPanel,
    SimulatorPanel,
    CategoryManager
} from '../components/lab';
import { OneRMAnchorManager } from '../components/common/OneRMAnchorManager';

type DevLabTab = 'ai' | 'anchors' | 'categories' | 'feedback' | 'simulator' | 'system';

const TABS: { id: DevLabTab; label: string; icon: string }[] = [
    { id: 'ai', label: 'AI Engine', icon: '🤖' },
    { id: 'anchors', label: '1RM Anchors', icon: '🏋️' },
    { id: 'categories', label: 'Categories', icon: '📁' },
    { id: 'feedback', label: 'Feedback', icon: '📝' },
    { id: 'simulator', label: 'Simulator', icon: '🎲' },
    { id: 'system', label: 'System', icon: '🔧' },
];

export function DevLabView() {
    const [activeTab, setActiveTab] = useState<DevLabTab>('ai');

    return (
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
            <AuraSection
                title="Dev Lab"
                subtitle="Internal development tools and diagnostics"
            />

            {/* Warning Banner */}
            <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-600/30 text-amber-400 text-sm">
                ⚠️ Estas herramientas son para desarrollo y diagnóstico. Cambios aquí pueden afectar el comportamiento del sistema.
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#2A2A2A] pb-2 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-amber-600/20 text-amber-400 border-b-2 border-amber-500'
                                : 'text-gray-500 hover:text-white hover:bg-[#1A1A1A]'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'ai' && <AIEnginePanel />}
            {activeTab === 'anchors' && <OneRMAnchorManager />}
            {activeTab === 'categories' && <CategoryManager />}
            {activeTab === 'feedback' && <FeedbackPanel />}
            {activeTab === 'simulator' && <SimulatorPanel />}
            {activeTab === 'system' && <SystemStatsPanel />}
        </div>
    );
}

export default DevLabView;
