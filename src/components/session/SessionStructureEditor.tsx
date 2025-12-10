/**
 * SessionStructureEditor - Editor de estructura de sesión
 * 
 * Permite:
 * - Añadir/eliminar/reordenar bloques
 * - Editar tipo y parámetros de cada bloque
 * - Renombrar bloques
 * - Configurar duración estimada
 * 
 * Usado en:
 * - TemplatesView (estructura de plantilla)
 * - SessionBuilder (estructura de sesión individual)
 */

import { useState } from 'react';
import { Modal, Input } from '../ui';
import { AuraButton, AuraBadge, AuraEmptyState } from '../ui/aura';
import type { SessionStructure, SessionBlockConfig, SessionStructureType } from '../../core/sessions/sessionStructure.model';
import {
    STRUCTURE_TYPE_LABELS,
    addBlock,
    removeBlock,
    updateBlock,
    reorderBlocks,
    createDefaultStructure,
} from '../../core/sessions/sessionStructure.model';

// ============================================
// PROPS
// ============================================

export interface SessionStructureEditorProps {
    /** Current structure */
    structure: SessionStructure;
    /** Callback when structure changes */
    onChange: (structure: SessionStructure) => void;
    /** Read-only mode */
    readOnly?: boolean;
    /** Compact display */
    compact?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function SessionStructureEditor({
    structure,
    onChange,
    readOnly = false,
    compact = false,
}: SessionStructureEditorProps) {
    // State
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Sorted blocks
    const sortedBlocks = [...structure.blocks].sort((a, b) => a.order - b.order);

    // Handlers
    const handleAddBlock = (title: string, type: SessionStructureType) => {
        const newStructure = addBlock(structure, {
            title,
            type,
            estimatedDuration: 15,
        });
        onChange(newStructure);
        setShowAddModal(false);
    };

    const handleRemoveBlock = (blockId: string) => {
        const newStructure = removeBlock(structure, blockId);
        onChange(newStructure);
    };

    const handleUpdateBlock = (blockId: string, updates: Partial<SessionBlockConfig>) => {
        const newStructure = updateBlock(structure, blockId, updates);
        onChange(newStructure);
    };

    const handleReorder = (blockId: string, direction: 'up' | 'down') => {
        const currentIndex = sortedBlocks.findIndex((b) => b.id === blockId);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= sortedBlocks.length) return;

        const newStructure = reorderBlocks(structure, currentIndex, newIndex);
        onChange(newStructure);
    };

    // Empty state
    if (sortedBlocks.length === 0) {
        return (
            <AuraEmptyState
                icon="📋"
                title="Sin estructura"
                description="Añade bloques para organizar la sesión"
                action={
                    !readOnly
                        ? {
                            label: '➕ Añadir bloque',
                            onClick: () => setShowAddModal(true),
                        }
                        : undefined
                }
                size="sm"
            />
        );
    }

