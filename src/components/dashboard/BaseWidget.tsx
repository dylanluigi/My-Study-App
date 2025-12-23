import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface BaseWidgetProps {
    title?: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
    colSpan?: 1 | 2 | 3 | 4;
    rowSpan?: number;
    headerRight?: ReactNode;
}

export function BaseWidget({
    title,
    icon,
    children,
    className,
    colSpan = 1,
    rowSpan = 1,
    headerRight
}: BaseWidgetProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx(
                "flex flex-col gap-4 rounded-3xl p-6 overflow-hidden glass-panel",
                // Grid positioning
                colSpan === 1 && "col-span-1",
                colSpan === 2 && "col-span-1 md:col-span-2",
                colSpan === 3 && "col-span-1 md:col-span-3",
                colSpan === 4 && "col-span-1 md:col-span-4",
                // Dynamic row span if needed, usually we let content drive height or set specific classes
                // But for grid auto-flow it helps.
                `row-span-${rowSpan}`,
                className
            )}
        >
            {(title || icon) && (
                <div className="flex items-center justify-between shrink-0">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                        {icon}
                        {title}
                    </h2>
                    {headerRight}
                </div>
            )}

            <div className="flex-1 overflow-hidden relative">
                {children}
            </div>
        </motion.div>
    );
}
