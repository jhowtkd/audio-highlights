'use client';

import { TaskCard } from './task-card';
import type { Task } from '@/types/task-types';

interface TaskListProps {
    tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
    // Ordenar: processando primeiro, depois pendentes, depois completas/erro (por data mais recente)
    const sortedTasks = [...tasks].sort((a, b) => {
        const statusOrder = {
            converting: 0,
            transcribing: 1,
            generating: 2,
            pending: 3,
            error: 4,
            completed: 5,
        };

        const orderA = statusOrder[a.status];
        const orderB = statusOrder[b.status];

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // Mesmo status: ordenar por data de criação (mais recente primeiro)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <div className="space-y-4">
            {sortedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
            ))}
        </div>
    );
}
