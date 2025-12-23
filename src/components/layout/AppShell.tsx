import { useState, type ReactNode } from 'react';
import { Calendar, CheckSquare, Layers, Minus, X, Sliders, Palette } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { ThemeSelector } from '../theme/ThemeSelector';
import { VisualSettings } from '../theme/VisualSettings';

interface AppShellProps {
    children: ReactNode;
    activeTab: 'dashboard' | 'calendar' | 'todo' | 'exams';
    onTabChange: (tab: 'dashboard' | 'calendar' | 'todo' | 'exams') => void;
}

import { useTheme } from '../../services/theme/ThemeContext';

export function AppShell({ children, activeTab, onTabChange }: AppShellProps) {
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    const [showVisualSettings, setShowVisualSettings] = useState(false);

    // Connect to Visual Settings
    const { blurIntensity, panelOpacity } = useTheme();

    return (
        <div className="flex h-screen w-screen overflow-hidden text-slate-800">
            {/* Custom Title Bar Area */}
            <div
                className="fixed top-0 left-0 w-full h-10 z-50 flex items-center justify-start px-3 gap-2 hover:bg-black/5 transition-colors group"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
                {/* Window Controls (No Drag Region for Buttons) */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <button
                        onClick={() => {
                            console.log('Minimize clicked');
                            (window as unknown as { electron: { minimize: () => void } }).electron?.minimize()
                        }}
                        className="p-1.5 rounded-full hover:bg-black/10 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <Minus size={14} />
                    </button>
                    <button
                        onClick={() => {
                            console.log('Close clicked');
                            (window as unknown as { electron: { close: () => void } }).electron?.close()
                        }}
                        className="p-1.5 rounded-full hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Main Glass Container (Full Screen now) */}
            <div
                className="relative flex h-full w-full overflow-hidden border-t border-glass-border transition-all duration-300"
                style={{
                    backdropFilter: `blur(${blurIntensity}px)`,
                    backgroundColor: `rgba(255, 255, 255, ${Math.max(0.1, panelOpacity - 0.2)})` // Slightly less opaque than panels
                }}
            >

                {/* Sidebar / Dock */}
                <nav className="flex w-20 flex-col items-center border-r border-glass-border py-8 transition-all duration-300"
                    style={{
                        backgroundColor: `rgba(255, 255, 255, ${Math.max(0.2, panelOpacity - 0.1)})`
                    }}
                >
                    <div className="mb-8 rounded-xl bg-white/20 p-3 shadow-sm">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={() => setShowThemeSelector(!showThemeSelector)}
                            className="h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-orange-500/20 hover:scale-110 active:scale-95 transition-all shadow-lg cursor-pointer ring-1 ring-white/10"
                            title="Theme Settings"
                        >
                            <Palette size={24} />
                        </button>
                    </div>
                    {showThemeSelector && <ThemeSelector onClose={() => setShowThemeSelector(false)} />}


                    <div className="flex flex-1 flex-col gap-6">
                        <NavItem
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
                            label="Dashboard"
                            active={activeTab === 'dashboard'}
                            onClick={() => onTabChange('dashboard')}
                        />
                        <NavItem
                            icon={<Calendar size={24} />}
                            label="Calendar"
                            active={activeTab === 'calendar'}
                            onClick={() => onTabChange('calendar')}
                        />
                        <NavItem
                            icon={<CheckSquare size={24} />}
                            label="To-Do"
                            active={activeTab === 'todo'}
                            onClick={() => onTabChange('todo')}
                        />
                        <NavItem
                            icon={<Layers size={24} />}
                            label="Exams"
                            active={activeTab === 'exams'}
                            onClick={() => onTabChange('exams')}
                        />
                    </div>

                    {/* Visual Settings Toggle */}
                    <div className="mt-auto mb-6 rounded-xl bg-white/20 p-2 shadow-sm relative group z-50">
                        <button
                            onClick={() => setShowVisualSettings(!showVisualSettings)}
                            className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Visual Settings"
                        >
                            <Sliders size={14} />
                        </button>
                        {showVisualSettings && <VisualSettings onClose={() => setShowVisualSettings(false)} />}
                    </div>
                </nav>

                {/* Content Area */}
                <main className="flex-1 overflow-auto p-8 relative">
                    {children}
                </main>
            </div >
        </div >
    );
}

interface NavItemProps {
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={twMerge(
                "group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
                active
                    ? "bg-white/20 text-orange-500 shadow-lg scale-105"
                    : "text-white/60 hover:bg-white/10 hover:scale-110 hover:text-white"
            )}
        >
            {icon}
            {active && (
                <span className="absolute -right-1 top-1 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white/50" />
            )}
        </button>
    );
}
