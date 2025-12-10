/**
 * AuraTabs - Tabbed navigation with Aura styling
 * 
 * Consistent tab component used across views
 */


import type { ReactNode } from 'react';

export interface AuraTab {
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    content?: ReactNode;
}

interface AuraTabsProps {
    /** Array of tab definitions */
    tabs: readonly AuraTab[];
    /** Currently active tab ID */
    activeTab: string;
    /** Callback when tab changes */
    onChange: (tabId: string) => void;
    /** Size variant */
    size?: 'sm' | 'md';
    /** Additional classes */
    className?: string;
}

export function AuraTabs({
    tabs,
    activeTab,
    onChange,
    size = 'md',
    className = '',
}: AuraTabsProps) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
    };

    return (
        <div className={`flex gap-1 border-b border-[#2A2A2A] pb-2 ${className}`}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => !tab.disabled && onChange(tab.id)}
                    disabled={tab.disabled}
                    className={`
                        ${sizeClasses[size]}
                        rounded-t-lg font-medium transition-colors
                        ${activeTab === tab.id
                            ? 'bg-[var(--color-accent-gold)] text-black'
                            : tab.disabled
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-500 hover:text-white hover:bg-[#1A1A1A]'
                        }
                    `}
                >
                    {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
