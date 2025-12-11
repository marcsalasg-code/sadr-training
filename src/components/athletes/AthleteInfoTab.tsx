/**
 * AthleteInfoTab - Information tab content (contact, goals, injuries, notes, custom fields)
 */

import { AuraPanel, AuraButton } from '../ui/aura';
import { InfoRow } from './AthleteSessionRow';

interface AthleteInfoTabProps {
    email?: string;
    phone?: string;
    birthDate?: string;
    createdAt: string;
    goals?: string;
    injuries?: string;
    notes?: string;
    customFields?: Record<string, string | boolean | number>;
    formatDate: (dateStr?: string) => string;
    onAddCustomField: () => void;
    onDeleteCustomField: (key: string) => void;
}

export function AthleteInfoTab({
    email,
    phone,
    birthDate,
    createdAt,
    goals,
    injuries,
    notes,
    customFields,
    formatDate,
    onAddCustomField,
    onDeleteCustomField,
}: AthleteInfoTabProps) {
    return (
        <div className="space-y-4 pt-4">
            <AuraPanel header={<span className="text-white text-sm">Datos de Contacto</span>}>
                <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Email" value={email || '-'} />
                    <InfoRow label="Teléfono" value={phone || '-'} />
                    <InfoRow label="Fecha de nacimiento" value={formatDate(birthDate)} />
                    <InfoRow label="Registrado" value={formatDate(createdAt)} />
                </div>
            </AuraPanel>

            {goals && (
                <AuraPanel header={<span className="text-white text-sm">🎯 Objetivos</span>}>
                    <p className="text-gray-400 whitespace-pre-wrap">{goals}</p>
                </AuraPanel>
            )}

            {injuries && (
                <AuraPanel
                    header={<span className="text-yellow-400 text-sm">⚠️ Lesiones / Limitaciones</span>}
                    className="border-yellow-600/30"
                >
                    <p className="text-gray-400 whitespace-pre-wrap">{injuries}</p>
                </AuraPanel>
            )}

            {notes && (
                <AuraPanel header={<span className="text-white text-sm">📝 Notas</span>}>
                    <p className="text-gray-400 whitespace-pre-wrap">{notes}</p>
                </AuraPanel>
            )}

            {/* Custom Fields Section */}
            <AuraPanel
                header={
                    <div className="flex items-center justify-between w-full">
                        <span className="text-white text-sm">🏷️ Campos Personalizados</span>
                        <AuraButton variant="ghost" size="sm" onClick={onAddCustomField}>
                            + Añadir
                        </AuraButton>
                    </div>
                }
            >
                {customFields && Object.keys(customFields).length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(customFields).map(([key, value]) => (
                            <div
                                key={key}
                                className="flex items-center justify-between p-2 rounded bg-[#141414] group"
                            >
                                <div>
                                    <p className="text-xs text-gray-500">{key}</p>
                                    <p className="text-sm text-white">
                                        {typeof value === 'boolean'
                                            ? (value ? '✓ Sí' : '✗ No')
                                            : String(value)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onDeleteCustomField(key)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition-opacity"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                        No hay campos personalizados. Haz clic en "+ Añadir" para crear uno.
                    </p>
                )}
            </AuraPanel>
        </div>
    );
}
