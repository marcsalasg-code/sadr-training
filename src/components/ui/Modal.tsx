/**
 * Modal - Componente de modal/diálogo
 * 
 * HOTFIX: Uses createPortal to render to document.body, escaping
 * any stacking contexts (transform, z-index, overflow) from parent components.
 */

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { lockBodyScroll, unlockBodyScroll } from '../../core/dom/scrollLock';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
    fullScreenOnMobile?: boolean;
    /** Phase 14A: When true, disables scroll on content wrapper, delegating scroll to child */
    disableContentScroll?: boolean;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, footer, size = 'md', fullScreenOnMobile = false, disableContentScroll = false }: ModalProps) {
    // Handle ESC key and scroll lock (Phase 14C: use ref-counted helper)
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            lockBodyScroll();
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            if (isOpen) {
                unlockBodyScroll();
            }
        };
    }, [isOpen, onClose]);

    // Don't render anything if closed
    if (!isOpen) return null;

    // Compute modal container classes
    const modalContainerClasses = fullScreenOnMobile
        ? `relative w-full h-[100dvh] rounded-none flex flex-col md:h-auto md:max-h-[90vh] md:${sizeClasses[size]} md:rounded-xl`
        : `relative w-full ${sizeClasses[size]} bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-xl shadow-2xl`;

    // Use z-[100] to ensure modal is above header (z-50) and sidebar
    const wrapperClasses = fullScreenOnMobile
        ? 'fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-4'
        : 'fixed inset-0 z-[100] flex items-center justify-center p-4';

    const modalContent = (
        <div className={wrapperClasses}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`${modalContainerClasses} bg-[var(--color-bg-card)] border border-[var(--color-border-default)] shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - sticky on mobile */}
                <div className={`flex items-center justify-between p-4 md:p-6 border-b border-[var(--color-border-default)] ${fullScreenOnMobile ? 'sticky top-0 z-10 bg-[var(--color-bg-card)]' : ''}`}>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content - Phase 14A: Support disableContentScroll for nested scroll control */}
                <div className={`p-4 md:p-6 ${disableContentScroll
                    ? 'overflow-hidden flex flex-col min-h-0'
                    : 'overflow-y-auto'
                    } ${fullScreenOnMobile ? 'flex-1' : 'max-h-[60vh]'}`}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-[var(--color-border-default)]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    // Portal to document.body to escape all stacking contexts
    // Defensive check for SSR (though this is a Vite SPA)
    if (typeof document === 'undefined') return null;

    return createPortal(modalContent, document.body);
}

// Modal de confirmación predefinido
interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'primary' | 'secondary' | 'ghost';
    isDestructive?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    isDestructive = false,
}: ConfirmModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => { onConfirm(); onClose(); }}
                        className={isDestructive ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            <p className="text-[var(--color-text-secondary)]">{message}</p>
        </Modal>
    );
}
