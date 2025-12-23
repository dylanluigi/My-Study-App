import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { type CalendarEvent, type Exam } from '../../types';
import { storage } from '../../utils/storage';
import { EventModal } from './EventModal';

export function CalendarView({ exam_list }: { exam_list?: Exam[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    // Local events only (user created non-exam events)
    const [localEvents, setLocalEvents] = useState<CalendarEvent[]>(() => storage.getEvents());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Fetch exams from storage if not provided in props
    const exams = exam_list || storage.getExams();

    // Derived exam events
    const examEvents = exams.map(exam => ({
        id: exam.id,
        title: `EXAM: ${exam.subject}`,
        date: exam.date,
        type: 'exam' as const,
        completed: false,
        color: exam.color
    }));

    // Combined events for display
    const events = [...localEvents, ...examEvents];

    const saveEvents = (newLocalEvents: CalendarEvent[]) => {
        setLocalEvents(newLocalEvents);
        storage.saveEvents(newLocalEvents);
    };

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const handleSaveEvent = (title: string) => {
        if (!selectedDate || !title) return;

        const newEvent: CalendarEvent = {
            id: crypto.randomUUID(),
            title,
            date: format(selectedDate, 'yyyy-MM-dd'),
            type: 'study', // Default type
            completed: false
        };

        saveEvents([...localEvents, newEvent]); // Use localEvents directly to append
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const jumpToToday = () => setCurrentDate(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="flex h-full flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4 backdrop-blur-sm shadow-sm border border-glass-border">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={jumpToToday}
                        className="mr-2 rounded-lg bg-white/20 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-white/40 transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={prevMonth}
                        className="rounded-lg p-2 hover:bg-white/30 transition-colors text-slate-700"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="rounded-lg p-2 hover:bg-white/30 transition-colors text-slate-700"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 rounded-3xl bg-white/5 p-4 backdrop-blur-md border border-glass-border shadow-inner overflow-hidden">
                <div className="grid h-full grid-cols-7 grid-rows-[auto_1fr] gap-4">

                    {/* Weekday Headers */}
                    {weekDays.map((day) => (
                        <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}

                    {/* Days */}
                    <div className="col-span-7 grid grid-cols-7 grid-rows-6 gap-2">
                        {days.map((day) => {
                            const dayEvents = events.filter(e => {
                                // Robust date comparison
                                try {
                                    return isSameDay(parseISO(e.date), day);
                                } catch (err) {
                                    return false; // Skip invalid dates
                                }
                            });
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isTodayDate = isToday(day);

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => handleDayClick(day)}
                                    className={clsx(
                                        "group relative flex flex-col items-start justify-start rounded-xl p-1.5 transition-all duration-200 border",
                                        !isCurrentMonth && "text-slate-400 opacity-40 border-transparent hover:opacity-70",
                                        isCurrentMonth && "text-slate-800 border-white/10 bg-white/5 hover:bg-white/20 hover:border-white/30 hover:scale-[1.02] hover:shadow-lg cursor-pointer",
                                        isTodayDate && "bg-blue-500/10 border-blue-400/30 shadow-inner"
                                    )}
                                >
                                    <span
                                        className={clsx(
                                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                            isTodayDate
                                                ? "bg-blue-500 text-white shadow-sm"
                                                : "text-slate-600 group-hover:text-slate-900"
                                        )}
                                    >
                                        {format(day, 'd')}
                                    </span>

                                    {/* Events List */}
                                    <div className="mt-2 flex w-full flex-col gap-1.5 overflow-hidden">
                                        {dayEvents.slice(0, 3).map(event => (
                                            <div
                                                key={event.id}
                                                className={clsx(
                                                    "w-full truncate rounded-md px-1.5 py-1 text-xs font-semibold backdrop-blur-[1px]",
                                                    event.type === 'exam'
                                                        ? clsx(event.color || "bg-rose-100 text-rose-800", "text-white shadow-sm")
                                                        : "bg-blue-100/60 text-blue-900"
                                                )}
                                                title={event.title}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[10px] font-medium text-slate-500 pl-1">
                                                +{dayEvents.length - 3} more
                                            </div>
                                        )}
                                    </div>

                                    {/* Add Hint */}
                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Plus size={12} className="text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                selectedDate={selectedDate}
            />
        </div>
    );
}
