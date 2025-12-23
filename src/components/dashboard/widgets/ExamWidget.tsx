import { differenceInDays, parseISO, format } from 'date-fns';
import { BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { BaseWidget } from '../BaseWidget';
import { type Exam } from '../../../types';

interface ExamWidgetProps {
    nextExam: Exam | undefined;
}

export function ExamWidget({ nextExam }: ExamWidgetProps) {
    const daysToNextExam = nextExam ? differenceInDays(parseISO(nextExam.date), new Date()) : null;

    return (
        <BaseWidget
            title="Next Up"
            icon={<BookOpen className="text-blue-500" />}
            className={clsx(
                "relative transition-colors duration-500",
                nextExam && daysToNextExam !== null && daysToNextExam <= 3
                    ? "bg-rose-50/90 border-rose-200"
                    : "bg-white/60 border-glass-border"
            )}
        >
            <div className="flex bg-transparent h-full flex-col items-center justify-center z-10">
                {nextExam ? (
                    <>
                        <h3 className="text-3xl font-bold text-slate-800 text-center leading-tight mb-2">{nextExam.subject}</h3>
                        <p className="text-base text-slate-500 font-medium mb-8">
                            {format(parseISO(nextExam.date), 'EEEE, MMMM do')}
                        </p>

                        <div className="flex flex-col items-center">
                            <div className="text-6xl font-extrabold text-blue-600 tracking-tighter drop-shadow-sm">
                                {daysToNextExam}
                            </div>
                            <span className="text-sm uppercase font-bold tracking-widest text-slate-400 mt-2">Days Left</span>
                        </div>
                    </>
                ) : (
                    <div className="text-slate-400 font-medium text-center">
                        No upcoming exams.<br />Time to chill?
                    </div>
                )}
            </div>
        </BaseWidget>
    );
}
