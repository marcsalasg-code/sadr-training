/**
 * ContentArea - Área de contenido principal con fondo decorativo
 * Wrapper para las rutas con grid decorativo estilo Aura
 */

interface ContentAreaProps {
    children: React.ReactNode;
}

export function ContentArea({ children }: ContentAreaProps) {
    return (
        <main className="flex-1 bg-[var(--color-bg-primary)] relative overflow-y-auto scroll-smooth">
            {/* Decorative Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </main>
    );
}
