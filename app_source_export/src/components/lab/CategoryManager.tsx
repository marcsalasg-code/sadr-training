/**
 * CategoryManager - Gestión de categorías de entrenamiento
 * Permite añadir, editar y eliminar categorías personalizadas
 */

import { useState } from 'react';
import { AuraPanel, AuraButton, AuraDivider } from '../ui/aura';
import { Input } from '../ui';
import { useTrainingStore } from '../../store/store';

const ICON_OPTIONS = ['💪', '🏋️', '⚡', '🏃', '🧘', '❤️', '🔥', '❄️', '🎯', '💥', '🦵', '🧠'];

export function CategoryManager() {
    const { exerciseCategories, addCategory, updateCategory, deleteCategory } = useTrainingStore();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newIcon, setNewIcon] = useState('💪');

    const handleAdd = () => {
        if (!newName.trim()) return;
        addCategory(newName.trim(), newIcon);
        setNewName('');
        setNewIcon('💪');
        setIsAdding(false);
    };

    const handleUpdate = (id: string, name: string, icon: string) => {
        updateCategory(id, { name, icon });
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Eliminar esta categoría? Los ejercicios existentes mantendrán su categoría.')) {
            deleteCategory(id);
        }
    };

    return (
        <AuraPanel
            header={
                <div className="flex items-center justify-between">
                    <span className="text-white font-medium">📁 Categorías de Entrenamiento</span>
                    <span className="text-xs text-gray-500">{exerciseCategories.length} categorías</span>
                </div>
            }
        >
            <div className="space-y-2">
                {exerciseCategories.map((cat) => (
                    <div
                        key={cat.id}
                        className="flex items-center justify-between p-3 bg-[#141414] rounded-lg hover:bg-[#1A1A1A] transition-colors"
                    >
                        {editingId === cat.id ? (
                            <CategoryEditForm
                                initialName={cat.name}
                                initialIcon={cat.icon || '💪'}
                                onSave={(name, icon) => handleUpdate(cat.id, name, icon)}
                                onCancel={() => setEditingId(null)}
                            />
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{cat.icon}</span>
                                    <span className="text-white">{cat.name}</span>
                                    <span className="text-xs text-gray-500 font-mono">{cat.id}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setEditingId(cat.id)}
                                        className="p-2 hover:bg-[#2A2A2A] rounded transition-colors"
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 hover:bg-red-500/20 rounded transition-colors"
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <AuraDivider className="my-4" />

            {isAdding ? (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="flex gap-1 flex-wrap">
                            {ICON_OPTIONS.map((icon) => (
                                <button
                                    key={icon}
                                    onClick={() => setNewIcon(icon)}
                                    className={`w-10 h-10 rounded flex items-center justify-center text-xl transition-all ${newIcon === icon
                                            ? 'bg-[var(--color-accent-gold)] scale-110'
                                            : 'bg-[#1A1A1A] hover:bg-[#2A2A2A]'
                                        }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nombre de categoría..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1"
                        />
                        <AuraButton variant="gold" onClick={handleAdd} disabled={!newName.trim()}>
                            Añadir
                        </AuraButton>
                        <AuraButton variant="ghost" onClick={() => setIsAdding(false)}>
                            Cancelar
                        </AuraButton>
                    </div>
                </div>
            ) : (
                <AuraButton variant="ghost" onClick={() => setIsAdding(true)} className="w-full">
                    + Nueva Categoría
                </AuraButton>
            )}
        </AuraPanel>
    );
}

// Subcomponente para editar categoría
function CategoryEditForm({
    initialName,
    initialIcon,
    onSave,
    onCancel,
}: {
    initialName: string;
    initialIcon: string;
    onSave: (name: string, icon: string) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(initialName);
    const [icon, setIcon] = useState(initialIcon);

    return (
        <div className="flex items-center gap-2 flex-1">
            <div className="flex gap-1">
                {ICON_OPTIONS.slice(0, 6).map((i) => (
                    <button
                        key={i}
                        onClick={() => setIcon(i)}
                        className={`w-8 h-8 rounded text-lg ${icon === i ? 'bg-[var(--color-accent-gold)]' : 'bg-[#2A2A2A]'}`}
                    >
                        {i}
                    </button>
                ))}
            </div>
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
            />
            <AuraButton size="sm" variant="gold" onClick={() => onSave(name, icon)}>
                ✓
            </AuraButton>
            <AuraButton size="sm" variant="ghost" onClick={onCancel}>
                ✕
            </AuraButton>
        </div>
    );
}
