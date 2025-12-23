import { differenceInDays, parseISO, format } from 'date-fns';
import { BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { BaseWidget } from '../BaseWidget';
import { type Exam } from '../../../types';

export function ExamWidget({ exams }: { exams: Exam[] }) {
    // Filter and sort should technically be done in parent to ensure consistency, 
    // but we can rely on the passed 'exams' being already sorted upcoming exams.
    const nextExam = exams[0];
    const otherExams = exams.slice(1);

    const daysToNextExam = nextExam ? differenceInDays(parseISO(nextExam.date), new Date()) : null;

    return (
        <BaseWidget
            title="Exams"
            icon={<BookOpen className="text-blue-500" />}
            className={clsx(
                "relative transition-colors duration-500",
                nextExam && daysToNextExam !== null && daysToNextExam <= 3
                    ? "bg-rose-50/90 border-rose-200"
                    : "bg-white/60 border-glass-border"
            )}
        >
            <div className="flex h-full gap-4">
                {/* Left Panel: Next Exam (Hero) */}
                <div className="flex-1 flex flex-col items-center justify-center border-r border-slate-200/50 pr-4">
                    {nextExam ? (
                        <>
                            {/* <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Next Up</div> */}
                            <h3 className="text-2xl font-bold text-slate-800 text-center leading-tight mb-1">{nextExam.subject}</h3>
                            <p className="text-sm text-slate-500 font-medium mb-4">
                                {format(parseISO(nextExam.date), 'EEEE, MMM do')}
                            </p>

                            <div className="flex flex-col items-center">
                                <div className="text-5xl font-extrabold text-blue-600 tracking-tighter drop-shadow-sm">
                                    {daysToNextExam}
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">Days Left</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-400 font-medium text-center text-sm">
                            No upcoming exams.<br />Time to chill? 🏖️
                        </div>
                    )}
                </div>

                {/* Right Panel: Upcoming List */}
                <div className="w-2/5 flex flex-col gap-2 overflow-y-auto pl-1">
                    {/* <div className="text-xs font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-transparent mb-1">Upcoming</div> */}
                    {otherExams.length > 0 ? (
                        otherExams.map(exam => {
                            const days = differenceInDays(parseISO(exam.date), new Date());
                            return (
                                <div key={exam.id} className="flex flex-col p-2 rounded-lg bg-white/40 border border-white/20 hover:bg-white/60 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="font-semibold text-slate-700 text-sm truncate w-full">{exam.subject}</span>
                                        <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 shrink-0",
                                            days <= 7 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {days}d
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-0.5">
                                        {format(parseISO(exam.date), 'MMM d')}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-xs text-slate-400 italic py-2 text-center">
                            Nothing else planned.
                        </div>
                    )}
                </div>
            </div>
        </BaseWidget>
    );
}
