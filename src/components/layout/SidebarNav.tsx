/**
 * SidebarNav - Desktop sidebar navigation
 * 
 * Phase 13: Refactored to use shared SidebarNavContent component.
 * Logo and profile footer remain here, navigation content is shared.
 */

import { Link } from 'react-router-dom';
import { SidebarNavContent } from './SidebarNavContent';

// Logo icon (inline to avoid dependencies)
const LayersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export function SidebarNav() {
    return (
        <aside className="w-64 bg-[#111111] border-r border-[var(--color-border-default)] flex flex-col relative z-40">
            {/* Logo */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-[#1A1A1A] rounded border border-[#333] flex items-center justify-center">
                        <LayersIcon />
                    </div>
                    <div>
                        <span className="block text-sm font-bold text-white tracking-tight">SADR</span>
                        <span className="block text-[9px] text-gray-500 font-mono tracking-widest">TRAINING OS</span>
                    </div>
                </div>
            </div>

            {/* Shared Navigation Content */}
            <div className="flex-1 overflow-hidden -mt-6">
                <SidebarNavContent />
            </div>

            {/* Footer - Profile */}
            <div className="mt-auto p-4 border-t border-[var(--color-border-default)]">
                <Link
                    to="/settings"
                    className="flex items-center gap-3 px-2 hover:bg-[#1A1A1A] rounded-md py-2 transition-all group"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black border border-gray-600" />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-white">Coach Profile</span>
                        <span className="text-[10px] text-gray-500">Settings</span>
                    </div>
                    <div className="ml-auto">
                        <SettingsIcon />
                    </div>
                </Link>
            </div>
        </aside>
    );
}
