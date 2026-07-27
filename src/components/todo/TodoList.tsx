'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, EmptyState, Spinner } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import { useTodos } from '@/hooks/useTodos'
import { useDebounce } from '@/hooks/useDebounce'
import TodoCreateForm from './TodoCreateForm'
import TodoFilters, { type TodoFiltersValue } from './TodoFilters'
import TodoItems from './TodoItems'
import TodoEditModal from './TodoEditModal'
import TodoDetailsSidebar from './TodoDetailsSidebar'
import type { Todo } from '@/types/todo'

const INITIAL_FILTERS: TodoFiltersValue = {
  viewMode: 'all',
  groupBy: 'none',
  search: '',
  priority: '',
  category: '',
  status: '',
}

export default function TodoList() {
  const { t } = useAppTranslation()
  const [filters, setFilters] = useState<TodoFiltersValue>(INITIAL_FILTERS)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedSearch = useDebounce(filters.search, 400)

  const {
    todos,
    groupedTodos,
    categories,
    metrics,
    loading,
    error,
    apiError,
    selectedTodo,
    setApiError,
    setSelectedTodo,
    fetchTodos,
    createTodo,
    createSubtask,
    toggleTodo,
    deleteTodo,
    editTodo,
  } = useTodos(t)

  const { viewMode, groupBy, priority, category, status } = filters
  useEffect(() => {
    fetchTodos({ viewMode, groupBy, search: debouncedSearch, priority, category, status })
  }, [fetchTodos, viewMode, groupBy, debouncedSearch, priority, category, status])

  // Keyboard shortcut: "n" to focus the new-todo input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const clearFilters = () => setFilters(INITIAL_FILTERS)

  const itemHandlers = {
    onToggle: toggleTodo,
    onDelete: deleteTodo,
    onEdit: setEditingTodo,
    onSelect: setSelectedTodo,
    onCreateSubtask: createSubtask,
  }

  if (loading && todos.length === 0 && !groupedTodos) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-danger">{error}</p>
        <Button
          className="mt-4"
          onClick={() =>
            fetchTodos({ viewMode, groupBy, search: debouncedSearch, priority, category, status })
          }
        >
          {t('todos.retry')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary">{t('todos.title')}</h2>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-6">
          <TodoCreateForm inputRef={inputRef} onAdd={createTodo} />

          {/* API Error Banner */}
          {apiError && (
            <div
              className="flex items-center gap-3 rounded-[8px] border p-4"
              style={{
                background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
                borderColor: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
                color: 'var(--color-danger)',
              }}
            >
              <span className="material-symbols-outlined">error</span>
              <span className="flex-1 text-sm font-medium">{apiError}</span>
              <button
                onClick={() => setApiError('')}
                aria-label={t('common.cancel')}
                className="todo-error-close rounded p-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          <TodoFilters value={filters} categories={categories} onChange={setFilters} onClear={clearFilters} />

          {/* Todo List */}
          {groupedTodos ? (
            <div className="space-y-6">
              {Object.entries(groupedTodos).map(([groupName, groupTodos]) => (
                <div key={groupName}>
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-secondary">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {groupName}
                    <span className="text-sm font-normal text-text-muted">({groupTodos.length})</span>
                  </h3>
                  <TodoItems todos={groupTodos} selectedId={selectedTodo?.id ?? null} {...itemHandlers} />
                </div>
              ))}
            </div>
          ) : todos.length === 0 ? (
            <EmptyState
              icon="checklist"
              title={t('todos.noTodos')}
              description={t('todos.adjustFilters')}
            />
          ) : (
            <TodoItems todos={todos} selectedId={selectedTodo?.id ?? null} {...itemHandlers} />
          )}

          {/* Edit Modal */}
          {editingTodo && (
            <TodoEditModal
              todo={editingTodo}
              categories={categories}
              onSave={editTodo}
              onClose={() => setEditingTodo(null)}
            />
          )}
        </div>

        {/* Sidebar */}
        <TodoDetailsSidebar todo={selectedTodo} metrics={metrics} />
      </div>
    </div>
  )
}
