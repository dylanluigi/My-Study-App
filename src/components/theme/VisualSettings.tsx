import { motion } from 'framer-motion';
import { X, Moon } from 'lucide-react';
import { useTheme } from '../../services/theme/ThemeContext';
import { clsx } from 'clsx';

export function VisualSettings({ onClose }: { onClose: () => void }) {
    const {
        blurIntensity, setBlurIntensity,
        panelOpacity, setPanelOpacity
    } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute bottom-0 left-12 z-50 w-72 rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl p-4 shadow-2xl text-white"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Visual Settings</h3>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="flex flex-col gap-6">
                {/* Blur Slider */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Glass Blur</span>
                        <span>{blurIntensity}px</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={blurIntensity}
                        onChange={(e) => setBlurIntensity(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                    />
                </div>

                {/* Opacity Slider */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Panel Opacity</span>
                        <span>{Math.round(panelOpacity * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="0.95"
                        step="0.05"
                        value={panelOpacity}
                        onChange={(e) => setPanelOpacity(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                    />
                </div>

                {/* Dark Mode Toggle (Preset) */}
                <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setPanelOpacity(panelOpacity > 0.6 ? 0.4 : 0.8)}>
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <Moon size={14} className={panelOpacity > 0.6 ? "text-blue-400" : "text-slate-400"} />
                            <span>Darker Panels</span>
                        </div>
                        <div className={clsx("w-3 h-3 rounded-full border border-white/20", panelOpacity > 0.6 ? "bg-blue-500" : "bg-transparent")} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
