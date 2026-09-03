'use client'

import { useState, memo } from 'react'
import { Button, Input } from '@/components/ui'
import type { Todo } from '@/types/todo'

interface TodoItemProps {
  todo: Todo
  isSelected: boolean
  onToggle: (id: number, completed: boolean) => void
  onDelete: (id: number) => void
  onEdit: (todo: Todo) => void
  onSelect: (todo: Todo) => void
  onCreateSubtask: (parentId: number, title: string) => void
}

function TodoItem({
  todo,
  isSelected,
  onToggle,
  onDelete,
  onEdit,
  onSelect,
  onCreateSubtask,
}: TodoItemProps) {
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return
    onCreateSubtask(todo.id, newSubtaskTitle.trim())
    setNewSubtaskTitle('')
    setShowAddSubtask(false)
    setShowSubtasks(true)
  }

  return (
    <div className="space-y-2">
      <div
        className={`todo-item-card group todo-item-hover flex items-start gap-3 rounded-[8px] border-2 p-4 transition-all ${
          todo.completed ? 'todo-item-card-completed' : ''
        }`}
        style={{
          background: todo.completed ? 'var(--color-bg-surface-hover)' : 'var(--color-bg-surface)',
          borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
        }}
      >
        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo.id, !todo.completed)}
          role="checkbox"
          aria-checked={todo.completed}
          className={`todo-checkbox mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            todo.completed ? 'todo-checkbox-checked' : 'todo-checkbox-unchecked'
          }`}
          style={{
            background: todo.completed ? 'var(--color-success)' : 'transparent',
            borderColor: todo.completed ? 'var(--color-success)' : 'var(--color-border-strong)',
          }}
        >
          {todo.completed && (
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Main content area */}
        <div
          className="flex min-w-0 flex-1 cursor-pointer flex-col gap-2 sm:flex-row sm:items-start"
          onClick={() => onSelect(todo)}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <span
              onDoubleClick={(e) => {
                e.stopPropagation()
                onEdit(todo)
              }}
              className={`block break-words text-base font-medium ${
                todo.completed ? 'line-through' : ''
              }`}
              style={{
                color: todo.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              }}
            >
              {todo.title}
            </span>

            {todo.description && (
              <p className="text-sm text-text-secondary">{todo.description}</p>
            )}

            {(todo.subTasksCount || 0) > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSubtasks(!showSubtasks)
                }}
                className="todo-subtask-toggle mt-1 flex items-center gap-1 rounded-full bg-bg-surface-hover px-2 py-0.5 text-text-secondary transition-colors"
              >
                <span className={`material-symbols-outlined text-sm transition-transform ${showSubtasks ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
                <span className="text-xs font-medium">Subtasks</span>
                <span className="text-xs text-text-muted">
                  {todo.completedSubTasksCount}/{todo.subTasksCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setShowAddSubtask(!showAddSubtask)}
            className="todo-action-btn todo-action-btn-info rounded-[8px] p-2 text-text-muted transition-colors"
            title="Add subtask"
          >
            <span className="material-symbols-outlined text-lg">add_task</span>
          </button>
          <button
            onClick={() => onEdit(todo)}
            className="todo-action-btn todo-action-btn-primary rounded-[8px] p-2 text-text-muted transition-colors"
            title="Edit"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="todo-action-btn todo-action-btn-danger rounded-[8px] p-2 text-text-muted transition-colors"
            title="Delete"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>

      {/* Add Subtask Form */}
      {showAddSubtask && (
        <div className="ml-8">
          <form onSubmit={handleAddSubtask} className="flex gap-2">
            <Input
              fieldSize="sm"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Subtask title..."
              autoFocus
            />
            <Button type="submit" size="sm" disabled={!newSubtaskTitle.trim()}>
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddSubtask(false)
                setNewSubtaskTitle('')
              }}
            >
              Cancel
            </Button>
          </form>
        </div>
      )}

      {/* Subtasks */}
      {showSubtasks && todo.subTasks && todo.subTasks.length > 0 && (
        <div className="ml-8 space-y-2">
          {todo.subTasks.map((subtask) => (
            <div
              key={subtask.id}
              className={`subtask-card group flex items-center gap-3 rounded-[8px] border border-border bg-bg-surface-hover p-3 ${
                subtask.completed ? 'subtask-card-completed' : ''
              }`}
            >
              <button
                onClick={() => onToggle(subtask.id, !subtask.completed)}
                role="checkbox"
                aria-checked={subtask.completed}
                className={`subtask-checkbox flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  subtask.completed ? 'subtask-checkbox-checked' : 'subtask-checkbox-unchecked'
                }`}
                style={{
                  background: subtask.completed ? 'var(--color-success)' : 'transparent',
                  borderColor: subtask.completed ? 'var(--color-success)' : 'var(--color-border-strong)',
                }}
              >
                {subtask.completed && (
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span
                className={`flex-1 text-sm ${subtask.completed ? 'line-through' : ''}`}
                style={{ color: subtask.completed ? 'var(--color-text-muted)' : 'var(--color-text-secondary)' }}
              >
                {subtask.title}
              </span>
              <button
                onClick={() => onDelete(subtask.id)}
                className="todo-action-btn-danger rounded p-1 text-text-muted opacity-0 transition-colors group-hover:opacity-100"
                title="Delete subtask"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(TodoItem)
