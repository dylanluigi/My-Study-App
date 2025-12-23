import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { BaseWidget } from '../BaseWidget';

export function ClockWidget() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    // const seconds = time.getSeconds().toString().padStart(2, '0');

    return (
        <BaseWidget
            title="Time"
            colSpan={1}
            icon={<Clock className="text-blue-500" />}
            className="flex flex-col items-center justify-center"
        >
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-5xl font-bold text-slate-800 tracking-tighter">
                    {hours}:{minutes}
                </div>
                <div className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-widest">
                    {time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
            </div>
        </BaseWidget>
    );
}
