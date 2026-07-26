export interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = 'checklist', title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[8px] border border-dashed border-border bg-bg-surface-hover py-16 text-center">
      {icon && (
        <span className="material-symbols-outlined mb-4 block text-5xl text-text-muted">{icon}</span>
      )}
      <p className="text-lg text-text-secondary">{title}</p>
      {description && <p className="mt-1 text-text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export default EmptyState
