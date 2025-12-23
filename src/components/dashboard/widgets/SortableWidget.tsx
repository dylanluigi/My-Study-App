import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { type ReactNode } from 'react';

interface SortableWidgetProps {
    id: string;
    children: ReactNode;
    colSpan: 1 | 2 | 3 | 4;
    disabled?: boolean;
    className?: string;
}

export function SortableWidget({ id, children, colSpan, disabled, className }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        // approximate flex-basis based on colSpan (total 4 columns ~ 100%)
        // 25% - gap, 50% - gap etc.
        // We will use tailwind classes for width, but flex-grow will handle filling.
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={clsx(
                "relative h-auto min-h-[200px] flex-grow", // Flex grow + min height
                colSpan === 1 && "basis-[20%] md:basis-[22%]", // ~1/4 minus gap
                colSpan === 2 && "basis-[45%] md:basis-[46%]", // ~1/2 minus gap
                colSpan === 3 && "basis-[70%] md:basis-[71%]",
                colSpan === 4 && "basis-[100%]",
                className
            )}
        >
            {children}
        </div>
    );
}
