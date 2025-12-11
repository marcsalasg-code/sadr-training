/**
 * BrowserTopBar - Barra decorativa estilo navegador macOS
 * Parte del diseño Aura premium
 */

interface BrowserTopBarProps {
    version?: string;
}

export function BrowserTopBar({ version = 'v1.0.0' }: BrowserTopBarProps) {
    return (
        <div className="h-10 bg-[#141414] border-b border-[var(--color-border-default)] flex items-center px-4 justify-between shrink-0 z-50"
            style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)'
            }}
        >
            {/* Traffic Lights (macOS style) */}
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[var(--color-traffic-red)] border border-black/20 hover:brightness-110 transition-all cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-[var(--color-traffic-yellow)] border border-black/20 hover:brightness-110 transition-all cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-[var(--color-traffic-green)] border border-black/20 hover:brightness-110 transition-all cursor-pointer" />
            </div>

            {/* URL Bar */}
            <div className="flex-1 max-w-lg mx-auto">
                <div className="bg-[#0A0A0A] rounded text-[10px] text-gray-500 text-center py-1 border border-[#222] font-mono flex items-center justify-center gap-2">
                    <svg className="w-3 h-3 text-[var(--color-accent-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="opacity-70">sadr.training/app</span>
                </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 bg-[var(--color-accent-gold)] rounded-full animate-pulse" />
                <div className="text-[10px] font-mono text-gray-500">{version}</div>
            </div>
        </div>
    );
}
