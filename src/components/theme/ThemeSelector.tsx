import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../services/theme/ThemeContext';
import { Cloud, CloudRain, Image as ImageIcon, MapPin, Moon, Sun, Monitor } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ThemeSelectorProps {
    onClose: () => void;
}

export function ThemeSelector({ onClose }: ThemeSelectorProps) {
    const { mode, setMode, theme, setTheme, timeOfDay, weather, setManualTime, setManualWeather, geoError, manualLocation, setManualLocation } = useTheme();
    const [debugMode, setDebugMode] = useState(false);

    return createPortal(
        <div className="fixed top-12 left-20 z-[100] w-80 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 text-white animate-in slide-in-from-left-4 fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <ImageIcon size={18} className="text-purple-400" />
                    Theme Settings
                </h3>
                {/* Secret debug toggle */}
                <button onClick={() => setDebugMode(!debugMode)} className="text-xs text-slate-600 hover:text-slate-400">
                    Dev
                </button>
            </div>

            {/* Mode Switcher */}
            <div className="bg-slate-800/50 p-1 rounded-lg flex mb-6">
                <button
                    onClick={() => setMode('auto')}
                    className={twMerge(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                        mode === 'auto' ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                    )}
                >
                    <MapPin size={14} />
                    Auto
                </button>
                <button
                    onClick={() => setMode('manual')}
                    className={twMerge(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                        mode === 'manual' ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                    )}
                >
                    <Monitor size={14} />
                    Manual
                </button>
            </div>

            {/* Current Status (only for Auto) */}
            {mode === 'auto' && (
                <div className="mb-6 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-slate-400 uppercase tracking-wider">Current Conditions</div>
                        {manualLocation && (
                            <button onClick={() => setManualLocation(null)} className="text-[10px] text-blue-400 hover:text-blue-300">
                                Clear ({manualLocation})
                            </button>
                        )}
                    </div>

                    {/* Location Input */}
                    <div className="mb-3">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const val = (e.target as any).locationInput.value;
                                if (val) setManualLocation(val);
                            }}
                            className="flex gap-2"
                        >
                            <div className="relative flex-1">
                                <input
                                    name="locationInput"
                                    defaultValue={manualLocation || ''}
                                    placeholder={manualLocation ? manualLocation : "Enter City (e.g. London)"}
                                    className="w-full bg-black/20 border border-white/10 rounded-md py-1.5 pl-7 pr-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                                <MapPin size={12} className="absolute left-2 top-2 text-slate-500" />
                            </div>
                            <button type="submit" className="bg-white/10 hover:bg-white/20 text-xs px-2 rounded-md transition-colors">
                                Set
                            </button>
                        </form>
                    </div>

                    {geoError ? (
                        <div className="text-xs text-red-200 bg-red-500/20 p-2 rounded flex items-start gap-2">
                            <span className="mt-0.5 text-xs">⚠️</span>
                            <span>{geoError}</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {timeOfDay === 'day' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-300" />}
                                <span className="capitalize">{timeOfDay}</span>
                            </div>
                            <div className="h-4 w-px bg-white/20" />
                            <div className="flex items-center gap-2">
                                {weather === 'rain' ? <CloudRain size={18} className="text-blue-400" /> :
                                    weather === 'cloudy' ? <Cloud size={18} className="text-slate-400" /> :
                                        <Sun size={18} className="text-amber-400" />}
                                <span className="capitalize">{weather}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Theme Grid */}
            <div className="space-y-3">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Available Themes</div>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setTheme('gradient')}
                        className={twMerge(
                            "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95",
                            theme === 'gradient' ? "border-purple-500 ring-2 ring-purple-500/50" : "border-transparent"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600" />
                        <span className="absolute bottom-2 left-2 text-xs font-medium shadow-black/50 drop-shadow-md">Classic</span>
                    </button>

                    <button
                        onClick={() => setTheme('forest')}
                        className={twMerge(
                            "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 group",
                            theme === 'forest' ? "border-purple-500 ring-2 ring-purple-500/50" : "border-transparent"
                        )}
                    >
                        <img src="/themes/forest/day.png" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <span className="absolute bottom-2 left-2 text-xs font-medium shadow-black/50 drop-shadow-md">Cozy Forest</span>
                    </button>
                </div>
            </div>

            {/* Debug Controls */}
            {debugMode && (
                <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="text-xs text-red-400 font-mono mb-2">DEBUG OVERRIDES</div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setManualTime(timeOfDay === 'day' ? 'night' : 'day')} className="bg-slate-800 p-1 text-xs rounded">Toggle Time</button>
                        <button onClick={() => setManualWeather(weather === 'rain' ? 'clear' : 'rain')} className="bg-slate-800 p-1 text-xs rounded">Toggle Rain</button>
                    </div>
                </div>
            )}

            {/* Click outside closer helper (transparent fixed overlay behind this modal) */}
            <div className="fixed inset-0 -z-10" onClick={onClose} />
        </div>,
        document.body
    );
}
