'use client'

import { useState } from 'react'
import TodoItem from './TodoItem'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { Todo } from '@/types/todo'

interface TodoItemsProps {
  todos: Todo[]
  selectedId: number | null
  onToggle: (id: number, completed: boolean) => void
  onDelete: (id: number) => void
  onEdit: (todo: Todo) => void
  onSelect: (todo: Todo) => void
  onCreateSubtask: (parentId: number, title: string) => void
}

export default function TodoItems({
  todos,
  selectedId,
  onToggle,
  onDelete,
  onEdit,
  onSelect,
  onCreateSubtask,
}: TodoItemsProps) {
  const { t } = useAppTranslation()
  const [completedCollapsed, setCompletedCollapsed] = useState(false)

  const unchecked = todos.filter((todo) => !todo.completed)
  const checked = todos.filter((todo) => todo.completed)

  const itemProps = { onToggle, onDelete, onEdit, onSelect, onCreateSubtask }

  return (
    <div className="space-y-2">
      {unchecked.map((todo) => (
        <TodoItem key={todo.id} todo={todo} isSelected={selectedId === todo.id} {...itemProps} />
      ))}
      {checked.length > 0 && (
        <>
          {unchecked.length > 0 && (
            <button
              onClick={() => setCompletedCollapsed(!completedCollapsed)}
              className="todo-completed-toggle flex w-full items-center gap-2 py-2 text-sm font-medium text-text-muted transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                {completedCollapsed ? 'expand_more' : 'expand_less'}
              </span>
              {t('todos.completedToggle', { count: checked.length })}
            </button>
          )}
          {!completedCollapsed && (
            <div className="space-y-2">
              {checked.map((todo) => (
                <TodoItem key={todo.id} todo={todo} isSelected={selectedId === todo.id} {...itemProps} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
