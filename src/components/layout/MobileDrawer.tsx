/**
 * MobileDrawer - Portal-based mobile drawer component
 * 
 * Phase 14D: Renders to document.body via createPortal to escape any
 * stacking contexts (overflow, transform, z-index) from parent components.
 * 
 * Uses "always mounted" strategy with CSS for transitions.
 * Integrates with ref-counted scroll lock helper.
 */

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll, unlockBodyScroll } from '../../core/dom/scrollLock';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export function MobileDrawer({ isOpen, onClose, children }: MobileDrawerProps) {
    // Scroll lock integration (robust pattern)
    useEffect(() => {
        if (!isOpen) return;
        lockBodyScroll();
        return () => unlockBodyScroll();
    }, [isOpen]);

    // Portal content - always mounted for smooth transitions
    const content = (
        <div className="relative z-[70]">
            {/* Overlay - full screen backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 left-0 h-[100dvh] w-[85vw] max-w-[320px] bg-[#111111] z-[70] shadow-2xl transform transition-transform duration-200 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
                    }`}
            >
                {/* Content wrapper with safe area padding */}
                <div className="flex-1 flex flex-col overflow-hidden pb-[max(env(safe-area-inset-bottom),16px)]">
                    {children}
                </div>
            </div>
        </div>
    );

    // SSR guard (though Vite is SPA)
    if (typeof document === 'undefined') return null;

    // Portal to document.body to escape all stacking contexts
    return createPortal(content, document.body);
}
