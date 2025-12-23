export interface CalendarEvent {
    id: string;
    title: string;
    date: string; // ISO date string YYYY-MM-DD
    type: 'exam' | 'study' | 'todo';
    completed: boolean;
    color?: string; // Optional color override
}

export interface Exam {
    id: string;
    subject: string;
    date: string;
    color: string;
}

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    category: 'personal' | 'study' | 'urgent';
    priority: 'high' | 'medium' | 'low';
    subjectId?: string;
    notes?: string;
    dueDate?: string; // ISO date string YYYY-MM-DD
}

export type WidgetType = 'focus' | 'exams' | 'spotify' | 'clock' | 'youtube' | 'pomodoro' | 'pdf';

export interface WidgetInstance {
    id: string; // unique instance id
    type: WidgetType;
    colSpan: 1 | 2 | 3 | 4;
    title?: string;
    data?: Record<string, unknown>; // For flexible configuration (e.g. spotify url, clock format)
}

export interface UserProfile {
    name: string;
}
