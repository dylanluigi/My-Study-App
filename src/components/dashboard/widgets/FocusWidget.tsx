import { memo, useCallback, useMemo, useState } from 'react';
import { CheckCircle, ArrowRight, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseWidget } from '../BaseWidget';
import { type TodoItem, type Exam } from '../../../types';

interface FocusWidgetProps {
    todos: TodoItem[];
    exams: Exam[];
    onNavigate: (tab: 'dashboard' | 'calendar' | 'todo' | 'exams') => void;
    onToggleTask: (id: string) => void;
}

import { parseISO, startOfDay, isBefore, isSameDay } from 'date-fns';

export function FocusWidget({ todos, exams, onNavigate, onToggleTask }: FocusWidgetProps) {
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    // Filter tasks logic (reused)
    const focusTasks = useMemo(() => {
        const todayStart = startOfDay(new Date());

        return todos.filter(t => {
            if (t.completed) return false;
            if (t.dueDate) {
                // parseISO converts YYYY-MM-DD to local 00:00:00
                const due = parseISO(t.dueDate);
                // Check if due date is today or in the past
                if (isBefore(due, todayStart) || isSameDay(due, todayStart)) return true;
            }
            if (t.priority === 'high') return true;
            return false;
        });
    }, [todos]);

    const { groupedTasks, noSubjectTasks } = useMemo(() => focusTasks.reduce<{ groupedTasks: Record<string, TodoItem[]>; noSubjectTasks: TodoItem[] }>((acc, task) => {
        if (task.subjectId) {
            if (!acc.groupedTasks[task.subjectId]) acc.groupedTasks[task.subjectId] = [];
            acc.groupedTasks[task.subjectId].push(task);
        } else {
            acc.noSubjectTasks.push(task);
        }
        return acc;
    }, { groupedTasks: {}, noSubjectTasks: [] }), [focusTasks]);

    const subjectLookup = useMemo(() => Object.fromEntries(exams.map(exam => [exam.id, exam])), [exams]);

    const handleToggleExpand = useCallback((id: string) => {
        setExpandedTaskId(prev => prev === id ? null : id);
    }, []);

    const handleToggleComplete = useCallback((id: string) => {
        onToggleTask(id);
    }, [onToggleTask]);

    return (
        <BaseWidget
            title="Today's Focus"
            colSpan={2}
            icon={<CheckCircle className="text-rose-500" />}
            headerRight={
                <button
                    onClick={() => onNavigate('todo')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    View All <ArrowRight size={12} />
                </button>
            }
            className="flex flex-col"
        >
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
                {Object.keys(groupedTasks).length === 0 && noSubjectTasks.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center text-slate-400 italic text-sm">
                        No focus tasks for today. Relax or add some!
                    </div>
                ) : (
                    <>
                        {Object.entries(groupedTasks).map(([subjectId, tasks]) => {
                            const subject = subjectLookup[subjectId];
                            return (
                                <div key={subjectId} className="flex flex-col gap-2">
                                    <div className={clsx("text-xs font-bold uppercase tracking-wider px-1", subject ? "text-slate-600" : "text-slate-400")}>
                                        {subject?.subject || 'Unknown Subject'}
                                    </div>
                                    {tasks.map(task => (
                                        <DashboardTaskItem
                                            key={task.id}
                                            task={task}
                                            isExpanded={expandedTaskId === task.id}
                                            onToggleExpand={handleToggleExpand}
                                            onToggleComplete={handleToggleComplete}
                                            subjectColor={subject?.color}
                                        />
                                    ))}
                                </div>
                            );
                        })}

                        {noSubjectTasks.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Other</div>
                                {noSubjectTasks.map(task => (
                                    <DashboardTaskItem
                                        key={task.id}
                                        task={task}
                                        isExpanded={expandedTaskId === task.id}
                                        onToggleExpand={handleToggleExpand}
                                        onToggleComplete={handleToggleComplete}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </BaseWidget>
    );
}

// Internal component
function DashboardTaskItemComponent({
    task,
    isExpanded,
    onToggleExpand,
    onToggleComplete,
    subjectColor
}: {
    task: TodoItem,
    isExpanded: boolean,
    onToggleExpand: (id: string) => void,
    onToggleComplete: (id: string) => void,
    subjectColor?: string
}) {
    return (
        <div
            onClick={() => onToggleExpand(task.id)}
            className={clsx(
                "group flex flex-col rounded-xl border transition-all cursor-pointer overflow-hidden",
                isExpanded ? "bg-white/80 border-blue-200 shadow-md" : "bg-white/40 border-white/20 shadow-sm hover:bg-white/60"
            )}
        >
            <div className="flex items-center gap-3 p-3">
                {/* Completion Checkbox */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(task.id);
                    }}
                    className={clsx(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                        "border-slate-300 hover:border-blue-500 text-transparent hover:text-blue-500",
                        // Note: task.completed should be false here usually, but good to handle visually just in case
                        task.completed && "bg-blue-500 border-blue-500 text-white"
                    )}
                >
                    <CheckCircle size={14} fill="currentColor" className={clsx(task.completed ? "opacity-100" : "opacity-0 hover:opacity-100")} />
                </button>

                <div className={clsx("h-2 w-2 rounded-full shrink-0", subjectColor ? subjectColor.replace('bg-', 'bg-') : "bg-rose-500")} />
                <span className={clsx("text-sm font-medium text-slate-700 line-clamp-1 flex-1", task.completed && "line-through text-slate-400")}>
                    {task.text}
                </span>

                {task.notes && (
                    <FileText size={14} className={clsx("transition-colors", isExpanded ? "text-blue-500" : "text-slate-400")} />
                )}
                <div className="text-slate-400">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && task.notes && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 pb-3 pt-0"
                    >
                        <div className="text-xs text-slate-600 bg-white/50 p-2 rounded-lg border border-white/20 whitespace-pre-wrap">
                            {task.notes}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const DashboardTaskItem = memo(DashboardTaskItemComponent);
