/**
 * SessionCreateModal - Modal for creating new sessions
 * 
 * PHASE 2: Added TemplatePreview integration
 */

import { useMemo } from 'react';
import { Modal, Input, Select } from '../ui';
import { AuraButton } from '../ui/aura';
import { TemplatePreview } from './TemplatePreview';
import type { WorkoutTemplate, Exercise } from '../../types/types';

interface Athlete {
    id: string;
    name: string;
}

interface NewSessionData {
    name: string;
    athleteId: string;
    athleteIds: string[];
    isMultiAthlete: boolean;
    templateId: string;
    description: string;
    scheduledDate: string;
}

interface SessionCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: () => void;
    newSession: NewSessionData;
    setNewSession: (data: NewSessionData) => void;
    athletes: Athlete[];
    /** Full template objects for preview */
    templates: WorkoutTemplate[];
    /** Exercise map for template preview */
    exercisesMap?: Map<string, Exercise>;
}

export function SessionCreateModal({
    isOpen,
    onClose,
    onCreate,
    newSession,
    setNewSession,
    athletes,
    templates,
    exercisesMap,
}: SessionCreateModalProps) {
    const isValid = newSession.name.trim() && newSession.athleteId;

    // Find selected template for preview
    const selectedTemplate = useMemo(() => {
        if (!newSession.templateId) return null;
        return templates.find(t => t.id === newSession.templateId) || null;
    }, [newSession.templateId, templates]);

    // Auto-fill name from template if empty
    const handleTemplateChange = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        setNewSession({
            ...newSession,
            templateId,
            // Auto-fill name if empty
            name: newSession.name || template?.name || '',
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="New Session"
            size="lg"
            footer={
                <>
                    <AuraButton variant="ghost" onClick={onClose}>
                        Cancel
                    </AuraButton>
                    <AuraButton
                        variant="gold"
                        onClick={onCreate}
                        disabled={!isValid}
                    >
                        Create & Start
                    </AuraButton>
                </>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Form Fields */}
                <div className="space-y-4">
                    <Input
                        label="Session Name *"
                        placeholder="E.g: Push Day, Legs, Full Body..."
                        value={newSession.name}
                        onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                        autoFocus
                    />
                    <Select
                        label="Athlete *"
                        value={newSession.athleteId}
                        onChange={(e) => setNewSession({
                            ...newSession,
                            athleteId: e.target.value,
                            athleteIds: e.target.value ? [e.target.value] : [],
                        })}
                        placeholder="Select athlete"
                        options={athletes.map(a => ({ value: a.id, label: a.name }))}
                    />

                    {/* Multi-athlete toggle */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="multiAthlete"
                            checked={newSession.isMultiAthlete}
                            onChange={(e) => setNewSession({ ...newSession, isMultiAthlete: e.target.checked })}
                            className="w-4 h-4 rounded bg-[#1A1A1A] border-[#2A2A2A]"
                        />
                        <label htmlFor="multiAthlete" className="text-sm text-gray-400">
                            Add more athletes (multi-athlete session)
                        </label>
                    </div>

                    {/* Additional athletes selector */}
                    {newSession.isMultiAthlete && (
                        <div className="p-3 bg-[#141414] rounded-lg border border-[#2A2A2A]">
                            <p className="text-xs text-gray-500 mb-2">Select additional athletes:</p>
                            <div className="flex flex-wrap gap-2">
                                {athletes
                                    .filter(a => a.id !== newSession.athleteId)
                                    .map(athlete => (
                                        <label
                                            key={athlete.id}
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition-all ${newSession.athleteIds.includes(athlete.id)
                                                ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/30'
                                                : 'bg-[#1A1A1A] text-gray-400 hover:text-white border border-[#2A2A2A]'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={newSession.athleteIds.includes(athlete.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...newSession.athleteIds, athlete.id]
                                                        : newSession.athleteIds.filter(id => id !== athlete.id);
                                                    setNewSession({ ...newSession, athleteIds: ids });
                                                }}
                                                className="sr-only"
                                            />
                                            {athlete.name}
                                        </label>
                                    ))}
                            </div>
                        </div>
                    )}

                    {templates.length > 0 && (
                        <Select
                            label="Template (optional)"
                            value={newSession.templateId}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            placeholder="No template"
                            options={[
                                { value: '', label: 'No template' },
                                ...templates.map(t => ({ value: t.id, label: t.name })),
                            ]}
                        />
                    )}

                    <Input
                        label="Scheduled Date (optional)"
                        type="date"
                        value={newSession.scheduledDate}
                        onChange={(e) => setNewSession({ ...newSession, scheduledDate: e.target.value })}
                    />

                    <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                            Notes (optional)
                        </label>
                        <textarea
                            placeholder="Session notes..."
                            value={newSession.description}
                            onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                            rows={2}
                            className="w-full bg-[#0A0A0A] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Right Column: Template Preview */}
                <div className="space-y-2">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest">
                        Template Preview
                    </label>
                    <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[#222] min-h-[200px]">
                        {selectedTemplate && exercisesMap ? (
                            <TemplatePreview
                                template={selectedTemplate}
                                exercisesMap={exercisesMap}
                                compact
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                {templates.length > 0
                                    ? 'Select a template to preview'
                                    : 'No templates available'}
                            </div>
                        )}
                    </div>
                    {selectedTemplate && (
                        <p className="text-[10px] text-gray-500 text-center">
                            Exercises will be copied to the new session
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
}

