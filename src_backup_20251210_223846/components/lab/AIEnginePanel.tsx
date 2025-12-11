/**
 * AIEnginePanel - Panel de configuración y testing del motor IA
 */

import { useState, useEffect } from 'react';
import { Input } from '../../components/ui';
import {
    AuraPanel,
    AuraButton,
    AuraBadge,
} from '../../components/ui/aura';
import { useAIStore, useAISettings, useAILogs, useAITest, type ProviderType } from '../../ai';

export function AIEnginePanel() {
    const aiSettings = useAISettings();
    const aiLogs = useAILogs();
    const { updateSettings: updateAISettings, clearLogs, initialize: initAI, setProvider, setEnabled: setAIEnabled } = useAIStore();
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const { runTest: runAITest, isRunning: isAITestRunning, result: aiTestResult, clearResult: clearAITestResult } = useAITest();

    useEffect(() => {
        initAI();
    }, [initAI]);

    const handleTestConnection = async () => {
        setTestStatus('testing');
        try {
            const { AIEngine } = await import('../../ai');
            const result = await AIEngine.testConnection();
            setTestStatus(result ? 'success' : 'error');
            setTimeout(() => setTestStatus('idle'), 3000);
        } catch {
            setTestStatus('error');
            setTimeout(() => setTestStatus('idle'), 3000);
        }
    };

    return (
        <div className="space-y-6">
            {/* Status */}
            <AuraPanel
                header={
                    <div className="flex items-center justify-between w-full">
                        <span className="text-white font-medium">🤖 AI Engine</span>
                        <AuraBadge variant={aiSettings.isEnabled ? 'success' : 'muted'}>
                            {aiSettings.isEnabled ? '● Active' : '○ Inactive'}
                        </AuraBadge>
                    </div>
                }
            >
                <div className="space-y-4">
                    {/* Toggle */}
                    <label className="flex items-center justify-between p-3 rounded-lg bg-[#141414]">
                        <div>
                            <span className="font-medium text-white">Enable AI</span>
                            <p className="text-xs text-gray-500">Enable all AI features</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={aiSettings.isEnabled}
                            onChange={(e) => setAIEnabled(e.target.checked)}
                            className="toggle scale-125"
                        />
                    </label>

                    {/* Provider */}
                    <div className="p-3 rounded-lg bg-[#141414]">
                        <label className="block mb-2 text-sm font-medium text-white">Provider</label>
                        <div className="flex gap-2">
                            {(['mock', 'remote'] as ProviderType[]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setProvider(p)}
                                    className={`flex-1 py-2 px-4 rounded text-sm transition-colors ${aiSettings.provider === p
                                        ? 'bg-[var(--color-accent-gold)] text-black font-medium'
                                        : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#222]'
                                        }`}
                                >
                                    {p === 'mock' ? '🔧 Mock' : '☁️ Remote'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </AuraPanel>

            {/* Remote Config */}
            {aiSettings.provider === 'remote' && (
                <AuraPanel header={<span className="text-white font-medium">Remote API Configuration</span>}>
                    <div className="space-y-4">
                        <Input
                            label="API URL"
                            value={aiSettings.apiUrl}
                            onChange={(e) => updateAISettings({ apiUrl: e.target.value })}
                            placeholder="https://api.example.com/v1/chat/completions"
                        />
                        <Input
                            label="API Key"
                            type="password"
                            value={aiSettings.apiKey}
                            onChange={(e) => updateAISettings({ apiKey: e.target.value })}
                            placeholder="sk-..."
                        />
                        <Input
                            label="Model"
                            value={aiSettings.model}
                            onChange={(e) => updateAISettings({ model: e.target.value })}
                            placeholder="gpt-4o-mini"
                        />
                        <AuraButton
                            onClick={handleTestConnection}
                            disabled={testStatus === 'testing' || !aiSettings.apiKey}
                            variant={testStatus === 'success' ? 'gold' : testStatus === 'error' ? 'secondary' : 'primary'}
                        >
                            {testStatus === 'testing' ? '⏳ Testing...' :
                                testStatus === 'success' ? '✓ Connected' :
                                    testStatus === 'error' ? '✗ Error' : 'Test Connection'}
                        </AuraButton>
                    </div>
                </AuraPanel>
            )}

            {/* Features */}
            <AuraPanel header={<span className="text-white font-medium">AI Features</span>}>
                <div className="space-y-3">
                    {[
                        { key: 'templateGeneration', label: '📋 Template Generator', desc: 'Generate templates from natural language' },
                        { key: 'loadPrediction', label: '📊 Load Prediction', desc: 'Weight and rep suggestions' },
                        { key: 'autoSuggestions', label: '💡 Auto Suggestions', desc: 'Show proactive suggestions' },
                    ].map(feature => (
                        <label key={feature.key} className="flex items-center justify-between p-3 rounded-lg bg-[#141414]">
                            <div>
                                <span className="font-medium text-white">{feature.label}</span>
                                <p className="text-xs text-gray-500">{feature.desc}</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={aiSettings[feature.key as keyof typeof aiSettings] as boolean}
                                onChange={() => updateAISettings({ [feature.key]: !aiSettings[feature.key as keyof typeof aiSettings] })}
                                className="toggle"
                            />
                        </label>
                    ))}
                </div>
            </AuraPanel>

            {/* Logs */}
            <AuraPanel
                header={
                    <div className="flex items-center justify-between w-full">
                        <span className="text-white font-medium">AI Logs ({aiLogs.length})</span>
                        <AuraButton variant="ghost" size="sm" onClick={clearLogs}>Clear</AuraButton>
                    </div>
                }
            >
                {aiLogs.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No AI logs</p>
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {aiLogs.slice(-20).reverse().map(log => (
                            <div key={log.id} className={`p-2 rounded text-xs ${log.success ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                                <div className="flex justify-between">
                                    <span className="font-mono text-white">{log.requestType}</span>
                                    <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                {log.details && <p className="text-gray-500 mt-1">{log.details}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </AuraPanel>

            {/* Test */}
            <AuraPanel header={<span className="text-white font-medium">🧪 AI Test</span>}>
                <p className="text-sm text-gray-500 mb-4">
                    Test the complete flow: Button → AIEngine → Provider → Response
                </p>
                <div className="flex gap-2 mb-4">
                    <AuraButton onClick={runAITest} disabled={isAITestRunning || !aiSettings.isEnabled}>
                        {isAITestRunning ? '⏳ Running...' : '🧪 Run Test'}
                    </AuraButton>
                    {aiTestResult && (
                        <AuraButton variant="ghost" size="sm" onClick={clearAITestResult}>Clear</AuraButton>
                    )}
                </div>

                {!aiSettings.isEnabled && (
                    <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30 text-yellow-400 text-sm mb-4">
                        ⚠️ AI is disabled. Enable it above to test.
                    </div>
                )}

                {aiTestResult && (
                    <div className={`p-4 rounded-lg border ${aiTestResult.success
                        ? 'bg-green-900/20 border-green-500/30'
                        : 'bg-red-900/20 border-red-500/30'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`font-bold ${aiTestResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                {aiTestResult.success ? '✅ AI OK' : '❌ Error'}
                            </span>
                            <span className="text-xs text-gray-500">
                                {aiTestResult.duration}ms | Provider: {aiTestResult.provider || 'unknown'}
                            </span>
                        </div>
                        {aiTestResult.success && typeof aiTestResult.data !== 'undefined' && (
                            <pre className="text-xs bg-[#0A0A0A] p-2 rounded overflow-x-auto max-h-40 overflow-y-auto text-gray-300">
                                {JSON.stringify(aiTestResult.data, null, 2)}
                            </pre>
                        )}
                        {aiTestResult.error && (
                            <p className="text-sm text-red-300 mt-2">{aiTestResult.error}</p>
                        )}
                    </div>
                )}
            </AuraPanel>
        </div>
    );
}
