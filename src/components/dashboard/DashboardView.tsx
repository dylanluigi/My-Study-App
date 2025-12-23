import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Sunrise, Settings, Plus, X, Trash2, LayoutGrid } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { storage } from '../../utils/storage';
import { type TodoItem, type Exam, type WidgetInstance, type WidgetType } from '../../types';
import { FocusWidget } from './widgets/FocusWidget';
import { ExamWidget } from './widgets/ExamWidget';
import { SpotifyWidget } from './widgets/SpotifyWidget';
import { ClockWidget } from './widgets/ClockWidget';
import { BaseWidget } from './BaseWidget';
import { SortableWidget } from './widgets/SortableWidget';

import { YoutubeWidget } from './widgets/YoutubeWidget';

interface DashboardProps {
    onNavigate: (tab: 'dashboard' | 'calendar' | 'todo' | 'exams') => void;
    isVisible: boolean;
}

const AVAILABLE_WIDGETS: { type: WidgetType, title: string, defaultSpan: 1 | 2 | 3 | 4 }[] = [
    { type: 'focus', title: "Today's Focus", defaultSpan: 2 },
    { type: 'exams', title: "Next Exam", defaultSpan: 2 },
    { type: 'spotify', title: "Spotify Player", defaultSpan: 2 },
    { type: 'youtube', title: "YouTube Player", defaultSpan: 2 },
    { type: 'clock', title: "Clock", defaultSpan: 1 },
];

