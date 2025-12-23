import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string) => void;
    selectedDate: Date | null;
}

export function EventModal({ isOpen, onClose, onSave, selectedDate }: EventModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const title = inputRef.current?.value;
        if (title) {
            onSave(title);
            onClose();
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-white font-medium">Add Event</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Date</label>
                        <div className="text-white font-medium">
                            {selectedDate?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Event Title</label>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Study Session, Gym, etc."
                            className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Save Event
                        </button>
                    </div>
                </form>
            </div>

            {/* Backdrop click handler */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>,
        document.body
    );
}
