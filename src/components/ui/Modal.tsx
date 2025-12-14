/**
 * Modal - Componente de modal/diálogo
 */

import { useEffect, type ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
    fullScreenOnMobile?: boolean;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, footer, size = 'md', fullScreenOnMobile = false }: ModalProps) {
    // Cerrar con Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Compute modal container classes
    const modalContainerClasses = fullScreenOnMobile
        ? `relative w-full h-[100dvh] rounded-none flex flex-col md:h-auto md:max-h-[90vh] md:${sizeClasses[size]} md:rounded-xl`
        : `relative w-full ${sizeClasses[size]} bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-xl shadow-2xl`;

    const wrapperClasses = fullScreenOnMobile
        ? 'fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4'
        : 'fixed inset-0 z-50 flex items-center justify-center p-4';

    return (
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

                {/* Content */}
                <div className={`p-4 md:p-6 overflow-y-auto ${fullScreenOnMobile ? 'flex-1' : 'max-h-[60vh]'}`}>
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
