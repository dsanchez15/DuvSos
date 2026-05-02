'use client'

import { useState, memo } from 'react'
import { formatEffort, getPriorityColor, formatDate, isOverdue } from '@/lib/todo-utils'

interface Category {
  id: number
  name: string
  color: string
  icon: string
}

interface SubTask {
  id: number
  title: string
  completed: boolean
  position: number
}

interface Todo {
  id: number
  title: string
  description?: string
  completed: boolean
  priority: string
  dueDate?: string
  dueTime?: string
  effortMinutes: number
  position: number
  createdAt: string
  updatedAt: string
  parentId?: number
  categoryId?: number
  category?: Category
  subTasks?: SubTask[]
  progress?: number
  subTasksCount?: number
  completedSubTasksCount?: number
}

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number, completed: boolean) => void
  onDelete: (id: number) => void
  onEdit: (todo: Todo) => void
  onCreateSubtask: (parentId: number, title: string) => void
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
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

  const todoIsOverdue = isOverdue(todo.dueDate, todo.completed)

  return (
    <div className="space-y-2">
      <div
        className={`todo-item-card flex items-start gap-3 p-4 rounded-xl transition-all ${
          todo.completed ? 'todo-item-card-completed' : ''
        } border group todo-item-hover`}
        style={{
          background: todo.completed ? 'var(--color-bg-surface-hover)' : 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo.id, !todo.completed)}
          className={`todo-checkbox flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
            todo.completed
              ? 'todo-checkbox-checked'
              : 'todo-checkbox-unchecked'
          }`}
          style={{
            background: todo.completed ? 'var(--color-success)' : 'transparent',
            borderColor: todo.completed ? 'var(--color-success)' : 'var(--color-border-strong)',
          }}
        >
          {todo.completed && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <span
              onDoubleClick={() => onEdit(todo)}
              className={`text-base font-medium break-words ${
                todo.completed ? 'line-through' : ''
              } cursor-pointer`}
              style={{
                color: todo.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              }}
            >
              {todo.title}
            </span>
          </div>

          {/* Description */}
          {todo.description && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {todo.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Priority badge */}
            <span
              className={`badge-priority-${todo.priority} px-2 py-0.5 rounded-full font-medium ${getPriorityColor(todo.priority)}`}
              style={{ background: 'var(--color-bg-surface-hover)' }}
            >
              {todo.priority}
            </span>

            {/* Due date */}
            {todo.dueDate && (
              <span
                className="badge-due flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{
                  color: todoIsOverdue ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                  background: todoIsOverdue ? 'color-mix(in srgb, var(--color-danger) 10%, transparent)' : 'var(--color-bg-surface-hover)',
                }}
              >
                <span className="material-symbols-outlined text-sm">event</span>
                {formatDate(todo.dueDate)}
                {todo.dueTime && ` ${todo.dueTime}`}
              </span>
            )}

            {/* Effort */}
            {todo.effortMinutes > 0 && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface-hover)' }}
              >
                <span className="material-symbols-outlined text-sm">schedule</span>
                {formatEffort(todo.effortMinutes)}
              </span>
            )}

            {/* Category */}
            {todo.category && (
              <span
                className="badge-category px-2 py-0.5 rounded-full text-white text-xs font-medium"
                style={{ backgroundColor: todo.category.color }}
              >
                {todo.category.name}
              </span>
            )}

            {/* Subtasks indicator */}
            {(todo.subTasksCount || 0) > 0 && (
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="todo-subtask-toggle flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors"
                style={{ color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface-hover)' }}
              >
                <span className={`material-symbols-outlined text-sm transition-transform ${showSubtasks ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
                <span className="text-xs font-medium">Subtasks</span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {todo.completedSubTasksCount}/{todo.subTasksCount}
                </span>
                {todo.progress !== undefined && (
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>({todo.progress}%)</span>
                )}
              </button>
            )}

            {/* Overdue badge */}
            {todoIsOverdue && (
              <span
                className="badge-overdue px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: 'var(--color-danger)' }}
              >
                overdue
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => setShowAddSubtask(!showAddSubtask)}
            className="todo-action-btn todo-action-btn-info p-2 rounded-lg transition-colors"
            title="Add subtask"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span className="material-symbols-outlined text-lg">add_task</span>
          </button>
          <button
            onClick={() => onEdit(todo)}
            className="todo-action-btn todo-action-btn-primary p-2 rounded-lg transition-colors"
            title="Edit"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="todo-action-btn todo-action-btn-danger p-2 rounded-lg transition-colors"
            title="Delete"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>

      {/* Add Subtask Form */}
      {showAddSubtask && (
        <div className="ml-8">
          <form onSubmit={handleAddSubtask} className="flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Subtask title..."
              className="rf-input flex-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
              autoFocus
            />
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim()}
              className="btn-neon px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAddSubtask(false); setNewSubtaskTitle('') }}
              className="btn-outline px-3 py-2 text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Subtasks */}
      {showSubtasks && todo.subTasks && todo.subTasks.length > 0 && (
        <div className="ml-8 space-y-2">
          {todo.subTasks.map((subtask) => (
            <div
              key={subtask.id}
              className={`subtask-card group flex items-center gap-3 p-3 rounded-lg ${
                subtask.completed ? 'subtask-card-completed' : ''
              } border`}
              style={{
                background: 'var(--color-bg-surface-hover)',
                borderColor: 'var(--color-border)',
              }}
            >
              <button
                onClick={() => onToggle(subtask.id, !subtask.completed)}
                className={`subtask-checkbox flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  subtask.completed ? 'subtask-checkbox-checked' : 'subtask-checkbox-unchecked'
                }`}
                style={{
                  background: subtask.completed ? 'var(--color-success)' : 'transparent',
                  borderColor: subtask.completed ? 'var(--color-success)' : 'var(--color-border-strong)',
                }}
              >
                {subtask.completed && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="todo-action-btn-danger p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Delete subtask"
                style={{ color: 'var(--color-text-muted)' }}
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
