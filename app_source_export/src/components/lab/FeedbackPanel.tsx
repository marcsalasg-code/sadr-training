/**
 * FeedbackPanel - Panel de feedback y notas internas
 */

import { useState } from 'react';
import {
    AuraPanel,
    AuraButton,
    AuraBadge,
    AuraEmptyState,
} from '../../components/ui/aura';
import { useAILogs } from '../../ai/aiStore';
import type { LabEntry } from '../../types/types';
import type { AIFeedback } from '../../ai/types';

export function FeedbackPanel() {
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'note'>('note');
    const [labEntries, setLabEntries] = useState<LabEntry[]>(() => {
        const stored = localStorage.getItem('sadr-lab-entries');
        return stored ? JSON.parse(stored) : [];
    });

    // AI Feedback
    const aiLogs = useAILogs();
    const [aiFeedback, setAIFeedback] = useState<AIFeedback[]>(() => {
        const stored = localStorage.getItem('sadr-ai-feedback');
        return stored ? JSON.parse(stored) : [];
    });
    const [selectedCategory, setSelectedCategory] = useState<'accurate' | 'not_useful' | 'imprecise' | null>(null);

    const recentAILogs = aiLogs
        .filter(log => log.type === 'response' && log.success)
        .slice(-5)
        .reverse();

    const handleSubmitFeedback = () => {
        if (!feedbackText.trim()) return;
        const entry: LabEntry = {
            id: crypto.randomUUID(),
            type: feedbackType,
            title: feedbackText.trim(),
            createdAt: new Date().toISOString(),
            status: 'open',
        };
        const updated = [entry, ...labEntries];
        setLabEntries(updated);
        localStorage.setItem('sadr-lab-entries', JSON.stringify(updated));
        setFeedbackText('');
    };

    const handleToggleResolved = (id: string) => {
        const updated = labEntries.map(e =>
            e.id === id
                ? { ...e, status: e.status === 'resolved' ? 'open' as const : 'resolved' as const, resolvedAt: e.status !== 'resolved' ? new Date().toISOString() : undefined }
                : e
        );
        setLabEntries(updated);
        localStorage.setItem('sadr-lab-entries', JSON.stringify(updated));
    };

    const handleDeleteEntry = (id: string) => {
        const updated = labEntries.filter(e => e.id !== id);
        setLabEntries(updated);
        localStorage.setItem('sadr-lab-entries', JSON.stringify(updated));
    };

    const handleAIFeedback = (logId: string, rating: 'positive' | 'negative') => {
        // Check if already rated
        if (aiFeedback.some(f => f.logId === logId)) return;

        const feedback: AIFeedback = {
            id: crypto.randomUUID(),
            logId,
            timestamp: new Date().toISOString(),
            rating,
            category: selectedCategory || undefined,
        };
        const updated = [...aiFeedback, feedback];
        setAIFeedback(updated);
        localStorage.setItem('sadr-ai-feedback', JSON.stringify(updated));
        setSelectedCategory(null);
    };

    const getFeedbackForLog = (logId: string) => aiFeedback.find(f => f.logId === logId);

    return (
        <div className="space-y-6">
            {/* AI Quick Feedback */}
            <AuraPanel header={<span className="text-white font-medium">🤖 AI Response Feedback</span>}>
                {recentAILogs.length === 0 ? (
                    <AuraEmptyState
                        icon="🤖"
                        title="No AI responses yet"
                        description="Generate templates or get suggestions to provide feedback."
                        size="sm"
                    />
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500">Rate recent AI responses:</p>

                        {/* Category selector */}
                        <div className="flex gap-2 mb-3">
                            {(['accurate', 'not_useful', 'imprecise'] as const).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${selectedCategory === cat
                                            ? 'bg-[var(--color-accent-gold)] text-black'
                                            : 'bg-[#1A1A1A] text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {cat === 'accurate' ? '✓ Accurate' : cat === 'not_useful' ? '✗ Not useful' : '⚠ Imprecise'}
                                </button>
                            ))}
                        </div>

                        {recentAILogs.map(log => {
                            const existing = getFeedbackForLog(log.id);
                            return (
                                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-[#141414]">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <AuraBadge size="sm" variant="muted">{log.requestType}</AuraBadge>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {log.details && (
                                            <p className="text-xs text-gray-400 truncate mt-1">{log.details}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 ml-3">
                                        {existing ? (
                                            <span className={`text-sm ${existing.rating === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                                                {existing.rating === 'positive' ? '👍' : '👎'}
                                            </span>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleAIFeedback(log.id, 'positive')}
                                                    className="p-1.5 rounded hover:bg-green-900/30 text-gray-400 hover:text-green-400 transition-colors"
                                                >
                                                    👍
                                                </button>
                                                <button
                                                    onClick={() => handleAIFeedback(log.id, 'negative')}
                                                    className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                                                >
                                                    👎
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Feedback summary */}
                        {aiFeedback.length > 0 && (
                            <div className="pt-2 border-t border-[#2A2A2A] text-xs text-gray-500">
                                Total feedback: {aiFeedback.length} ({aiFeedback.filter(f => f.rating === 'positive').length} 👍 / {aiFeedback.filter(f => f.rating === 'negative').length} 👎)
                            </div>
                        )}
                    </div>
                )}
            </AuraPanel>

            <AuraPanel header={<span className="text-white font-medium">Submit Feedback</span>}>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        {(['bug', 'feature', 'note'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFeedbackType(type)}
                                className={`px-3 py-1.5 rounded text-sm transition-colors ${feedbackType === type
                                    ? 'bg-[var(--color-accent-gold)] text-black font-medium'
                                    : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#222]'
                                    }`}
                            >
                                {type === 'bug' ? '🐛 Bug' : type === 'feature' ? '✨ Feature' : '📝 Note'}
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Describe the bug, feature, or note..."
                        rows={3}
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                    />
                    <AuraButton onClick={handleSubmitFeedback} disabled={!feedbackText.trim()}>
                        Save
                    </AuraButton>
                </div>
            </AuraPanel>

            <AuraPanel
                header={
                    <div className="flex items-center justify-between w-full">
                        <span className="text-white font-medium">History ({labEntries.length})</span>
                    </div>
                }
            >
                {labEntries.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No entries</p>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {labEntries.map(entry => (
                            <div
                                key={entry.id}
                                className={`p-3 rounded-lg bg-[#141414] ${entry.status === 'resolved' ? 'opacity-50' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <AuraBadge
                                                size="sm"
                                                variant={entry.type === 'bug' ? 'error' : entry.type === 'feature' ? 'success' : 'muted'}
                                            >
                                                {entry.type === 'bug' ? '🐛' : entry.type === 'feature' ? '✨' : '📝'} {entry.type}
                                            </AuraBadge>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(entry.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300">{entry.title}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleToggleResolved(entry.id)}
                                            className="p-1 text-gray-500 hover:text-green-400 transition-colors"
                                        >
                                            {entry.status === 'resolved' ? '↩️' : '✓'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEntry(entry.id)}
                                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AuraPanel>
        </div>
    );
}