export function DashboardView({ onNavigate, isVisible }: DashboardProps) {
    const [todos, setTodos] = useState<TodoItem[]>(() => storage.getTodos());
    const [exams, setExams] = useState<Exam[]>(() => storage.getExams());

    // Auto-refresh when becoming visible
    useEffect(() => {
        if (isVisible) {
            setTodos(storage.getTodos());
            setExams(storage.getExams());
        }
    }, [isVisible]);

    const toggleTodo = (id: string) => {
        const newTodos = todos.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        );
        setTodos(newTodos);
        storage.saveTodos(newTodos);
    };

    // Greeting Logic
    const getGreetingDetails = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Good Morning', icon: <Sunrise className="text-amber-500" /> };
        if (hour < 18) return { text: 'Good Afternoon', icon: <Sun className="text-orange-500" /> };
        return { text: 'Good Evening', icon: <Moon className="text-indigo-400" /> };
    };

    const [{ greeting, timeOfDayIcon }] = useState(() => {
        const { text, icon } = getGreetingDetails();
        return { greeting: text, timeOfDayIcon: icon };
    });

    // Dynamic Widget State
    const [widgets, setWidgets] = useState<WidgetInstance[]>(() => storage.getLayout());
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);

    const upcomingExams = exams
        .filter(e => differenceInDays(parseISO(e.date), new Date()) >= 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const nextExam = upcomingExams[0];

    // Drag and Drop Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setWidgets((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);

                const newLayout = arrayMove(items, oldIndex, newIndex);
                storage.saveLayout(newLayout);
                return newLayout;
            });
        }
    };

    // Widget Management
    const addWidget = (type: WidgetType, defaultSpan: 1 | 2 | 3 | 4) => {
        const newWidget: WidgetInstance = {
            id: crypto.randomUUID(),
            type,
            colSpan: defaultSpan,
            title: '' // Title often handled by component itself or overridden
        };
        const newLayout = [...widgets, newWidget];
        setWidgets(newLayout);
        storage.saveLayout(newLayout);
        setShowAddMenu(false);
    };

    const removeWidget = (id: string) => {
        const newLayout = widgets.filter(w => w.id !== id);
        setWidgets(newLayout);
        storage.saveLayout(newLayout);
    };

    return (
        <div className="flex h-full flex-col gap-6 relative">
            {/* Header / Greeting */}
            <div className="flex items-center justify-between py-2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4"
                >
                    <div className="rounded-full bg-white/20 p-4 shadow-lg backdrop-blur-md">
                        {timeOfDayIcon}
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{greeting}, Dylan</h1>
                        <p className="text-slate-700 font-medium">Ready to conquer the day?</p>
                    </div>
                </motion.div>

                {/* Edit Mode Toggle */}
                <div className="flex items-center gap-2">
                    {isEditMode && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={() => setShowAddMenu(!showAddMenu)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-full font-medium shadow-sm transition-colors",
                                showAddMenu ? "bg-blue-600 text-white" : "bg-white/40 text-blue-600 hover:bg-white/60"
                            )}
                        >
                            <Plus size={18} /> Add Widget
                        </motion.button>
                    )}
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={clsx(
                            "p-3 rounded-full transition-all duration-300",
                            isEditMode ? "bg-slate-800 text-white shadow-md rotate-90" : "bg-white/20 text-slate-600 hover:bg-white/40 hover:text-slate-900"
                        )}
                        title="Customize Dashboard"
                    >
                        {isEditMode ? <X size={20} /> : <Settings size={20} />}
                    </button>

                    {/* Add Menu Dropdown */}
                    <AnimatePresence>
                        {showAddMenu && isEditMode && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute top-20 right-0 z-50 w-64 p-2 rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/50 flex flex-col gap-1"
                            >
                                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Available Widgets</div>
                                {AVAILABLE_WIDGETS.map(w => (
                                    <button
                                        key={w.type}
                                        onClick={() => addWidget(w.type, w.defaultSpan)}
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors text-left"
                                    >
                                        <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600">
                                            <LayoutGrid size={16} />
                                        </div>
                                        <span className="font-medium">{w.title}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modular Flex Layout */}
            <div className="flex flex-wrap gap-6 flex-1 overflow-y-auto overflow-x-hidden p-1 pb-20 content-start">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={widgets.map(w => w.id)}
                        strategy={rectSortingStrategy}
                        disabled={!isEditMode} // Disable sorting when not in edit mode
                    >
                        <AnimatePresence mode='popLayout'>
                            {widgets.length === 0 ? (
                                <div className="col-span-4 flex flex-col items-center justify-center text-slate-400 italic py-20">
                                    Dashboard empty. Click settings to add widgets!
                                </div>
                            ) : (
                                widgets.map(widget => (
                                    <SortableWidget
                                        key={widget.id}
                                        id={widget.id}
                                        colSpan={widget.colSpan}
                                        disabled={!isEditMode}
                                        className="relative group"
                                    >
                                        <motion.div
                                            // Decoupled animation: No layout prop to avoid conflict with dnd-kit transform
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                rotate: isEditMode ? [-0.5, 0.5, -0.5] : 0,
                                            }}
                                            transition={{
                                                // Only repeat if in edit mode
                                                rotate: isEditMode ? { repeat: Infinity, duration: 0.3 } : { duration: 0.2 }
                                            }}
                                            className="h-full"
                                        >
                                            {isEditMode && (
                                                <button
                                                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking delete
                                                    onClick={() => removeWidget(widget.id)}
                                                    className="absolute -top-2 -right-2 z-50 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 hover:scale-110 transition-all cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}

                                            {/* Widget Renderer */}
                                            {widget.type === 'focus' && (
                                                <FocusWidget
                                                    todos={todos}
                                                    exams={exams}
                                                    onNavigate={onNavigate}
                                                    onToggleTask={toggleTodo}
                                                />
                                            )}
                                            {widget.type === 'exams' && (
                                                <ExamWidget nextExam={nextExam} />
                                            )}
                                            {widget.type === 'spotify' && (
                                                <SpotifyWidget
                                                    data={widget.data}
                                                    isEditMode={isEditMode}
                                                    onUpdate={(data) => {
                                                        const newLayout = widgets.map(w =>
                                                            w.id === widget.id ? { ...w, data: { ...w.data, ...data } } : w
                                                        );
                                                        setWidgets(newLayout);
                                                        storage.saveLayout(newLayout);
                                                    }}
                                                />
                                            )}
                                            {widget.type === 'youtube' && (
                                                <YoutubeWidget
                                                    data={widget.data}
                                                    isEditMode={isEditMode}
                                                    onUpdate={(data) => {
                                                        const newLayout = widgets.map(w =>
                                                            w.id === widget.id ? { ...w, data: { ...w.data, ...data } } : w
                                                        );
                                                        setWidgets(newLayout);
                                                        storage.saveLayout(newLayout);
                                                    }}
                                                />
                                            )}
                                            {widget.type === 'clock' && <ClockWidget />}

                                            {/* Fallback/Error state */}
                                            {!['focus', 'exams', 'spotify', 'clock', 'youtube'].includes(widget.type) && (
                                                <BaseWidget title="Unknown Widget" colSpan={widget.colSpan}>
                                                    <div className="text-red-400 text-sm">Widget type '{widget.type}' not found.</div>
                                                </BaseWidget>
                                            )}
                                        </motion.div>
                                    </SortableWidget>
                                ))
                            )}
                        </AnimatePresence>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
