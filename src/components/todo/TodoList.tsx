import { useState, useRef } from 'react';
import { useAnimate, motion } from 'framer-motion';
import { Plus, Trash2, Check, AlertCircle, BookOpen, FileText, UploadCloud, Calendar as CalendarIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns';
import { type TodoItem, type Exam } from '../../types';
import { storage } from '../../utils/storage';
import { parseTodoCSV } from '../../utils/csvImport';

export function TodoList() {

    const [newTodo, setNewTodo] = useState('');
    const [newNote, setNewNote] = useState('');
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>('');
    const [expandedTodoId, setExpandedTodoId] = useState<string | null>(null);
    const [todos, setTodos] = useState<TodoItem[]>(() => storage.getTodos());
    const [exams] = useState<Exam[]>(() => storage.getExams());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [scope, animate] = useAnimate();

    const saveTodos = (newTodos: TodoItem[]) => {
        setTodos(newTodos);
        storage.saveTodos(newTodos);
    };

    const addTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        const todo: TodoItem = {
            id: crypto.randomUUID(),
            text: newTodo,
            completed: false,
            category: 'study',
            priority,
            subjectId: selectedSubject || undefined,
            dueDate: dueDate || undefined,
            notes: newNote || undefined
        };

        // Sort by priority on insert (simple approach)
        const newTodos = [todo, ...todos].sort((a, b) => {
            const p = { high: 3, medium: 2, low: 1 };
            return p[b.priority] - p[a.priority];
        });

        saveTodos(newTodos);
        setNewTodo('');
        setNewNote('');
        setPriority('medium');
        setSelectedSubject('');
        setDueDate('');

        // Animate in
        animate("li:first-child", { opacity: [0, 1], y: [-20, 0] }, { duration: 0.3 });
    };

    const toggleTodo = (id: string) => {
        const newTodos = todos.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        );
        saveTodos(newTodos);
    };

    const deleteTodo = (id: string) => {
        const newTodos = todos.filter(t => t.id !== id);
        saveTodos(newTodos);
    };

    const updateNote = (id: string, note: string) => {
        const newTodos = todos.map(t =>
            t.id === id ? { ...t, notes: note } : t
        );
        saveTodos(newTodos);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                const parsedTodos = parseTodoCSV(content);
                const mergedTodos = [...parsedTodos, ...todos]; // Add new ones at top
                saveTodos(mergedTodos);
                // Clear input
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const getPriorityColor = (p: string) => {
        if (p === 'high') return 'text-rose-500 bg-rose-50 border-rose-200';
        if (p === 'medium') return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    };

    return (
        <div className="flex h-full flex-col gap-6" ref={scope}>
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Tasks</h2>
                <div className="text-sm text-slate-500 font-medium flex items-center gap-4">
                    <button
                        onClick={triggerFileInput}
                        className="flex items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Import CSV"
                    >
                        <UploadCloud size={18} />
                        <span className="text-xs">Import</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        className="hidden"
                    />
                    <span>{todos.filter(t => t.completed).length}/{todos.length} Completed</span>
                </div>
            </div>

            {/* Input Area */}
            <form onSubmit={addTodo} className="flex flex-col gap-3 rounded-2xl border border-glass-border bg-white/20 p-4 backdrop-blur-md transition-all focus-within:bg-white/40 shadow-sm">
                <div className="relative">
                    <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder="Add a new task..."
                        className="w-full bg-transparent text-lg text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add details / notes (optional)..."
                        className="w-full bg-transparent text-sm text-slate-600 placeholder-slate-400 focus:outline-none mt-2"
                    />
                    <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500">
                        <Plus size={24} />
                    </button>
                </div>

                <div className="flex gap-2">
                    {/* Priority Selector */}
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                        className="rounded-lg bg-white/50 px-2 py-1 text-xs font-medium text-slate-600 outline-none hover:bg-white/70 focus:ring-2 focus:ring-blue-400/30"
                    >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                    </select>

                    {/* Subject Selector */}
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="rounded-lg bg-white/50 px-2 py-1 text-xs font-medium text-slate-600 outline-none hover:bg-white/70 focus:ring-2 focus:ring-blue-400/30 flex-1 truncate"
                    >
                        <option value="">No Subject</option>
                        {exams.map(e => (
                            <option key={e.id} value={e.id}>{e.subject}</option>
                        ))}
                    </select>

                    {/* Due Date Picker */}
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="rounded-lg bg-white/50 px-2 py-1 text-xs font-medium text-slate-600 outline-none hover:bg-white/70 focus:ring-2 focus:ring-blue-400/30"
                    />
                </div>
            </form>

            {/* List */}
            <ul className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar px-1 pb-2">
                {todos.length === 0 && (
                    <div className="flex h-40 flex-col items-center justify-center text-slate-400 italic gap-2 opacity-60">
                        <Check size={32} />
                        <p>All caught up!</p>
                    </div>
                )}

                {todos.map((todo) => {
                    const subject = exams.find(e => e.id === todo.subjectId);

                    return (
                        <motion.li
                            key={todo.id}
                            initial={false}
                            layout
                            className={clsx(
                                "group flex items-start gap-3 rounded-xl border p-3 backdrop-blur-sm transition-all duration-300",
                                todo.completed
                                    ? "bg-white/5 border-transparent opacity-50"
                                    : "bg-white/60 border-glass-border hover:bg-white/80 hover:shadow-md hover:scale-[1.01]"
                            )}
                        >
                            {/* Checkbox */}
                            <button
                                onClick={() => toggleTodo(todo.id)}
                                className={clsx(
                                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                    todo.completed
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-slate-300 hover:border-emerald-400"
                                )}
                            >
                                {todo.completed && <Check size={12} strokeWidth={4} />}
                            </button>

                            <div className="flex flex-1 flex-col gap-1">
                                <div className="flex items-start justify-between gap-2">
                                    <span className={clsx(
                                        "font-medium text-slate-800 transition-all leading-tight",
                                        todo.completed && "text-slate-500 line-through decoration-slate-400"
                                    )}>
                                        {todo.text}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Priority Badge */}
                                    <span className={clsx("flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider border", getPriorityColor(todo.priority))}>
                                        {todo.priority === 'high' && <AlertCircle size={10} />}
                                        {todo.priority}
                                    </span>

                                    {/* Subject Badge */}
                                    {subject && (
                                        <span className={clsx("flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm", subject.color)}>
                                            <BookOpen size={10} />
                                            {subject.subject}
                                        </span>
                                    )}

                                    {/* Due Date Badge */}
                                    {todo.dueDate && (
                                        <span className={clsx(
                                            "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border",
                                            isPast(parseISO(todo.dueDate)) && !isToday(parseISO(todo.dueDate)) ? "text-red-500 border-red-200 bg-red-50" :
                                                isToday(parseISO(todo.dueDate)) ? "text-amber-600 border-amber-200 bg-amber-50" :
                                                    "text-slate-500 border-slate-200 bg-slate-50"
                                        )}>
                                            <CalendarIcon size={10} />
                                            {isToday(parseISO(todo.dueDate)) ? "Today" :
                                                isTomorrow(parseISO(todo.dueDate)) ? "Tomorrow" :
                                                    format(parseISO(todo.dueDate), 'MMM d')}
                                        </span>
                                    )}

                                    {/* Note Indicator */}
                                    {todo.notes && (
                                        <FileText size={12} className="text-slate-400" />
                                    )}
                                </div>

                                {/* Expandable Note Area */}
                                {expandedTodoId === todo.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="w-full mt-2"
                                    >
                                        <textarea
                                            value={todo.notes || ''}
                                            onChange={(e) => updateNote(todo.id, e.target.value)}
                                            placeholder="Add notes..."
                                            className="w-full rounded-lg bg-white/50 p-2 text-sm text-slate-700 placeholder-slate-400 focus:bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-none"
                                            rows={3}
                                            autoFocus
                                        />
                                    </motion.div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setExpandedTodoId(expandedTodoId === todo.id ? null : todo.id)}
                                    className={clsx(
                                        "p-1.5 transition-colors rounded hover:bg-white/50",
                                        (expandedTodoId === todo.id || todo.notes) ? "text-blue-500 opacity-100" : "text-slate-400 hover:text-blue-500"
                                    )}
                                    title="Add Note"
                                >
                                    <FileText size={16} />
                                </button>
                                <button
                                    onClick={() => deleteTodo(todo.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white/50 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.li>
                    );
                })}
            </ul>
        </div>
    );
}
