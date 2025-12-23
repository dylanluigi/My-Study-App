import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Check, Volume2, VolumeX, Calculator, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { BaseWidget } from '../BaseWidget';

interface PomodoroData {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    soundEnabled: boolean;
    sessionGoal?: number; // Total target sessions
    completedSessions?: number;
}

interface PomodoroTimerWidgetProps {
    data?: PomodoroData;
    onUpdate?: (data: Partial<PomodoroData>) => void;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const DEFAULT_SETTINGS: PomodoroData = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    soundEnabled: true
};

export function PomodoroTimerWidget({ data, onUpdate }: PomodoroTimerWidgetProps) {
    // Settings
    const settings = { ...DEFAULT_SETTINGS, ...data };

    // State
    const [mode, setMode] = useState<TimerMode>('work');
    const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
    const [isActive, setIsActive] = useState(false);
    const [view, setView] = useState<'timer' | 'settings' | 'planner'>('timer');


    // Planner State
    const [planHours, setPlanHours] = useState(2);
    const [planFocusMin, setPlanFocusMin] = useState(25);

    // Timer Ref
    const intervalRef = useRef<any>(null);

    // Audio
    const playNotification = () => {
        if (!settings.soundEnabled) return;
        // Simple beep using AudioContext or generic HTML5 Audio if asset exists
        // For now, let's use a simple reliable tone generator approach or silent if no assets
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    // Effect to handle timer countdown
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            // Timer Finished
            setIsActive(false);
            playNotification();

            // Auto-switch mode suggestion logic could go here, for now just stop.
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, timeLeft, mode]); // Re-run if these change

    // Listen for setting changes to update duration if timer is not running
    useEffect(() => {
        if (!isActive) {
            resetTimer(mode);
        }
    }, [settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]);


    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = (targetMode: TimerMode = mode) => {
        setIsActive(false);
        setMode(targetMode);
        switch (targetMode) {
            case 'work': setTimeLeft(settings.workDuration * 60); break;
            case 'shortBreak': setTimeLeft(settings.shortBreakDuration * 60); break;
            case 'longBreak': setTimeLeft(settings.longBreakDuration * 60); break;
        }
    };

    const handleModeChange = (newMode: TimerMode) => {
        resetTimer(newMode);
    };

    const handleSettingChange = (key: keyof PomodoroData, value: number | boolean) => {
        onUpdate?.({ [key]: value });
    };

    // Planner Logic
    const calculatePlan = () => {
        const totalMinutes = planHours * 60;

        let timeUsed = 0;
        let sessions = 0;

        // Simulation loop
        while (timeUsed < totalMinutes) {
            // Add Focus
            if (timeUsed + planFocusMin > totalMinutes) break;
            timeUsed += planFocusMin;
            sessions++;

            // Add Break
            if (timeUsed >= totalMinutes) break;

            // What break is next?
            const isLong = sessions % 4 === 0;
            const breakTime = isLong ? DEFAULT_SETTINGS.longBreakDuration : DEFAULT_SETTINGS.shortBreakDuration;

            timeUsed += breakTime;
        }

        // Apply
        onUpdate?.({
            workDuration: planFocusMin,
            sessionGoal: sessions,
            completedSessions: 0 // Reset progress
        });

        setMode('work');
        // Immediate update for local feedback before prop propagation
        setTimeLeft(planFocusMin * 60);

        setView('timer');
    };

    // Formatting
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };



    if (view === 'settings') {
        return (
            <BaseWidget
                title="Settings"
                colSpan={1}
                headerRight={<button onClick={() => setView('timer')} className="bg-slate-100 p-1 rounded-full"><Check size={14} /></button>}
                className="overflow-y-auto"
            >
                <div className="flex flex-col gap-3 p-1">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Work (min)</label>
                        <input
                            type="number"
                            value={settings.workDuration}
                            onChange={(e) => handleSettingChange('workDuration', Number(e.target.value))}
                            className="p-2 border rounded-lg text-sm bg-white/50"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Short Break</label>
                        <input
                            type="number"
                            value={settings.shortBreakDuration}
                            onChange={(e) => handleSettingChange('shortBreakDuration', Number(e.target.value))}
                            className="p-2 border rounded-lg text-sm bg-white/50"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Long Break</label>
                        <input
                            type="number"
                            value={settings.longBreakDuration}
                            onChange={(e) => handleSettingChange('longBreakDuration', Number(e.target.value))}
                            className="p-2 border rounded-lg text-sm bg-white/50"
                        />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                        <span className="text-xs font-medium text-slate-600">Sound</span>
                        <button
                            onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
                            className={clsx("p-2 rounded-lg transition-colors", settings.soundEnabled ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400")}
                        >
                            {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>
                    </div>
                </div>
            </BaseWidget>
        );
    }

    if (view === 'planner') {
        // Calculate preview
        const totalMinutes = planHours * 60;
        const cycleTime = planFocusMin + DEFAULT_SETTINGS.shortBreakDuration;
        const estSessions = Math.floor(totalMinutes / cycleTime);

        return (
            <BaseWidget
                title="Plan Session"
                colSpan={1}
                headerRight={<button onClick={() => setView('timer')} className="bg-slate-100 p-1 rounded-full"><Check size={14} /></button>}
                className="overflow-y-auto"
            >
                <div className="flex flex-col gap-4 p-1">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Available Time (Hours)</label>
                        <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={planHours}
                            onChange={(e) => setPlanHours(Number(e.target.value))}
                            className="p-2 border rounded-lg text-sm bg-white/50"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Focus Interval (min)</label>
                        <input
                            type="number"
                            value={planFocusMin}
                            onChange={(e) => setPlanFocusMin(Number(e.target.value))}
                            className="p-2 border rounded-lg text-sm bg-white/50"
                        />
                    </div>

                    <div className="bg-blue-50 p-3 rounded-xl text-blue-800 text-xs leading-relaxed">
                        <span className="font-bold block mb-1">Estimated Plan:</span>
                        Approx <span className="font-bold">{estSessions}</span> focus sessions with breaks.
                    </div>

                    <button
                        onClick={calculatePlan}
                        className="mt-2 w-full py-2 bg-blue-600 text-white rounded-xl font-medium shadow-md hover:bg-blue-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        Start Plan <ArrowRight size={14} />
                    </button>
                </div>
            </BaseWidget>
        );
    }

    return (
        <BaseWidget
            title={mode === 'work' ? "Focus" : mode === 'shortBreak' ? "Short Break" : "Long Break"}
            icon={null} // Or a specific icon if desired, but dynamic title is nice
            colSpan={1}
            headerRight={
                <div className="flex gap-1">
                    <button
                        onClick={() => setView('planner')}
                        className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                        title="Plan Session"
                    >
                        <Calculator size={16} />
                    </button>
                    <button
                        onClick={() => setView('settings')}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                        title="Settings"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            }
            className="flex flex-col relative"
        >
            {/* Mode Switcher */}
            <div className="flex justify-center gap-1 mb-4 p-1 bg-slate-100/50 rounded-xl">
                <button
                    onClick={() => handleModeChange('work')}
                    className={clsx("flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-colors", mode === 'work' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                    Focus
                </button>
                <button
                    onClick={() => handleModeChange('shortBreak')}
                    className={clsx("flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-colors", mode === 'shortBreak' ? "bg-white text-green-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                    Short
                </button>
                <button
                    onClick={() => handleModeChange('longBreak')}
                    className={clsx("flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-colors", mode === 'longBreak' ? "bg-white text-purple-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                >
                    Long
                </button>
            </div>

            {/* Timer Display */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* Progress Ring Background (Simple absolute div for now, or svg) */}
                <div className="text-5xl font-bold text-slate-800 tracking-tighter tabular-nums relative z-10">
                    {formatTime(timeLeft)}
                </div>
                <div className={clsx("text-xs font-bold uppercase tracking-widest mt-2",
                    mode === 'work' ? "text-blue-500" : mode === 'shortBreak' ? "text-green-500" : "text-purple-500"
                )}>
                    {isActive ? "Running" : "Paused"}
                </div>
            </div>

            {/* Session Dots / Goal */}
            {(settings.sessionGoal || 0) > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-2 mb-2">
                    {Array.from({ length: settings.sessionGoal || 0 }).map((_, i) => (
                        <div
                            key={i}
                            className={clsx(
                                "w-2 h-2 rounded-full transition-colors",
                                i < (settings.completedSessions || 0) ? "bg-blue-500" :
                                    i === (settings.completedSessions || 0) && mode === 'work' ? "bg-blue-300 animate-pulse" : "bg-slate-200"
                            )}
                        />
                    ))}
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
                <button
                    onClick={toggleTimer}
                    className={clsx(
                        "h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95",
                        isActive ? "bg-amber-100 text-amber-600" : "bg-blue-600 text-white"
                    )}
                >
                    {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                </button>

                <button
                    onClick={() => resetTimer(mode)}
                    className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                    <RotateCcw size={18} />
                </button>
            </div>
        </BaseWidget>
    );
}
