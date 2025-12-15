/**
 * SidebarNavContent - Shared navigation content component
 * 
 * Phase 13: Used by both desktop SidebarNav and mobile sidebar.
 * Uses Link (not NavLink) since active state is pre-computed by useNavigation.
 */

import { Link } from 'react-router-dom';
import { useNavigation, type NavGroupRuntime, type NavItemRuntime } from '../../hooks/useNavigation';

interface SidebarNavContentProps {
    /** Callback invoked after navigation (used to close mobile menu) */
    onNavigate?: () => void;
    /** Whether to show the logo header (used in mobile sidebar) */
    showLogo?: boolean;
}

export function SidebarNavContent({ onNavigate, showLogo = false }: SidebarNavContentProps) {
    const navGroups = useNavigation();

    const handleClick = () => {
        onNavigate?.();
    };

    return (
        <div className="flex flex-col h-full">
            {/* Optional Logo Header (for mobile) */}
            {showLogo && (
                <div className="h-14 flex items-center px-4 border-b border-[var(--color-border-default)]">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#1A1A1A] rounded border border-[#333] flex items-center justify-center">
                            <svg className="w-3 h-3 text-[var(--color-accent-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <span className="text-sm font-bold tracking-tight text-white uppercase">SADR</span>
                    </div>
                </div>
            )}

            {/* Navigation Groups - Phase 14C: Added pb-8 for safe area scroll */}
            <nav className="flex-1 overflow-y-auto p-4 pb-8 space-y-1">
                {navGroups.map((group) => (
                    <NavGroup key={group.title} group={group} onNavigate={handleClick} />
                ))}
            </nav>
        </div>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function NavGroup({ group, onNavigate }: { group: NavGroupRuntime; onNavigate: () => void }) {
    return (
        <div>
            <div className="px-3 py-1 text-[10px] font-mono text-gray-600 uppercase tracking-widest mt-4 mb-2 first:mt-0">
                {group.title}
            </div>
            {group.items.map((item) => (
                <NavItem key={item.id} item={item} onNavigate={onNavigate} />
            ))}
        </div>
    );
}

function NavItem({ item, onNavigate }: { item: NavItemRuntime; onNavigate: () => void }) {
    // Phase 14C: Aura Gold active style for better visibility
    const activeClass = item.isActive
        ? 'text-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30'
        : 'text-gray-400 hover:text-white hover:bg-[var(--color-bg-elevated)] border border-transparent';

    return (
        <Link
            to={item.to}
            onClick={onNavigate}
            className={`
        flex items-center gap-3 w-full
        text-sm font-medium rounded-md px-3 py-2
        transition-all
        ${activeClass}
      `}
        >
            <span className="transition-colors shrink-0">
                {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
            {/* Pulse indicator for Live Session when active */}
            {item.id === 'live' && (
                <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
        </Link>
    );
}
