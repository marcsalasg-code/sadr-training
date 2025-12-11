/**
 * SimulatorPanel - Panel para ejecutar simulaciones de datos
 * Sprint 8: Testing del sistema completo
 */

import { useState } from 'react';
import { AuraButton, AuraPanel } from '../ui/aura';
import { createDefaultSimulation, runSimulation, type SimulationResult } from '../../utils/dataSimulator';
import { useExercises, useTrainingStore } from '../../store/store';

export function SimulatorPanel() {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [importStatus, setImportStatus] = useState<string>('');

    const exercises = useExercises();
    const { addSession, addAthlete } = useTrainingStore();

    const handleRunSimulation = () => {
        setIsRunning(true);
        setImportStatus('');

        try {
            const simResult = createDefaultSimulation(exercises);
            setResult(simResult);
        } catch (error) {
            console.error('Simulation error:', error);
            setResult(null);
        } finally {
            setIsRunning(false);
        }
    };

    const handleImportToStore = () => {
        if (!result) return;

        setImportStatus('Importing...');

        try {
            // Import athletes
            result.athletes.forEach(athlete => {
                addAthlete(athlete);
            });

            // Import sessions
            result.sessions.forEach(session => {
                addSession(session);
            });

            setImportStatus(`✅ Imported ${result.athletes.length} athletes and ${result.sessions.length} sessions`);
        } catch (error) {
            setImportStatus(`❌ Error: ${error}`);
        }
    };

    const handleCustomSimulation = () => {
        setIsRunning(true);
        setImportStatus('');

        try {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 2);

            const simResult = runSimulation({
                athleteCount: 4,
                sessionsPerWeek: 4,
                weeksToSimulate: 10,
                startDate,
                exercisePool: exercises,
            });
            setResult(simResult);
        } catch (error) {
            console.error('Custom simulation error:', error);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="space-y-4">
            <AuraPanel header={<div><h3 className="text-white font-medium">Data Simulator</h3><p className="text-xs text-gray-500">Generate test data for system validation</p></div>}>
                <div className="space-y-4">
                    {/* Actions */}
                    <div className="flex gap-3">
                        <AuraButton
                            onClick={handleRunSimulation}
                            disabled={isRunning}
                        >
                            {isRunning ? '⏳ Running...' : '🎲 Quick Simulation'}
                        </AuraButton>
                        <AuraButton
                            variant="secondary"
                            onClick={handleCustomSimulation}
                            disabled={isRunning}
                        >
                            📊 Extended (4 athletes, 10 weeks)
                        </AuraButton>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="p-4 bg-[#0D0D0D] rounded-lg border border-[#2A2A2A] space-y-3">
                            <h4 className="text-sm font-medium text-[var(--color-accent-gold)]">
                                Simulation Results
                            </h4>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{result.athletes.length}</p>
                                    <p className="text-xs text-gray-500">Athletes</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{result.sessions.length}</p>
                                    <p className="text-xs text-gray-500">Sessions</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">
                                        {(result.sessions.length / result.athletes.length).toFixed(1)}
                                    </p>
                                    <p className="text-xs text-gray-500">Sessions/Athlete</p>
                                </div>
                            </div>

                            {/* Logs */}
                            <div className="mt-3 text-xs text-gray-500 space-y-1">
                                {result.logs.map((log, i) => (
                                    <div key={i}>• {log}</div>
                                ))}
                            </div>

                            {/* Import Button */}
                            <div className="pt-3 border-t border-[#2A2A2A]">
                                <AuraButton
                                    variant="primary"
                                    onClick={handleImportToStore}
                                >
                                    📥 Import to Store
                                </AuraButton>
                                {importStatus && (
                                    <p className={`mt-2 text-sm ${importStatus.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                                        {importStatus}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </AuraPanel>

            {/* Audit Info */}
            <AuraPanel header={<div><h3 className="text-white font-medium">System Audit</h3><p className="text-xs text-gray-500">Verify data consistency</p></div>}>
                <div className="text-sm text-gray-500">
                    <p>After importing simulation data, check:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Dashboard shows correct stats</li>
                        <li>AthleteDetail shows 1RM progress</li>
                        <li>Analytics shows volume trends</li>
                        <li>Calendar shows sessions properly</li>
                    </ul>
                </div>
            </AuraPanel>
        </div>
    );
}
