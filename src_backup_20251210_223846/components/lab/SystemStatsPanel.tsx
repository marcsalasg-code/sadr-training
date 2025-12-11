/**
 * SystemStatsPanel - Panel de estadísticas del sistema
 */

import { useMemo } from 'react';
import {
    AuraPanel,
    AuraGrid,
    AuraMetric,
    AuraButton,
} from '../../components/ui/aura';
import { useTrainingStore } from '../../store/store';
import { useAIStats, useAIMode, useAIStore } from '../../ai/aiStore';

export function SystemStatsPanel() {
    const { sessions, athletes, exercises, templates, clearAllData, exportData } = useTrainingStore();
    const aiStats = useAIStats();
    const aiMode = useAIMode();
    const { setMode, resetStats } = useAIStore();

    const systemStats = useMemo(() => ({
        athletes: athletes.length,
        sessions: sessions.length,
        exercises: exercises.length,
        templates: templates.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        totalVolume: sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0),
        storageSize: new Blob([JSON.stringify(exportData())]).size,
    }), [athletes, sessions, exercises, templates, exportData]);

    return (
        <div className="space-y-6">
            <AuraPanel header={<span className="text-white font-medium">System Status</span>}>
                <AuraGrid cols={4} gap="md">
                    <AuraMetric label="Athletes" value={systemStats.athletes} />
                    <AuraMetric label="Sessions" value={systemStats.sessions} />
                    <AuraMetric label="Exercises" value={systemStats.exercises} />
                    <AuraMetric label="Templates" value={systemStats.templates} />
                </AuraGrid>
            </AuraPanel>

            {/* AI Statistics */}
            <AuraPanel header={
                <div className="flex justify-between items-center w-full">
                    <span className="text-white font-medium">🤖 AI Statistics</span>
                    <div className="flex gap-2">
                        {(['mock', 'live', 'hybrid'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setMode(mode)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${aiMode === mode
                                        ? 'bg-[var(--color-accent-gold)] text-black'
                                        : 'bg-[#2A2A2A] text-gray-400 hover:text-white'
                                    }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
            }>
                <AuraGrid cols={4} gap="md">
                    <AuraMetric label="Total Calls" value={aiStats.totalCalls} />
                    <AuraMetric label="Errors" value={aiStats.totalErrors} />
                    <AuraMetric label="Retries" value={aiStats.retryCount} />
                    <AuraMetric label="Validation Errors" value={aiStats.validationErrors} />
                </AuraGrid>

                {/* Call breakdown by type */}
                {aiStats.totalCalls > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Calls by Type</p>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(aiStats.callsByType).map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center p-2 rounded-lg bg-[#141414]">
                                    <span className="text-sm text-gray-400 capitalize">{type}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm text-white">{count}</span>
                                        {aiStats.avgResponseTime[type] && (
                                            <span className="text-[10px] text-gray-500">
                                                ~{aiStats.avgResponseTime[type]}ms
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={resetStats}
                            className="text-xs text-gray-500 hover:text-gray-400 mt-2"
                        >
                            Reset stats
                        </button>
                    </div>
                )}
            </AuraPanel>

            <AuraPanel header={<span className="text-white font-medium">Storage</span>}>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-[#141414]">
                        <span className="text-gray-400">Data size</span>
                        <span className="font-mono text-[var(--color-accent-gold)]">
                            {(systemStats.storageSize / 1024).toFixed(1)} KB
                        </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-[#141414]">
                        <span className="text-gray-400">Total volume</span>
                        <span className="font-mono text-[var(--color-accent-gold)]">
                            {(systemStats.totalVolume / 1000).toFixed(0)}k kg
                        </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-[#141414]">
                        <span className="text-gray-400">Completed sessions</span>
                        <span className="font-mono text-[var(--color-accent-gold)]">
                            {systemStats.completedSessions}
                        </span>
                    </div>
                </div>
            </AuraPanel>

            <AuraPanel variant="accent" header={<span className="text-red-400 font-medium">⚠️ Danger Zone</span>}>
                <p className="text-sm text-gray-500 mb-4">These actions are irreversible.</p>
                <AuraButton
                    variant="secondary"
                    className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                    onClick={() => {
                        if (confirm('Delete ALL data?')) {
                            clearAllData();
                            localStorage.removeItem('sadr-lab-entries');
                        }
                    }}
                >
                    🗑️ Clear All Data
                </AuraButton>
            </AuraPanel>
        </div>
    );
}

