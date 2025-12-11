/**
 * RecommendedTemplatesPanel - Template recommendations for today's workout
 */

import { AuraPanel, AuraButton, AuraBadge } from '../ui/aura';

interface RecommendedTemplate {
    id: string;
    name: string;
    exerciseCount: number;
    estimatedDuration: number;
    badge?: string;
}

interface RecommendedTemplatesPanelProps {
    templates: RecommendedTemplate[];
    todaySessionType: string;
    onSelectTemplate: (templateId: string, templateName: string) => void;
}

export function RecommendedTemplatesPanel({
    templates,
    todaySessionType,
    onSelectTemplate,
}: RecommendedTemplatesPanelProps) {
    if (templates.length === 0) return null;

    return (
        <AuraPanel
            header={
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <span className="text-[var(--color-accent-gold)]">✨</span>
                        <span>Recommended for today</span>
                    </div>
                    <AuraBadge variant="gold" size="sm">
                        {todaySessionType}
                    </AuraBadge>
                </div>
            }
        >
            <div className="grid grid-cols-3 gap-3">
                {templates.map(template => (
                    <div
                        key={template.id}
                        className="p-4 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] hover:border-[var(--color-accent-gold)]/30 transition-all cursor-pointer group"
                        onClick={() => onSelectTemplate(template.id, template.name)}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-white group-hover:text-[var(--color-accent-gold)] transition-colors truncate">
                                {template.name}
                            </h4>
                            {template.badge && (
                                <AuraBadge variant="gold" size="sm">
                                    {template.badge}
                                </AuraBadge>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                            {template.exerciseCount} exercises • {template.estimatedDuration} min
                        </p>
                        <AuraButton variant="ghost" size="sm" className="w-full">
                            Use →
                        </AuraButton>
                    </div>
                ))}
            </div>
        </AuraPanel>
    );
}
