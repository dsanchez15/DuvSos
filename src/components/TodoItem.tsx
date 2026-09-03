'use client'

import { useState, memo } from 'react'
import type { Todo, SubTask } from '@/types/todo'
import { useAppTranslation } from '@/components/LanguageProvider'

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
  const { t } = useAppTranslation()
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
    <div className="space-y-2" role="listitem">
      <div
        className={`todo-item-card flex items-start gap-3 p-4 rounded-[8px] transition-all ${
          todo.completed ? 'todo-item-card-completed' : ''
        } border-2 group todo-item-hover ${isSelected ? 'todo-card-selected' : 'todo-border'}`}
        style={{
          background: todo.completed ? 'var(--color-bg-surface-hover)' : 'var(--color-bg-surface)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Checkbox */}
        <button
          role="checkbox"
          aria-checked={todo.completed}
          aria-label={todo.completed ? t('todos.markIncomplete') : t('todos.markComplete')}
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
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Main content area */}
        <div
          className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start gap-2 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onSelect(todo) }}
        >
          {/* Left: Title + Description */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Title row */}
            <span
              onDoubleClick={(e) => {
                e.stopPropagation()
                onEdit(todo)
              }}
              className={`text-base font-medium break-words ${
                todo.completed ? 'line-through' : ''
              } block ${todo.completed ? 'todo-text-muted' : 'todo-text-primary'}`}
            >
              {todo.title}
            </span>

            {/* Description */}
            {todo.description && (
              <p className="text-sm todo-text-secondary">{todo.description}</p>
            )}

            {/* Subtasks toggle */}
            {(todo.subTasksCount || 0) > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSubtasks(!showSubtasks)
                }}
                className="todo-subtask-toggle flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors mt-1 todo-text-secondary todo-bg-surface-hover"
                aria-expanded={showSubtasks}
                aria-label={t('todos.toggleSubtasks', { count: todo.subTasksCount ?? 0 })}
              >
                <span className={`material-symbols-outlined text-sm transition-transform ${showSubtasks ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
                <span className="text-xs font-medium">{t('todos.subtasks')}</span>
                <span className="text-xs todo-text-muted">
                  {todo.completedSubTasksCount}/{todo.subTasksCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setShowAddSubtask(!showAddSubtask) }}
            className="todo-action-btn todo-action-btn-info p-2 rounded-[8px] transition-colors"
            title={t('todos.addSubtask')}
            aria-label={t('todos.addSubtask')}
          >
            <span className="material-symbols-outlined text-lg todo-text-muted">add_task</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(todo) }}
            className="todo-action-btn todo-action-btn-primary p-2 rounded-[8px] transition-colors"
            title={t('todos.edit')}
            aria-label={t('todos.edit')}
          >
            <span className="material-symbols-outlined text-lg todo-text-muted">edit</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(todo.id) }}
            className="todo-action-btn todo-action-btn-danger p-2 rounded-[8px] transition-colors"
            title={t('todos.delete')}
            aria-label={t('todos.delete')}
          >
            <span className="material-symbols-outlined text-lg todo-text-muted">delete</span>
          </button>
        </div>
      </div>

      {/* Add Subtask Form */}
      {showAddSubtask && (
        <div className="ml-8">
          <form onSubmit={handleAddSubtask} className="flex gap-2" role="form" aria-label={t('todos.addSubtask')}>
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder={t('todos.subtaskPlaceholder')}
              className="todo-input-sm flex-1"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim()}
              className="todo-btn-sm"
            >
              {t('todos.add')}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddSubtask(false); setNewSubtaskTitle('') }}
              className="px-3 py-2 text-sm todo-text-muted"
            >
              {t('common.cancel')}
            </button>
          </form>
        </div>
      )}

      {/* Subtasks */}
      {showSubtasks && todo.subTasks && todo.subTasks.length > 0 && (
        <div className="ml-8 space-y-2" role="list" aria-label={t('todos.subtasks')}>
          {todo.subTasks.map((subtask: SubTask) => (
            <div
              key={subtask.id}
              className={`subtask-card group flex items-center gap-3 p-3 rounded-[8px] ${
                subtask.completed ? 'subtask-card-completed' : ''
              } border todo-bg-surface-hover todo-border`}
            >
              <button
                role="checkbox"
                aria-checked={subtask.completed}
                aria-label={subtask.completed ? t('todos.markIncomplete') : t('todos.markComplete')}
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
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span
                className={`flex-1 text-sm ${subtask.completed ? 'line-through' : ''} ${subtask.completed ? 'todo-text-muted' : 'todo-text-secondary'}`}
              >
                {subtask.title}
              </span>
              <button
                onClick={() => onDelete(subtask.id)}
                className="todo-action-btn-danger p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                title={t('todos.delete')}
                aria-label={t('todos.deleteSubtask')}
              >
                <span className="material-symbols-outlined text-sm todo-text-muted">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(TodoItem)