    return (
        <div className="space-y-2">
            {/* Block List */}
            {sortedBlocks.map((block, index) => (
                <div
                    key={block.id}
                    className={`
                        flex items-center justify-between p-3 rounded-lg
                        bg-[#141414] border border-[#2A2A2A]
                        ${compact ? 'p-2' : 'p-3'}
                    `}
                >
                    {/* Block Info */}
                    <div className="flex items-center gap-3">
                        {/* Order Number */}
                        <div className="w-6 h-6 rounded-full bg-[#2A2A2A] flex items-center justify-center text-xs text-gray-400">
                            {index + 1}
                        </div>

                        {/* Title & Type */}
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{block.title}</span>
                                <AuraBadge variant="muted">{STRUCTURE_TYPE_LABELS[block.type]}</AuraBadge>
                            </div>
                            {block.estimatedDuration && (
                                <span className="text-xs text-gray-500">
                                    ~{block.estimatedDuration} min
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    {!readOnly && (
                        <div className="flex items-center gap-1">
                            {/* Reorder Up */}
                            <button
                                onClick={() => handleReorder(block.id, 'up')}
                                disabled={index === 0}
                                className={`
                                    p-1 rounded text-gray-400 hover:text-white hover:bg-[#2A2A2A]
                                    ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}
                                `}
                            >
                                ↑
                            </button>

                            {/* Reorder Down */}
                            <button
                                onClick={() => handleReorder(block.id, 'down')}
                                disabled={index === sortedBlocks.length - 1}
                                className={`
                                    p-1 rounded text-gray-400 hover:text-white hover:bg-[#2A2A2A]
                                    ${index === sortedBlocks.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}
                                `}
                            >
                                ↓
                            </button>

                            {/* Edit */}
                            <button
                                onClick={() => setEditingBlockId(block.id)}
                                className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#2A2A2A]"
                            >
                                ✏️
                            </button>

                            {/* Delete */}
                            <button
                                onClick={() => handleRemoveBlock(block.id)}
                                className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                            >
                                🗑️
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {/* Add Button */}
            {!readOnly && (
                <AuraButton
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAddModal(true)}
                >
                    ➕ Añadir bloque
                </AuraButton>
            )}

            {/* Add Block Modal */}
            {showAddModal && (
                <AddBlockModal
                    onAdd={handleAddBlock}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {/* Edit Block Modal */}
            {editingBlockId && (
                <EditBlockModal
                    block={structure.blocks.find((b) => b.id === editingBlockId)!}
                    onSave={(updates) => {
                        handleUpdateBlock(editingBlockId, updates);
                        setEditingBlockId(null);
                    }}
                    onClose={() => setEditingBlockId(null)}
                />
            )}
        </div>
    );
}

// ============================================
// ADD BLOCK MODAL
// ============================================

interface AddBlockModalProps {
    onAdd: (title: string, type: SessionStructureType) => void;
    onClose: () => void;
}

const BLOCK_PRESETS: { title: string; type: SessionStructureType; icon: string }[] = [
    { title: 'Calentamiento', type: 'linear', icon: '🔥' },
    { title: 'Fuerza Principal', type: 'linear', icon: '💪' },
    { title: 'Accesorios', type: 'linear', icon: '🔧' },
    { title: 'Core', type: 'linear', icon: '🧘' },
    { title: 'EMOM', type: 'emom', icon: '⏱️' },
    { title: 'AMRAP', type: 'amrap', icon: '🔁' },
    { title: 'Circuito', type: 'circuit', icon: '🔄' },
    { title: 'Personalizado', type: 'custom', icon: '✨' },
];

function AddBlockModal({ onAdd, onClose }: AddBlockModalProps) {
    const [customTitle, setCustomTitle] = useState('');
    const [customType, setCustomType] = useState<SessionStructureType>('linear');
    const [showCustom, setShowCustom] = useState(false);

    const handlePresetClick = (preset: typeof BLOCK_PRESETS[0]) => {
        if (preset.title === 'Personalizado') {
            setShowCustom(true);
        } else {
            onAdd(preset.title, preset.type);
        }
    };

    const handleCustomAdd = () => {
        if (customTitle.trim()) {
            onAdd(customTitle.trim(), customType);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Añadir Bloque"
            size="md"
        >
            {showCustom ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Nombre del bloque</label>
                        <Input
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="Ej: Fuerza máxima"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Tipo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(STRUCTURE_TYPE_LABELS) as SessionStructureType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setCustomType(type)}
                                    className={`
                                        p-2 rounded-lg text-sm transition-colors
                                        ${customType === type
                                            ? 'bg-[var(--color-accent-gold)] text-black'
                                            : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                        }
                                    `}
                                >
                                    {STRUCTURE_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <AuraButton variant="ghost" onClick={() => setShowCustom(false)}>
                            ← Volver
                        </AuraButton>
                        <AuraButton variant="gold" onClick={handleCustomAdd} disabled={!customTitle.trim()}>
                            Añadir
                        </AuraButton>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {BLOCK_PRESETS.map((preset) => (
                        <button
                            key={preset.title}
                            onClick={() => handlePresetClick(preset)}
                            className="p-4 rounded-lg bg-[#141414] border border-[#2A2A2A] hover:border-[var(--color-accent-gold)]/30 text-left transition-colors"
                        >
                            <span className="text-2xl">{preset.icon}</span>
                            <p className="text-white font-medium mt-2">{preset.title}</p>
                            <p className="text-xs text-gray-500">{STRUCTURE_TYPE_LABELS[preset.type]}</p>
                        </button>
                    ))}
                </div>
            )}
        </Modal>
    );
}

// ============================================
// EDIT BLOCK MODAL
// ============================================

interface EditBlockModalProps {
    block: SessionBlockConfig;
    onSave: (updates: Partial<SessionBlockConfig>) => void;
    onClose: () => void;
}

function EditBlockModal({ block, onSave, onClose }: EditBlockModalProps) {
    const [title, setTitle] = useState(block.title);
    const [type, setType] = useState<SessionStructureType>(block.type);
    const [duration, setDuration] = useState(block.estimatedDuration || 15);
    const [notes, setNotes] = useState(block.notes || '');

    const handleSave = () => {
        onSave({
            title: title.trim() || block.title,
            type,
            estimatedDuration: duration,
            notes: notes.trim() || undefined,
        });
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Editar: ${block.title}`}
            size="md"
            footer={
                <>
                    <AuraButton variant="ghost" onClick={onClose}>
                        Cancelar
                    </AuraButton>
                    <AuraButton variant="gold" onClick={handleSave}>
                        Guardar
                    </AuraButton>
                </>
            }
        >
            <div className="space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Nombre del bloque"
                    />
                </div>

                {/* Type */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Tipo</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(STRUCTURE_TYPE_LABELS) as SessionStructureType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`
                                    p-2 rounded-lg text-sm transition-colors
                                    ${type === t
                                        ? 'bg-[var(--color-accent-gold)] text-black'
                                        : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                                    }
                                `}
                            >
                                {STRUCTURE_TYPE_LABELS[t]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Duración estimada (min)</label>
                    <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                        min={1}
                        max={120}
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Notas</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notas opcionales..."
                        className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-accent-gold)] outline-none resize-none"
                        rows={3}
                    />
                </div>
            </div>
        </Modal>
    );
}

// ============================================
// EXPORTS
// ============================================

export { createDefaultStructure };
