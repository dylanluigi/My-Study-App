import { type CalendarEvent, type Exam, type TodoItem, type WidgetInstance, type UserProfile } from '../types';

export const storage = {
    getEvents: (): CalendarEvent[] => {
        try {
            const item = localStorage.getItem('calendar_events');
            return item ? JSON.parse(item) : [];
        } catch { return []; }
    },
    saveEvents: (events: CalendarEvent[]) => {
        localStorage.setItem('calendar_events', JSON.stringify(events));
    },

    getExams: (): Exam[] => {
        try {
            const item = localStorage.getItem('exam_list');
            return item ? JSON.parse(item) : [];
        } catch { return []; }
    },
    saveExams: (exams: Exam[]) => {
        localStorage.setItem('exam_list', JSON.stringify(exams));
    },

    getTodos: (): TodoItem[] => {
        try {
            const item = localStorage.getItem('todo_list');
            return item ? JSON.parse(item) : [];
        } catch { return []; }
    },
    saveTodos: (todos: TodoItem[]) => {
        localStorage.setItem('todo_list', JSON.stringify(todos));
    },

    getLayout: (): WidgetInstance[] => {
        try {
            const item = localStorage.getItem('dashboard_layout');
            // Default Layout if empty
            if (!item) {
                return [
                    { id: 'default-focus', type: 'focus', colSpan: 2, title: "Today's Focus" },
                    { id: 'default-exams', type: 'exams', colSpan: 2, title: 'Next Up' },
                    { id: 'default-spotify', type: 'spotify', colSpan: 2 }
                ];
            }
            return JSON.parse(item);
        } catch {
            return [
                { id: 'default-focus', type: 'focus', colSpan: 2, title: "Today's Focus" },
                { id: 'default-exams', type: 'exams', colSpan: 2, title: 'Next Up' },
                { id: 'default-spotify', type: 'spotify', colSpan: 2 }
            ];
        }
    },
    saveLayout: (layout: WidgetInstance[]) => {
        localStorage.setItem('dashboard_layout', JSON.stringify(layout));
    },

    getUserProfile: (): UserProfile => {
        try {
            const item = localStorage.getItem('user_profile');
            return item ? JSON.parse(item) : { name: 'Dylan' };
        } catch {
            return { name: 'Dylan' };
        }
    },
    saveUserProfile: (profile: UserProfile) => {
        localStorage.setItem('user_profile', JSON.stringify(profile));
    }
};
