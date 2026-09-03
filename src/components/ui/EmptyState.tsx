interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
}

export default function EmptyState({ icon = 'checklist', title, description }: EmptyStateProps) {
  return (
    <div className="empty-state text-center py-16 rounded-[8px] border border-dashed todo-bg-surface-hover todo-border">
      {icon && (
        <span className="material-symbols-outlined text-5xl mb-4 block todo-text-muted">
          {icon}
        </span>
      )}
      <p className="text-lg todo-text-secondary">{title}</p>
      {description && (
        <p className="mt-1 todo-text-muted">{description}</p>
      )}
    </div>
  )
}