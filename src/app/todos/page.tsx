'use client';

import AppLayout from '@/components/AppLayout';
import TodoList from '@/components/TodoList';

export default function TodosPage() {
    return (
        <AppLayout>
            <div className="w-full max-w-7xl mx-auto">
                <TodoList />
            </div>
        </AppLayout>
    );
}
