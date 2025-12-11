/**
 * AthleteHeader - Header section with avatar, status badges, and action buttons
 */

import { AuraSection, AuraButton, AuraBadge } from '../ui/aura';

interface AthleteHeaderProps {
    name: string;
    isActive: boolean;
    email?: string;
    hasInjuries: boolean;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export function AthleteHeader({
    name,
    isActive,
    email,
    hasInjuries,
    onBack,
    onEdit,
    onDelete,
}: AthleteHeaderProps) {
    return (
        <>
            {/* Header */}
            <AuraSection
                title={name}
                subtitle={isActive ? 'Atleta activo' : 'Atleta inactivo'}
                action={
                    <div className="flex items-center gap-2">
                        <AuraButton variant="ghost" onClick={onBack}>
                            ← Volver
                        </AuraButton>
                        <AuraButton variant="secondary" onClick={onEdit}>
                            ✏️ Editar
                        </AuraButton>
                        <AuraButton
                            variant="ghost"
                            className="!text-red-400 hover:!bg-red-400/10"
                            onClick={onDelete}
                        >
                            🗑️
                        </AuraButton>
                    </div>
                }
            />

            {/* Avatar + Status */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent-gold)] to-[#8B7355] flex items-center justify-center text-2xl font-bold text-black">
                    {name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <AuraBadge variant={isActive ? 'gold' : 'muted'}>
                            {isActive ? 'Activo' : 'Inactivo'}
                        </AuraBadge>
                        {hasInjuries && <AuraBadge variant="warning">⚠️ Lesiones</AuraBadge>}
                    </div>
                    {email && <p className="text-sm text-gray-500 mt-1">{email}</p>}
                </div>
            </div>
        </>
    );
}
