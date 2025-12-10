/**
 * InternalLab - Consola interna de desarrollo y configuración
 * Rediseñado con UI Aura y componentes modulares
 * 
 * Tabs: AI Engine | 1RM Anchors | Feedback | Simulator | System
 * (Parameters moved to Settings to avoid duplication)
 */

import { useState } from 'react';
import {
    AuraSection,
} from '../components/ui/aura';
import { AIEnginePanel, SystemStatsPanel, FeedbackPanel, SimulatorPanel, CategoryManager } from '../components/lab';
import { OneRMAnchorManager } from '../components/common/OneRMAnchorManager';

export function InternalLab() {
    const [activeTab, setActiveTab] = useState<'ai' | 'anchors' | 'feedback' | 'simulator' | 'categories' | 'system'>('ai');

    const tabs = [
        { id: 'ai', label: 'AI Engine', icon: '🤖' },
        { id: 'anchors', label: '1RM Anchors', icon: '🏋️' },
        { id: 'categories', label: 'Categories', icon: '📁' },
        { id: 'feedback', label: 'Feedback', icon: '📝' },
        { id: 'simulator', label: 'Simulator', icon: '🎲' },
        { id: 'system', label: 'System', icon: '🔧' },
    ] as const;

    return (
        <div className="p-8 space-y-6 max-w-4xl mx-auto">
            <AuraSection
                title="Internal Lab"
                subtitle="Development console"
            />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[#2A2A2A] pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-[var(--color-accent-gold)] text-black'
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

