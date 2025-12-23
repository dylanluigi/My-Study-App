import { type TodoItem } from '../types';

export function parseTodoCSV(content: string): TodoItem[] {
    const lines = content.split(/\r?\n/);
    const todos: TodoItem[] = [];

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Simple CSV parsing: split by comma
        // Expected format: Task Name, Priority (optional), Notes (optional)
        const parts = trimmedLine.split(',').map(part => part.trim());

        if (parts.length === 0 || !parts[0]) continue;

        const text = parts[0];
        let priority: 'high' | 'medium' | 'low' = 'medium';
        let notes: string | undefined = undefined;
        let dueDate: string | undefined = undefined;

        if (parts.length > 1) {
            const p = parts[1].toLowerCase();
            if (p === 'high' || p === 'medium' || p === 'low') {
                priority = p;
            }
        }

        if (parts.length > 2) {
            // Check if parts[2] looks like a date (YYYY-MM-DD) or has notes
            const part2 = parts[2].trim();
            // Simple check: 4 digits, dash, 2 digits, dash, 2 digits
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

            if (dateRegex.test(part2)) {
                dueDate = part2;

                if (parts.length > 3) {
                    // Join remaining parts as notes
                    notes = parts.slice(3).join(', ').trim();
                }
            } else {
                // If it's not a date, assume it's notes (legacy format support)
                notes = parts.slice(2).join(', ').trim();
            }
        }

        const todo: TodoItem = {
            id: crypto.randomUUID(),
            text,
            completed: false,
            category: 'study', // Default category
            priority,
            notes,
            dueDate
        };

        todos.push(todo);
    }

    return todos;
}
