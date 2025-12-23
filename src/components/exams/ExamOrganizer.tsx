import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, BookOpen, GraduationCap, X } from 'lucide-react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { type Exam } from '../../types';
import { storage } from '../../utils/storage';

const COLORS = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-indigo-500'
];

export function ExamOrganizer() {
    const [exams, setExams] = useState<Exam[]>(() => storage.getExams());
    const [isAdding, setIsAdding] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newDate, setNewDate] = useState('');

    const saveExams = (newExams: Exam[]) => {
        setExams(newExams);
        storage.saveExams(newExams);
    };

    const addExam = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject || !newDate) return;

        const exam: Exam = {
            id: crypto.randomUUID(),
            subject: newSubject,
            date: newDate,
            color: COLORS[exams.length % COLORS.length]
        };

        saveExams([...exams, exam]);
        setNewSubject('');
        setNewDate('');
        setIsAdding(false);
    };

    const removeExam = (id: string) => {
        saveExams(exams.filter(e => e.id !== id));
    };

    return (
        <div className="flex h-full flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Exams</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-500/20 transition-all"
                >
                    <Plus size={18} />
                    Add Exam
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.form
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={addExam}
                        className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-white/20 p-4 backdrop-blur-md"
                    >
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Subject (e.g. Calculus)"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                className="flex-1 rounded-xl bg-white/40 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50"
                                autoFocus
                            />
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="rounded-xl bg-white/40 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="rounded-lg px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-white/30"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
                            >
                                Save Exam
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 overflow-y-auto pb-4 custom-scrollbar pr-2">
                {exams.length === 0 && !isAdding && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 opacity-60">
                        <GraduationCap size={48} className="mb-4" />
                        <p className="font-medium">No upcoming exams defined.</p>
                    </div>
                )}

                {exams.map((exam) => {
                    const daysLeft = differenceInDays(parseISO(exam.date), new Date());
                    const isUrgent = daysLeft >= 0 && daysLeft <= 3;

                    return (
                        <motion.div
                            key={exam.id}
                            layout
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={clsx(
                                "relative flex flex-col justify-between overflow-hidden rounded-3xl border p-5 backdrop-blur-md transition-all hover:shadow-lg group",
                                isUrgent ? "border-rose-300 bg-rose-50/50" : "border-glass-border bg-white/30"
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={clsx("h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm text-white", exam.color)}>
                                        <BookOpen size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{exam.subject}</h3>
                                        <p className="text-xs text-slate-500">{format(parseISO(exam.date), 'MMM do, yyyy')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeExam(exam.id)}
                                    className="rounded-lg p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mt-6 flex items-end justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Time Remaining</span>
                                    <div className={clsx(
                                        "flex items-baseline gap-1 text-2xl font-bold",
                                        isUrgent ? "text-rose-600" : "text-slate-700"
                                    )}>
                                        {daysLeft < 0 ? "Done" : daysLeft}
                                        {daysLeft >= 0 && <span className="text-xs font-medium text-slate-500">days</span>}
                                    </div>
                                </div>
                                <Clock size={40} className="text-slate-800/5 -mb-2 -mr-2" />
                            </div>

                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
